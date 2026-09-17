import test from "node:test";
import assert from "node:assert/strict";

import {
  archiveMemo,
  compareMemosForDisplay,
  createMemo,
  editMemo,
  MEMO_SCHEMA_VERSION,
  migrateMemoRecord,
  restoreArchivedMemo,
  restoreTrashedMemo,
  trashMemo
} from "../src/domain/memo.mjs";

test("createMemo creates a schema v2 active memo", () => {
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
  assert.equal(memo.createdAt, "2026-09-17T12:00:00.000Z");
  assert.equal(memo.updatedAt, memo.createdAt);
  assert.equal(memo.state, "active");
  assert.equal(memo.pinned, false);
  assert.equal(memo.archivedAt, null);
  assert.equal(memo.trashedAt, null);
  assert.equal(memo.restoreState, null);
});

test("migrateMemoRecord upgrades a schema v1 record without losing content", () => {
  const migrated = migrateMemoRecord({
    schemaVersion: 1,
    id: "legacy",
    title: "Legacy",
    content: "Preserve me",
    createdAt: "2026-09-17T10:00:00Z",
    updatedAt: "2026-09-17T11:00:00Z",
    state: "active",
    pinned: true
  });

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.id, "legacy");
  assert.equal(migrated.content, "Preserve me");
  assert.equal(migrated.pinned, true);
  assert.equal(migrated.archivedAt, null);
  assert.equal(migrated.trashedAt, null);
});

test("editMemo preserves creation time and updates editable fields", () => {
  const memo = createMemo({ id: "memo-1", content: "Before", createdAt: "2026-09-17T10:00:00Z" });
  const edited = editMemo(memo, {
    title: "Updated",
    content: "After",
    updatedAt: "2026-09-17T11:00:00Z"
  });

  assert.equal(edited.createdAt, memo.createdAt);
  assert.equal(edited.updatedAt, "2026-09-17T11:00:00.000Z");
  assert.equal(edited.title, "Updated");
  assert.equal(edited.content, "After");
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

test("display ordering puts pinned memos first and newer memos next", () => {
  const memos = [
    { id: "old", pinned: false, updatedAt: "2026-09-17T10:00:00Z" },
    { id: "new", pinned: false, updatedAt: "2026-09-17T12:00:00Z" },
    { id: "pin", pinned: true, updatedAt: "2026-09-17T09:00:00Z" }
  ];

  memos.sort(compareMemosForDisplay);
  assert.deepEqual(memos.map((memo) => memo.id), ["pin", "new", "old"]);
});
