import test from "node:test";
import assert from "node:assert/strict";

import { MemoService } from "../src/app/memo-service.mjs";

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
