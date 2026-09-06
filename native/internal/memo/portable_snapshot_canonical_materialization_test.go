package memo

import (
	"encoding/json"
	"errors"
	"testing"
	"time"
)

func TestPortableSnapshotRejectsNormalizationDependentRecordTextWithValidChecksum(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 6, 14, 0, 0, 0, time.UTC)
	tests := map[string]portableMemo{
		"content": {
			ID:        "memo-1",
			Content:   " Portable memo ",
			Labels:    []string{},
			Lifecycle: LifecycleActive,
			CreatedAt: now,
			UpdatedAt: now,
		},
		"label": {
			ID:        "memo-1",
			Content:   "Portable memo",
			Labels:    []string{" Work "},
			Lifecycle: LifecycleActive,
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	for name, record := range tests {
		record := record
		t.Run(name, func(t *testing.T) {
			records := []portableMemo{record}
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
		})
	}
}
