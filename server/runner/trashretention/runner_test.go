package trashretention

import (
	"strings"
	"testing"
	"time"
)

func TestDecideRetention(t *testing.T) {
	now := time.Date(2026, time.August, 21, 20, 0, 0, 0, time.UTC)

	tests := []struct {
		name    string
		content string
		want    retentionDecision
	}{
		{
			name:    "ordinary memo is ignored",
			content: "Quick memo",
			want:    retentionSkip,
		},
		{
			name:    "legacy Trash receives a grace-period timestamp",
			content: "Quick memo\n\n<!-- goreecloud-note-trash: normal -->",
			want:    retentionStamp,
		},
		{
			name:    "malformed timestamp fails safe to a fresh grace period",
			content: "Quick memo\n\n<!-- goreecloud-note-trash: archived -->\n<!-- goreecloud-note-trash-at: invalid -->",
			want:    retentionStamp,
		},
		{
			name:    "fresh Trash remains recoverable",
			content: "Quick memo\n\n<!-- goreecloud-note-trash: normal -->\n<!-- goreecloud-note-trash-at: 2026-08-01T20:00:01Z -->",
			want:    retentionSkip,
		},
		{
			name:    "exactly thirty days is permanently deletable",
			content: "Quick memo\n\n<!-- goreecloud-note-trash: normal -->\n<!-- goreecloud-note-trash-at: 2026-07-22T20:00:00Z -->",
			want:    retentionDelete,
		},
		{
			name:    "older than thirty days is permanently deletable",
			content: "Quick memo\n\n<!-- goreecloud-note-trash: archived -->\n<!-- goreecloud-note-trash-at: 2026-07-01T12:00:00Z -->",
			want:    retentionDelete,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := decideRetention(tt.content, now); got != tt.want {
				t.Fatalf("decideRetention() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestWithTrashTimestamp(t *testing.T) {
	now := time.Date(2026, time.August, 21, 20, 0, 0, 123456789, time.UTC)
	content := "Quick memo\n\n<!-- goreecloud-note-trash: normal -->\n<!-- goreecloud-note-trash-at: malformed -->"

	updated := withTrashTimestamp(content, now)
	if strings.Count(updated, "goreecloud-note-trash-at:") != 1 {
		t.Fatalf("expected exactly one Trash timestamp marker, got %q", updated)
	}
	if !strings.Contains(updated, "<!-- goreecloud-note-trash: normal -->") {
		t.Fatalf("Trash origin marker was not preserved: %q", updated)
	}
	if got, ok := parseTrashTimestamp(updated); !ok || !got.Equal(now) {
		t.Fatalf("parseTrashTimestamp() = %v, %v, want %v, true", got, ok, now)
	}
}

func TestRetentionPeriodIsThirtyDays(t *testing.T) {
	if RetentionPeriod != 30*24*time.Hour {
		t.Fatalf("RetentionPeriod = %v, want 30 days", RetentionPeriod)
	}
}
