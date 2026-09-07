package memo

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

var (
	ErrPortableRestoreTargetExists    = errors.New("portable memo restore target already exists")
	ErrPortableRestoreCommitAmbiguous = errors.New("portable memo restore commit outcome is ambiguous")
)

// RestorePortableSnapshotCleanTarget materializes a fully validated portable snapshot into an
// explicit target owner on a durable FileRepository, but only when that owner has no repository
// directory yet.
//
// The complete snapshot is decoded before persistence. Records are then written into an owner-only
// staging directory under the repository root, individually synchronized, and the staging directory
// is synchronized before one directory rename makes the complete owner state authoritative. Existing
// target state observed by this repository instance is never merged or overwritten by this operation.
//
// This is a single-node clean-target primitive. It does not authenticate the target owner, choose a
// target owner on the caller's behalf, resolve conflicts, coordinate hostile/non-cooperating external
// writers, provide cross-device synchronization, or establish Everkeep/production restore acceptance.
func RestorePortableSnapshotCleanTarget(
	repository *FileRepository,
	payload []byte,
	targetOwnerID string,
) error {
	if repository == nil {
		return fmt.Errorf("%w: durable file repository is required", ErrInvalidPortableSnapshot)
	}

	normalizedTargetOwnerID := normalizeRepositoryIdentity(targetOwnerID)
	if normalizedTargetOwnerID == "" || targetOwnerID != normalizedTargetOwnerID {
		return fmt.Errorf("%w: target owner identity must be canonical", ErrInvalidPortableSnapshot)
	}
	targetOwnerID = normalizedTargetOwnerID
	values, err := DecodePortableSnapshot(payload, targetOwnerID)
	if err != nil {
		return err
	}
	ownerDir, err := repository.ownerDirectory(targetOwnerID)
	if err != nil {
		return err
	}

	repository.mu.Lock()
	defer repository.mu.Unlock()

	if err := requireAbsentRestoreTarget(ownerDir); err != nil {
		return err
	}

	stagingDir, err := os.MkdirTemp(repository.root, ".memo-restore-*")
	if err != nil {
		return fmt.Errorf("create portable memo restore staging directory: %w", err)
	}
	removeStaging := true
	defer func() {
		if removeStaging {
			_ = os.RemoveAll(stagingDir)
		}
	}()
	if err := os.Chmod(stagingDir, 0o700); err != nil {
		return fmt.Errorf("protect portable memo restore staging directory: %w", err)
	}
	if err := validateRestoreStagingDirectory(stagingDir); err != nil {
		return err
	}

	for _, value := range values {
		if normalizeRepositoryIdentity(value.OwnerID) != targetOwnerID {
			return fmt.Errorf("%w: decoded memo owner does not match restore target", ErrInvalidPortableSnapshot)
		}
		if err := writeStagedMemoRecord(stagingDir, value); err != nil {
			return err
		}
	}
	if err := syncDirectory(stagingDir); err != nil {
		return fmt.Errorf("sync portable memo restore staging directory: %w", err)
	}

	// Recheck immediately before commit. repository.mu excludes all cooperating writes through this
	// FileRepository instance. The source remains explicitly single-node and does not claim hostile
	// multi-process exclusion.
	if err := requireAbsentRestoreTarget(ownerDir); err != nil {
		return err
	}
	if err := os.Rename(stagingDir, ownerDir); err != nil {
		return fmt.Errorf("commit portable memo clean-target restore: %w", err)
	}
	removeStaging = false

	// From this point onward the owner directory is visible at its authoritative path. Any failure
	// must report an ambiguous commit outcome so callers reconcile state instead of retrying as if
	// nothing could have been materialized.
	if err := repository.validateOwnerDirectory(ownerDir); err != nil {
		return portableRestoreCommitAmbiguous("validate committed portable memo restore", err)
	}
	for _, value := range values {
		path, err := repository.recordPath(targetOwnerID, value.ID)
		if err != nil {
			return portableRestoreCommitAmbiguous("resolve committed portable memo record", err)
		}
		bytes, err := readProtectedMemoRecord(path)
		if err != nil {
			return portableRestoreCommitAmbiguous("verify committed portable memo record", err)
		}
		actual, err := decodeFileMemoRecord(bytes, targetOwnerID, value.ID)
		if err != nil {
			return portableRestoreCommitAmbiguous("verify committed portable memo record identity", err)
		}
		if !portableRestoreMemoEqual(value, actual) {
			return portableRestoreCommitAmbiguous(
				"verify committed portable memo record content",
				ErrPortableRestoreStateMismatch,
			)
		}
	}

	if err := syncDirectory(repository.root); err != nil {
		return portableRestoreCommitAmbiguous("sync repository root after restore commit; crash durability is unknown", err)
	}
	return nil
}

func portableRestoreCommitAmbiguous(operation string, err error) error {
	return fmt.Errorf("%w: %s: %v", ErrPortableRestoreCommitAmbiguous, operation, err)
}

func requireAbsentRestoreTarget(ownerDir string) error {
	_, err := os.Lstat(ownerDir)
	switch {
	case err == nil:
		return ErrPortableRestoreTargetExists
	case errors.Is(err, os.ErrNotExist):
		return nil
	default:
		return fmt.Errorf("inspect portable memo restore target: %w", err)
	}
}

func validateRestoreStagingDirectory(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return fmt.Errorf("inspect portable memo restore staging directory: %w", err)
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.IsDir() {
		return errors.New("portable memo restore staging path is not a protected directory")
	}
	if info.Mode().Perm()&0o077 != 0 {
		return errors.New("portable memo restore staging directory permissions are broader than owner-only")
	}
	return nil
}

func writeStagedMemoRecord(stagingDir string, value Memo) error {
	memoID := normalizeRepositoryIdentity(value.ID)
	if memoID == "" {
		return ErrInvalidID
	}
	bytes, err := json.Marshal(fileMemoRecord{
		Version: fileMemoRecordVersion,
		Memo:    cloneMemo(value),
	})
	if err != nil {
		return fmt.Errorf("encode portable memo restore record: %w", err)
	}
	bytes = append(bytes, '\n')

	path := filepath.Join(stagingDir, repositoryDigest(memoID)+".json")
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o600)
	if err != nil {
		return fmt.Errorf("create portable memo restore record: %w", err)
	}
	closed := false
	defer func() {
		if !closed {
			_ = file.Close()
		}
	}()
	if err := file.Chmod(0o600); err != nil {
		return fmt.Errorf("protect portable memo restore record: %w", err)
	}
	if _, err := file.Write(bytes); err != nil {
		return fmt.Errorf("write portable memo restore record: %w", err)
	}
	if err := file.Sync(); err != nil {
		return fmt.Errorf("sync portable memo restore record: %w", err)
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("close portable memo restore record: %w", err)
	}
	closed = true
	return nil
}
