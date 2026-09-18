export const ALL_COLORS = "all";
export const NO_COLOR = "none";
export const ALL_LABEL_COLORS = "all";

function normalizeText(value) {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}

export function memoMatchesQuery(memo, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  const searchable = [
    memo?.title,
    memo?.content,
    ...(Array.isArray(memo?.labels) ? memo.labels : [])
  ]
    .filter((value) => typeof value === "string")
    .join("\n")
    .toLocaleLowerCase();

  return searchable.includes(normalizedQuery);
}

export function memoMatchesColor(memo, color) {
  const normalizedColor = normalizeText(color);
  if (!normalizedColor || normalizedColor === ALL_COLORS) return true;
  if (normalizedColor === NO_COLOR) return memo?.color == null || memo.color === "";
  return normalizeText(memo?.color) === normalizedColor;
}

export function memoMatchesLabel(memo, label) {
  const normalizedLabel = normalizeText(label);
  if (!normalizedLabel || normalizedLabel === "all") return true;
  return Array.isArray(memo?.labels) && memo.labels.some((item) => normalizeText(item) === normalizedLabel);
}

function managedLabelColorsById(managedLabels) {
  if (!Array.isArray(managedLabels)) throw new TypeError("managedLabels must be an array");
  const colors = new Map();
  for (const label of managedLabels) {
    if (!label || typeof label !== "object" || typeof label.id !== "string") continue;
    const id = label.id.trim();
    if (!id) continue;
    colors.set(id, normalizeText(label.color));
  }
  return colors;
}

function memoMatchesLabelColorIndex(memo, labelColor, colorsById) {
  const normalizedColor = normalizeText(labelColor);
  if (!normalizedColor || normalizedColor === ALL_LABEL_COLORS) return true;
  if (!Array.isArray(memo?.labelIds)) return false;
  return memo.labelIds.some((id) => typeof id === "string" && colorsById.get(id.trim()) === normalizedColor);
}

export function memoMatchesLabelColor(memo, labelColor, managedLabels = []) {
  return memoMatchesLabelColorIndex(memo, labelColor, managedLabelColorsById(managedLabels));
}

export function filterMemos(
  memos,
  {
    query = "",
    color = ALL_COLORS,
    label = "all",
    labelColor = ALL_LABEL_COLORS,
    expression = null
  } = {},
  { managedLabels = [] } = {}
) {
  if (!Array.isArray(memos)) throw new TypeError("memos must be an array");
  if (expression != null && (typeof expression !== "object" || Array.isArray(expression))) {
    throw new TypeError("expression must be an object or null");
  }

  const colorsById = managedLabelColorsById(managedLabels);
  return memos.filter((memo) =>
    memoMatchesQuery(memo, query) &&
    memoMatchesColor(memo, color) &&
    memoMatchesLabel(memo, label) &&
    memoMatchesLabelColorIndex(memo, labelColor, colorsById) &&
    (!expression || memoMatchesColor(memo, expression.color)) &&
    (!expression || memoMatchesLabel(memo, expression.label)) &&
    (!expression || memoMatchesLabelColorIndex(memo, expression.labelColor, colorsById))
  );
}

export function collectLabelOptions(memos) {
  if (!Array.isArray(memos)) throw new TypeError("memos must be an array");
  const labels = new Map();
  for (const memo of memos) {
    for (const label of Array.isArray(memo?.labels) ? memo.labels : []) {
      if (typeof label !== "string") continue;
      const trimmed = label.trim();
      if (!trimmed) continue;
      const key = trimmed.toLocaleLowerCase();
      if (!labels.has(key)) labels.set(key, trimmed);
    }
  }
  return [...labels.values()].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}
