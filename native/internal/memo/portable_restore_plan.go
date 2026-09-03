package memo

import "fmt"

// PortableRestorePlan is a content-minimized, read-only projection of how a validated
// portable snapshot compares with one explicit target owner's current repository state.
//
// The plan intentionally exposes counts only. It does not return memo content, labels,
// reminder timestamps, conflicting identifiers, or any write instruction.
type PortableRestorePlan struct {
	TotalMemoCount     int
	CreateCount        int
	UnchangedCount     int
	ConflictCount      int
	ConflictResolutionRequired bool
}

// PlanPortableSnapshotRestore validates and materializes a snapshot for targetOwnerID,
// then compares it with that owner's existing repository state without writing anything.
//
// A conflict means the snapshot contains a memo identifier already present for the target
// owner but the complete memo value differs. An identical value is counted as unchanged.
// New identifiers are counted as creates. Callers must use a separately authorized restore
// path to resolve conflicts or persist any state.
func PlanPortableSnapshotRestore(
	payload []byte,
	targetOwnerID string,
	repository Repository,
) (PortableRestorePlan, error) {
	if repository == nil {
		return PortableRestorePlan{}, fmt.Errorf("%w: repository is required", ErrInvalidPortableSnapshot)
	}

	values, err := DecodePortableSnapshot(payload, targetOwnerID)
	if err != nil {
		return PortableRestorePlan{}, err
	}
	targetOwnerID = normalizeRepositoryIdentity(targetOwnerID)

	existingValues, err := repository.List(targetOwnerID)
	if err != nil {
		return PortableRestorePlan{}, err
	}
	existingByID := make(map[string]Memo, len(existingValues))
	for _, value := range existingValues {
		if normalizeRepositoryIdentity(value.OwnerID) != targetOwnerID {
			return PortableRestorePlan{}, fmt.Errorf(
				"%w: repository returned a memo outside the target owner scope",
				ErrInvalidPortableSnapshot,
			)
		}
		existingByID[value.ID] = value
	}

	plan := PortableRestorePlan{TotalMemoCount: len(values)}
	for _, value := range values {
		existing, ok := existingByID[value.ID]
		if !ok {
			plan.CreateCount++
			continue
		}
		if portableRestoreMemoEqual(existing, value) {
			plan.UnchangedCount++
			continue
		}
		plan.ConflictCount++
	}
	plan.ConflictResolutionRequired = plan.ConflictCount > 0
	return plan, nil
}

func portableRestoreMemoEqual(left, right Memo) bool {
	if normalizeRepositoryIdentity(left.ID) != normalizeRepositoryIdentity(right.ID) ||
		normalizeRepositoryIdentity(left.OwnerID) != normalizeRepositoryIdentity(right.OwnerID) ||
		left.Content != right.Content ||
		left.Pinned != right.Pinned ||
		left.Lifecycle != right.Lifecycle ||
		!left.CreatedAt.Equal(right.CreatedAt) ||
		!left.UpdatedAt.Equal(right.UpdatedAt) ||
		len(left.Labels) != len(right.Labels) {
		return false
	}
	for index := range left.Labels {
		if left.Labels[index] != right.Labels[index] {
			return false
		}
	}
	if left.RemindAt == nil || right.RemindAt == nil {
		return left.RemindAt == nil && right.RemindAt == nil
	}
	return left.RemindAt.Equal(*right.RemindAt)
}
