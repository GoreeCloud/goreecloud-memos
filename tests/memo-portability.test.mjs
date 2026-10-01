import test from "node:test";
import assert from "node:assert/strict";

import {
  formatMemoPlainText,
  formatMemoPlainTextSelection,
  formatMemosLibraryJson,
  memoPlainTextFilename,
  memoPlainTextSelectionFilename,
  memosLibraryJsonFilename
} from "../src/app/memo-portability.mjs";

test("plain-text export keeps quick-capture content and local organization metadata", () => {
  const memo = {
    title: "Launch notes",
    content: "First line\nSecond line\n",
    color: "blue",
    labels: ["Work", "Release"]
  };

  assert.equal(
    formatMemoPlainText(memo),
    "Launch notes\n\nFirst line\nSecond line\n\nLabels: Work, Release\nColor: blue\n"
  );
});

test("filename uses title first and removes filesystem-hostile characters", () => {
  assert.equal(
    memoPlainTextFilename({
      title: "Roadmap: Q4 / polish?",
      content: "Fallback",
      labels: []
    }),
    "Roadmap Q4 polish.txt"
  );
});

test("filename falls back to the first content line", () => {
  assert.equal(
    memoPlainTextFilename({
      title: "",
      content: "Remember the charger\nBefore leaving",
      labels: []
    }),
    "Remember the charger.txt"
  );
});

test("format fails closed for blank memo content", () => {
  assert.throws(
    () => formatMemoPlainText({ title: "Blank", content: "   " }),
    /memo content/
  );
});


test("selected memo export is deterministic and preserves selection order", () => {
  const memos = [
    {
      title: "First",
      content: "Alpha body",
      labels: ["Work"],
      color: "blue"
    },
    {
      title: "",
      content: "Second body\nwith another line",
      labels: [],
      color: null
    }
  ];

  assert.equal(
    formatMemoPlainTextSelection(memos),
    [
      "Memo 1 of 2",
      "",
      "First",
      "",
      "Alpha body",
      "",
      "Labels: Work",
      "Color: blue",
      "",
      "---",
      "",
      "Memo 2 of 2",
      "",
      "Second body",
      "with another line",
      ""
    ].join("\n")
  );
  assert.equal(memoPlainTextSelectionFilename(2), "goreecloud-memos-selection-2.txt");
});

test("selected memo export rejects empty selections and invalid filename counts", () => {
  assert.throws(() => formatMemoPlainTextSelection([]), /non-empty array/);
  assert.throws(() => memoPlainTextSelectionFilename(0), /positive integer/);
});


test("library JSON export is versioned deterministic and preserves lifecycle records", () => {
  const exported = formatMemosLibraryJson({
    exportedAt: new Date("2026-09-29T11:00:00.000Z"),
    memos: [
      {
        schemaVersion: 4,
        id: "memo-b",
        title: "",
        content: "Archived",
        color: null,
        labels: ["Work"],
        labelIds: ["label-b"],
        createdAt: "2026-09-29T10:00:00.000Z",
        updatedAt: "2026-09-29T10:05:00.000Z",
        state: "archived",
        pinned: false,
        pinOrder: null,
        archivedAt: "2026-09-29T10:05:00.000Z",
        trashedAt: null,
        restoreState: null
      },
      {
        schemaVersion: 4,
        id: "memo-a",
        title: "Earlier",
        content: "Active",
        color: "blue",
        labels: [],
        labelIds: [],
        createdAt: "2026-09-28T10:00:00.000Z",
        updatedAt: "2026-09-28T10:00:00.000Z",
        state: "active",
        pinned: true,
        pinOrder: 0,
        archivedAt: null,
        trashedAt: null,
        restoreState: null
      }
    ],
    labels: [
      {
        schemaVersion: 2,
        id: "label-b",
        name: "Work",
        nameKey: "work",
        color: "teal",
        icon: null,
        description: "Projects",
        createdAt: "2026-09-27T10:00:00.000Z",
        updatedAt: "2026-09-27T10:00:00.000Z"
      }
    ],
    savedViews: [
      {
        schemaVersion: 1,
        id: "view-a",
        name: "Work view",
        nameKey: "work view",
        filters: { query: "label:Work", color: "all", label: "all", labelColor: "all" },
        createdAt: "2026-09-29T09:00:00.000Z",
        updatedAt: "2026-09-29T09:00:00.000Z"
      }
    ]
  });

  const parsed = JSON.parse(exported);
  assert.equal(parsed.format, "goreecloud-memos-library-export");
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.exportedAt, "2026-09-29T11:00:00.000Z");
  assert.deepEqual(parsed.memos.map((memo) => memo.id), ["memo-a", "memo-b"]);
  assert.equal(parsed.memos[1].state, "archived");
  assert.deepEqual(parsed.memos[1].labelIds, ["label-b"]);
  assert.equal(parsed.labels[0].description, "Projects");
  assert.equal(parsed.savedViews[0].filters.query, "label:Work");
  assert.equal(exported.endsWith("\n"), true);
});

test("library JSON export filename uses the export UTC date and invalid input fails closed", () => {
  assert.equal(
    memosLibraryJsonFilename(new Date("2026-09-29T23:59:59.000Z")),
    "goreecloud-memos-2026-09-29.json"
  );
  assert.throws(
    () => formatMemosLibraryJson({ memos: null }),
    /memos must be an array/
  );
});
