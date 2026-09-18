import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_COLORS,
  ALL_LABEL_COLORS,
  NO_COLOR,
  collectLabelOptions,
  filterMemos,
  memoMatchesColor,
  memoMatchesLabel,
  memoMatchesLabelColor,
  memoMatchesQuery
} from "../src/app/memo-query.mjs";

const memos = [
  {
    id: "a",
    title: "Project Alpha",
    content: "Launch checklist and notes",
    color: "blue",
    labels: ["Work", "Launch"],
    labelIds: ["label-work", "label-launch"],
    state: "active"
  },
  {
    id: "b",
    title: "Garden",
    content: "Buy basil and tomatoes",
    color: null,
    labels: ["Home", "Ideas"],
    labelIds: ["label-home", "label-ideas"],
    state: "active"
  },
  {
    id: "c",
    title: "Reference",
    content: "Alpha background material",
    color: "green",
    labels: ["Research", "work"],
    labelIds: ["label-research", "label-work"],
    state: "archived"
  }
];

const managedLabels = [
  { id: "label-work", name: "Work", color: "blue" },
  { id: "label-launch", name: "Launch", color: "purple" },
  { id: "label-home", name: "Home", color: null },
  { id: "label-ideas", name: "Ideas", color: "purple" },
  { id: "label-research", name: "Research", color: "green" }
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

test("managed label color filter matches any linked managed label by stable identity", () => {
  assert.equal(memoMatchesLabelColor(memos[0], ALL_LABEL_COLORS, managedLabels), true);
  assert.equal(memoMatchesLabelColor(memos[0], "purple", managedLabels), true);
  assert.equal(memoMatchesLabelColor(memos[1], "purple", managedLabels), true);
  assert.equal(memoMatchesLabelColor(memos[2], "green", managedLabels), true);
  assert.equal(memoMatchesLabelColor(memos[2], "purple", managedLabels), false);
  assert.equal(memoMatchesLabelColor({ labels: ["Legacy"] }, "blue", managedLabels), false);
});

test("filters combine query, memo color, label name, and managed label color constraints", () => {
  assert.deepEqual(filterMemos(
    memos,
    { query: "alpha", color: "blue", label: "work", labelColor: "purple" },
    { managedLabels }
  ).map((memo) => memo.id), ["a"]);
  assert.deepEqual(filterMemos(
    memos,
    { query: "alpha", color: "green", label: "work", labelColor: "green" },
    { managedLabels }
  ).map((memo) => memo.id), ["c"]);
  assert.deepEqual(filterMemos(
    memos,
    { query: "alpha", color: NO_COLOR, labelColor: "purple" },
    { managedLabels }
  ).map((memo) => memo.id), []);
});

test("parsed expression constraints combine with existing direct filters", () => {
  assert.deepEqual(filterMemos(
    memos,
    {
      query: "alpha",
      color: ALL_COLORS,
      label: "all",
      labelColor: ALL_LABEL_COLORS,
      expression: { color: "green", label: "work", labelColor: "green" }
    },
    { managedLabels }
  ).map((memo) => memo.id), ["c"]);

  assert.deepEqual(filterMemos(
    memos,
    {
      query: "",
      color: "blue",
      expression: { color: "green", label: null, labelColor: null }
    },
    { managedLabels }
  ).map((memo) => memo.id), []);
});

test("label options deduplicate case-insensitively and sort for controls", () => {
  assert.deepEqual(collectLabelOptions(memos), ["Home", "Ideas", "Launch", "Research", "Work"]);
});

test("filterMemos rejects non-array input", () => {
  assert.throws(() => filterMemos(null), /memos must be an array/);
});
