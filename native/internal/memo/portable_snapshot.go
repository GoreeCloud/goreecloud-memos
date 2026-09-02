package memo

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"
)

const (
	portableSnapshotFormat  = "goreecloud-memos-portable-snapshot"
	portableSnapshotVersion = 1
)

var (
	ErrInvalidPortableSnapshot   = errors.New("invalid portable memo snapshot")
	ErrPortableSnapshotIntegrity = errors.New("portable memo snapshot integrity check failed")
	ErrUnsupportedSnapshot       = errors.New("unsupported portable memo snapshot")
)

type portableSnapshotEnvelope struct {
	Format        string         `json:"format"`
	SchemaVersion int            `json:"schema_version"`
	ExportedAt    time.Time      `json:"exported_at"`
	Memos         []portableMemo `json:"memos"`
	SHA256        string         `json:"sha256"`
}

type portableMemo struct {
	ID        string     `json:"id"`
	Content   string     `json:"content"`
	Pinned    bool       `json:"pinned"`
	Labels    []string   `json:"labels"`
	RemindAt  *time.Time `json:"remind_at,omitempty"`
	Lifecycle Lifecycle  `json:"lifecycle"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// CreatePortableSnapshot exports one owner's native memo state into a versioned,
// machine-readable JSON document. The owner identifier is deliberately omitted from
// the payload so a portability artifact does not disclose an application identity
// merely to preserve memo content and metadata.
//
// The returned checksum detects accidental or untrusted payload modification. It is
// integrity evidence for the snapshot bytes, not a signature or proof of provenance.
func CreatePortableSnapshot(repository Repository, ownerID string, exportedAt time.Time) ([]byte, error) {
	if repository == nil {
		return nil, fmt.Errorf("%w: repository is required", ErrInvalidPortableSnapshot)
	}
	ownerID = normalizeRepositoryIdentity(ownerID)
	if ownerID == "" {
		return nil, ErrInvalidOwner
	}
	if exportedAt.IsZero() {
		return nil, fmt.Errorf("%w: exported_at must not be zero", ErrInvalidPortableSnapshot)
	}

	values, err := repository.List(ownerID)
	if err != nil {
		return nil, err
	}

	records := make([]portableMemo, 0, len(values))
	for _, value := range values {
		if normalizeRepositoryIdentity(value.OwnerID) != ownerID {
			return nil, fmt.Errorf("%w: repository returned a memo outside the requested owner scope", ErrInvalidPortableSnapshot)
		}
		record, err := portableMemoFromDomain(value)
		if err != nil {
			return nil, err
		}
		records = append(records, record)
	}

	checksum, err := portableMemoChecksum(records)
	if err != nil {
		return nil, err
	}

	return json.MarshalIndent(portableSnapshotEnvelope{
		Format:        portableSnapshotFormat,
		SchemaVersion: portableSnapshotVersion,
		ExportedAt:    exportedAt.UTC(),
		Memos:         records,
		SHA256:        checksum,
	}, "", "  ")
}

// DecodePortableSnapshot verifies and materializes a portable snapshot for an explicit
// target owner. It does not write to a Repository. Callers must perform any restore or
// migration as a separately authorized operation so conflicts and rollback can be
// handled deliberately rather than through an implicit overwrite.
func DecodePortableSnapshot(payload []byte, targetOwnerID string) ([]Memo, error) {
	targetOwnerID = normalizeRepositoryIdentity(targetOwnerID)
	if targetOwnerID == "" {
		return nil, ErrInvalidOwner
	}
	if len(payload) == 0 {
		return nil, fmt.Errorf("%w: payload is empty", ErrInvalidPortableSnapshot)
	}

	var envelope portableSnapshotEnvelope
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&envelope); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidPortableSnapshot, err)
	}
	var trailing json.RawMessage
	if err := decoder.Decode(&trailing); err != io.EOF {
		if err == nil {
			return nil, fmt.Errorf("%w: payload contains multiple JSON values", ErrInvalidPortableSnapshot)
		}
		return nil, fmt.Errorf("%w: trailing JSON data: %v", ErrInvalidPortableSnapshot, err)
	}

	if envelope.Format != portableSnapshotFormat || envelope.SchemaVersion != portableSnapshotVersion {
		return nil, ErrUnsupportedSnapshot
	}
	if envelope.ExportedAt.IsZero() {
		return nil, fmt.Errorf("%w: exported_at must not be zero", ErrInvalidPortableSnapshot)
	}
	if envelope.Memos == nil {
		return nil, fmt.Errorf("%w: memos must be an array", ErrInvalidPortableSnapshot)
	}

	checksum, err := portableMemoChecksum(envelope.Memos)
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(checksum, strings.TrimSpace(envelope.SHA256)) {
		return nil, ErrPortableSnapshotIntegrity
	}

	seenIDs := make(map[string]struct{}, len(envelope.Memos))
	values := make([]Memo, 0, len(envelope.Memos))
	for _, record := range envelope.Memos {
		value, err := record.toDomain(targetOwnerID)
		if err != nil {
			return nil, err
		}
		if _, exists := seenIDs[value.ID]; exists {
			return nil, fmt.Errorf("%w: duplicate memo id %q", ErrInvalidPortableSnapshot, value.ID)
		}
		seenIDs[value.ID] = struct{}{}
		values = append(values, value)
	}
	return values, nil
}

func portableMemoFromDomain(value Memo) (portableMemo, error) {
	record := portableMemo{
		ID:        value.ID,
		Content:   value.Content,
		Pinned:    value.Pinned,
		Labels:    append([]string{}, value.Labels...),
		Lifecycle: value.Lifecycle,
		CreatedAt: value.CreatedAt.UTC(),
		UpdatedAt: value.UpdatedAt.UTC(),
	}
	if value.RemindAt != nil {
		remindAt := value.RemindAt.UTC()
		record.RemindAt = &remindAt
	}
	if _, err := record.toDomain(value.OwnerID); err != nil {
		return portableMemo{}, err
	}
	return record, nil
}

func (record portableMemo) toDomain(ownerID string) (Memo, error) {
	ownerID = normalizeRepositoryIdentity(ownerID)
	if ownerID == "" {
		return Memo{}, ErrInvalidOwner
	}

	id := normalizeRepositoryIdentity(record.ID)
	if id == "" {
		return Memo{}, fmt.Errorf("%w: memo id must not be empty", ErrInvalidPortableSnapshot)
	}
	content := strings.TrimSpace(record.Content)
	if content == "" {
		return Memo{}, fmt.Errorf("%w: memo %q has empty content", ErrInvalidPortableSnapshot, id)
	}
	if record.CreatedAt.IsZero() || record.UpdatedAt.IsZero() {
		return Memo{}, fmt.Errorf("%w: memo %q has a zero timestamp", ErrInvalidPortableSnapshot, id)
	}
	createdAt := record.CreatedAt.UTC()
	updatedAt := record.UpdatedAt.UTC()
	if updatedAt.Before(createdAt) {
		return Memo{}, fmt.Errorf("%w: memo %q is updated before it was created", ErrInvalidPortableSnapshot, id)
	}
	if !validPortableLifecycle(record.Lifecycle) {
		return Memo{}, fmt.Errorf("%w: memo %q has unknown lifecycle %q", ErrInvalidPortableSnapshot, id, record.Lifecycle)
	}

	labels := make([]string, 0, len(record.Labels))
	for _, label := range record.Labels {
		normalized := normalizeLabel(label)
		if normalized == "" {
			return Memo{}, fmt.Errorf("%w: memo %q has an empty label", ErrInvalidPortableSnapshot, id)
		}
		for _, existing := range labels {
			if sameLabel(existing, normalized) {
				return Memo{}, fmt.Errorf("%w: memo %q has duplicate label %q", ErrInvalidPortableSnapshot, id, normalized)
			}
		}
		labels = append(labels, normalized)
	}

	var remindAt *time.Time
	if record.RemindAt != nil {
		if record.RemindAt.IsZero() {
			return Memo{}, fmt.Errorf("%w: memo %q has a zero reminder", ErrInvalidPortableSnapshot, id)
		}
		normalized := record.RemindAt.UTC()
		remindAt = &normalized
	}

	return Memo{
		ID:        id,
		OwnerID:   ownerID,
		Content:   content,
		Pinned:    record.Pinned,
		Labels:    labels,
		RemindAt:  remindAt,
		Lifecycle: record.Lifecycle,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}, nil
}

func validPortableLifecycle(value Lifecycle) bool {
	switch value {
	case LifecycleActive, LifecycleArchived, LifecycleTrashed:
		return true
	default:
		return false
	}
}

func portableMemoChecksum(records []portableMemo) (string, error) {
	canonical, err := json.Marshal(records)
	if err != nil {
		return "", fmt.Errorf("%w: cannot encode memo records: %v", ErrInvalidPortableSnapshot, err)
	}
	digest := sha256.Sum256(canonical)
	return fmt.Sprintf("%x", digest[:]), nil
}
