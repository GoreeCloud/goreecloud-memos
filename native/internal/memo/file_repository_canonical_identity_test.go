package memo

import (
	"encoding/json"
	"os"
	"testing"
	"time"
)

func TestFileRepositoryRejectsNormalizationDependentRecordIdentity(t *testing.T) {
	t.Parallel()

	for name, mutate := range map[string]func(*fileMemoRecord){
		"owner id": func(record *fileMemoRecord) { record.Memo.OwnerID = " owner-a " },
		"memo id":  func(record *fileMemoRecord) { record.Memo.ID = " memo-1 " },
	} {
		mutate := mutate
		t.Run(name, func(t *testing.T) {
			repository, err := NewFileRepository(t.TempDir())
			if err != nil {
				t.Fatal(err)
			}
			value, err := New("memo-1", "owner-a", "private", time.Date(2026, 9, 6, 18, 0, 0, 0, time.UTC))
			if err != nil {
				t.Fatal(err)
			}
			if err := repository.Save(value); err != nil {
				t.Fatal(err)
			}
			path, err := repository.recordPath("owner-a", "memo-1")
			if err != nil {
				t.Fatal(err)
			}

			bytes, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			var record fileMemoRecord
			if err := json.Unmarshal(bytes, &record); err != nil {
				t.Fatal(err)
			}
			mutate(&record)
			bytes, err = json.Marshal(record)
			if err != nil {
				t.Fatal(err)
			}
			bytes = append(bytes, '\n')
			if err := os.WriteFile(path, bytes, 0o600); err != nil {
				t.Fatal(err)
			}

			if _, err := repository.Get("owner-a", "memo-1"); err == nil {
				t.Fatal("expected Get to reject normalization-dependent durable record identity")
			}
			if _, err := repository.List("owner-a"); err == nil {
				t.Fatal("expected List to reject normalization-dependent durable record identity")
			}
		})
	}
}

func TestFileRepositoryRejectsNormalizationDependentCallerIdentity(t *testing.T) {
	t.Parallel()

	repository, err := NewFileRepository(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	value, err := New("memo-1", "owner-a", "private", time.Date(2026, 9, 6, 19, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatal(err)
	}
	if err := repository.Save(value); err != nil {
		t.Fatal(err)
	}

	aliasedOwner := value
	aliasedOwner.OwnerID = " owner-a "
	if err := repository.Save(aliasedOwner); err == nil {
		t.Fatal("expected Save to reject normalization-dependent owner identity")
	}
	aliasedMemo := value
	aliasedMemo.ID = " memo-1 "
	if err := repository.Save(aliasedMemo); err == nil {
		t.Fatal("expected Save to reject normalization-dependent memo identity")
	}

	if _, err := repository.Get(" owner-a ", "memo-1"); err == nil {
		t.Fatal("expected Get to reject normalization-dependent owner identity")
	}
	if _, err := repository.Get("owner-a", " memo-1 "); err == nil {
		t.Fatal("expected Get to reject normalization-dependent memo identity")
	}
	if _, err := repository.List(" owner-a "); err == nil {
		t.Fatal("expected List to reject normalization-dependent owner identity")
	}
	if err := repository.Delete("owner-a", " memo-1 "); err == nil {
		t.Fatal("expected Delete to reject normalization-dependent memo identity")
	}

	persisted, err := repository.Get("owner-a", "memo-1")
	if err != nil {
		t.Fatalf("canonical memo should remain after rejected aliases: %v", err)
	}
	if persisted.OwnerID != "owner-a" || persisted.ID != "memo-1" || persisted.Content != "private" {
		t.Fatalf("unexpected canonical memo after rejected aliases: %#v", persisted)
	}
}
