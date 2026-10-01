import test from "node:test";
import assert from "node:assert/strict";

import { MemoService } from "../src/app/memo-service.mjs";
import {
  archiveMemo,
  restoreArchivedMemo,
  restoreTrashedMemo,
  trashMemo
} from "../src/domain/memo.mjs";

class MemoryMemoStore {
  #records = new Map();

  async put(memo) {
    this.#records.set(memo.id, structuredClone(memo));
  }

  async get(id) {
    const memo = this.#records.get(id);
    return memo ? structuredClone(memo) : undefined;
  }

  async list() {
    return [...this.#records.values()].map((memo) => structuredClone(memo));
  }

  async remove(id) {
    this.#records.delete(id);
  }

  async bulkUpdateState(memoIds, mode, changedAt) {
    const planned = memoIds.map((id) => {
      const memo = this.#records.get(id);
      if (!memo) throw new Error(`memo not found: ${id}`);
      if (mode === "archive") return archiveMemo(memo, changedAt);
      if (mode === "trash") return trashMemo(memo, changedAt);
      if (mode === "restore") {
        return memo.state === "archived"
          ? restoreArchivedMemo(memo, changedAt)
          : restoreTrashedMemo(memo, changedAt);
      }
      throw new TypeError("mode must be archive, restore, or trash");
    });
    for (const memo of planned) this.#records.set(memo.id, structuredClone(memo));
    return planned.map((memo) => structuredClone(memo));
  }
}

function createService() {
  let tick = 0;
  let id = 0;
  return new MemoService(new MemoryMemoStore(), {
    idFactory: () => `memo-${++id}`,
    clock: () => new Date(1789646400000 + tick++ * 60_000)
  });
}

test("capture persists memo organization metadata and active list returns it", async () => {
  const service = createService();
  await service.capture({ title: "First", content: "Remember this", color: "green", labels: ["Work"] });
  const memos = await service.list();

  assert.equal(memos.length, 1);
  assert.equal(memos[0].id, "memo-1");
  assert.equal(memos[0].content, "Remember this");
  assert.equal(memos[0].color, "green");
  assert.deepEqual(memos[0].labels, ["Work"]);
});

test("duplicate creates a new active unpinned memo without mutating the source", async () => {
  const service = createService();
  await service.capture({
    title: "Reusable",
    content: "Keep this text",
    color: "teal",
    labels: ["Work", "Reference"]
  });
  await service.pin("memo-1");

  const duplicate = await service.duplicate("memo-1");
  const source = await service.get("memo-1");

  assert.equal(duplicate.id, "memo-2");
  assert.equal(duplicate.title, source.title);
  assert.equal(duplicate.content, source.content);
  assert.equal(duplicate.color, source.color);
  assert.deepEqual(duplicate.labels, source.labels);
  assert.equal(duplicate.state, "active");
  assert.equal(duplicate.pinned, false);
  assert.equal(duplicate.pinOrder, null);
  assert.equal(source.pinned, true);
});

test("listAll returns every lifecycle state in display order from one snapshot", async () => {
  const service = createService();
  await service.capture({ content: "Active one" });
  await service.capture({ content: "Archive me" });
  await service.capture({ content: "Trash me" });
  await service.archive("memo-2");
  await service.trash("memo-3");

  const all = await service.listAll();
  assert.equal(all.length, 3);
  assert.deepEqual(new Set(all.map((memo) => memo.state)), new Set(["active", "archived", "trashed"]));
  assert.equal(all.find((memo) => memo.id === "memo-1").state, "active");
  assert.equal(all.find((memo) => memo.id === "memo-2").state, "archived");
  assert.equal(all.find((memo) => memo.id === "memo-3").state, "trashed");
});

test("edit persists content, color, and labels", async () => {
  const service = createService();
  await service.capture({ content: "Before" });
  const updated = await service.edit("memo-1", {
    title: "Edited",
    content: "After",
    color: "purple",
    labels: ["Ideas", "Work"]
  });

  assert.equal(updated.title, "Edited");
  assert.equal(updated.content, "After");
  assert.equal(updated.color, "purple");
  assert.deepEqual(updated.labels, ["Ideas", "Work"]);
  assert.equal((await service.get("memo-1")).content, "After");
});

test("pin, movePin and unpin preserve manual pinned ordering", async () => {
  const service = createService();
  await service.capture({ content: "First" });
  await service.capture({ content: "Second" });
  await service.pin("memo-1");
  await service.pin("memo-2");

  assert.deepEqual((await service.list()).map((memo) => memo.id), ["memo-1", "memo-2"]);
  await service.movePin("memo-2", "up");
  assert.deepEqual((await service.list()).map((memo) => memo.id), ["memo-2", "memo-1"]);
  await service.unpin("memo-2");
  const active = await service.list();
  assert.equal(active[0].id, "memo-1");
  assert.equal((await service.get("memo-2")).pinOrder, null);
});

test("archive, trash and restore keep recoverable state", async () => {
  const service = createService();
  await service.capture({ content: "Keep me" });
  await service.archive("memo-1");

  assert.deepEqual(await service.list({ state: "active" }), []);
  assert.equal((await service.list({ state: "archived" })).length, 1);

  await service.trash("memo-1");
  assert.deepEqual(await service.list({ state: "archived" }), []);
  assert.equal((await service.list({ state: "trashed" }))[0].restoreState, "archived");

  await service.restoreFromTrash("memo-1");
  assert.equal((await service.list({ state: "archived" })).length, 1);

  await service.restoreFromArchive("memo-1");
  assert.equal((await service.list({ state: "active" })).length, 1);
});

test("permanent deletion is restricted to Trash", async () => {
  const service = createService();
  await service.capture({ content: "Temporary" });

  await assert.rejects(() => service.deletePermanently("memo-1"), /only trashed memos/);
  await service.trash("memo-1");
  await service.deletePermanently("memo-1");
  await assert.rejects(() => service.get("memo-1"), /memo not found/);
});


test("bulk lifecycle actions archive, trash and restore selected memos", async () => {
  const service = createService();
  await service.capture({ content: "First" });
  await service.capture({ content: "Second" });
  await service.capture({ content: "Third" });

  const archived = await service.archiveMany(["memo-1", "memo-2"]);
  assert.equal(archived.length, 2);
  assert.deepEqual(
    new Set((await service.list({ state: "archived" })).map((memo) => memo.id)),
    new Set(["memo-1", "memo-2"])
  );

  await service.restoreMany(["memo-1", "memo-2"]);
  assert.equal((await service.list({ state: "active" })).length, 3);

  await service.trashMany(["memo-1", "memo-3"]);
  assert.deepEqual(
    new Set((await service.list({ state: "trashed" })).map((memo) => memo.id)),
    new Set(["memo-1", "memo-3"])
  );

  await service.restoreMany(["memo-1", "memo-3"]);
  assert.equal((await service.list({ state: "active" })).length, 3);
});

test("bulk lifecycle validation fails before mutating any selected memo", async () => {
  const service = createService();
  await service.capture({ content: "Already archived" });
  await service.capture({ content: "Must stay active" });
  await service.archive("memo-1");

  await assert.rejects(
    () => service.archiveMany(["memo-1", "memo-2"]),
    /only active memos can be archived/
  );
  assert.equal((await service.get("memo-1")).state, "archived");
  assert.equal((await service.get("memo-2")).state, "active");
});
