import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_RECENT_SEARCHES,
  RECENT_SEARCHES_KEY,
  clearRecentSearches,
  loadRecentSearches,
  rememberRecentSearch
} from "../src/app/recent-searches.mjs";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test("recent searches are bounded, newest-first, and case-insensitively deduplicated", () => {
  const storage = memoryStorage();

  for (let index = 0; index < MAX_RECENT_SEARCHES + 2; index += 1) {
    rememberRecentSearch(storage, `query ${index}`);
  }

  assert.deepEqual(
    loadRecentSearches(storage),
    Array.from({ length: MAX_RECENT_SEARCHES }, (_, index) => `query ${MAX_RECENT_SEARCHES + 1 - index}`)
  );

  rememberRecentSearch(storage, "QUERY 9");
  assert.deepEqual(loadRecentSearches(storage).slice(0, 2), ["QUERY 9", "query 8"]);
});

test("blank, oversized, malformed, and non-string entries are not retained", () => {
  const storage = memoryStorage({
    [RECENT_SEARCHES_KEY]: JSON.stringify([
      "  alpha  ",
      "",
      "x".repeat(257),
      14,
      "ALPHA",
      "beta"
    ])
  });

  assert.deepEqual(loadRecentSearches(storage), ["alpha", "beta"]);
  assert.equal(rememberRecentSearch(storage, "   ").saved, false);
  assert.equal(rememberRecentSearch(storage, "x".repeat(257)).saved, false);
});

test("clearing recent searches removes only the recent-search record", () => {
  const storage = memoryStorage();
  storage.setItem("unrelated", "keep");
  rememberRecentSearch(storage, "alpha");

  assert.equal(clearRecentSearches(storage), true);
  assert.deepEqual(loadRecentSearches(storage), []);
  assert.equal(storage.getItem("unrelated"), "keep");
});
