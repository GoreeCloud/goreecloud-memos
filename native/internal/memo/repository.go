package memo

import (
	"errors"
	"sort"
	"strings"
	"sync"
)

var ErrMemoNotFound = errors.New("memo not found")

// Repository is the persistence boundary for the native GoreeCloud Memos domain.
// Implementations must scope every operation to an explicit owner identifier.
type Repository interface {
	Save(memo Memo) error
	Get(ownerID, memoID string) (Memo, error)
	List(ownerID string) ([]Memo, error)
	Delete(ownerID, memoID string) error
}

// MemoryRepository is a concurrency-safe development/test repository. It deliberately
// keeps ownership in the storage key so callers cannot address another owner's memo by
// ID alone. A durable repository can replace it without changing domain behavior.
type MemoryRepository struct {
	mu      sync.RWMutex
	byOwner map[string]map[string]Memo
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{byOwner: make(map[string]map[string]Memo)}
}

func normalizeRepositoryIdentity(value string) string {
	return strings.TrimSpace(value)
}

func cloneMemo(value Memo) Memo {
	copyValue := value
	copyValue.Labels = append([]string(nil), value.Labels...)
	if value.RemindAt != nil {
		remindAt := *value.RemindAt
		copyValue.RemindAt = &remindAt
	}
	return copyValue
}

func (repository *MemoryRepository) Save(value Memo) error {
	ownerID := normalizeRepositoryIdentity(value.OwnerID)
	memoID := normalizeRepositoryIdentity(value.ID)
	if ownerID == "" {
		return ErrInvalidOwner
	}
	if memoID == "" {
		return ErrInvalidID
	}

	repository.mu.Lock()
	defer repository.mu.Unlock()

	ownerMemos := repository.byOwner[ownerID]
	if ownerMemos == nil {
		ownerMemos = make(map[string]Memo)
		repository.byOwner[ownerID] = ownerMemos
	}
	ownerMemos[memoID] = cloneMemo(value)
	return nil
}

func (repository *MemoryRepository) Get(ownerID, memoID string) (Memo, error) {
	ownerID = normalizeRepositoryIdentity(ownerID)
	memoID = normalizeRepositoryIdentity(memoID)
	if ownerID == "" {
		return Memo{}, ErrInvalidOwner
	}
	if memoID == "" {
		return Memo{}, ErrInvalidID
	}

	repository.mu.RLock()
	defer repository.mu.RUnlock()

	ownerMemos := repository.byOwner[ownerID]
	value, ok := ownerMemos[memoID]
	if !ok {
		return Memo{}, ErrMemoNotFound
	}
	return cloneMemo(value), nil
}

func (repository *MemoryRepository) List(ownerID string) ([]Memo, error) {
	ownerID = normalizeRepositoryIdentity(ownerID)
	if ownerID == "" {
		return nil, ErrInvalidOwner
	}

	repository.mu.RLock()
	defer repository.mu.RUnlock()

	ownerMemos := repository.byOwner[ownerID]
	values := make([]Memo, 0, len(ownerMemos))
	for _, value := range ownerMemos {
		values = append(values, cloneMemo(value))
	}
	sort.Slice(values, func(i, j int) bool {
		if values[i].UpdatedAt.Equal(values[j].UpdatedAt) {
			return values[i].ID < values[j].ID
		}
		return values[i].UpdatedAt.After(values[j].UpdatedAt)
	})
	return values, nil
}

func (repository *MemoryRepository) Delete(ownerID, memoID string) error {
	ownerID = normalizeRepositoryIdentity(ownerID)
	memoID = normalizeRepositoryIdentity(memoID)
	if ownerID == "" {
		return ErrInvalidOwner
	}
	if memoID == "" {
		return ErrInvalidID
	}

	repository.mu.Lock()
	defer repository.mu.Unlock()

	ownerMemos := repository.byOwner[ownerID]
	if _, ok := ownerMemos[memoID]; !ok {
		return ErrMemoNotFound
	}
	delete(ownerMemos, memoID)
	if len(ownerMemos) == 0 {
		delete(repository.byOwner, ownerID)
	}
	return nil
}
