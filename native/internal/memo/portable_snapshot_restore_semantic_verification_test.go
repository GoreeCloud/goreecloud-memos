package memo

import (
	"testing"
	"time"
)

func TestPortableRestoreMemoEqualCoversCompletePortableMeaning(t *testing.T) {
	t.Parallel()

	created := time.Date(2026, 9, 5, 16, 0, 0, 0, time.UTC)
	updated := created.Add(2 * time.Minute)
	reminder := created.Add(2 * time.Hour)
	expected := Memo{
		ID:        "memo-1",
		OwnerID:   "target-owner",
		Content:   "Exact restored content",
		Pinned:    true,
		Labels:    []string{"work", "urgent"},
		RemindAt:  &reminder,
		Lifecycle: LifecycleArchived,
		CreatedAt: created,
		UpdatedAt: updated,
	}

	if !portableRestoreMemoEqual(expected, cloneMemo(expected)) {
		t.Fatal("identical portable memo meaning must compare equal")
	}

	cases := map[string]func(Memo) Memo{
		"id": func(value Memo) Memo {
			value.ID = "memo-2"
			return value
		},
		"noncanonical id": func(value Memo) Memo {
			value.ID = " memo-1 "
			return value
		},
		"owner": func(value Memo) Memo {
			value.OwnerID = "other-owner"
			return value
		},
		"noncanonical owner": func(value Memo) Memo {
			value.OwnerID = " target-owner "
			return value
		},
		"content": func(value Memo) Memo {
			value.Content = "Changed content"
			return value
		},
		"pinned": func(value Memo) Memo {
			value.Pinned = false
			return value
		},
		"labels": func(value Memo) Memo {
			value.Labels = []string{"urgent", "work"}
			return value
		},
		"reminder": func(value Memo) Memo {
			changed := reminder.Add(time.Minute)
			value.RemindAt = &changed
			return value
		},
		"lifecycle": func(value Memo) Memo {
			value.Lifecycle = LifecycleActive
			return value
		},
		"created": func(value Memo) Memo {
			value.CreatedAt = created.Add(time.Second)
			return value
		},
		"updated": func(value Memo) Memo {
			value.UpdatedAt = updated.Add(time.Second)
			return value
		},
	}

	for name, mutate := range cases {
		name, mutate := name, mutate
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			actual := mutate(cloneMemo(expected))
			if portableRestoreMemoEqual(expected, actual) {
				t.Fatalf("changed %s must fail exact portable restore comparison", name)
			}
		})
	}
}
