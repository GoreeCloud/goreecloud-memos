package memo

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"
)

func TestInspectPortableSnapshotReturnsOnlyAggregatePreflightState(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 3, 6, 30, 0, 0, time.UTC)
	reminder := now.Add(2 * time.Hour)
	records := []portableMemo{
		{
			ID:        "memo-private-one",
			Content:   "private launch checklist",
			Pinned:    true,
			Labels:    []string{"private-label"},
			RemindAt:  &reminder,
			Lifecycle: LifecycleActive,
			CreatedAt: now.Add(-2 * time.Hour),
			UpdatedAt: now.Add(-time.Hour),
		},
		{
			ID:        "memo-private-two",
			Content:   "archived private content",
			Labels:    []string{"archive-label"},
			Lifecycle: LifecycleArchived,
			CreatedAt: now.Add(-4 * time.Hour),
			UpdatedAt: now.Add(-3 * time.Hour),
		},
		{
			ID:        "memo-private-three",
			Content:   "trashed private content",
			Pinned:    true,
			Labels:    []string{},
			Lifecycle: LifecycleTrashed,
			CreatedAt: now.Add(-6 * time.Hour),
			UpdatedAt: now.Add(-5 * time.Hour),
		},
	}
	checksum, err := portableMemoChecksum(records)
	if err != nil {
		t.Fatalf("portableMemoChecksum() error = %v", err)
	}
	payload, err := json.Marshal(portableSnapshotEnvelope{
		Format:        portableSnapshotFormat,
		SchemaVersion: portableSnapshotVersion,
		ExportedAt:    now,
		Memos:         records,
		SHA256:        checksum,
	})
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}

	summary, err := InspectPortableSnapshot(payload)
	if err != nil {
		t.Fatalf("InspectPortableSnapshot() error = %v", err)
	}
	if !summary.ExportedAt.Equal(now) {
		t.Fatalf("ExportedAt = %v, want %v", summary.ExportedAt, now)
	}
	if summary.MemoCount != 3 || summary.ActiveCount != 1 || summary.ArchivedCount != 1 || summary.TrashedCount != 1 {
		t.Fatalf("lifecycle counts = %+v, want 3 total and one in each lifecycle", summary)
	}
	if summary.PinnedCount != 2 || summary.ReminderCount != 1 {
		t.Fatalf("pin/reminder counts = %+v, want pinned=2 reminders=1", summary)
	}

	projection := fmt.Sprintf("%+v", summary)
	for _, privateValue := range []string{
		"memo-private-one",
		"private launch checklist",
		"private-label",
		"archive-label",
	} {
		if strings.Contains(projection, privateValue) {
			t.Fatalf("summary projection leaked private value %q: %s", privateValue, projection)
		}
	}
}

func TestInspectPortableSnapshotRejectsTamperedSnapshot(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 3, 7, 0, 0, 0, time.UTC)
	records := []portableMemo{{
		ID:        "memo-1",
		Content:   "original private content",
		Labels:    []string{},
		Lifecycle: LifecycleActive,
		CreatedAt: now,
		UpdatedAt: now,
	}}
	checksum, err := portableMemoChecksum(records)
	if err != nil {
		t.Fatalf("portableMemoChecksum() error = %v", err)
	}
	payload, err := json.Marshal(portableSnapshotEnvelope{
		Format:        portableSnapshotFormat,
		SchemaVersion: portableSnapshotVersion,
		ExportedAt:    now,
		Memos:         records,
		SHA256:        checksum,
	})
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}

	tampered := bytes.Replace(payload, []byte("original private content"), []byte("tampered private content"), 1)
	if bytes.Equal(tampered, payload) {
		t.Fatal("test payload was not changed")
	}
	_, err = InspectPortableSnapshot(tampered)
	if !errors.Is(err, ErrPortableSnapshotIntegrity) {
		t.Fatalf("InspectPortableSnapshot() error = %v, want %v", err, ErrPortableSnapshotIntegrity)
	}
}

func TestInspectPortableSnapshotPreservesStrictUnknownFieldRejection(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 3, 7, 30, 0, 0, time.UTC)
	records := []portableMemo{}
	checksum, err := portableMemoChecksum(records)
	if err != nil {
		t.Fatalf("portableMemoChecksum() error = %v", err)
	}
	payload, err := json.Marshal(portableSnapshotEnvelope{
		Format:        portableSnapshotFormat,
		SchemaVersion: portableSnapshotVersion,
		ExportedAt:    now,
		Memos:         records,
		SHA256:        checksum,
	})
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	payload = bytes.Replace(payload, []byte(`"memos":[]`), []byte(`"unexpected":"value","memos":[]`), 1)

	_, err = InspectPortableSnapshot(payload)
	if !errors.Is(err, ErrInvalidPortableSnapshot) {
		t.Fatalf("InspectPortableSnapshot() error = %v, want %v", err, ErrInvalidPortableSnapshot)
	}
}
