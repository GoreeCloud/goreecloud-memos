import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_COLORS,
  NO_COLOR,
  collectLabelOptions,
  filterMemos,
  memoMatchesColor,
  memoMatchesLabel,
  memoMatchesQuery
} from "../src/app/memo-query.mjs";

const memos = [
  {
    id: "a",
    title: "Project Alpha",
    content: "Launch checklist and notes",
    color: "blue",
    labels: ["Work", "Launch"],
    state: "active"
  },
  {
    id: "b",
    title: "Garden",
    content: "Buy basil and tomatoes",
    color: null,
    labels: ["Home", "Ideas"],
    state: "active"
  },
  {
    id: "c",
    title: "Reference",
    content: "Alpha background material",
    color: "green",
    labels: ["Research", "work"],
    state: "archived"
  }
];

test("query matches title, content, and memo-local labels case-insensitively", () => {
  assert.equal(memoMatchesQuery(memos[0], "project"), true);
  assert.equal(memoMatchesQuery(memos[1], "TOMATOES"), true);
  assert.equal(memoMatchesQuery(memos[2], "research"), true);
  assert.equal(memoMatchesQuery(memos[1], "alpha"), false);
  assert.equal(memoMatchesQuery(memos[1], "   "), true);
});

test("color filters support all colors and explicit no-color", () => {
  assert.equal(memoMatchesColor(memos[0], ALL_COLORS), true);
  assert.equal(memoMatchesColor(memos[0], "blue"), true);
  assert.equal(memoMatchesColor(memos[0], "green"), false);
  assert.equal(memoMatchesColor(memos[1], NO_COLOR), true);
});

test("label filter uses exact case-insensitive memo-local label names", () => {
  assert.equal(memoMatchesLabel(memos[0], "work"), true);
  assert.equal(memoMatchesLabel(memos[2], "WORK"), true);
  assert.equal(memoMatchesLabel(memos[1], "work"), false);
  assert.equal(memoMatchesLabel(memos[1], "all"), true);
});

test("filters combine query, color, and label constraints", () => {
  assert.deepEqual(filterMemos(memos, { query: "alpha", color: "blue", label: "work" }).map((memo) => memo.id), ["a"]);
  assert.deepEqual(filterMemos(memos, { query: "alpha", color: "green", label: "work" }).map((memo) => memo.id), ["c"]);
  assert.deepEqual(filterMemos(memos, { query: "alpha", color: NO_COLOR }).map((memo) => memo.id), []);
});

test("label options deduplicate case-insensitively and sort for controls", () => {
  assert.deepEqual(collectLabelOptions(memos), ["Home", "Ideas", "Launch", "Research", "Work"]);
});

test("filterMemos rejects non-array input", () => {
  assert.throws(() => filterMemos(null), /memos must be an array/);
});
