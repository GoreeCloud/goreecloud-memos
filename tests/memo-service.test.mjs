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
  return new MemoService(new MemoryMemoStore(), {
    idFactory: () => "memo-1",
    clock: () => new Date(1789646400000 + tick++ * 60_000)
  });
}

test("capture persists a memo and active list returns it", async () => {
  const service = createService();
  await service.capture({ title: "First", content: "Remember this" });
  const memos = await service.list();

  assert.equal(memos.length, 1);
  assert.equal(memos[0].id, "memo-1");
  assert.equal(memos[0].content, "Remember this");
});

test("edit persists content updates", async () => {
  const service = createService();
  await service.capture({ content: "Before" });
  const updated = await service.edit("memo-1", { title: "Edited", content: "After" });

  assert.equal(updated.title, "Edited");
  assert.equal(updated.content, "After");
  assert.equal((await service.get("memo-1")).content, "After");
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
