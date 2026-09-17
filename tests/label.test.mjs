import test from "node:test";
import assert from "node:assert/strict";
import {
  createLabel,
  labelNameKey,
  migrateLabelRecord,
  normalizeLabelColor,
  normalizeLabelDescription,
  normalizeLabelIcon,
  normalizeLabelIds,
  normalizeLabelNames,
  reconcileManagedLabels,
  renameLabel,
  updateLabelMetadata
} from "../src/domain/label.mjs";

test("managed labels have stable IDs and canonical case-insensitive keys", () => {
  const label = createLabel({ id: "label-1", name: " Work ", createdAt: "2026-09-17T12:00:00Z" });
  assert.equal(label.id, "label-1");
  assert.equal(label.name, "Work");
  assert.equal(label.nameKey, "work");
  assert.equal(labelNameKey(" WORK "), "work");
  assert.equal(label.schemaVersion, 2);
  assert.equal(label.color, null);
  assert.equal(label.icon, null);
  assert.equal(label.description, null);
});

test("memo label names retain current bounded normalization", () => {
  assert.deepEqual(normalizeLabelNames(["Work", " work ", "Ideas", ""]), ["Work", "Ideas"]);
});

test("managed-label reconciliation reuses identity by case-insensitive name", () => {
  const existing = [createLabel({ id: "label-work", name: "Work", createdAt: "2026-09-17T12:00:00Z" })];
  let sequence = 0;
  const result = reconcileManagedLabels(existing, ["work", "Ideas"], {
    idFactory: () => `label-${++sequence}`,
    createdAt: "2026-09-17T13:00:00Z"
  });
  assert.deepEqual(result.labelIds, ["label-work", "label-1"]);
  assert.deepEqual(result.labelNames, ["Work", "Ideas"]);
  assert.equal(result.created.length, 1);
  assert.equal(result.created[0].nameKey, "ideas");
});

test("renaming a managed label preserves identity, metadata, and creation time", () => {
  const label = createLabel({
    id: "label-work",
    name: "Work",
    color: "blue",
    icon: "💼",
    description: "Office tasks",
    createdAt: "2026-09-17T12:00:00Z"
  });
  const renamed = renameLabel(label, " Projects ", "2026-09-17T13:00:00Z");
  assert.equal(renamed.id, "label-work");
  assert.equal(renamed.name, "Projects");
  assert.equal(renamed.nameKey, "projects");
  assert.equal(renamed.color, "blue");
  assert.equal(renamed.icon, "💼");
  assert.equal(renamed.description, "Office tasks");
  assert.equal(renamed.createdAt, label.createdAt);
  assert.equal(renamed.updatedAt, "2026-09-17T13:00:00.000Z");
});

test("label metadata normalizes palette, optional text, and timestamps", () => {
  const label = createLabel({ id: "label-ideas", name: "Ideas", createdAt: "2026-09-17T12:00:00Z" });
  const updated = updateLabelMetadata(label, {
    color: " PURPLE ",
    icon: " 💡 ",
    description: "  Things to explore  "
  }, "2026-09-17T14:00:00Z");
  assert.equal(updated.id, label.id);
  assert.equal(updated.name, label.name);
  assert.equal(updated.color, "purple");
  assert.equal(updated.icon, "💡");
  assert.equal(updated.description, "Things to explore");
  assert.equal(updated.updatedAt, "2026-09-17T14:00:00.000Z");
  assert.equal(normalizeLabelColor(""), null);
  assert.equal(normalizeLabelIcon("   "), null);
  assert.equal(normalizeLabelDescription(null), null);
  assert.throws(() => normalizeLabelColor("chartreuse"), /supported palette token/);
});

test("legacy managed Label v1 records migrate to v2 with empty metadata", () => {
  const migrated = migrateLabelRecord({
    schemaVersion: 1,
    id: "legacy-label",
    name: "Legacy",
    nameKey: "legacy",
    createdAt: "2026-09-17T12:00:00Z",
    updatedAt: "2026-09-17T12:30:00Z"
  });
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.color, null);
  assert.equal(migrated.icon, null);
  assert.equal(migrated.description, null);
});

test("label ID normalization deduplicates exact stable identifiers", () => {
  assert.deepEqual(normalizeLabelIds([" a ", "a", "b"]), ["a", "b"]);
});
