package memo

import (
	"errors"
	"testing"
	"time"
)

func TestMemoLabelsNormalizeDeduplicateAndRemove(t *testing.T) {
	created := time.Date(2026, 8, 24, 18, 0, 0, 0, time.UTC)
	m, err := New("memo-1", "owner-1", "Capture", created)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}
	if len(m.Labels) != 0 {
		t.Fatalf("new memo should start without labels")
	}

	addedAt := created.Add(time.Minute)
	added, err := m.AddLabel("  Ideas  ", addedAt)
	if err != nil || !added {
		t.Fatalf("AddLabel failed: added=%v err=%v", added, err)
	}
	if len(m.Labels) != 1 || m.Labels[0] != "Ideas" || !m.UpdatedAt.Equal(addedAt) {
		t.Fatalf("label was not normalized and persisted correctly: %#v", m.Labels)
	}
	if !m.HasLabel("ideas") || !m.HasLabel(" IDEAS ") {
		t.Fatalf("label lookup should be case-insensitive and whitespace-tolerant")
	}

	unchangedAt := m.UpdatedAt
	added, err = m.AddLabel("IDEAS", addedAt.Add(time.Minute))
	if err != nil || added {
		t.Fatalf("duplicate label should be a no-op: added=%v err=%v", added, err)
	}
	if len(m.Labels) != 1 || !m.UpdatedAt.Equal(unchangedAt) {
		t.Fatalf("duplicate label mutated memo state")
	}

	removedAt := created.Add(3 * time.Minute)
	if !m.RemoveLabel(" ideas ", removedAt) {
		t.Fatalf("expected label removal")
	}
	if len(m.Labels) != 0 || !m.UpdatedAt.Equal(removedAt) {
		t.Fatalf("label removal did not update memo state")
	}
	if m.RemoveLabel("missing", removedAt.Add(time.Minute)) {
		t.Fatalf("missing label removal should be a no-op")
	}
	if !m.UpdatedAt.Equal(removedAt) {
		t.Fatalf("missing label removal changed update time")
	}
}

func TestMemoLabelRejectsBlankWithoutMutation(t *testing.T) {
	created := time.Date(2026, 8, 24, 18, 0, 0, 0, time.UTC)
	m, err := New("memo-1", "owner-1", "Capture", created)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}

	added, err := m.AddLabel("   ", created.Add(time.Minute))
	if !errors.Is(err, ErrInvalidLabel) || added {
		t.Fatalf("expected ErrInvalidLabel, added=%v err=%v", added, err)
	}
	if len(m.Labels) != 0 || !m.UpdatedAt.Equal(created) {
		t.Fatalf("invalid label mutated memo state")
	}
	if m.HasLabel(" ") {
		t.Fatalf("blank label must never match")
	}
}
