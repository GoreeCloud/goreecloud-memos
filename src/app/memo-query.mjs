export const ALL_COLORS = "all";
export const NO_COLOR = "none";

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

export function filterMemos(memos, { query = "", color = ALL_COLORS, label = "all" } = {}) {
  if (!Array.isArray(memos)) throw new TypeError("memos must be an array");
  return memos.filter((memo) =>
    memoMatchesQuery(memo, query) &&
    memoMatchesColor(memo, color) &&
    memoMatchesLabel(memo, label)
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
