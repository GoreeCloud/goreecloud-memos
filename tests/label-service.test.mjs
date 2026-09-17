import test from "node:test";
import assert from "node:assert/strict";
import { LabelService } from "../src/app/label-service.mjs";

function createStore() {
  const calls = [];
  const labels = [
    { id: "work", name: "Work" },
    { id: "ideas", name: "Ideas" }
  ];
  return {
    calls,
    async listLabels() { return labels; },
    async renameLabel(id, name, changedAt) {
      calls.push(["rename", id, name, changedAt.toISOString()]);
      return { id, name };
    },
    async deleteLabel(id) {
      calls.push(["delete", id]);
      return { label: { id, name: "Work" }, affectedMemoCount: 2 };
    },
    async mergeLabels(sourceId, targetId) {
      calls.push(["merge", sourceId, targetId]);
      return { source: { id: sourceId, name: "Work" }, target: { id: targetId, name: "Ideas" }, affectedMemoCount: 2 };
    }
  };
}

test("label service exposes list and forwards timestamped rename", async () => {
  const store = createStore();
  const service = new LabelService(store, { clock: () => new Date("2026-09-17T19:45:00Z") });
  assert.equal((await service.list()).length, 2);
  assert.equal((await service.rename(" work ", "Projects")).name, "Projects");
  assert.deepEqual(store.calls[0], ["rename", "work", "Projects", "2026-09-17T19:45:00.000Z"]);
});

test("label service forwards explicit delete and merge operations", async () => {
  const store = createStore();
  const service = new LabelService(store);
  assert.equal((await service.delete("work")).affectedMemoCount, 2);
  assert.equal((await service.merge("work", "ideas")).target.name, "Ideas");
  assert.deepEqual(store.calls.slice(0, 2), [["delete", "work"], ["merge", "work", "ideas"]]);
});

test("label service rejects a self merge", async () => {
  const service = new LabelService(createStore());
  await assert.rejects(() => service.merge("work", "work"), /must be different/);
});
