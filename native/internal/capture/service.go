package capture

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/GoreeCloud/goreecloud-memos/native/internal/memo"
)

const (
	MaxContentBytes   = 20 * 1024
	MaxSourceURLBytes = 2048
)

var (
	ErrUnauthenticated = errors.New("authenticated owner is required")
	ErrInvalidKind     = errors.New("capture kind is invalid")
	ErrContentTooLarge = errors.New("capture content is too large")
	ErrSourceTooLarge  = errors.New("capture source url is too large")
	ErrInvalidSource   = errors.New("capture source url is invalid")
)

type Kind string

const (
	KindPage      Kind = "page"
	KindLink      Kind = "link"
	KindSelection Kind = "selection"
)

type Input struct {
	Kind      Kind
	Content   string
	SourceURL string
}

type MemoWriter interface {
	CreateMemo(context.Context, memo.Memo) error
}

type IDGenerator func() string

type Service struct {
	writer MemoWriter
	now    func() time.Time
	newID  IDGenerator
}

func NewService(writer MemoWriter, now func() time.Time, newID IDGenerator) (*Service, error) {
	if writer == nil {
		return nil, errors.New("memo writer is required")
	}
	if now == nil {
		return nil, errors.New("clock is required")
	}
	if newID == nil {
		return nil, errors.New("id generator is required")
	}
	return &Service{writer: writer, now: now, newID: newID}, nil
}

func (s *Service) Capture(ctx context.Context, ownerID string, input Input) (memo.Memo, error) {
	ownerID = strings.TrimSpace(ownerID)
	if ownerID == "" {
		return memo.Memo{}, ErrUnauthenticated
	}
	if input.Kind != KindPage && input.Kind != KindLink && input.Kind != KindSelection {
		return memo.Memo{}, ErrInvalidKind
	}
	content := strings.TrimSpace(input.Content)
	if len([]byte(content)) > MaxContentBytes {
		return memo.Memo{}, ErrContentTooLarge
	}

	source, err := normalizeSourceURL(input.SourceURL)
	if err != nil {
		return memo.Memo{}, err
	}
	if content == "" && source == "" {
		return memo.Memo{}, memo.ErrEmptyContent
	}
	if content == "" {
		content = source
	} else if source != "" {
		content = fmt.Sprintf("%s\n\nSource: %s", content, source)
	}

	created, err := memo.New(s.newID(), ownerID, content, s.now())
	if err != nil {
		return memo.Memo{}, err
	}
	if err := s.writer.CreateMemo(ctx, created); err != nil {
		return memo.Memo{}, fmt.Errorf("persist captured memo: %w", err)
	}
	return created, nil
}

func normalizeSourceURL(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", nil
	}
	if len([]byte(raw)) > MaxSourceURLBytes {
		return "", ErrSourceTooLarge
	}
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "https" && parsed.Scheme != "http") {
		return "", ErrInvalidSource
	}
	parsed.Fragment = ""
	return parsed.String(), nil
}
