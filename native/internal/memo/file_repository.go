package memo

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
)

const fileMemoRecordVersion = 1

type fileMemoRecord struct {
	Version int  `json:"version"`
	Memo    Memo `json:"memo"`
}

// FileRepository is a single-node durable native repository for GoreeCloud Memos.
//
// Owner and memo identifiers are hashed before they are used as path components. The complete memo
// remains protected user data inside the record and is never represented in a filename. Writes use
// a temporary record, file sync, atomic rename, and directory sync before Save returns success.
// This implementation grants no cross-device synchronization or production acceptance authority.
type FileRepository struct {
	mu   sync.RWMutex
	root string
}

func NewFileRepository(root string) (*FileRepository, error) {
	root = strings.TrimSpace(root)
	if root == "" {
		return nil, errors.New("memo repository root is required")
	}
	absolute, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("resolve memo repository root: %w", err)
	}
	if absolute == string(filepath.Separator) {
		return nil, errors.New("memo repository root cannot be filesystem root")
	}
	if err := os.MkdirAll(absolute, 0o700); err != nil {
		return nil, fmt.Errorf("create memo repository root: %w", err)
	}
	if err := os.Chmod(absolute, 0o700); err != nil {
		return nil, fmt.Errorf("protect memo repository root: %w", err)
	}
	resolved, err := filepath.EvalSymlinks(absolute)
	if err != nil {
		return nil, fmt.Errorf("resolve memo repository root links: %w", err)
	}
	return &FileRepository{root: resolved}, nil
}

func repositoryDigest(value string) string {
	digest := sha256.Sum256([]byte(value))
	return hex.EncodeToString(digest[:])
}

func (repository *FileRepository) ownerDirectory(ownerID string) (string, error) {
	ownerID = normalizeRepositoryIdentity(ownerID)
	if ownerID == "" {
		return "", ErrInvalidOwner
	}
	return filepath.Join(repository.root, repositoryDigest(ownerID)), nil
}

func (repository *FileRepository) recordPath(ownerID, memoID string) (string, error) {
	ownerDir, err := repository.ownerDirectory(ownerID)
	if err != nil {
		return "", err
	}
	memoID = normalizeRepositoryIdentity(memoID)
	if memoID == "" {
		return "", ErrInvalidID
	}
	return filepath.Join(ownerDir, repositoryDigest(memoID)+".json"), nil
}

func syncDirectory(path string) error {
	directory, err := os.Open(path)
	if err != nil {
		return err
	}
	defer directory.Close()
	return directory.Sync()
}

func (repository *FileRepository) validateOwnerDirectory(ownerDir string) error {
	info, err := os.Lstat(ownerDir)
	if err != nil {
		return err
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.IsDir() {
		return errors.New("memo owner path is not a protected directory")
	}
	if info.Mode().Perm()&0o077 != 0 {
		return errors.New("memo owner directory permissions are broader than owner-only")
	}
	resolved, err := filepath.EvalSymlinks(ownerDir)
	if err != nil {
		return err
	}
	if filepath.Clean(resolved) != filepath.Clean(ownerDir) {
		return errors.New("memo owner directory resolves outside its repository path")
	}
	return nil
}

func (repository *FileRepository) prepareOwnerDirectory(ownerDir string) error {
	if err := os.Mkdir(ownerDir, 0o700); err != nil && !errors.Is(err, os.ErrExist) {
		return fmt.Errorf("create memo owner directory: %w", err)
	}
	if err := repository.validateOwnerDirectory(ownerDir); err != nil {
		return fmt.Errorf("validate memo owner directory: %w", err)
	}
	if err := os.Chmod(ownerDir, 0o700); err != nil {
		return fmt.Errorf("protect memo owner directory: %w", err)
	}
	return nil
}

func validateProtectedMemoRecord(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return errors.New("memo record is not a protected regular file")
	}
	if info.Mode().Perm()&0o077 != 0 {
		return errors.New("memo record permissions are broader than owner-only")
	}
	return nil
}

func readProtectedMemoRecord(path string) ([]byte, error) {
	if err := validateProtectedMemoRecord(path); err != nil {
		return nil, err
	}
	return os.ReadFile(path)
}

func (repository *FileRepository) Save(value Memo) error {
	ownerID := normalizeRepositoryIdentity(value.OwnerID)
	memoID := normalizeRepositoryIdentity(value.ID)
	path, err := repository.recordPath(ownerID, memoID)
	if err != nil {
		return err
	}
	value.OwnerID = ownerID
	value.ID = memoID
	bytes, err := json.Marshal(fileMemoRecord{Version: fileMemoRecordVersion, Memo: cloneMemo(value)})
	if err != nil {
		return fmt.Errorf("encode memo record: %w", err)
	}
	bytes = append(bytes, '\n')

	repository.mu.Lock()
	defer repository.mu.Unlock()

	ownerDir := filepath.Dir(path)
	if err := repository.prepareOwnerDirectory(ownerDir); err != nil {
		return err
	}

	temporary, err := os.CreateTemp(ownerDir, ".memo-*")
	if err != nil {
		return fmt.Errorf("create memo temporary record: %w", err)
	}
	temporaryPath := temporary.Name()
	removeTemporary := true
	defer func() {
		_ = temporary.Close()
		if removeTemporary {
			_ = os.Remove(temporaryPath)
		}
	}()
	if err := temporary.Chmod(0o600); err != nil {
		return fmt.Errorf("protect memo temporary record: %w", err)
	}
	if _, err := temporary.Write(bytes); err != nil {
		return fmt.Errorf("write memo temporary record: %w", err)
	}
	if err := temporary.Sync(); err != nil {
		return fmt.Errorf("sync memo temporary record: %w", err)
	}
	if err := temporary.Close(); err != nil {
		return fmt.Errorf("close memo temporary record: %w", err)
	}
	if err := os.Rename(temporaryPath, path); err != nil {
		return fmt.Errorf("commit memo record: %w", err)
	}
	removeTemporary = false
	if err := syncDirectory(ownerDir); err != nil {
		return fmt.Errorf("sync memo owner directory: %w", err)
	}
	return nil
}

