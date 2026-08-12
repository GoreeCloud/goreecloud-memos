const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GoreeCloud Labels intentionally reuse Memos' Markdown tag model so labels
 * remain portable and continue to work with the existing server-side tag
 * index/filter engine. User-facing labels are stored as ordinary #tag tokens.
 */
export const normalizeNoteLabel = (value: string): string => {
  const label = value.trim().replace(/^#+/, "");
  if (!label || /\s/.test(label)) return "";
  return label;
};

export const hasNoteLabel = (content: string, value: string): boolean => {
  const label = normalizeNoteLabel(value);
  if (!label) return false;
  const token = new RegExp(`(^|\\s)#${escapeRegExp(label)}(?=\\s|$)`, "u");
  return token.test(content);
};

const TRAILING_LABEL_LINE = /(^|\n)(#[^\s#]+(?:[ \t]+#[^\s#]+)*)[ \t]*$/u;

export const addNoteLabel = (content: string, value: string): string => {
  const label = normalizeNoteLabel(value);
  if (!label || hasNoteLabel(content, label)) return content;

  const trimmed = content.trimEnd();
  if (!trimmed) return `#${label}`;

  if (TRAILING_LABEL_LINE.test(trimmed)) {
    return trimmed.replace(TRAILING_LABEL_LINE, (_match, prefix: string, line: string) => `${prefix}${line} #${label}`);
  }

  return `${trimmed}\n\n#${label}`;
};

export const removeNoteLabel = (content: string, value: string): string => {
  const label = normalizeNoteLabel(value);
  if (!label) return content;

  const token = new RegExp(`(^|\\s)#${escapeRegExp(label)}(?=\\s|$)`, "gu");
  const next = content.replace(token, (_match, prefix: string) => (prefix.includes("\n") ? prefix : " "));

  return next
    .split("\n")
    .map((line) => {
      const normalized = line.replace(/[ \t]{2,}/g, " ").trimEnd();
      return /^\s*#[^\s#]+(?:\s+#[^\s#]+)*$/u.test(normalized) ? normalized.trimStart() : normalized;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
};

export const setNoteLabelEnabled = (content: string, value: string, enabled: boolean): string =>
  enabled ? addNoteLabel(content, value) : removeNoteLabel(content, value);
