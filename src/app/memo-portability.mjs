import { migrateMemoRecord } from "../domain/memo.mjs";
import { migrateLabelRecord } from "../domain/label.mjs";
import { migrateSavedViewRecord } from "../domain/saved-view.mjs";

function requireMemo(memo) {
  if (!memo || typeof memo !== "object") throw new TypeError("memo must be an object");
  if (typeof memo.content !== "string" || memo.content.trim().length === 0) {
    throw new TypeError("memo content must be a non-empty string");
  }
  return memo;
}

function cleanFilenamePart(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 80);
}

export function formatMemoPlainText(memo) {
  const normalized = requireMemo(memo);
  const lines = [];
  const title = typeof normalized.title === "string" ? normalized.title.trim() : "";

  if (title) {
    lines.push(title, "");
  }
  lines.push(normalized.content.trimEnd());

  const labels = Array.isArray(normalized.labels)
    ? normalized.labels.map((label) => String(label).trim()).filter(Boolean)
    : [];
  const metadata = [];
  if (labels.length > 0) metadata.push(`Labels: ${labels.join(", ")}`);
  if (typeof normalized.color === "string" && normalized.color.trim()) {
    metadata.push(`Color: ${normalized.color.trim()}`);
  }

  if (metadata.length > 0) {
    lines.push("", ...metadata);
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function memoPlainTextFilename(memo) {
  const normalized = requireMemo(memo);
  const contentLead = normalized.content.split(/\r?\n/, 1)[0];
  const stem = cleanFilenamePart(normalized.title) || cleanFilenamePart(contentLead) || "memo";
  return `${stem}.txt`;
}


export function formatMemoPlainTextSelection(memos) {
  if (!Array.isArray(memos) || memos.length === 0) {
    throw new TypeError("memos must be a non-empty array");
  }

  return memos
    .map((memo, index) => {
      const body = formatMemoPlainText(memo).trimEnd();
      return `Memo ${index + 1} of ${memos.length}\n\n${body}`;
    })
    .join("\n\n---\n\n") + "\n";
}

export function memoPlainTextSelectionFilename(count) {
  if (!Number.isInteger(count) || count < 1) throw new TypeError("count must be a positive integer");
  return `goreecloud-memos-selection-${count}.txt`;
}


export const MEMOS_LIBRARY_EXPORT_FORMAT = "goreecloud-memos-library-export";
export const MEMOS_LIBRARY_EXPORT_SCHEMA_VERSION = 1;

function normalizeExportTimestamp(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("exportedAt must be a valid date");
  return date.toISOString();
}

function requireArray(value, name) {
  if (!Array.isArray(value)) throw new TypeError(`${name} must be an array`);
  return value;
}

function byTimestampThenId(left, right) {
  const time = String(left.createdAt).localeCompare(String(right.createdAt));
  return time || left.id.localeCompare(right.id);
}

function byNameThenId(left, right) {
  const name = String(left.nameKey ?? left.name).localeCompare(
    String(right.nameKey ?? right.name),
    undefined,
    { sensitivity: "base" }
  );
  return name || left.id.localeCompare(right.id);
}

export function formatMemosLibraryJson({
  memos,
  labels = [],
  savedViews = [],
  exportedAt = new Date()
}) {
  const snapshot = {
    format: MEMOS_LIBRARY_EXPORT_FORMAT,
    schemaVersion: MEMOS_LIBRARY_EXPORT_SCHEMA_VERSION,
    exportedAt: normalizeExportTimestamp(exportedAt),
    memos: requireArray(memos, "memos").map(migrateMemoRecord).sort(byTimestampThenId),
    labels: requireArray(labels, "labels").map(migrateLabelRecord).sort(byNameThenId),
    savedViews: requireArray(savedViews, "savedViews").map(migrateSavedViewRecord).sort(byNameThenId)
  };

  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function memosLibraryJsonFilename(exportedAt = new Date()) {
  return `goreecloud-memos-${normalizeExportTimestamp(exportedAt).slice(0, 10)}.json`;
}
