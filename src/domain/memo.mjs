export const MEMO_SCHEMA_VERSION = 2;
export const MAX_MEMO_TITLE_LENGTH = 240;
export const MAX_MEMO_CONTENT_LENGTH = 100_000;
export const MEMO_STATES = Object.freeze(["active", "archived", "trashed"]);

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

export function createMemo({ id, title = "", content, createdAt = new Date() }) {
  requireNonEmptyString(id, "id");
  const timestamp = normalizeTimestamp(createdAt, "createdAt");

  return {
    schemaVersion: MEMO_SCHEMA_VERSION,
    id: id.trim(),
    title: validateTitle(title),
    content: validateContent(content),
    createdAt: timestamp,
    updatedAt: timestamp,
    state: "active",
    pinned: false,
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

  return {
    schemaVersion: MEMO_SCHEMA_VERSION,
    id: record.id.trim(),
    title: validateTitle(record.title ?? ""),
    content: validateContent(record.content),
    createdAt,
    updatedAt,
    state,
    pinned: record.pinned === true,
    archivedAt: (state === "archived" || (state === "trashed" && restoreState === "archived")) && record.archivedAt
      ? normalizeTimestamp(record.archivedAt, "archivedAt")
      : null,
    trashedAt: state === "trashed" && record.trashedAt ? normalizeTimestamp(record.trashedAt, "trashedAt") : null,
    restoreState
  };
}

export function editMemo(memo, { title = memo.title, content = memo.content, updatedAt = new Date() }) {
  const normalized = migrateMemoRecord(memo);
  return {
    ...normalized,
    title: validateTitle(title),
    content: validateContent(content),
    updatedAt: normalizeTimestamp(updatedAt, "updatedAt")
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
  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}