func (repository *FileRepository) Get(ownerID, memoID string) (Memo, error) {
	ownerID = normalizeRepositoryIdentity(ownerID)
	memoID = normalizeRepositoryIdentity(memoID)
	path, err := repository.recordPath(ownerID, memoID)
	if err != nil {
		return Memo{}, err
	}

	repository.mu.RLock()
	defer repository.mu.RUnlock()
	ownerDir := filepath.Dir(path)
	if err := repository.validateOwnerDirectory(ownerDir); errors.Is(err, os.ErrNotExist) {
		return Memo{}, ErrMemoNotFound
	} else if err != nil {
		return Memo{}, fmt.Errorf("validate memo owner directory: %w", err)
	}
	bytes, err := readProtectedMemoRecord(path)
	if errors.Is(err, os.ErrNotExist) {
		return Memo{}, ErrMemoNotFound
	}
	if err != nil {
		return Memo{}, fmt.Errorf("read memo record: %w", err)
	}
	return decodeFileMemoRecord(bytes, ownerID, memoID)
}

func decodeFileMemoRecord(bytes []byte, ownerID, memoID string) (Memo, error) {
	var record fileMemoRecord
	if err := json.Unmarshal(bytes, &record); err != nil {
		return Memo{}, fmt.Errorf("decode memo record: %w", err)
	}
	if record.Version != fileMemoRecordVersion {
		return Memo{}, fmt.Errorf("unsupported memo record version %d", record.Version)
	}
	if normalizeRepositoryIdentity(record.Memo.OwnerID) != ownerID || normalizeRepositoryIdentity(record.Memo.ID) != memoID {
		return Memo{}, errors.New("memo record identity mismatch")
	}
	return cloneMemo(record.Memo), nil
}

func (repository *FileRepository) List(ownerID string) ([]Memo, error) {
	ownerID = normalizeRepositoryIdentity(ownerID)
	ownerDir, err := repository.ownerDirectory(ownerID)
	if err != nil {
		return nil, err
	}

	repository.mu.RLock()
	defer repository.mu.RUnlock()
	if err := repository.validateOwnerDirectory(ownerDir); errors.Is(err, os.ErrNotExist) {
		return []Memo{}, nil
	} else if err != nil {
		return nil, fmt.Errorf("validate memo owner directory: %w", err)
	}
	entries, err := os.ReadDir(ownerDir)
	if err != nil {
		return nil, fmt.Errorf("list memo owner directory: %w", err)
	}

	values := make([]Memo, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		bytes, err := readProtectedMemoRecord(filepath.Join(ownerDir, entry.Name()))
		if err != nil {
			return nil, fmt.Errorf("read memo list record: %w", err)
		}
		var record fileMemoRecord
		if err := json.Unmarshal(bytes, &record); err != nil {
			return nil, fmt.Errorf("decode memo list record: %w", err)
		}
		memoID := normalizeRepositoryIdentity(record.Memo.ID)
		if record.Version != fileMemoRecordVersion || normalizeRepositoryIdentity(record.Memo.OwnerID) != ownerID {
			return nil, errors.New("memo list record failed owner/version validation")
		}
		if memoID == "" || entry.Name() != repositoryDigest(memoID)+".json" {
			return nil, errors.New("memo list record failed path identity validation")
		}
		values = append(values, cloneMemo(record.Memo))
	}
	sort.Slice(values, func(i, j int) bool {
		if values[i].UpdatedAt.Equal(values[j].UpdatedAt) {
			return values[i].ID < values[j].ID
		}
		return values[i].UpdatedAt.After(values[j].UpdatedAt)
	})
	return values, nil
}

func (repository *FileRepository) Delete(ownerID, memoID string) error {
	ownerID = normalizeRepositoryIdentity(ownerID)
	memoID = normalizeRepositoryIdentity(memoID)
	path, err := repository.recordPath(ownerID, memoID)
	if err != nil {
		return err
	}

	repository.mu.Lock()
	defer repository.mu.Unlock()
	ownerDir := filepath.Dir(path)
	if err := repository.validateOwnerDirectory(ownerDir); errors.Is(err, os.ErrNotExist) {
		return ErrMemoNotFound
	} else if err != nil {
		return fmt.Errorf("validate memo owner directory: %w", err)
	}
	if err := validateProtectedMemoRecord(path); errors.Is(err, os.ErrNotExist) {
		return ErrMemoNotFound
	} else if err != nil {
		return fmt.Errorf("validate memo record before delete: %w", err)
	}
	if err := os.Remove(path); err != nil {
		return fmt.Errorf("delete memo record: %w", err)
	}
	if err := syncDirectory(ownerDir); err != nil {
		return fmt.Errorf("sync memo deletion: %w", err)
	}
	return nil
}
