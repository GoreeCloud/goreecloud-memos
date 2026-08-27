package memo

import (
	"errors"
	"strings"
	"time"
)

type Lifecycle string

const (
	LifecycleActive   Lifecycle = "active"
	LifecycleArchived Lifecycle = "archived"
	LifecycleTrashed  Lifecycle = "trashed"
)

var (
	ErrEmptyContent    = errors.New("memo content must not be empty")
	ErrInvalidID       = errors.New("memo id must not be empty")
	ErrInvalidOwner    = errors.New("memo owner id must not be empty")
	ErrInvalidReminder = errors.New("memo reminder time must not be zero")
)

type Memo struct {
	ID        string
	OwnerID   string
	Content   string
	Pinned    bool
	Labels    []string
	RemindAt  *time.Time
	Lifecycle Lifecycle
	CreatedAt time.Time
	UpdatedAt time.Time
}

func New(id, ownerID, content string, now time.Time) (Memo, error) {
	id = strings.TrimSpace(id)
	ownerID = strings.TrimSpace(ownerID)
	content = strings.TrimSpace(content)
	if id == "" {
		return Memo{}, ErrInvalidID
	}
	if ownerID == "" {
		return Memo{}, ErrInvalidOwner
	}
	if content == "" {
		return Memo{}, ErrEmptyContent
	}
	return Memo{
		ID:        id,
		OwnerID:   ownerID,
		Content:   content,
		Labels:    []string{},
		Lifecycle: LifecycleActive,
		CreatedAt: now.UTC(),
		UpdatedAt: now.UTC(),
	}, nil
}

func (m *Memo) Edit(content string, now time.Time) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return ErrEmptyContent
	}
	m.Content = content
	m.UpdatedAt = now.UTC()
	return nil
}

func (m *Memo) Archive(now time.Time) {
	m.Lifecycle = LifecycleArchived
	m.UpdatedAt = now.UTC()
}

func (m *Memo) Trash(now time.Time) {
	m.Lifecycle = LifecycleTrashed
	m.UpdatedAt = now.UTC()
}

func (m *Memo) Restore(now time.Time) {
	m.Lifecycle = LifecycleActive
	m.UpdatedAt = now.UTC()
}

func (m *Memo) SetPinned(pinned bool, now time.Time) {
	m.Pinned = pinned
	m.UpdatedAt = now.UTC()
}

func (m *Memo) SetReminder(remindAt, now time.Time) error {
	if remindAt.IsZero() {
		return ErrInvalidReminder
	}

	normalized := remindAt.UTC()
	if m.RemindAt != nil && m.RemindAt.Equal(normalized) {
		return nil
	}

	m.RemindAt = &normalized
	m.UpdatedAt = now.UTC()
	return nil
}

func (m *Memo) ClearReminder(now time.Time) {
	if m.RemindAt == nil {
		return
	}
	m.RemindAt = nil
	m.UpdatedAt = now.UTC()
}

func (m Memo) ReminderDue(now time.Time) bool {
	return m.Lifecycle == LifecycleActive && m.RemindAt != nil && !m.RemindAt.After(now.UTC())
}
