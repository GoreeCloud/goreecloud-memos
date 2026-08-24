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

var ErrEmptyContent = errors.New("memo content must not be empty")

type Memo struct {
	ID        string
	OwnerID   string
	Content   string
	Pinned    bool
	Lifecycle Lifecycle
	CreatedAt time.Time
	UpdatedAt time.Time
}

func New(id, ownerID, content string, now time.Time) (Memo, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return Memo{}, ErrEmptyContent
	}
	return Memo{
		ID:        id,
		OwnerID:   ownerID,
		Content:   content,
		Lifecycle: LifecycleActive,
		CreatedAt: now.UTC(),
		UpdatedAt: now.UTC(),
	}, nil
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
