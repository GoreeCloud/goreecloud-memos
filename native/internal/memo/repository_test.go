package memo

import (
	"errors"
	"testing"
	"time"
)

func TestMemoryRepositoryScopesReadsByOwner(t *testing.T) {
	repository := NewMemoryRepository()
	now := time.Date(2026, 8, 31, 19, 0, 0, 0, time.UTC)
	value, err := New("memo-1", "owner-a", "private memo", now)
	if err != nil {
		t.Fatal(err)
	}
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}

	if _, err := repository.Get("owner-b", "memo-1"); !errors.Is(err, ErrMemoNotFound) {
		t.Fatalf("other owner read = %v, want ErrMemoNotFound", err)
	}
	stored, err := repository.Get("owner-a", "memo-1")
	if err != nil {
		t.Fatal(err)
	}
	if stored.Content != "private memo" {
		t.Fatalf("stored content = %q", stored.Content)
	}
}

func TestMemoryRepositoryDefensivelyCopiesMutableMemoFields(t *testing.T) {
	repository := NewMemoryRepository()
	now := time.Date(2026, 8, 31, 19, 0, 0, 0, time.UTC)
	value, err := New("memo-1", "owner-a", "copy me", now)
	if err != nil {
		t.Fatal(err)
	}
	value.Labels = []string{"work"}
	remindAt := now.Add(time.Hour)
	expectedReminder := remindAt
	value.RemindAt = &remindAt
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}

	value.Labels[0] = "mutated"
	*value.RemindAt = now.Add(2 * time.Hour)

	stored, err := repository.Get("owner-a", "memo-1")
	if err != nil {
		t.Fatal(err)
	}
	if stored.Labels[0] != "work" {
		t.Fatalf("repository label mutated through caller: %q", stored.Labels[0])
	}
	if !stored.RemindAt.Equal(expectedReminder) {
		t.Fatalf("repository reminder mutated through caller: %v", stored.RemindAt)
	}

	stored.Labels[0] = "read-copy"
	*stored.RemindAt = now.Add(3 * time.Hour)
	again, err := repository.Get("owner-a", "memo-1")
	if err != nil {
		t.Fatal(err)
	}
	if again.Labels[0] != "work" || !again.RemindAt.Equal(expectedReminder) {
		t.Fatal("Get returned repository-owned mutable state")
	}
}

func TestMemoryRepositoryListIsOwnerScopedAndStable(t *testing.T) {
	repository := NewMemoryRepository()
	base := time.Date(2026, 8, 31, 19, 0, 0, 0, time.UTC)

	older, _ := New("older", "owner-a", "older", base)
	newer, _ := New("newer", "owner-a", "newer", base.Add(time.Minute))
	foreign, _ := New("foreign", "owner-b", "foreign", base.Add(2*time.Minute))
	for _, value := range []Memo{older, newer, foreign} {
		if err := repository.Save(value); err != nil {
			t.Fatal(err)
		}
	}

	values, err := repository.List("owner-a")
	if err != nil {
		t.Fatal(err)
	}
	if len(values) != 2 {
		t.Fatalf("List returned %d memos, want 2", len(values))
	}
	if values[0].ID != "newer" || values[1].ID != "older" {
		t.Fatalf("List order = %q, %q", values[0].ID, values[1].ID)
	}
}

func TestMemoryRepositoryDeleteCannotCrossOwnerBoundary(t *testing.T) {
	repository := NewMemoryRepository()
	value, _ := New("memo-1", "owner-a", "private", time.Now())
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}

	if err := repository.Delete("owner-b", "memo-1"); !errors.Is(err, ErrMemoNotFound) {
		t.Fatalf("cross-owner delete = %v, want ErrMemoNotFound", err)
	}
	if _, err := repository.Get("owner-a", "memo-1"); err != nil {
		t.Fatalf("owner memo disappeared after foreign delete: %v", err)
	}
	if err := repository.Delete("owner-a", "memo-1"); err != nil {
		t.Fatal(err)
	}
	if _, err := repository.Get("owner-a", "memo-1"); !errors.Is(err, ErrMemoNotFound) {
		t.Fatalf("deleted memo read = %v, want ErrMemoNotFound", err)
	}
}
