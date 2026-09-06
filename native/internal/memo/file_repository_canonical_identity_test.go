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
