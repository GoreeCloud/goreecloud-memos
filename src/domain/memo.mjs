export const MEMO_SCHEMA_VERSION = 3;
export const MAX_MEMO_TITLE_LENGTH = 240;
export const MAX_MEMO_CONTENT_LENGTH = 100_000;
export const MAX_MEMO_LABELS = 20;
export const MAX_MEMO_LABEL_LENGTH = 60;
export const MEMO_STATES = Object.freeze(["active", "archived", "trashed"]);
export const MEMO_COLORS = Object.freeze(["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "gray"]);

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
}

function normalizeTimestamp(value, fieldName = "timestamp") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`${fieldName} must be a valid date`);
  }
  return date.toISOString();
}

function validateTitle(title) {
  if (typeof title !== "string") {
    throw new TypeError("title must be a string");
  }
  if (title.length > MAX_MEMO_TITLE_LENGTH) {
    throw new RangeError(`title must be ${MAX_MEMO_TITLE_LENGTH} characters or fewer`);
  }
  return title.trim();
}

function validateContent(content) {
  if (typeof content !== "string") {
    throw new TypeError("content must be a string");
  }
  if (content.trim().length === 0) {
    throw new TypeError("content must not be blank");
  }
  if (content.length > MAX_MEMO_CONTENT_LENGTH) {
    throw new RangeError(`content must be ${MAX_MEMO_CONTENT_LENGTH} characters or fewer`);
  }
  return content;
}

function normalizeState(value) {
  return MEMO_STATES.includes(value) ? value : "active";
}

function normalizeRestoreState(value) {
  return value === "active" || value === "archived" ? value : null;
}

export function normalizeMemoColor(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new TypeError("color must be a string or null");
  }
  const color = value.trim().toLowerCase();
  if (!MEMO_COLORS.includes(color)) {
    throw new TypeError(`color must be one of: ${MEMO_COLORS.join(", ")}`);
  }
  return color;
}

export function normalizeMemoLabels(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new TypeError("labels must be an array of strings");
  }

  const labels = [];
  const seen = new Set();
  for (const rawLabel of value) {
    if (typeof rawLabel !== "string") {
      throw new TypeError("labels must contain only strings");
    }
    const label = rawLabel.trim();
    if (!label) continue;
    if (label.length > MAX_MEMO_LABEL_LENGTH) {
      throw new RangeError(`labels must be ${MAX_MEMO_LABEL_LENGTH} characters or fewer`);
    }
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }

  if (labels.length > MAX_MEMO_LABELS) {
    throw new RangeError(`a memo can have at most ${MAX_MEMO_LABELS} labels`);
  }
  return labels;
}

function normalizePinOrder(value, pinned, updatedAt) {
  if (!pinned) return null;
  if (Number.isSafeInteger(value) && value >= 0) return value;
  return Number.MAX_SAFE_INTEGER - Date.parse(updatedAt);
}

export function createMemo({ id, title = "", content, color = null, labels = [], createdAt = new Date() }) {
  requireNonEmptyString(id, "id");
  const timestamp = normalizeTimestamp(createdAt, "createdAt");

  return {
    schemaVersion: MEMO_SCHEMA_VERSION,
    id: id.trim(),
    title: validateTitle(title),
    content: validateContent(content),
    color: normalizeMemoColor(color),
    labels: normalizeMemoLabels(labels),
    createdAt: timestamp,
    updatedAt: timestamp,
    state: "active",
    pinned: false,
    pinOrder: null,
    archivedAt: null,
    trashedAt: null,
    restoreState: null
  };
}

