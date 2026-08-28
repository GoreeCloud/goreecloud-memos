package memo

import (
	"testing"
	"time"
)

func TestMatchesQuerySearchesContentAndLabels(t *testing.T) {
	m, err := New("memo-1", "owner-1", "Call the electrician Friday", time.Unix(0, 0))
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}
	if _, err := m.AddLabel("Home", time.Unix(60, 0)); err != nil {
		t.Fatalf("AddLabel returned error: %v", err)
	}

	cases := []struct {
		query string
		want  bool
	}{
		{query: "", want: true},
		{query: " electrician ", want: true},
		{query: "FRIDAY", want: true},
		{query: "home", want: true},
		{query: "ome", want: true},
		{query: "work", want: false},
	}
	for _, tc := range cases {
		if got := m.MatchesQuery(tc.query); got != tc.want {
			t.Fatalf("MatchesQuery(%q) = %v, want %v", tc.query, got, tc.want)
		}
	}
}

func TestHasLabelNormalizesCaseAndWhitespace(t *testing.T) {
	m, err := New("memo-1", "owner-1", "Capture", time.Unix(0, 0))
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}
	if _, err := m.AddLabel("Errands", time.Unix(60, 0)); err != nil {
		t.Fatalf("AddLabel returned error: %v", err)
	}

	if !m.HasLabel(" errands ") {
		t.Fatalf("expected normalized label match")
	}
	if !m.HasLabel("ERRANDS") {
		t.Fatalf("expected case-insensitive label match")
	}
	if m.HasLabel("") {
		t.Fatalf("blank label must not match")
	}
	if m.HasLabel("work") {
		t.Fatalf("unexpected label match")
	}
}
