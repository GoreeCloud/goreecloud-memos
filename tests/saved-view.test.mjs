import test from "node:test";
import assert from "node:assert/strict";
import {
  SAVED_VIEW_SCHEMA_VERSION,
  createSavedView,
  migrateSavedViewRecord,
  normalizeSavedViewFilters,
  savedViewNameKey
} from "../src/domain/saved-view.mjs";

test("saved view creation normalizes name, timestamps, and bounded filter state", () => {
  const view = createSavedView({
    id: "view-1",
    name: "  Blue Work  ",
    filters: {
      query: 'alpha label:"Project Work"',
      color: "blue",
      label: "Project Work",
      labelColor: "purple"
    },
    createdAt: "2026-09-18T13:00:00.000Z"
  });

  assert.equal(view.schemaVersion, SAVED_VIEW_SCHEMA_VERSION);
  assert.equal(view.name, "Blue Work");
  assert.equal(view.nameKey, "blue work");
  assert.deepEqual(view.filters, {
    query: 'alpha label:"Project Work"',
    color: "blue",
    label: "Project Work",
    labelColor: "purple"
  });
  assert.equal(view.createdAt, "2026-09-18T13:00:00.000Z");
  assert.equal(view.updatedAt, view.createdAt);
});

test("saved view filters preserve plain query text and normalize default filter tokens", () => {
  assert.deepEqual(normalizeSavedViewFilters({ query: "https://example.test" }), {
    query: "https://example.test",
    color: "all",
    label: "all",
    labelColor: "all"
  });
});

test("saved view migration normalizes the persisted v1 record shape", () => {
  assert.deepEqual(migrateSavedViewRecord({
    schemaVersion: 1,
    id: " view-1 ",
    name: "Work",
    filters: { query: "", color: "all", label: "all", labelColor: "all" },
    createdAt: "2026-09-18T13:00:00.000Z"
  }), {
    schemaVersion: 1,
    id: "view-1",
    name: "Work",
    nameKey: "work",
    filters: { query: "", color: "all", label: "all", labelColor: "all" },
    createdAt: "2026-09-18T13:00:00.000Z",
    updatedAt: "2026-09-18T13:00:00.000Z"
  });
});

test("saved view validation rejects invalid names and filter tokens", () => {
  assert.throws(() => savedViewNameKey("   "), /must not be blank/);
  assert.throws(() => normalizeSavedViewFilters({ color: "cyan" }), /memo color/);
  assert.throws(() => normalizeSavedViewFilters({ labelColor: "cyan" }), /label color/);
});
