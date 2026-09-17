import test from "node:test";
import assert from "node:assert/strict";

import {
  archiveMemo,
  compareMemosForDisplay,
  createMemo,
  editMemo,
  MEMO_SCHEMA_VERSION,
  migrateMemoRecord,
  normalizeMemoLabels,
  pinMemo,
  restoreArchivedMemo,
  restoreTrashedMemo,
  setPinnedOrder,
  trashMemo,
  unpinMemo
} from "../src/domain/memo.mjs";

test("createMemo creates a schema v3 active memo with portable organization defaults", () => {
  const memo = createMemo({
    id: "memo-1",
    title: " Idea ",
    content: "Capture this",
    createdAt: new Date("2026-09-17T12:00:00Z")
  });

  assert.equal(memo.schemaVersion, MEMO_SCHEMA_VERSION);
  assert.equal(memo.id, "memo-1");
  assert.equal(memo.title, "Idea");
  assert.equal(memo.content, "Capture this");
  assert.equal(memo.color, null);
  assert.deepEqual(memo.labels, []);
  assert.equal(memo.createdAt, "2026-09-17T12:00:00.000Z");
  assert.equal(memo.updatedAt, memo.createdAt);
  assert.equal(memo.state, "active");
  assert.equal(memo.pinned, false);
  assert.equal(memo.pinOrder, null);
  assert.equal(memo.archivedAt, null);
  assert.equal(memo.trashedAt, null);
  assert.equal(memo.restoreState, null);
});

test("migrateMemoRecord upgrades a schema v2 record without losing content or pin state", () => {
  const migrated = migrateMemoRecord({
    schemaVersion: 2,
    id: "legacy",
    title: "Legacy",
    content: "Preserve me",
    createdAt: "2026-09-17T10:00:00Z",
    updatedAt: "2026-09-17T11:00:00Z",
    state: "active",
    pinned: true,
    archivedAt: null,
    trashedAt: null,
    restoreState: null
  });

  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.id, "legacy");
  assert.equal(migrated.content, "Preserve me");
  assert.equal(migrated.pinned, true);
  assert.equal(Number.isSafeInteger(migrated.pinOrder), true);
  assert.equal(migrated.color, null);
  assert.deepEqual(migrated.labels, []);
});

test("editMemo updates color and normalized labels with content", () => {
  const memo = createMemo({ id: "memo-1", content: "Before", createdAt: "2026-09-17T10:00:00Z" });
  const edited = editMemo(memo, {
    title: "Updated",
    content: "After",
    color: "Blue",
    labels: [" Work ", "Ideas", "work", ""],
    updatedAt: "2026-09-17T11:00:00Z"
  });

  assert.equal(edited.createdAt, memo.createdAt);
  assert.equal(edited.updatedAt, "2026-09-17T11:00:00.000Z");
  assert.equal(edited.title, "Updated");
  assert.equal(edited.content, "After");
  assert.equal(edited.color, "blue");
  assert.deepEqual(edited.labels, ["Work", "Ideas"]);
});

test("memo colors reject unknown palette values", () => {
  assert.throws(
    () => createMemo({ id: "memo-1", content: "Color", color: "ultraviolet" }),
    /color must be one of/
  );
});

test("normalizeMemoLabels deduplicates case-insensitively and preserves first display spelling", () => {
  assert.deepEqual(normalizeMemoLabels(["Work", " work ", "RESEARCH", "Research"]), ["Work", "RESEARCH"]);
});

test("pinning supports persisted manual order", () => {
  const memo = createMemo({ id: "memo-1", content: "Pin me", createdAt: "2026-09-17T10:00:00Z" });
  const pinned = pinMemo(memo, 4, "2026-09-17T11:00:00Z");
  const reordered = setPinnedOrder(pinned, 1, "2026-09-17T12:00:00Z");
  const unpinned = unpinMemo(reordered, "2026-09-17T13:00:00Z");

  assert.equal(pinned.pinned, true);
  assert.equal(pinned.pinOrder, 4);
  assert.equal(reordered.pinOrder, 1);
  assert.equal(unpinned.pinned, false);
  assert.equal(unpinned.pinOrder, null);
});

test("archive and trash restore preserve the prior archive location", () => {
  const memo = createMemo({ id: "memo-1", content: "Lifecycle", createdAt: "2026-09-17T10:00:00Z" });
  const archived = archiveMemo(memo, "2026-09-17T11:00:00Z");
  const trashed = trashMemo(archived, "2026-09-17T12:00:00Z");
  const restoredFromTrash = restoreTrashedMemo(trashed, "2026-09-17T13:00:00Z");
  const restoredFromArchive = restoreArchivedMemo(restoredFromTrash, "2026-09-17T14:00:00Z");

  assert.equal(archived.state, "archived");
  assert.equal(trashed.state, "trashed");
  assert.equal(trashed.restoreState, "archived");
  assert.equal(restoredFromTrash.state, "archived");
  assert.equal(restoredFromTrash.trashedAt, null);
  assert.equal(restoredFromArchive.state, "active");
  assert.equal(restoredFromArchive.archivedAt, null);
});

test("createMemo rejects blank content", () => {
  assert.throws(() => createMemo({ id: "memo-1", content: "   " }), /must not be blank/);
});

test("display ordering puts pinned memos first using manual order and newer ordinary memos next", () => {
  const memos = [
    { id: "old", pinned: false, pinOrder: null, updatedAt: "2026-09-17T10:00:00Z" },
    { id: "new", pinned: false, pinOrder: null, updatedAt: "2026-09-17T12:00:00Z" },
    { id: "pin-b", pinned: true, pinOrder: 1, updatedAt: "2026-09-17T13:00:00Z" },
    { id: "pin-a", pinned: true, pinOrder: 0, updatedAt: "2026-09-17T09:00:00Z" }
  ];

  memos.sort(compareMemosForDisplay);
  assert.deepEqual(memos.map((memo) => memo.id), ["pin-a", "pin-b", "new", "old"]);
});
