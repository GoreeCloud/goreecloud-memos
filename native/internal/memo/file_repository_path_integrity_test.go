package memo

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

func TestFileRepositoryRejectsSymlinkedOwnerDirectory(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("symlink creation may require elevated privileges on Windows")
	}

	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	ownerDir, err := repository.ownerDirectory("owner-a")
	if err != nil {
		t.Fatal(err)
	}
	outside := t.TempDir()
	if err := os.Symlink(outside, ownerDir); err != nil {
		t.Fatal(err)
	}

	value, _ := New("memo-1", "owner-a", "private", time.Now())
	if err := repository.Save(value); err == nil {
		t.Fatal("expected symlinked owner directory to fail closed")
	}
	entries, err := os.ReadDir(outside)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 0 {
		t.Fatalf("symlink target was unexpectedly modified: %#v", entries)
	}
}

func TestFileRepositoryRejectsSymlinkedRecordRead(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("symlink creation may require elevated privileges on Windows")
	}

	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	value, _ := New("memo-1", "owner-a", "private", time.Now())
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}
	path, err := repository.recordPath("owner-a", "memo-1")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	outside := filepath.Join(t.TempDir(), "outside.json")
	if err := os.WriteFile(outside, []byte("{}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, path); err != nil {
		t.Fatal(err)
	}

	if _, err := repository.Get("owner-a", "memo-1"); err == nil {
		t.Fatal("expected symlinked memo record to fail closed")
	}
}

func TestFileRepositoryListRejectsRecordFilenameIdentityMismatch(t *testing.T) {
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	value, _ := New("memo-1", "owner-a", "private", time.Now())
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}
	path, err := repository.recordPath("owner-a", "memo-1")
	if err != nil {
		t.Fatal(err)
	}
	mismatched := filepath.Join(filepath.Dir(path), repositoryDigest("different-memo")+".json")
	if err := os.Rename(path, mismatched); err != nil {
		t.Fatal(err)
	}

	if _, err := repository.List("owner-a"); err == nil {
		t.Fatal("expected memo filename/record identity mismatch to fail closed")
	}
}

func TestFileRepositoryRejectsBroadRecordPermissions(t *testing.T) {
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	value, _ := New("memo-1", "owner-a", "private", time.Now())
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}
	path, err := repository.recordPath("owner-a", "memo-1")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0o644); err != nil {
		t.Fatal(err)
	}

	if _, err := repository.Get("owner-a", "memo-1"); err == nil {
		t.Fatal("expected broadly readable memo record to fail closed")
	}
}