export function migrateMemoRecord(record) {
  if (!record || typeof record !== "object") {
    throw new TypeError("record must be an object");
  }

  requireNonEmptyString(record.id, "id");
  const createdAt = normalizeTimestamp(record.createdAt, "createdAt");
  const updatedAt = normalizeTimestamp(record.updatedAt ?? record.createdAt, "updatedAt");
  const state = normalizeState(record.state);
  const restoreState = state === "trashed" ? normalizeRestoreState(record.restoreState) : null;
  const pinned = record.pinned === true;

  return {
    schemaVersion: MEMO_SCHEMA_VERSION,
    id: record.id.trim(),
    title: validateTitle(record.title ?? ""),
    content: validateContent(record.content),
    color: normalizeMemoColor(record.color),
    labels: normalizeMemoLabels(record.labels),
    createdAt,
    updatedAt,
    state,
    pinned,
    pinOrder: normalizePinOrder(record.pinOrder, pinned, updatedAt),
    archivedAt: (state === "archived" || (state === "trashed" && restoreState === "archived")) && record.archivedAt
      ? normalizeTimestamp(record.archivedAt, "archivedAt")
      : null,
    trashedAt: state === "trashed" && record.trashedAt ? normalizeTimestamp(record.trashedAt, "trashedAt") : null,
    restoreState
  };
}

export function editMemo(
  memo,
  {
    title = memo.title,
    content = memo.content,
    color = memo.color,
    labels = memo.labels,
    updatedAt = new Date()
  }
) {
  const normalized = migrateMemoRecord(memo);
  return {
    ...normalized,
    title: validateTitle(title),
    content: validateContent(content),
    color: normalizeMemoColor(color),
    labels: normalizeMemoLabels(labels),
    updatedAt: normalizeTimestamp(updatedAt, "updatedAt")
  };
}

export function pinMemo(memo, pinOrder, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "active") {
    throw new Error("only active memos can be pinned");
  }
  if (normalized.pinned) return normalized;
  if (!Number.isSafeInteger(pinOrder) || pinOrder < 0) {
    throw new TypeError("pinOrder must be a non-negative safe integer");
  }
  return {
    ...normalized,
    pinned: true,
    pinOrder,
    updatedAt: normalizeTimestamp(changedAt, "changedAt")
  };
}

export function unpinMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (!normalized.pinned) return normalized;
  return {
    ...normalized,
    pinned: false,
    pinOrder: null,
    updatedAt: normalizeTimestamp(changedAt, "changedAt")
  };
}

export function setPinnedOrder(memo, pinOrder, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (!normalized.pinned) {
    throw new Error("only pinned memos can be reordered");
  }
  if (!Number.isSafeInteger(pinOrder) || pinOrder < 0) {
    throw new TypeError("pinOrder must be a non-negative safe integer");
  }
  return {
    ...normalized,
    pinOrder,
    updatedAt: normalizeTimestamp(changedAt, "changedAt")
  };
}

export function archiveMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "active") {
    throw new Error("only active memos can be archived");
  }
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  return {
    ...normalized,
    state: "archived",
    archivedAt: timestamp,
    updatedAt: timestamp,
    restoreState: null
  };
}

export function restoreArchivedMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "archived") {
    throw new Error("only archived memos can be restored from archive");
  }
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  return {
    ...normalized,
    state: "active",
    archivedAt: null,
    updatedAt: timestamp,
    restoreState: null
  };
}

export function trashMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state === "trashed") {
    throw new Error("memo is already in trash");
  }
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  return {
    ...normalized,
    state: "trashed",
    trashedAt: timestamp,
    updatedAt: timestamp,
    restoreState: normalized.state,
    archivedAt: normalized.state === "archived" ? normalized.archivedAt : null
  };
}

export function restoreTrashedMemo(memo, changedAt = new Date()) {
  const normalized = migrateMemoRecord(memo);
  if (normalized.state !== "trashed") {
    throw new Error("only trashed memos can be restored from trash");
  }
  const timestamp = normalizeTimestamp(changedAt, "changedAt");
  const restoredState = normalized.restoreState ?? "active";
  return {
    ...normalized,
    state: restoredState,
    archivedAt: restoredState === "archived" ? normalized.archivedAt ?? timestamp : null,
    trashedAt: null,
    restoreState: null,
    updatedAt: timestamp
  };
}

export function compareMemosForDisplay(left, right) {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1;
  }
  if (left.pinned && right.pinned) {
    const leftOrder = Number.isSafeInteger(left.pinOrder) ? left.pinOrder : Number.MAX_SAFE_INTEGER;
    const rightOrder = Number.isSafeInteger(right.pinOrder) ? right.pinOrder : Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  }
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}
