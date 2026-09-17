import test from "node:test";
import assert from "node:assert/strict";
import { createLabel, labelNameKey, normalizeLabelIds, normalizeLabelNames, reconcileManagedLabels } from "../src/domain/label.mjs";

test("managed labels have stable IDs and canonical case-insensitive keys", () => {
  const label = createLabel({ id: "label-1", name: " Work ", createdAt: "2026-09-17T12:00:00Z" });
  assert.equal(label.id, "label-1");
  assert.equal(label.name, "Work");
  assert.equal(label.nameKey, "work");
  assert.equal(labelNameKey(" WORK "), "work");
});

test("memo label names retain current bounded normalization", () => {
  assert.deepEqual(normalizeLabelNames(["Work", " work ", "Ideas", ""]), ["Work", "Ideas"]);
});

test("managed-label reconciliation reuses identity by case-insensitive name", () => {
  const existing = [createLabel({ id: "label-work", name: "Work", createdAt: "2026-09-17T12:00:00Z" })];
  let sequence = 0;
  const result = reconcileManagedLabels(existing, ["work", "Ideas"], { idFactory: () => `label-${++sequence}`, createdAt: "2026-09-17T13:00:00Z" });
  assert.deepEqual(result.labelIds, ["label-work", "label-1"]);
  assert.deepEqual(result.labelNames, ["Work", "Ideas"]);
  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].nameKey, "ideas");
});

test("label ID normalization deduplicates exact stable identifiers", () => {
  assert.deepEqual(normalizeLabelIds([" a ", "a", "b"]), ["a", "b"]);
});
