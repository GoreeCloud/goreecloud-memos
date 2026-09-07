package memo

import (
	"errors"
	"testing"
	"time"
)

func TestMemoryRepositoryRejectsNoncanonicalCallerIdentities(t *testing.T) {
	repository := NewMemoryRepository()
	now := time.Date(2026, 9, 6, 21, 30, 0, 0, time.UTC)
	canonical, err := New("memo-1", "owner-a", "private memo", now)
	if err != nil {
		t.Fatal(err)
	}
	if err := repository.Save(canonical); err != nil {
		t.Fatal(err)
	}

	badOwner := canonical
	badOwner.OwnerID = " owner-a"
	if err := repository.Save(badOwner); !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("Save noncanonical owner = %v, want ErrInvalidOwner", err)
	}

	badMemo := canonical
	badMemo.ID = "memo-1 "
	if err := repository.Save(badMemo); !errors.Is(err, ErrInvalidID) {
		t.Fatalf("Save noncanonical memo = %v, want ErrInvalidID", err)
	}

	if _, err := repository.Get(" owner-a", "memo-1"); !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("Get noncanonical owner = %v, want ErrInvalidOwner", err)
	}
	if _, err := repository.Get("owner-a", "memo-1 "); !errors.Is(err, ErrInvalidID) {
		t.Fatalf("Get noncanonical memo = %v, want ErrInvalidID", err)
	}
	if _, err := repository.List("owner-a "); !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("List noncanonical owner = %v, want ErrInvalidOwner", err)
	}
	if err := repository.Delete(" owner-a", "memo-1"); !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("Delete noncanonical owner = %v, want ErrInvalidOwner", err)
	}
	if err := repository.Delete("owner-a", "memo-1 "); !errors.Is(err, ErrInvalidID) {
		t.Fatalf("Delete noncanonical memo = %v, want ErrInvalidID", err)
	}

	stored, err := repository.Get("owner-a", "memo-1")
	if err != nil {
		t.Fatalf("canonical memo unavailable after rejected callers: %v", err)
	}
	if stored.OwnerID != "owner-a" || stored.ID != "memo-1" {
		t.Fatalf("canonical identity changed: owner=%q memo=%q", stored.OwnerID, stored.ID)
	}
}

func TestRepositoryCanonicalIdentityHelpersDoNotRewriteScope(t *testing.T) {
	if owner, err := requireCanonicalRepositoryOwnerID("owner-a"); err != nil || owner != "owner-a" {
		t.Fatalf("canonical owner = %q, %v", owner, err)
	}
	if memoID, err := requireCanonicalRepositoryMemoID("memo-1"); err != nil || memoID != "memo-1" {
		t.Fatalf("canonical memo = %q, %v", memoID, err)
	}
	if owner, err := requireCanonicalRepositoryOwnerID(" owner-a "); owner != "" || !errors.Is(err, ErrInvalidOwner) {
		t.Fatalf("rewritten owner = %q, %v; want empty + ErrInvalidOwner", owner, err)
	}
	if memoID, err := requireCanonicalRepositoryMemoID(" memo-1 "); memoID != "" || !errors.Is(err, ErrInvalidID) {
		t.Fatalf("rewritten memo = %q, %v; want empty + ErrInvalidID", memoID, err)
	}
}
