export const MEMO_SCHEMA_VERSION = 1;
export const MAX_MEMO_TITLE_LENGTH = 240;
export const MAX_MEMO_CONTENT_LENGTH = 100_000;

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
}

function normalizeTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("createdAt must be a valid date");
  }
  return date.toISOString();
}

export function createMemo({ id, title = "", content, createdAt = new Date() }) {
  requireNonEmptyString(id, "id");

  if (typeof title !== "string") {
    throw new TypeError("title must be a string");
  }
  if (title.length > MAX_MEMO_TITLE_LENGTH) {
    throw new RangeError(`title must be ${MAX_MEMO_TITLE_LENGTH} characters or fewer`);
  }

  if (typeof content !== "string") {
    throw new TypeError("content must be a string");
  }
  if (content.trim().length === 0) {
    throw new TypeError("content must not be blank");
  }
  if (content.length > MAX_MEMO_CONTENT_LENGTH) {
    throw new RangeError(`content must be ${MAX_MEMO_CONTENT_LENGTH} characters or fewer`);
  }

  const timestamp = normalizeTimestamp(createdAt);

  return {
    schemaVersion: MEMO_SCHEMA_VERSION,
    id: id.trim(),
    title: title.trim(),
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
    state: "active",
    pinned: false
  };
}

export function compareMemosForDisplay(left, right) {
  if (left.pinned !== right.pinned) {
    return left.pinned ? -1 : 1;
  }

  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}
