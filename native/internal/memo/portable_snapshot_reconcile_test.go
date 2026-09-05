package memo

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestReconcilePortableSnapshotCleanTargetMatchesRestoredState(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 10, 0, 0, 0, time.UTC)
	reminder := now.Add(4 * time.Hour)
	source := NewMemoryRepository()
	first, err := New("memo-1", "source-owner", "First reconciled memo", now)
	if err != nil {
		t.Fatalf("New(first) error = %v", err)
	}
	first.Labels = []string{"work", "urgent"}
	first.RemindAt = &reminder
	first.SetPinned(true, now.Add(time.Minute))
	second, err := New("memo-2", "source-owner", "Second reconciled memo", now.Add(2*time.Minute))
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
	payload, err := CreatePortableSnapshot(source, "source-owner", now.Add(5*time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}

	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	if err := RestorePortableSnapshotCleanTarget(repository, payload, " target-owner "); err != nil {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v", err)
	}
	if err := ReconcilePortableSnapshotCleanTarget(repository, payload, " target-owner "); err != nil {
		t.Fatalf("ReconcilePortableSnapshotCleanTarget() error = %v", err)
	}
}

func TestReconcilePortableSnapshotCleanTargetMissingTargetDoesNotMatchEmptySnapshot(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 11, 0, 0, 0, time.UTC)
	payload, err := CreatePortableSnapshot(NewMemoryRepository(), "source-owner", now)
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}

	err = ReconcilePortableSnapshotCleanTarget(repository, payload, "target-owner")
	if !errors.Is(err, ErrPortableRestoreStateMismatch) {
		t.Fatalf("ReconcilePortableSnapshotCleanTarget() error = %v, want %v", err, ErrPortableRestoreStateMismatch)
	}
}

func TestReconcilePortableSnapshotCleanTargetMatchesCommittedEmptySnapshot(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 11, 30, 0, 0, time.UTC)
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
	if err := ReconcilePortableSnapshotCleanTarget(repository, payload, "target-owner"); err != nil {
		t.Fatalf("ReconcilePortableSnapshotCleanTarget() error = %v", err)
	}
}

func TestReconcilePortableSnapshotCleanTargetDetectsModifiedMemo(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 12, 0, 0, 0, time.UTC)
	payload := mustPortableRestoreReconciliationPayload(t, now)
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	if err := RestorePortableSnapshotCleanTarget(repository, payload, "target-owner"); err != nil {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v", err)
	}
	value, err := repository.Get("target-owner", "memo-1")
	if err != nil {
		t.Fatalf("repository.Get() error = %v", err)
	}
	value.Content = "Changed after restore"
	if err := repository.Save(value); err != nil {
		t.Fatalf("repository.Save() error = %v", err)
	}

	err = ReconcilePortableSnapshotCleanTarget(repository, payload, "target-owner")
	if !errors.Is(err, ErrPortableRestoreStateMismatch) {
		t.Fatalf("ReconcilePortableSnapshotCleanTarget() error = %v, want %v", err, ErrPortableRestoreStateMismatch)
	}
}

func TestReconcilePortableSnapshotCleanTargetDetectsExtraMemo(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 13, 0, 0, 0, time.UTC)
	payload := mustPortableRestoreReconciliationPayload(t, now)
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	if err := RestorePortableSnapshotCleanTarget(repository, payload, "target-owner"); err != nil {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v", err)
	}
	extra, err := New("extra", "target-owner", "Unexpected memo", now.Add(2*time.Hour))
	if err != nil {
		t.Fatalf("New(extra) error = %v", err)
	}
	if err := repository.Save(extra); err != nil {
		t.Fatalf("repository.Save(extra) error = %v", err)
	}

	err = ReconcilePortableSnapshotCleanTarget(repository, payload, "target-owner")
	if !errors.Is(err, ErrPortableRestoreStateMismatch) {
		t.Fatalf("ReconcilePortableSnapshotCleanTarget() error = %v, want %v", err, ErrPortableRestoreStateMismatch)
	}
}

func TestReconcilePortableSnapshotCleanTargetRejectsTamperedSnapshotBeforeStateClaim(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 14, 0, 0, 0, time.UTC)
	payload := mustPortableRestoreReconciliationPayload(t, now)
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	if err := RestorePortableSnapshotCleanTarget(repository, payload, "target-owner"); err != nil {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v", err)
	}

	tampered := append([]byte(nil), payload...)
	for index := range tampered {
		if index+10 <= len(tampered) && string(tampered[index:index+10]) == "Reconcile " {
			copy(tampered[index:index+10], []byte("Tampered!!"))
			break
		}
	}
	err = ReconcilePortableSnapshotCleanTarget(repository, tampered, "target-owner")
	if !errors.Is(err, ErrPortableSnapshotIntegrity) {
		t.Fatalf("ReconcilePortableSnapshotCleanTarget() error = %v, want integrity failure", err)
	}
}

func TestReconcilePortableSnapshotCleanTargetRejectsUnexpectedOwnerEntry(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 5, 15, 0, 0, 0, time.UTC)
	payload := mustPortableRestoreReconciliationPayload(t, now)
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatalf("NewFileRepository() error = %v", err)
	}
	if err := RestorePortableSnapshotCleanTarget(repository, payload, "target-owner"); err != nil {
		t.Fatalf("RestorePortableSnapshotCleanTarget() error = %v", err)
	}
	ownerDir, err := repository.ownerDirectory("target-owner")
	if err != nil {
		t.Fatalf("ownerDirectory() error = %v", err)
	}
	if err := os.WriteFile(filepath.Join(ownerDir, "unexpected.tmp"), []byte("unexpected"), 0o600); err != nil {
		t.Fatalf("WriteFile(unexpected) error = %v", err)
	}

	err = ReconcilePortableSnapshotCleanTarget(repository, payload, "target-owner")
	if !errors.Is(err, ErrPortableRestoreStateMismatch) {
		t.Fatalf("ReconcilePortableSnapshotCleanTarget() error = %v, want %v", err, ErrPortableRestoreStateMismatch)
	}
}

func mustPortableRestoreReconciliationPayload(t *testing.T, now time.Time) []byte {
	t.Helper()

	source := NewMemoryRepository()
	value, err := New("memo-1", "source-owner", "Reconcile snapshot", now)
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
	return payload
}
