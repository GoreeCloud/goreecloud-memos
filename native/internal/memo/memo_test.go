package memo

import (
	"errors"
	"testing"
	"time"
)

func TestNewMemoRequiresIdentityAndContent(t *testing.T) {
	now := time.Unix(0, 0)
	cases := []struct {
		name    string
		id      string
		ownerID string
		content string
		want    error
	}{
		{name: "id", id: " ", ownerID: "owner-1", content: "memo", want: ErrInvalidID},
		{name: "owner", id: "memo-1", ownerID: " ", content: "memo", want: ErrInvalidOwner},
		{name: "content", id: "memo-1", ownerID: "owner-1", content: "   ", want: ErrEmptyContent},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := New(tc.id, tc.ownerID, tc.content, now)
			if !errors.Is(err, tc.want) {
				t.Fatalf("expected %v, got %v", tc.want, err)
			}
		})
	}
}

func TestMemoEditTrimsAndPreservesOnFailure(t *testing.T) {
	created := time.Date(2026, 8, 24, 16, 0, 0, 0, time.UTC)
	m, err := New("memo-1", "owner-1", "Original", created)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}

	editedAt := created.Add(time.Minute)
	if err := m.Edit("  Updated capture  ", editedAt); err != nil {
		t.Fatalf("Edit returned error: %v", err)
	}
	if m.Content != "Updated capture" || !m.UpdatedAt.Equal(editedAt) {
		t.Fatalf("edit did not normalize content and update timestamp")
	}

	if err := m.Edit("   ", editedAt.Add(time.Minute)); !errors.Is(err, ErrEmptyContent) {
		t.Fatalf("expected ErrEmptyContent, got %v", err)
	}
	if m.Content != "Updated capture" || !m.UpdatedAt.Equal(editedAt) {
		t.Fatalf("failed edit mutated memo state")
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
