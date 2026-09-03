package memo

import (
	"encoding/json"
	"fmt"
	"time"
)

const portableSnapshotInspectionOwner = "goreecloud-memos-snapshot-inspection"

// PortableSnapshotSummary is a privacy-minimized, read-only preflight projection of a
// validated native memo portability artifact. It deliberately excludes memo IDs,
// content, labels, reminder timestamps, and owner identity.
type PortableSnapshotSummary struct {
	ExportedAt    time.Time
	MemoCount     int
	ActiveCount   int
	ArchivedCount int
	TrashedCount  int
	PinnedCount   int
	ReminderCount int
}

// InspectPortableSnapshot validates a portable snapshot through the same strict decoder
// used for materialization, then returns only aggregate metadata suitable for a future
// user-facing preflight screen. It performs no Repository reads or writes.
func InspectPortableSnapshot(payload []byte) (PortableSnapshotSummary, error) {
	values, err := DecodePortableSnapshot(payload, portableSnapshotInspectionOwner)
	if err != nil {
		return PortableSnapshotSummary{}, err
	}

	// DecodePortableSnapshot already performed strict schema, trailing-value, format,
	// checksum, and record validation. This second parse reads only the validated
	// exported_at metadata needed for the minimized projection.
	var envelope portableSnapshotEnvelope
	if err := json.Unmarshal(payload, &envelope); err != nil {
		return PortableSnapshotSummary{}, fmt.Errorf("%w: cannot read validated snapshot metadata: %v", ErrInvalidPortableSnapshot, err)
	}

	summary := PortableSnapshotSummary{
		ExportedAt: envelope.ExportedAt.UTC(),
		MemoCount:  len(values),
	}
	for _, value := range values {
		switch value.Lifecycle {
		case LifecycleActive:
			summary.ActiveCount++
		case LifecycleArchived:
			summary.ArchivedCount++
		case LifecycleTrashed:
			summary.TrashedCount++
		}
		if value.Pinned {
			summary.PinnedCount++
		}
		if value.RemindAt != nil {
			summary.ReminderCount++
		}
	}
	return summary, nil
}
