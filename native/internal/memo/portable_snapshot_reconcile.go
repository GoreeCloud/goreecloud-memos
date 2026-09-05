package memo

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var ErrPortableRestoreStateMismatch = errors.New("portable memo restore state does not match snapshot")

// ReconcilePortableSnapshotCleanTarget verifies that the current durable state for an explicit
// target owner exactly matches a fully validated portable snapshot and re-synchronizes the owner
// and repository directories before returning success.
//
// This helper is intended for resolving a prior ErrPortableRestoreCommitAmbiguous result. Success
// establishes current-state equivalence and successful directory synchronization at the time of
// this call. It does not prove that a particular restore invocation created the state, authenticate
// or authorize the target owner, establish artifact provenance or recovery lineage, or grant
// Everkeep/production recovery acceptance.
func ReconcilePortableSnapshotCleanTarget(
	repository *FileRepository,
	payload []byte,
	targetOwnerID string,
) error {
	if repository == nil {
		return fmt.Errorf("%w: durable file repository is required", ErrInvalidPortableSnapshot)
	}

	targetOwnerID = normalizeRepositoryIdentity(targetOwnerID)
	expected, err := DecodePortableSnapshot(payload, targetOwnerID)
	if err != nil {
		return err
	}
	ownerDir, err := repository.ownerDirectory(targetOwnerID)
	if err != nil {
		return err
	}

	repository.mu.Lock()
	defer repository.mu.Unlock()

	if err := repository.validateOwnerDirectory(ownerDir); errors.Is(err, os.ErrNotExist) {
		return ErrPortableRestoreStateMismatch
	} else if err != nil {
		return portableRestoreCommitAmbiguous("validate target owner during restore reconciliation", err)
	}

	actual, err := readPortableRestoreOwnerStateLocked(repository, ownerDir, targetOwnerID)
	if err != nil {
		return err
	}
	if !portableRestoreStatesEqual(expected, actual) {
		return ErrPortableRestoreStateMismatch
	}

	if err := syncDirectory(ownerDir); err != nil {
		return portableRestoreCommitAmbiguous("sync target owner during restore reconciliation", err)
	}
	if err := syncDirectory(repository.root); err != nil {
		return portableRestoreCommitAmbiguous("sync repository root during restore reconciliation", err)
	}
	return nil
}

// readPortableRestoreOwnerStateLocked reads one exact owner-directory state while the caller holds
// repository.mu for writing. Unexpected entries and structurally invalid records are mismatches;
// inability to read a structurally protected record is an ambiguous I/O outcome rather than proof
// that the durable memo value differs.
func readPortableRestoreOwnerStateLocked(
	repository *FileRepository,
	ownerDir string,
	ownerID string,
) ([]Memo, error) {
	entries, err := os.ReadDir(ownerDir)
	if err != nil {
		return nil, portableRestoreCommitAmbiguous("read target owner during restore reconciliation", err)
	}

	values := make([]Memo, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			return nil, ErrPortableRestoreStateMismatch
		}

		path := filepath.Join(ownerDir, entry.Name())
		if err := validateProtectedMemoRecord(path); err != nil {
			return nil, ErrPortableRestoreStateMismatch
		}
		bytes, err := os.ReadFile(path)
		if err != nil {
			return nil, portableRestoreCommitAmbiguous("read protected memo during restore reconciliation", err)
		}
		var record fileMemoRecord
		if err := json.Unmarshal(bytes, &record); err != nil {
			return nil, ErrPortableRestoreStateMismatch
		}
		memoID := normalizeRepositoryIdentity(record.Memo.ID)
		if record.Version != fileMemoRecordVersion ||
			record.Memo.OwnerID != ownerID ||
			record.Memo.ID != memoID ||
			memoID == "" ||
			entry.Name() != repositoryDigest(memoID)+".json" {
			return nil, ErrPortableRestoreStateMismatch
		}
		values = append(values, cloneMemo(record.Memo))
	}
	return values, nil
}

func portableRestoreStatesEqual(expected, actual []Memo) bool {
	if len(expected) != len(actual) {
		return false
	}

	actualByID := make(map[string]Memo, len(actual))
	for _, value := range actual {
		memoID := normalizeRepositoryIdentity(value.ID)
		if memoID == "" || value.ID != memoID {
			return false
		}
		if _, exists := actualByID[memoID]; exists {
			return false
		}
		actualByID[memoID] = value
	}

	for _, expectedValue := range expected {
		memoID := normalizeRepositoryIdentity(expectedValue.ID)
		actualValue, exists := actualByID[memoID]
		if !exists || !portableRestoreMemoEqual(expectedValue, actualValue) {
			return false
		}
	}
	return true
}

func portableRestoreMemoEqual(expected, actual Memo) bool {
	if expected.ID != actual.ID ||
		expected.OwnerID != actual.OwnerID ||
		expected.Content != actual.Content ||
		expected.Pinned != actual.Pinned ||
		expected.Lifecycle != actual.Lifecycle ||
		!expected.CreatedAt.Equal(actual.CreatedAt) ||
		!expected.UpdatedAt.Equal(actual.UpdatedAt) ||
		len(expected.Labels) != len(actual.Labels) {
		return false
	}
	for index := range expected.Labels {
		if expected.Labels[index] != actual.Labels[index] {
			return false
		}
	}
	if (expected.RemindAt == nil) != (actual.RemindAt == nil) {
		return false
	}
	return expected.RemindAt == nil || expected.RemindAt.Equal(*actual.RemindAt)
}
