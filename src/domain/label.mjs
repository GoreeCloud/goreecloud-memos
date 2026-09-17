export const LABEL_SCHEMA_VERSION = 1;
export const MAX_LABELS_PER_MEMO = 20;
export const MAX_LABEL_NAME_LENGTH = 60;

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

export function normalizeLabelName(value) {
  if (typeof value !== "string") {
    throw new TypeError("label name must be a string");
  }
  const name = value.trim();
  if (!name) {
    throw new TypeError("label name must not be blank");
  }
  if (name.length > MAX_LABEL_NAME_LENGTH) {
    throw new RangeError(`label names must be ${MAX_LABEL_NAME_LENGTH} characters or fewer`);
  }
  return name;
}

export function labelNameKey(value) {
  return normalizeLabelName(value).toLocaleLowerCase();
}

export function normalizeLabelNames(value) {
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
    const trimmed = rawLabel.trim();
    if (!trimmed) continue;
    const name = normalizeLabelName(trimmed);
    const key = labelNameKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(name);
  }

  if (labels.length > MAX_LABELS_PER_MEMO) {
    throw new RangeError(`a memo can have at most ${MAX_LABELS_PER_MEMO} labels`);
  }
  return labels;
}

export function normalizeLabelIds(value) {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new TypeError("labelIds must be an array of strings");
  }
  const ids = [];
  const seen = new Set();
  for (const rawId of value) {
    requireNonEmptyString(rawId, "labelId");
    const id = rawId.trim();
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (ids.length > MAX_LABELS_PER_MEMO) {
    throw new RangeError(`a memo can have at most ${MAX_LABELS_PER_MEMO} label IDs`);
  }
  return ids;
}

export function createLabel({ id, name, createdAt = new Date() }) {
  requireNonEmptyString(id, "id");
  const normalizedName = normalizeLabelName(name);
  const timestamp = normalizeTimestamp(createdAt, "createdAt");
  return {
    schemaVersion: LABEL_SCHEMA_VERSION,
    id: id.trim(),
    name: normalizedName,
    nameKey: labelNameKey(normalizedName),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function migrateLabelRecord(record) {
  if (!record || typeof record !== "object") {
    throw new TypeError("record must be an object");
  }
  requireNonEmptyString(record.id, "id");
  const name = normalizeLabelName(record.name);
  const createdAt = normalizeTimestamp(record.createdAt, "createdAt");
  return {
    schemaVersion: LABEL_SCHEMA_VERSION,
    id: record.id.trim(),
    name,
    nameKey: labelNameKey(name),
    createdAt,
    updatedAt: normalizeTimestamp(record.updatedAt ?? createdAt, "updatedAt")
  };
}

export function reconcileManagedLabels(existingLabels, requestedNames, { idFactory, createdAt = new Date() } = {}) {
  if (!Array.isArray(existingLabels)) {
    throw new TypeError("existingLabels must be an array");
  }
  if (typeof idFactory !== "function") {
    throw new TypeError("idFactory must be a function");
  }

  const byKey = new Map();
  for (const rawLabel of existingLabels) {
    const label = migrateLabelRecord(rawLabel);
    if (!byKey.has(label.nameKey)) byKey.set(label.nameKey, label);
  }

  const names = normalizeLabelNames(requestedNames);
  const created = [];
  const labelIds = [];
  const canonicalNames = [];

  for (const requestedName of names) {
    const key = labelNameKey(requestedName);
    let label = byKey.get(key);
    if (!label) {
      label = createLabel({ id: idFactory(), name: requestedName, createdAt });
      byKey.set(key, label);
      created.push(label);
    }
    labelIds.push(label.id);
    canonicalNames.push(label.name);
  }

  return { created, labelIds, labelNames: canonicalNames };
}
