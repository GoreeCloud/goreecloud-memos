import test from "node:test";
import assert from "node:assert/strict";
import { MemoService } from "../src/app/memo-service.mjs";

function createStore() {
  const calls = [];
  return {
    calls,
    async put() {},
    async get() { return undefined; },
    async list() { return []; },
    async remove() {},
    async bulkUpdateLabel(memoIds, labelId, mode, changedAt) {
      calls.push({ memoIds, labelId, mode, changedAt: changedAt.toISOString() });
      return {
        mode,
        label: { id: labelId, name: "Ideas" },
        requestedMemoCount: memoIds.length,
        changedMemoCount: memoIds.length
      };
    }
  };
}

test("bulk label apply deduplicates memo IDs and forwards one timestamp", async () => {
  const store = createStore();
  const service = new MemoService(store, { clock: () => new Date("2026-09-17T20:30:00Z") });
  const result = await service.applyLabelToMany([" memo-1 ", "memo-1", "memo-2"], " label-ideas ");
  assert.equal(result.changedMemoCount, 2);
  assert.deepEqual(store.calls[0], {
    memoIds: ["memo-1", "memo-2"],
    labelId: "label-ideas",
    mode: "apply",
    changedAt: "2026-09-17T20:30:00.000Z"
  });
});

test("bulk label remove forwards explicit remove mode", async () => {
  const store = createStore();
  const service = new MemoService(store, { clock: () => new Date("2026-09-17T20:31:00Z") });
  await service.removeLabelFromMany(["memo-1", "memo-2"], "label-ideas");
  assert.equal(store.calls[0].mode, "remove");
  assert.deepEqual(store.calls[0].memoIds, ["memo-1", "memo-2"]);
});

test("bulk label service rejects empty selection and missing persistence capability", async () => {
  const store = createStore();
  const service = new MemoService(store);
  await assert.rejects(() => service.applyLabelToMany([], "label-ideas"), /non-empty array/);

  const noBulk = new MemoService({
    async put() {}, async get() {}, async list() { return []; }, async remove() {}
  });
  await assert.rejects(() => noBulk.applyLabelToMany(["memo-1"], "label-ideas"), /bulkUpdateLabel/);
});
