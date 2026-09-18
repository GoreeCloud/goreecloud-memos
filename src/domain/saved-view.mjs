import { LABEL_COLORS, MAX_LABEL_NAME_LENGTH, normalizeLabelName } from "./label.mjs";
import { MEMO_COLORS } from "./memo.mjs";

export const SAVED_VIEW_SCHEMA_VERSION = 1;
export const MAX_SAVED_VIEW_NAME_LENGTH = 80;
export const MAX_SAVED_VIEW_QUERY_LENGTH = 2_000;

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
}

function normalizeTimestamp(value, fieldName = "timestamp") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${fieldName} must be a valid date`);
  return date.toISOString();
}

export function normalizeSavedViewName(value) {
  if (typeof value !== "string") throw new TypeError("saved view name must be a string");
  const name = value.trim();
  if (!name) throw new TypeError("saved view name must not be blank");
  if (name.length > MAX_SAVED_VIEW_NAME_LENGTH) {
    throw new RangeError(`saved view name must be ${MAX_SAVED_VIEW_NAME_LENGTH} characters or fewer`);
  }
  return name;
}

export function savedViewNameKey(value) {
  return normalizeSavedViewName(value).toLowerCase();
}

function normalizeQuery(value) {
  if (typeof value !== "string") throw new TypeError("saved view query must be a string");
  if (value.length > MAX_SAVED_VIEW_QUERY_LENGTH) {
    throw new RangeError(`saved view query must be ${MAX_SAVED_VIEW_QUERY_LENGTH} characters or fewer`);
  }
  return value;
}

function normalizeMemoColorFilter(value) {
  if (value == null || value === "" || value === "all") return "all";
  if (value === "none") return "none";
  if (typeof value !== "string") throw new TypeError("saved view memo color must be a string");
  const normalized = value.trim().toLowerCase();
  if (!MEMO_COLORS.includes(normalized)) throw new RangeError("saved view memo color must be a supported filter token");
  return normalized;
}

function normalizeLabelFilter(value) {
  if (value == null || value === "" || value === "all") return "all";
  if (typeof value !== "string") throw new TypeError("saved view label must be a string");
  const name = normalizeLabelName(value);
  if (name.length > MAX_LABEL_NAME_LENGTH) throw new RangeError("saved view label is too long");
  return name;
}

function normalizeLabelColorFilter(value) {
  if (value == null || value === "" || value === "all") return "all";
  if (typeof value !== "string") throw new TypeError("saved view label color must be a string");
  const normalized = value.trim().toLowerCase();
  if (!LABEL_COLORS.includes(normalized)) throw new RangeError("saved view label color must be a supported filter token");
  return normalized;
}

export function normalizeSavedViewFilters(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("saved view filters must be an object");
  }
  return {
    query: normalizeQuery(value.query ?? ""),
    color: normalizeMemoColorFilter(value.color),
    label: normalizeLabelFilter(value.label),
    labelColor: normalizeLabelColorFilter(value.labelColor)
  };
}

export function createSavedView({ id, name, filters, createdAt = new Date() }) {
  requireNonEmptyString(id, "saved view id");
  const timestamp = normalizeTimestamp(createdAt, "createdAt");
  const normalizedName = normalizeSavedViewName(name);
  return {
    schemaVersion: SAVED_VIEW_SCHEMA_VERSION,
    id: id.trim(),
    name: normalizedName,
    nameKey: savedViewNameKey(normalizedName),
    filters: normalizeSavedViewFilters(filters),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function migrateSavedViewRecord(record) {
  if (!record || typeof record !== "object") throw new TypeError("saved view record must be an object");
  requireNonEmptyString(record.id, "saved view id");
  const name = normalizeSavedViewName(record.name);
  const createdAt = normalizeTimestamp(record.createdAt, "createdAt");
  const updatedAt = normalizeTimestamp(record.updatedAt ?? record.createdAt, "updatedAt");
  return {
    schemaVersion: SAVED_VIEW_SCHEMA_VERSION,
    id: record.id.trim(),
    name,
    nameKey: savedViewNameKey(name),
    filters: normalizeSavedViewFilters(record.filters),
    createdAt,
    updatedAt
  };
}
