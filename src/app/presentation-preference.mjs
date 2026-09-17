export const PRESENTATION_STORAGE_KEY = "goreecloud-memos:presentation:v1";
export const DEFAULT_PRESENTATION_MODE = "comfortable";
export const PRESENTATION_MODES = Object.freeze(["comfortable", "compact", "list", "dense"]);

export function normalizePresentationMode(value) {
  return PRESENTATION_MODES.includes(value) ? value : DEFAULT_PRESENTATION_MODE;
}

export function loadPresentationMode(storage = globalThis.localStorage) {
  try {
    return normalizePresentationMode(storage?.getItem(PRESENTATION_STORAGE_KEY));
  } catch {
    return DEFAULT_PRESENTATION_MODE;
  }
}

export function savePresentationMode(mode, storage = globalThis.localStorage) {
  if (!PRESENTATION_MODES.includes(mode)) {
    throw new TypeError("presentation mode must be comfortable, compact, list, or dense");
  }

  try {
    storage?.setItem(PRESENTATION_STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
}
