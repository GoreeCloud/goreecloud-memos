package memo

import (
	"bytes"
	"errors"
	"testing"
	"time"
)

func TestPortableSnapshotRejectsUnknownEnvelopeField(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 16, 0, 0, 0, time.UTC)
	repository := NewMemoryRepository()
	payload, err := CreatePortableSnapshot(repository, "owner-1", now)
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}

	withUnknownField := bytes.Replace(
		payload,
		[]byte(`"sha256":`),
		[]byte(`"unexpected": true,
  "sha256":`),
		1,
	)
	if bytes.Equal(withUnknownField, payload) {
		t.Fatal("test payload was not changed")
	}

	_, err = DecodePortableSnapshot(withUnknownField, "owner-1")
	if !errors.Is(err, ErrInvalidPortableSnapshot) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrInvalidPortableSnapshot)
	}
}

func TestPortableSnapshotRejectsUnknownMemoField(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 17, 0, 0, 0, time.UTC)
	repository := NewMemoryRepository()
	value, err := New("memo-1", "owner-1", "Portable memo", now)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if err := repository.Save(value); err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	payload, err := CreatePortableSnapshot(repository, "owner-1", now.Add(time.Hour))
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}

	withUnknownField := bytes.Replace(
		payload,
		[]byte(`"content": "Portable memo",`),
		[]byte(`"content": "Portable memo",
      "unexpected": true,`),
		1,
	)
	if bytes.Equal(withUnknownField, payload) {
		t.Fatal("test payload was not changed")
	}

	_, err = DecodePortableSnapshot(withUnknownField, "owner-1")
	if !errors.Is(err, ErrInvalidPortableSnapshot) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrInvalidPortableSnapshot)
	}
}

func TestPortableSnapshotRejectsTrailingJSONValue(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, 9, 1, 18, 0, 0, 0, time.UTC)
	repository := NewMemoryRepository()
	payload, err := CreatePortableSnapshot(repository, "owner-1", now)
	if err != nil {
		t.Fatalf("CreatePortableSnapshot() error = %v", err)
	}
	payload = append(payload, []byte("\n{}")...)

	_, err = DecodePortableSnapshot(payload, "owner-1")
	if !errors.Is(err, ErrInvalidPortableSnapshot) {
		t.Fatalf("DecodePortableSnapshot() error = %v, want %v", err, ErrInvalidPortableSnapshot)
	}
}
