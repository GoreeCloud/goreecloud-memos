import test from "node:test";
import assert from "node:assert/strict";
import { SavedViewService } from "../src/app/saved-view-service.mjs";

test("SavedViewService forwards create/list/delete operations", async () => {
  const calls = [];
  const store = {
    async listSavedViews() { calls.push(["list"]); return [{ id: "view-1" }]; },
    async createSavedView(name, filters) { calls.push(["create", name, filters]); return { id: "view-2", name, filters }; },
    async deleteSavedView(id) { calls.push(["delete", id]); return { id }; }
  };
  const service = new SavedViewService(store);

  assert.deepEqual(await service.list(), [{ id: "view-1" }]);
  assert.equal((await service.create("Work", { query: "alpha" })).name, "Work");
  assert.deepEqual(await service.delete(" view-2 "), { id: "view-2" });
  assert.deepEqual(calls, [
    ["list"],
    ["create", "Work", { query: "alpha" }],
    ["delete", "view-2"]
  ]);
});

test("SavedViewService validates its adapter and delete identity", () => {
  assert.throws(() => new SavedViewService({}), /saved view operations/);
  const service = new SavedViewService({
    listSavedViews() {},
    createSavedView() {},
    deleteSavedView() {}
  });
  assert.throws(() => service.delete(""), /non-empty string/);
});
