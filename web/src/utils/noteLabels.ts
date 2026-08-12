import { getNoteColor, setNoteColor, stripNoteColorMetadata } from "./noteColor";
import { getNoteTrashOrigin, setNoteTrashed, stripNoteTrashMetadata } from "./noteTrash";

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

const stripGoreeCloudStateMetadata = (content: string) => stripNoteTrashMetadata(stripNoteColorMetadata(content));

const restoreGoreeCloudStateMetadata = (content: string, originalContent: string): string => {
  const color = getNoteColor(originalContent);
  const trashOrigin = getNoteTrashOrigin(originalContent);
  const coloredContent = setNoteColor(content, color);
  return trashOrigin ? setNoteTrashed(coloredContent, trashOrigin) : coloredContent;
};

const addLabelToBody = (content: string, label: string): string => {
  const trimmed = content.trimEnd();
  if (!trimmed) return `#${label}`;

  if (TRAILING_LABEL_LINE.test(trimmed)) {
    return trimmed.replace(TRAILING_LABEL_LINE, (_match, prefix: string, line: string) => `${prefix}${line} #${label}`);
  }

  return `${trimmed}\n\n#${label}`;
};

const removeLabelFromBody = (content: string, label: string): string => {
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

export const addNoteLabel = (content: string, value: string): string => {
  const label = normalizeNoteLabel(value);
  if (!label || hasNoteLabel(content, label)) return content;

  const body = stripGoreeCloudStateMetadata(content);
  return restoreGoreeCloudStateMetadata(addLabelToBody(body, label), content);
};

export const removeNoteLabel = (content: string, value: string): string => {
  const label = normalizeNoteLabel(value);
  if (!label || !hasNoteLabel(content, label)) return content;

  const body = stripGoreeCloudStateMetadata(content);
  return restoreGoreeCloudStateMetadata(removeLabelFromBody(body, label), content);
};

export const setNoteLabelEnabled = (content: string, value: string, enabled: boolean): string =>
  enabled ? addNoteLabel(content, value) : removeNoteLabel(content, value);
