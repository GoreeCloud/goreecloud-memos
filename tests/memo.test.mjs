import test from "node:test";
import assert from "node:assert/strict";

import { createMemo, compareMemosForDisplay } from "../src/domain/memo.mjs";

test("createMemo creates a stable local memo record", () => {
  const memo = createMemo({
    id: "memo-1",
    title: " Idea ",
    content: "Capture this",
    createdAt: new Date("2026-09-17T12:00:00Z")
  });

  assert.equal(memo.id, "memo-1");
  assert.equal(memo.title, "Idea");
  assert.equal(memo.content, "Capture this");
  assert.equal(memo.createdAt, "2026-09-17T12:00:00.000Z");
  assert.equal(memo.updatedAt, memo.createdAt);
  assert.equal(memo.state, "active");
  assert.equal(memo.pinned, false);
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
