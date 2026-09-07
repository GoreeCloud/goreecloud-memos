package memo

import (
	"errors"
	"os"
	"testing"
	"time"
)

func TestRestorePortableSnapshotCleanTargetCommitsCompleteTargetOwner(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 6, 0, 0, 0, time.UTC)
	source := NewMemoryRepository()
	first, err := New("memo-1", "source-owner", "First restored memo", now)
	if err != nil {
		t.Fatalf("New(first) error = %v", err)
	}
	first.SetPinned(true, now.Add(time.Minute))
	second, err := New("memo-2", "source-owner", "Second restored memo", now.Add(2*time.Minute))
	if err != nil {
		t.Fatalf("New(second) error = %v", err)
	}
	second.Archive(now.Add(3 * time.Minute))
	if err := source.Save(first); err != nil {
		t.Fatalf("source.Save(first) error = %v", err)
	}
	if err := source.Save(second); err != nil {
		t.Fatalf("source.Save(second) error = %v", err)
	}
	payload, err := CreatePortableSnapshot(source, "source-owner", now.Add(time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}

	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	if err := RestorePortableSnapshotCleanTarget(repository, payload, "target-owner"); err != nil {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v", err)
	}

	values, err := repository.List("target-owner")
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(values) != 2 {
		t.Fatalf("List() returned %d memos, want 2", len(values))
	}
	byID := map[string]Memo{}
	for _, value := range values {
		byID[value.ID] = value
		if value.OwnerID != "target-owner" {
			t.Fatalf("restored owner = %q, want target-owner", value.OwnerID)
		}
	}
	if got := byID["memo-1"]; got.Content != "First restored memo" || !got.Pinned {
		t.Fatalf("restored memo-1 = %#v", got)
	}
	if got := byID["memo-2"]; got.Content != "Second restored memo" || got.Lifecycle != LifecycleArchived {
		t.Fatalf("restored memo-2 = %#v", got)
	}

	ownerDir, err := repository.ownerDirectory("target-owner")
	if err != nil {
		t.Fatalf("ownerDirectory() error = %v", err)
	}
	info, err := os.Lstat(ownerDir)
	if err != nil {
		t.Fatalf("Lstat(ownerDir) error = %v", err)
	}
	if info.Mode().Perm()&0o077 != 0 {
		t.Fatalf("owner directory permissions = %o, want owner-only", info.Mode().Perm())
	}
}

func TestRestorePortableSnapshotCleanTargetRejectsNonCanonicalTargetOwner(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 6, 30, 0, 0, time.UTC)
	payload, err := CreatePortableSnapshot(NewMemoryRepository(), "source-owner", now)
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}

	err = RestorePortableSnapshotCleanTarget(repository, payload, " target-owner ")
	if !errors.Is(err, ErrInvalidPortableSnapshot) {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v, want invalid snapshot", err)
	}
	ownerDir, err := repository.ownerDirectory("target-owner")
	if err != nil {
		t.Fatalf("ownerDirectory() error = %v", err)
	}
	if _, err := os.Lstat(ownerDir); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("target owner directory exists after non-canonical target, error = %v", err)
	}
}

func TestRestorePortableSnapshotCleanTargetRefusesExistingOwnerState(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 7, 0, 0, 0, time.UTC)
	source := NewMemoryRepository()
	incoming, err := New("incoming", "source-owner", "Incoming", now)
	if err != nil {
		t.Fatalf("New(incoming) error = %v", err)
	}
	if err := source.Save(incoming); err != nil {
		t.Fatalf("source.Save() error = %v", err)
	}
	payload, err := CreatePortableSnapshot(source, "source-owner", now.Add(time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}

	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	existing, err := New("existing", "target-owner", "Keep me", now)
	if err != nil {
		t.Fatalf("New(existing) error = %v", err)
	}
	if err := repository.Save(existing); err != nil {
		t.Fatalf("repository.Save(existing) error = %v", err)
	}

	err = RestorePortableSnapshotCleanTarget(repository, payload, "target-owner")
	if !errors.Is(err, ErrPortableRestoreTargetExists) {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v, want %v", err, ErrPortableRestoreTargetExists)
	}
	if _, err := repository.Get("target-owner", "existing"); err != nil {
		t.Fatalf("existing memo was damaged: %v", err)
	}
	if _, err := repository.Get("target-owner", "incoming"); !errors.Is(err, ErrMemoNotFound) {
		t.Fatalf("incoming memo unexpectedly materialized, error = %v", err)
	}
}

func TestRestorePortableSnapshotCleanTargetValidatesBeforeCreatingOwnerState(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 8, 0, 0, 0, time.UTC)
	source := NewMemoryRepository()
	value, err := New("memo-1", "source-owner", "Untampered", now)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if err := source.Save(value); err != nil {
		t.Fatalf("source.Save() error = %v", err)
	}
	payload, err := CreatePortableSnapshot(source, "source-owner", now.Add(time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}
	for index := range payload {
		if index+10 <= len(payload) && string(payload[index:index+10]) == "Untampered" {
			copy(payload[index:index+10], []byte("Tampered!!"))
			break
		}
	}

	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	err = RestorePortableSnapshotCleanTarget(repository, payload, "target-owner")
	if !errors.Is(err, ErrPortableSnapshotIntegrity) {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v, want integrity failure", err)
	}
	ownerDir, err := repository.ownerDirectory("target-owner")
	if err != nil {
		t.Fatalf("ownerDirectory() error = %v", err)
	}
	if _, err := os.Lstat(ownerDir); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("target owner directory exists after invalid snapshot, error = %v", err)
	}
}

func TestRestorePortableSnapshotCleanTargetSupportsEmptySnapshot(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 9, 0, 0, 0, time.UTC)
	payload, err := CreatePortableSnapshot(NewMemoryRepository(), "source-owner", now)
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	if err := RestorePortableSnapshotCleanTarget(repository, payload, "target-owner"); err != nil {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v", err)
	}
	values, err := repository.List("target-owner")
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(values) != 0 {
		t.Fatalf("List() returned %d memos, want empty", len(values))
	}
}
