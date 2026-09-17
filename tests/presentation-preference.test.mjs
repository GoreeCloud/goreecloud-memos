import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PRESENTATION_MODE,
  loadPresentationMode,
  normalizePresentationMode,
  PRESENTATION_STORAGE_KEY,
  savePresentationMode
} from "../src/app/presentation-preference.mjs";

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
}

test("presentation mode normalization falls back to comfortable", () => {
  assert.equal(normalizePresentationMode("compact"), "compact");
  assert.equal(normalizePresentationMode("dense"), "dense");
  assert.equal(normalizePresentationMode("unknown"), DEFAULT_PRESENTATION_MODE);
  assert.equal(normalizePresentationMode(null), DEFAULT_PRESENTATION_MODE);
});

test("presentation preference saves and reloads from storage", () => {
  const storage = new MemoryStorage();
  assert.equal(loadPresentationMode(storage), "comfortable");
  assert.equal(savePresentationMode("list", storage), true);
  assert.equal(storage.getItem(PRESENTATION_STORAGE_KEY), "list");
  assert.equal(loadPresentationMode(storage), "list");
});

test("presentation preference rejects unsupported modes and tolerates unavailable storage", () => {
  const failingStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); }
  };

  assert.equal(loadPresentationMode(failingStorage), "comfortable");
  assert.equal(savePresentationMode("compact", failingStorage), false);
  assert.throws(() => savePresentationMode("grid", failingStorage), /presentation mode/);
});
