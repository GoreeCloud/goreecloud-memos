import test from "node:test";
import assert from "node:assert/strict";
import { buildLabelPresentations } from "../src/app/label-presentation.mjs";

test("label presentation joins metadata by stable label identity and preserves memo order", () => {
  const memo = {
    labels: ["Old Work Name", "Ideas"],
    labelIds: ["label-work", "label-ideas"]
  };
  const managedLabels = [
    { id: "label-ideas", name: "Ideas", color: "purple", icon: "💡", description: "Not a card field" },
    { id: "label-work", name: "Projects", color: "blue", icon: "💼", description: "Office" }
  ];

  assert.deepEqual(buildLabelPresentations(memo, managedLabels), [
    { id: "label-work", name: "Projects", color: "blue", icon: "💼" },
    { id: "label-ideas", name: "Ideas", color: "purple", icon: "💡" }
  ]);
});

test("label presentation falls back to the memo projection when managed metadata is unavailable", () => {
  const memo = {
    labels: ["Legacy", "Plain"],
    labelIds: ["missing-label"]
  };

  assert.deepEqual(buildLabelPresentations(memo, []), [
    { id: "missing-label", name: "Legacy", color: null, icon: null },
    { id: null, name: "Plain", color: null, icon: null }
  ]);
});

test("label presentation rejects invalid memo label projections", () => {
  assert.throws(() => buildLabelPresentations({ labels: "Work", labelIds: [] }, []), /memo.labels/);
  assert.throws(() => buildLabelPresentations({ labels: ["Work"], labelIds: null }, []), /memo.labelIds/);
  assert.throws(() => buildLabelPresentations({ labels: [""], labelIds: [] }, []), /non-empty strings/);
});
