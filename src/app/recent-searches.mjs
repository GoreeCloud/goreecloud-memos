export const RECENT_SEARCHES_KEY = "goreecloud-memos:recent-searches:v1";
export const MAX_RECENT_SEARCHES = 8;
export const MAX_RECENT_SEARCH_LENGTH = 256;

function normalizeRecentSearch(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_RECENT_SEARCH_LENGTH) return null;
  return normalized;
}

export function loadRecentSearches(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    const unique = [];
    const seen = new Set();
    for (const value of parsed) {
      const normalized = normalizeRecentSearch(value);
      if (!normalized) continue;
      const identity = normalized.toLocaleLowerCase();
      if (seen.has(identity)) continue;
      seen.add(identity);
      unique.push(normalized);
      if (unique.length >= MAX_RECENT_SEARCHES) break;
    }
    return unique;
  } catch {
    return [];
  }
}

export function rememberRecentSearch(storage, value) {
  const normalized = normalizeRecentSearch(value);
  const current = loadRecentSearches(storage);
  if (!normalized) return { searches: current, saved: false };

  const identity = normalized.toLocaleLowerCase();
  const searches = [
    normalized,
    ...current.filter((entry) => entry.toLocaleLowerCase() !== identity)
  ].slice(0, MAX_RECENT_SEARCHES);

  try {
    storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    return { searches, saved: true };
  } catch {
    return { searches: current, saved: false };
  }
}

export function clearRecentSearches(storage) {
  try {
    storage.removeItem(RECENT_SEARCHES_KEY);
    return true;
  } catch {
    return false;
  }
}
