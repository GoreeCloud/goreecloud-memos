import { normalizeLabelIds, normalizeLabelNames } from "./label.mjs";

export const MEMO_SCHEMA_VERSION = 4;
export const MAX_MEMO_TITLE_LENGTH = 240;
export const MAX_MEMO_CONTENT_LENGTH = 100_000;
export const MEMO_STATES = Object.freeze(["active", "archived", "trashed"]);
export const MEMO_COLORS = Object.freeze(["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "gray"]);

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`${fieldName} must be a non-empty string`);
}
function normalizeTimestamp(value, fieldName = "timestamp") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${fieldName} must be a valid date`);
  return date.toISOString();
}
function validateTitle(title) {
  if (typeof title !== "string") throw new TypeError("title must be a string");
  if (title.length > MAX_MEMO_TITLE_LENGTH) throw new RangeError(`title must be ${MAX_MEMO_TITLE_LENGTH} characters or fewer`);
  return title.trim();
}
function validateContent(content) {
  if (typeof content !== "string") throw new TypeError("content must be a string");
  if (content.trim().length === 0) throw new TypeError("content must not be blank");
  if (content.length > MAX_MEMO_CONTENT_LENGTH) throw new RangeError(`content must be ${MAX_MEMO_CONTENT_LENGTH} characters or fewer`);
  return content;
}
function normalizeState(value) { return MEMO_STATES.includes(value) ? value : "active"; }
function normalizeRestoreState(value) { return value === "active" || value === "archived" ? value : null; }
export function normalizeMemoColor(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new TypeError("color must be a string or null");
  const color = value.trim().toLowerCase();
  if (!MEMO_COLORS.includes(color)) throw new TypeError(`color must be one of: ${MEMO_COLORS.join(", ")}`);
  return color;
}
export const normalizeMemoLabels = normalizeLabelNames;
function normalizePinOrder(value, pinned, updatedAt) {
  if (!pinned) return null;
  if (Number.isSafeInteger(value) && value >= 0) return value;
  return Number.MAX_SAFE_INTEGER - Date.parse(updatedAt);
}
export function createMemo({ id, title = "", content, color = null, labels = [], createdAt = new Date() }) {
  requireNonEmptyString(id, "id");
  const timestamp = normalizeTimestamp(createdAt, "createdAt");
  return { schemaVersion: MEMO_SCHEMA_VERSION, id: id.trim(), title: validateTitle(title), content: validateContent(content), color: normalizeMemoColor(color), labels: normalizeLabelNames(labels), labelIds: [], createdAt: timestamp, updatedAt: timestamp, state: "active", pinned: false, pinOrder: null, archivedAt: null, trashedAt: null, restoreState: null };
}
export function migrateMemoRecord(record) {
  if (!record || typeof record !== "object") throw new TypeError("record must be an object");
  requireNonEmptyString(record.id, "id");
  const createdAt = normalizeTimestamp(record.createdAt, "createdAt");
  const updatedAt = normalizeTimestamp(record.updatedAt ?? record.createdAt, "updatedAt");
  const state = normalizeState(record.state);
  const restoreState = state === "trashed" ? normalizeRestoreState(record.restoreState) : null;
  const pinned = record.pinned === true;
  return { schemaVersion: MEMO_SCHEMA_VERSION, id: record.id.trim(), title: validateTitle(record.title ?? ""), content: validateContent(record.content), color: normalizeMemoColor(record.color), labels: normalizeLabelNames(record.labels), labelIds: normalizeLabelIds(record.labelIds), createdAt, updatedAt, state, pinned, pinOrder: normalizePinOrder(record.pinOrder, pinned, updatedAt), archivedAt: (state === "archived" || (state === "trashed" && restoreState === "archived")) && record.archivedAt ? normalizeTimestamp(record.archivedAt, "archivedAt") : null, trashedAt: state === "trashed" && record.trashedAt ? normalizeTimestamp(record.trashedAt, "trashedAt") : null, restoreState };
}
function sameLabelNames(left, right) {
  if (left.length !== right.length) return false;
  return left.every((name, index) => name.toLocaleLowerCase() === right[index].toLocaleLowerCase());
}
export function editMemo(memo, { title = memo.title, content = memo.content, color = memo.color, labels = memo.labels, updatedAt = new Date() }) {
  const normalized = migrateMemoRecord(memo);
  const nextLabels = normalizeLabelNames(labels);
  return { ...normalized, title: validateTitle(title), content: validateContent(content), color: normalizeMemoColor(color), labels: nextLabels, labelIds: sameLabelNames(normalized.labels, nextLabels) ? normalized.labelIds : [], updatedAt: normalizeTimestamp(updatedAt, "updatedAt") };
}
export function pinMemo(memo, pinOrder, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "active") throw new Error("only active memos can be pinned");
  if (normalized.pinned) return normalized;
  if (!Number.isSafeInteger(pinOrder) || pinOrder < 0) throw new TypeError("pinOrder must be a non-negative safe integer");
  return { ...normalized, pinned: true, pinOrder, updatedAt: normalizeTimestamp(changedAt, "changedAt") };
}
export function unpinMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (!normalized.pinned) return normalized;
  return { ...normalized, pinned: false, pinOrder: null, updatedAt: normalizeTimestamp(changedAt, "changedAt") };
}
export function setPinnedOrder(memo, pinOrder, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (!normalized.pinned) throw new Error("only pinned memos can be reordered");
  if (!Number.isSafeInteger(pinOrder) || pinOrder < 0) throw new TypeError("pinOrder must be a non-negative safe integer");
  return { ...normalized, pinOrder, updatedAt: normalizeTimestamp(changedAt, "changedAt") };
}
export function archiveMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "active") throw new Error("only active memos can be archived");
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  return { ...normalized, state: "archived", archivedAt: timestamp, updatedAt: timestamp, restoreState: null };
}
export function restoreArchivedMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "archived") throw new Error("only archived memos can be restored from archive");
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  return { ...normalized, state: "active", archivedAt: null, updatedAt: timestamp, restoreState: null };
}
export function trashMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state === "trashed") throw new Error("memo is already in trash");
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  return { ...normalized, state: "trashed", trashedAt: timestamp, updatedAt: timestamp, restoreState: normalized.state, archivedAt: normalized.state === "archived" ? normalized.archivedAt : null };
}
export function restoreTrashedMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "trashed") throw new Error("only trashed memos can be restored from trash");
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  const restoredState = normalized.restoreState ?? "active";
  return { ...normalized, state: restoredState, archivedAt: restoredState === "archived" ? normalized.archivedAt ?? timestamp : null, trashedAt: null, restoreState: null, updatedAt: timestamp };
}
export function compareMemosForDisplay(left, right) {
  if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
  if (left.pinned && right.pinned) {
    const leftOrder = Number.isSafeInteger(left.pinOrder) ? left.pinOrder : Number.MAX_SAFE_INTEGER;
    const rightOrder = Number.isSafeInteger(right.pinOrder) ? right.pinOrder : Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  }
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}
