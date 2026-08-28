package capture

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/GoreeCloud/goreecloud-memos/native/internal/memo"
)

type recordingWriter struct {
	created []memo.Memo
	err     error
}

func (w *recordingWriter) CreateMemo(_ context.Context, value memo.Memo) error {
	if w.err != nil {
		return w.err
	}
	w.created = append(w.created, value)
	return nil
}

func TestCaptureBindsMemoToAuthenticatedOwnerAndNormalizesSource(t *testing.T) {
	writer := &recordingWriter{}
	now := time.Date(2026, 8, 28, 21, 0, 0, 0, time.UTC)
	service, err := NewService(writer, func() time.Time { return now }, func() string { return "memo-1" })
	if err != nil {
		t.Fatalf("new service: %v", err)
	}

	created, err := service.Capture(context.Background(), " owner-7 ", Input{
		Kind:      KindSelection,
		Content:   " selected text ",
		SourceURL: "https://example.test/page#private-fragment",
	})
	if err != nil {
		t.Fatalf("capture: %v", err)
	}
	if created.OwnerID != "owner-7" {
		t.Fatalf("owner = %q", created.OwnerID)
	}
	if created.Content != "selected text\n\nSource: https://example.test/page" {
		t.Fatalf("content = %q", created.Content)
	}
	if len(writer.created) != 1 || writer.created[0].ID != created.ID || writer.created[0].OwnerID != created.OwnerID || writer.created[0].Content != created.Content {
		t.Fatalf("writer did not receive created memo: %#v", writer.created)
	}
}

func TestCaptureFailsClosedWithoutOwnerOrForInvalidPayload(t *testing.T) {
	writer := &recordingWriter{}
	service, err := NewService(writer, time.Now, func() string { return "memo-1" })
	if err != nil {
		t.Fatalf("new service: %v", err)
	}

	tests := map[string]struct {
		owner  string
		input  Input
		target error
	}{
		"owner":  {"", Input{Kind: KindPage, Content: "hello"}, ErrUnauthenticated},
		"kind":   {"owner", Input{Kind: "other", Content: "hello"}, ErrInvalidKind},
		"size":   {"owner", Input{Kind: KindPage, Content: strings.Repeat("x", MaxContentBytes+1)}, ErrContentTooLarge},
		"source": {"owner", Input{Kind: KindLink, Content: "hello", SourceURL: "file:///etc/passwd"}, ErrInvalidSource},
	}
	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			_, err := service.Capture(context.Background(), test.owner, test.input)
			if !errors.Is(err, test.target) {
				t.Fatalf("error = %v, want %v", err, test.target)
			}
		})
	}
	if len(writer.created) != 0 {
		t.Fatalf("rejected captures reached writer: %#v", writer.created)
	}
}
