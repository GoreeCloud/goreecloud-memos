package memo

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
)

var ErrMemoNotFound = errors.New("memo not found")

// Repository is the persistence boundary for the native GoreeCloud Memos domain.
// Implementations must scope every operation to an explicit owner identifier and reject
// noncanonical owner/memo identities rather than silently rewriting caller-selected scope.
type Repository interface {
	Save(memo Memo) error
	Get(ownerID, memoID string) (Memo, error)
	List(ownerID string) ([]Memo, error)
	Delete(ownerID, memoID string) error
}

// MemoryRepository is a concurrency-safe development/test repository. It deliberately
// keeps ownership in the storage key so callers cannot address another owner's memo by
// ID alone. It enforces the same caller-identity semantics as durable repositories so a
// durable implementation can replace it without changing repository-scope behavior.
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

func requireCanonicalRepositoryOwnerID(ownerID string) (string, error) {
	canonical := normalizeRepositoryIdentity(ownerID)
	if canonical == "" {
		return "", ErrInvalidOwner
	}
	if ownerID != canonical {
		return "", fmt.Errorf("%w: owner id must already be canonical", ErrInvalidOwner)
	}
	return ownerID, nil
}

func requireCanonicalRepositoryMemoID(memoID string) (string, error) {
	canonical := normalizeRepositoryIdentity(memoID)
	if canonical == "" {
		return "", ErrInvalidID
	}
	if memoID != canonical {
		return "", fmt.Errorf("%w: memo id must already be canonical", ErrInvalidID)
	}
	return memoID, nil
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
	ownerID, err := requireCanonicalRepositoryOwnerID(value.OwnerID)
	if err != nil {
		return err
	}
	memoID, err := requireCanonicalRepositoryMemoID(value.ID)
	if err != nil {
		return err
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
	ownerID, err := requireCanonicalRepositoryOwnerID(ownerID)
	if err != nil {
		return Memo{}, err
	}
	memoID, err = requireCanonicalRepositoryMemoID(memoID)
	if err != nil {
		return Memo{}, err
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
	ownerID, err := requireCanonicalRepositoryOwnerID(ownerID)
	if err != nil {
		return nil, err
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
	ownerID, err := requireCanonicalRepositoryOwnerID(ownerID)
	if err != nil {
		return err
	}
	memoID, err = requireCanonicalRepositoryMemoID(memoID)
	if err != nil {
		return err
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
