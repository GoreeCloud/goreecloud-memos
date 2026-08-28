package memo

import (
	"errors"
	"testing"
	"time"
)

func TestMemoReminderNormalizesAndDetectsDueState(t *testing.T) {
	created := time.Date(2026, 8, 26, 20, 0, 0, 0, time.UTC)
	m, err := New("memo-1", "owner-1", "Call the dentist", created)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}

	location := time.FixedZone("EDT", -4*60*60)
	remindAt := time.Date(2026, 8, 27, 9, 30, 0, 0, location)
	changedAt := created.Add(time.Minute)
	if err := m.SetReminder(remindAt, changedAt); err != nil {
		t.Fatalf("SetReminder returned error: %v", err)
	}

	wantUTC := remindAt.UTC()
	if m.RemindAt == nil || !m.RemindAt.Equal(wantUTC) {
		t.Fatalf("reminder was not normalized to the expected instant")
	}
	if !m.UpdatedAt.Equal(changedAt) {
		t.Fatalf("setting reminder did not update memo timestamp")
	}
	if m.ReminderDue(wantUTC.Add(-time.Nanosecond)) {
		t.Fatalf("reminder reported due before its scheduled instant")
	}
	if !m.ReminderDue(wantUTC) {
		t.Fatalf("reminder was not due at its scheduled instant")
	}
}

func TestMemoReminderNoOpsAndValidationPreserveState(t *testing.T) {
	created := time.Date(2026, 8, 26, 20, 0, 0, 0, time.UTC)
	m, err := New("memo-1", "owner-1", "Renew certificate", created)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}

	if err := m.SetReminder(time.Time{}, created.Add(time.Minute)); !errors.Is(err, ErrInvalidReminder) {
		t.Fatalf("expected ErrInvalidReminder, got %v", err)
	}
	if m.RemindAt != nil || !m.UpdatedAt.Equal(created) {
		t.Fatalf("invalid reminder mutated memo state")
	}

	remindAt := created.Add(24 * time.Hour)
	setAt := created.Add(2 * time.Minute)
	if err := m.SetReminder(remindAt, setAt); err != nil {
		t.Fatalf("SetReminder returned error: %v", err)
	}
	if err := m.SetReminder(remindAt.In(time.FixedZone("offset", 2*60*60)), created.Add(3*time.Minute)); err != nil {
		t.Fatalf("equivalent SetReminder returned error: %v", err)
	}
	if !m.UpdatedAt.Equal(setAt) {
		t.Fatalf("equivalent reminder changed UpdatedAt")
	}

	m.ClearReminder(created.Add(4 * time.Minute))
	if m.RemindAt != nil || !m.UpdatedAt.Equal(created.Add(4*time.Minute)) {
		t.Fatalf("ClearReminder did not clear reminder and update timestamp")
	}
	m.ClearReminder(created.Add(5 * time.Minute))
	if !m.UpdatedAt.Equal(created.Add(4 * time.Minute)) {
		t.Fatalf("clearing an absent reminder changed UpdatedAt")
	}
}

func TestMemoReminderDueOnlyWhileActive(t *testing.T) {
	created := time.Date(2026, 8, 26, 20, 0, 0, 0, time.UTC)
	m, err := New("memo-1", "owner-1", "Check backup", created)
	if err != nil {
		t.Fatalf("New returned error: %v", err)
	}

	remindAt := created.Add(time.Hour)
	if err := m.SetReminder(remindAt, created.Add(time.Minute)); err != nil {
		t.Fatalf("SetReminder returned error: %v", err)
	}
	if !m.ReminderDue(remindAt) {
		t.Fatalf("active reminder should be due")
	}

	m.Archive(remindAt.Add(time.Minute))
	if m.ReminderDue(remindAt.Add(2 * time.Minute)) {
		t.Fatalf("archived memo reminder should not be due")
	}

	m.Restore(remindAt.Add(3 * time.Minute))
	if !m.ReminderDue(remindAt.Add(3 * time.Minute)) {
		t.Fatalf("restored active memo reminder should become due again")
	}

	m.Trash(remindAt.Add(4 * time.Minute))
	if m.ReminderDue(remindAt.Add(5 * time.Minute)) {
		t.Fatalf("trashed memo reminder should not be due")
	}
}
