package memo

import (
	"bytes"
	"encoding/json"
	"errors"
	"testing"
	"time"
)

func TestPortableSnapshotRoundTripPreservesMemoMeaningWithoutSourceOwnerIdentity(t *testing.T) {
	t.Parallel()

	createdAt := time.Date(2026, 9, 1, 12, 0, 0, 0, time.UTC)
	repository := NewMemoryRepository()
	value, err := New("memo-1", "owner-source", "  Portable memo  ", createdAt)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if _, err := value.AddLabel(" Work ", createdAt.Add(time.Minute)); err != nil {
		t.Fatalf("AddLabel() error = %v", err)
	}
	if _, err := value.AddLabel("Ideas", createdAt.Add(2*time.Minute)); err != nil {
		t.Fatalf("AddLabel() error = %v", err)
	}
	value.SetPinned(true, createdAt.Add(3*time.Minute))
	remindAt := createdAt.Add(2 * time.Hour)
	if err := value.SetReminder(remindAt, createdAt.Add(4*time.Minute)); err != nil {
		t.Fatalf("SetReminder() error = %v", err)
	}
	value.Archive(createdAt.Add(5 * time.Minute))
	if err := repository.Save(value); err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	payload, err := CreatePortableSnapshot(repository, "owner-source", createdAt.Add(24*time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}
	if bytes.Contains(payload, []byte("owner-source")) {
		t.Fatal("portable snapshot unexpectedly disclosed the source owner identifier")
	}

	decoded, err := DecodePortableSnapshot(payload, "owner-restored")
	if err != nil {
		t.Fatalf("DecodePortableSnapshot() error = %v", err)
	}
	if len(decoded) != 1 {
		t.Fatalf("DecodePortableSnapshot() returned %d memos, want 1", len(decoded))
	}

	got := decoded[0]
	if got.ID != value.ID {
		t.Fatalf("ID = %q, want %q", got.ID, value.ID)
	}
	if got.OwnerID != "owner-restored" {
		t.Fatalf("OwnerID = %q, want target owner", got.OwnerID)
	}
	if got.Content != "Portable memo" {
		t.Fatalf("Content = %q, want trimmed content", got.Content)
	}
	if !got.Pinned {
		t.Fatal("Pinned = false, want true")
	}
	if got.Lifecycle != LifecycleArchived {
		t.Fatalf("Lifecycle = %q, want %q", got.Lifecycle, LifecycleArchived)
	}
	if len(got.Labels) != 2 || got.Labels[0] != "Work" || got.Labels[1] != "Ideas" {
		t.Fatalf("Labels = %#v, want [Work Ideas]", got.Labels)
	}
	if got.RemindAt == nil || !got.RemindAt.Equal(remindAt) {
		t.Fatalf("RemindAt = %v, want %v", got.RemindAt, remindAt)
	}
	if !got.CreatedAt.Equal(value.CreatedAt) || !got.UpdatedAt.Equal(value.UpdatedAt) {
		t.Fatalf("timestamps changed: got created=%v updated=%v, want created=%v updated=%v", got.CreatedAt, got.UpdatedAt, value.CreatedAt, value.UpdatedAt)
	}
}

func TestPortableSnapshotExportAndDecodeRequireCanonicalOwnerIdentity(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 12, 30, 0, 0, time.UTC)
	repository := NewMemoryRepository()
	value, err := New("memo-1", "owner-1", "Portable memo", now)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if err := repository.Save(value); err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	_, err = CreatePortableSnapshot(repository, " owner-1 ", now.Add(time.Hour))
	if !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("CreatePortableSnapshot() error = %v, want %v", err, ErrInvalidOwner)
	}

	payload, err := CreatePortableSnapshot(repository, "owner-1", now.Add(time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}
	_, err = DecodePortableSnapshot(payload, " owner-restored ")
	if !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrInvalidOwner)
	}
}

func TestPortableSnapshotRejectsNoncanonicalMemoIDWithValidChecksum(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 12, 45, 0, 0, time.UTC)
	records := []portableMemo{
		{
			ID:        " memo-1 ",
			Content:   "Portable memo",
			Labels:    []string{},
			Lifecycle: LifecycleActive,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
	checksum, err := portableMemoChecksum(records)
	if err != nil {
		t.Fatalf("portableMemoChecksum() error = %v", err)
	}
	payload, err := json.Marshal(portableSnapshotEnvelope{
		Format:        portableSnapshotFormat,
		SchemaVersion: portableSnapshotVersion,
		ExportedAt:    now,
		Memos:         records,
		SHA256:        checksum,
	})
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}

	_, err = DecodePortableSnapshot(payload, "owner-1")
	if !errors.Is(err, ErrInvalidPortableSnapshot) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrInvalidPortableSnapshot)
	}
}

func TestPortableSnapshotRejectsTamperedMemoContent(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 13, 0, 0, 0, time.UTC)
	repository := NewMemoryRepository()
	value, err := New("memo-1", "owner-1", "Portable memo", now)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if err := repository.Save(value); err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	payload, err := CreatePortableSnapshot(repository, "owner-1", now.Add(time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}

	tampered := bytes.Replace(payload, []byte("Portable memo"), []byte("Tampered memo"), 1)
	if bytes.Equal(tampered, payload) {
		t.Fatal("test payload was not changed")
	}
	_, err = DecodePortableSnapshot(tampered, "owner-1")
	if !errors.Is(err, ErrPortableSnapshotIntegrity) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrPortableSnapshotIntegrity)
	}
}

func TestPortableSnapshotRejectsUnsupportedSchemaBeforeMaterialization(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 14, 0, 0, 0, time.UTC)
	repository := NewMemoryRepository()
	payload, err := CreatePortableSnapshot(repository, "owner-1", now)
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}

	unsupported := bytes.Replace(payload, []byte(`"schema_version": 1`), []byte(`"schema_version": 2`), 1)
	if bytes.Equal(unsupported, payload) {
		t.Fatal("test payload schema version was not changed")
	}
	_, err = DecodePortableSnapshot(unsupported, "owner-1")
	if !errors.Is(err, ErrUnsupportedSnapshot) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrUnsupportedSnapshot)
	}
}

func TestPortableSnapshotRejectsDuplicateMemoIDsWithValidChecksum(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 15, 0, 0, 0, time.UTC)
	records := []portableMemo{
		{
			ID:        "memo-1",
			Content:   "First",
			Labels:    []string{},
			Lifecycle: LifecycleActive,
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:        "memo-1",
			Content:   "Second",
			Labels:    []string{},
			Lifecycle: LifecycleActive,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
	checksum, err := portableMemoChecksum(records)
	if err != nil {
		t.Fatalf("portableMemoChecksum() error = %v", err)
	}
	payload, err := json.Marshal(portableSnapshotEnvelope{
		Format:        portableSnapshotFormat,
		SchemaVersion: portableSnapshotVersion,
		ExportedAt:    now,
		Memos:         records,
		SHA256:        checksum,
	})
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}

	_, err = DecodePortableSnapshot(payload, "owner-1")
	if !errors.Is(err, ErrInvalidPortableSnapshot) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrInvalidPortableSnapshot)
	}
}

func TestPortableSnapshotRequiresExplicitTargetOwner(t *testing.T) {
	t.Parallel()

	_, err := DecodePortableSnapshot([]byte(`{}`), "   ")
	if !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrInvalidOwner)
	}
}
