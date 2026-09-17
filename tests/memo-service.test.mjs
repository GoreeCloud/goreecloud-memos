import test from "node:test";
import assert from "node:assert/strict";

import { MemoService } from "../src/app/memo-service.mjs";

class MemoryMemoStore {
  #records = new Map();

  async put(memo) {
    this.#records.set(memo.id, structuredClone(memo));
  }

  async list() {
    return [...this.#records.values()].map((memo) => structuredClone(memo));
  }

  async remove(id) {
    this.#records.delete(id);
  }
}

test("capture persists a memo and list returns it", async () => {
  const service = new MemoService(new MemoryMemoStore(), {
    idFactory: () => "memo-1",
    clock: () => new Date("2026-09-17T12:00:00Z")
  });

  await service.capture({ title: "First", content: "Remember this" });
  const memos = await service.list();

  assert.equal(memos.length, 1);
  assert.equal(memos[0].id, "memo-1");
  assert.equal(memos[0].content, "Remember this");
});

test("delete removes a persisted memo", async () => {
  const service = new MemoService(new MemoryMemoStore(), {
    idFactory: () => "memo-1",
    clock: () => new Date("2026-09-17T12:00:00Z")
  });

  await service.capture({ content: "Temporary" });
  await service.delete("memo-1");

  assert.deepEqual(await service.list(), []);
});
