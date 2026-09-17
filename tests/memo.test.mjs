import test from "node:test";
import assert from "node:assert/strict";
import { archiveMemo, compareMemosForDisplay, createMemo, editMemo, MEMO_SCHEMA_VERSION, migrateMemoRecord, normalizeMemoLabels, pinMemo, restoreArchivedMemo, restoreTrashedMemo, setPinnedOrder, trashMemo, unpinMemo } from "../src/domain/memo.mjs";

test("createMemo creates a schema v4 active memo with managed-label defaults", () => {
  const memo = createMemo({ id: "memo-1", title: " Idea ", content: "Capture this", createdAt: new Date("2026-09-17T12:00:00Z") });
  assert.equal(memo.schemaVersion, MEMO_SCHEMA_VERSION);
  assert.equal(memo.id, "memo-1");
  assert.equal(memo.title, "Idea");
  assert.equal(memo.content, "Capture this");
  assert.equal(memo.color, null);
  assert.deepEqual(memo.labels, []);
  assert.deepEqual(memo.labelIds, []);
  assert.equal(memo.state, "active");
});

test("migrateMemoRecord upgrades a schema v3 record while preserving label-name projection", () => {
  const migrated = migrateMemoRecord({ schemaVersion: 3, id: "legacy", title: "Legacy", content: "Preserve me", color: "blue", labels: ["Work"], createdAt: "2026-09-17T10:00:00Z", updatedAt: "2026-09-17T11:00:00Z", state: "active", pinned: true, pinOrder: 2, archivedAt: null, trashedAt: null, restoreState: null });
  assert.equal(migrated.schemaVersion, 4);
  assert.deepEqual(migrated.labels, ["Work"]);
  assert.deepEqual(migrated.labelIds, []);
  assert.equal(migrated.pinOrder, 2);
});

test("editMemo clears stale managed label IDs when label names change", () => {
  const memo = { ...createMemo({ id: "memo-1", content: "Before", labels: ["Work"], createdAt: "2026-09-17T10:00:00Z" }), labelIds: ["label-work"] };
  const edited = editMemo(memo, { content: "After", labels: ["Ideas"], updatedAt: "2026-09-17T11:00:00Z" });
  assert.deepEqual(edited.labels, ["Ideas"]);
  assert.deepEqual(edited.labelIds, []);
});

test("editMemo preserves managed label IDs when labels are semantically unchanged", () => {
  const memo = { ...createMemo({ id: "memo-1", content: "Before", labels: ["Work"], createdAt: "2026-09-17T10:00:00Z" }), labelIds: ["label-work"] };
  const edited = editMemo(memo, { content: "After", labels: ["work"], updatedAt: "2026-09-17T11:00:00Z" });
  assert.deepEqual(edited.labelIds, ["label-work"]);
});

test("memo colors reject unknown palette values", () => {
  assert.throws(() => createMemo({ id: "memo-1", content: "Color", color: "ultraviolet" }), /color must be one of/);
});

test("normalizeMemoLabels deduplicates case-insensitively", () => {
  assert.deepEqual(normalizeMemoLabels(["Work", " work ", "RESEARCH", "Research"]), ["Work", "RESEARCH"]);
});

test("pinning supports persisted manual order", () => {
  const memo = createMemo({ id: "memo-1", content: "Pin me", createdAt: "2026-09-17T10:00:00Z" });
  const pinned = pinMemo(memo, 4, "2026-09-17T11:00:00Z");
  const reordered = setPinnedOrder(pinned, 1, "2026-09-17T12:00:00Z");
  const unpinned = unpinMemo(reordered, "2026-09-17T13:00:00Z");
  assert.equal(pinned.pinOrder, 4);
  assert.equal(reordered.pinOrder, 1);
  assert.equal(unpinned.pinOrder, null);
});

test("archive and trash restore preserve prior archive location", () => {
  const memo = createMemo({ id: "memo-1", content: "Lifecycle", createdAt: "2026-09-17T10:00:00Z" });
  const archived = archiveMemo(memo, "2026-09-17T11:00:00Z");
  const trashed = trashMemo(archived, "2026-09-17T12:00:00Z");
  const restoredFromTrash = restoreTrashedMemo(trashed, "2026-09-17T13:00:00Z");
  const restoredFromArchive = restoreArchivedMemo(restoredFromTrash, "2026-09-17T14:00:00Z");
  assert.equal(trashed.restoreState, "archived");
  assert.equal(restoredFromTrash.state, "archived");
  assert.equal(restoredFromArchive.state, "active");
});

test("createMemo rejects blank content", () => {
  assert.throws(() => createMemo({ id: "memo-1", content: "   " }), /must not be blank/);
});

test("display ordering keeps manual pinned order", () => {
  const memos = [
    { id: "old", pinned: false, pinOrder: null, updatedAt: "2026-09-17T10:00:00Z" },
    { id: "new", pinned: false, pinOrder: null, updatedAt: "2026-09-17T12:00:00Z" },
    { id: "pin-b", pinned: true, pinOrder: 1, updatedAt: "2026-09-17T13:00:00Z" },
    { id: "pin-a", pinned: true, pinOrder: 0, updatedAt: "2026-09-17T09:00:00Z" }
  ];
  memos.sort(compareMemosForDisplay);
  assert.deepEqual(memos.map((memo) => memo.id), ["pin-a", "pin-b", "new", "old"]);
});
