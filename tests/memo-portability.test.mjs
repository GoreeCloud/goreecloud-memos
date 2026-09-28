import test from "node:test";
import assert from "node:assert/strict";

import { formatMemoPlainText, memoPlainTextFilename } from "../src/app/memo-portability.mjs";

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
