package memo

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"
)

func TestPortableSnapshotRejectsNormalizationDependentChecksumEvidence(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 18, 0, 0, 0, time.UTC)
	records := []portableMemo{{
		ID:        "memo-1",
		Content:   "Portable memo",
		Labels:    []string{},
		Lifecycle: LifecycleActive,
		CreatedAt: now,
		UpdatedAt: now,
	}}
	checksum, err := portableMemoChecksum(records)
	if err != nil {
		t.Fatalf("portableMemoChecksum() error = %v", err)
	}

	for name, suppliedChecksum := range map[string]string{
		"uppercase":              strings.ToUpper(checksum),
		"surrounding whitespace": " " + checksum + " ",
	} {
		t.Run(name, func(t *testing.T) {
			payload, err := json.Marshal(portableSnapshotEnvelope{
				Format:        portableSnapshotFormat,
				SchemaVersion: portableSnapshotVersion,
				ExportedAt:    now,
				Memos:         records,
				SHA256:        suppliedChecksum,
			})
			if err != nil {
				t.Fatalf("json.Marshal() error = %v", err)
			}

			_, err = DecodePortableSnapshot(payload, "owner-1")
			if !errors.Is(err, ErrPortableSnapshotIntegrity) {
				t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrPortableSnapshotIntegrity)
			}
		})
	}
}
