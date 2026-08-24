package memo

import (
	"errors"
	"strings"
	"time"
)

var ErrInvalidLabel = errors.New("memo label must not be empty")

func normalizeLabel(label string) string {
	return strings.TrimSpace(label)
}

func sameLabel(a, b string) bool {
	return strings.EqualFold(a, b)
}

func (m *Memo) HasLabel(label string) bool {
	label = normalizeLabel(label)
	if label == "" {
		return false
	}
	for _, existing := range m.Labels {
		if sameLabel(existing, label) {
			return true
		}
	}
	return false
}

func (m *Memo) AddLabel(label string, now time.Time) (bool, error) {
	label = normalizeLabel(label)
	if label == "" {
		return false, ErrInvalidLabel
	}
	if m.HasLabel(label) {
		return false, nil
	}
	m.Labels = append(m.Labels, label)
	m.UpdatedAt = now.UTC()
	return true, nil
}

func (m *Memo) RemoveLabel(label string, now time.Time) bool {
	label = normalizeLabel(label)
	if label == "" {
		return false
	}
	for i, existing := range m.Labels {
		if sameLabel(existing, label) {
			m.Labels = append(m.Labels[:i], m.Labels[i+1:]...)
			m.UpdatedAt = now.UTC()
			return true
		}
	}
	return false
}
