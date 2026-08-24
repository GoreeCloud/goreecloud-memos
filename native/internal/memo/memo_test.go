package memo

import (
	"errors"
	"testing"
	"time"
)

func TestNewMemoRequiresContent(t *testing.T) {
	_, err := New("memo-1", "owner-1", "   ", time.Unix(0, 0))
	if !errors.Is(err, ErrEmptyContent) {
		t.Fatalf("expected ErrEmptyContent, got %v", err)
	}
}

func TestMemoLifecycleAndPinning(t *testing.T) {
	created := time.Date(2026, 8, 24, 16, 0, 0, 0, time.UTC)
	m, err := New("memo-1", "owner-1", "Capture this", created)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}
	if m.Lifecycle != LifecycleActive {
		t.Fatalf("expected active lifecycle, got %q", m.Lifecycle)
	}

	pinnedAt := created.Add(time.Minute)
	m.SetPinned(true, pinnedAt)
	if !m.Pinned || !m.UpdatedAt.Equal(pinnedAt) {
		t.Fatalf("pinning did not update state")
	}

	archivedAt := created.Add(2 * time.Minute)
	m.Archive(archivedAt)
	if m.Lifecycle != LifecycleArchived {
		t.Fatalf("expected archived lifecycle, got %q", m.Lifecycle)
	}

	trashedAt := created.Add(3 * time.Minute)
	m.Trash(trashedAt)
	if m.Lifecycle != LifecycleTrashed {
		t.Fatalf("expected trashed lifecycle, got %q", m.Lifecycle)
	}

	restoredAt := created.Add(4 * time.Minute)
	m.Restore(restoredAt)
	if m.Lifecycle != LifecycleActive || !m.UpdatedAt.Equal(restoredAt) {
		t.Fatalf("restore did not return memo to active state")
	}
}
