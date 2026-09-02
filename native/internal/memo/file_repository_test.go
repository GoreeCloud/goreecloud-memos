package memo

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestFileRepositoryPersistsOwnerScopedMemoAcrossInstances(t *testing.T) {
	root := t.TempDir()
	first, err := NewFileRepository(root)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Date(2026, 9, 1, 11, 0, 0, 0, time.UTC)
	value, _ := New("memo-private", "owner-private", "durable memo", now)
	value.Labels = []string{"work"}
	reminder := now.Add(time.Hour)
	value.RemindAt = &reminder
	if err := first.Save(value); err != nil {
		t.Fatal(err)
	}

	second, err := NewFileRepository(root)
	if err != nil {
		t.Fatal(err)
	}
	stored, err := second.Get("owner-private", "memo-private")
	if err != nil {
		t.Fatal(err)
	}
	if stored.Content != "durable memo" || len(stored.Labels) != 1 || stored.Labels[0] != "work" {
		t.Fatalf("unexpected stored memo: %#v", stored)
	}
	if stored.RemindAt == nil || !stored.RemindAt.Equal(reminder) {
		t.Fatalf("unexpected reminder: %v", stored.RemindAt)
	}
}

func TestFileRepositoryKeepsIdentifiersOutOfPathNames(t *testing.T) {
	root := t.TempDir()
	repository, err := NewFileRepository(root)
	if err != nil {
		t.Fatal(err)
	}
	value, _ := New("memo-secret-id", "owner-secret-id", "private", time.Now())
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}

	err = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		name := info.Name()
		for _, forbidden := range []string{"memo-secret-id", "owner-secret-id"} {
			if strings.Contains(name, forbidden) {
				t.Fatalf("repository path exposed identifier %q in %q", forbidden, path)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestFileRepositoryRejectsCrossOwnerReadsAndDeletes(t *testing.T) {
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	value, _ := New("memo-1", "owner-a", "private", time.Now())
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Get("owner-b", "memo-1"); !errors.Is(err, ErrMemoNotFound) {
		t.Fatalf("cross-owner read = %v, want ErrMemoNotFound", err)
	}
	if err := repository.Delete("owner-b", "memo-1"); !errors.Is(err, ErrMemoNotFound) {
		t.Fatalf("cross-owner delete = %v, want ErrMemoNotFound", err)
	}
	if _, err := repository.Get("owner-a", "memo-1"); err != nil {
		t.Fatalf("owner memo unavailable after foreign delete: %v", err)
	}
}

func TestFileRepositoryListIsDurableOwnerScopedAndDeterministic(t *testing.T) {
	root := t.TempDir()
	repository, _ := NewFileRepository(root)
	base := time.Date(2026, 9, 1, 11, 0, 0, 0, time.UTC)
	older, _ := New("older", "owner-a", "older", base)
	newer, _ := New("newer", "owner-a", "newer", base.Add(time.Minute))
	foreign, _ := New("foreign", "owner-b", "foreign", base.Add(2*time.Minute))
	for _, value := range []Memo{older, newer, foreign} {
		if err := repository.Save(value); err != nil {
			t.Fatal(err)
		}
	}

	reopened, _ := NewFileRepository(root)
	values, err := reopened.List("owner-a")
	if err != nil {
		t.Fatal(err)
	}
	if len(values) != 2 || values[0].ID != "newer" || values[1].ID != "older" {
		t.Fatalf("unexpected owner list: %#v", values)
	}
}

func TestFileRepositoryFailsClosedOnCorruptRecord(t *testing.T) {
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
	if err := os.WriteFile(path, []byte("not-json\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Get("owner-a", "memo-1"); err == nil {
		t.Fatal("expected corrupt memo record to fail closed")
	}
}

func TestFileRepositoryRejectsUnsafeRootAndMissingIdentity(t *testing.T) {
	if _, err := NewFileRepository(string(filepath.Separator)); err == nil {
		t.Fatal("expected filesystem root to be rejected")
	}
	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Get("", "memo-1"); !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("missing owner = %v, want ErrInvalidOwner", err)
	}
}
