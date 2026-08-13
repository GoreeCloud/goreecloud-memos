import { findTagMatches, scanTagAt, type TagMatch } from "./tag-grammar";
import { extractMarkdownTagValues } from "./markdownTags";
import { getNoteColor, setNoteColor, stripNoteColorMetadata } from "./noteColor";
import { getNoteTrashOrigin, setNoteTrashed, stripNoteTrashMetadata } from "./noteTrash";

/**
 * GoreeCloud Labels intentionally reuse Memos' Markdown tag model so labels
 * remain portable and continue to work with the existing server-side tag
 * index/filter engine. User-facing labels are stored as ordinary #tag tokens.
 */
export const normalizeNoteLabel = (value: string): string => {
  const label = value.trim().replace(/^#+/, "");
  if (!label || /\s/.test(label)) return "";

  const source = `#${label}`;
  const match = scanTagAt(source, 0);
  return match?.to === source.length ? match.value : "";
};

const countMarkdownLabel = (content: string, label: string): number =>
  extractMarkdownTagValues(content).filter((value) => value === label).length;

/**
 * Resolve exact source candidates that participate in canonical Markdown tag
 * extraction. Each candidate is masked with same-length literal text before
 * re-extraction, preserving surrounding Markdown structure while proving that
 * the candidate itself contributes one recognized tag occurrence.
 */
const findRecognizedLabelMatches = (content: string, label: string): TagMatch[] => {
  const recognizedCount = countMarkdownLabel(content, label);
  if (recognizedCount === 0) return [];

  return findTagMatches(content)
    .filter((match) => match.value === label)
    .filter((match) => {
      const masked = `${content.slice(0, match.from)}${"x".repeat(match.to - match.from)}${content.slice(match.to)}`;
      return countMarkdownLabel(masked, label) < recognizedCount;
    });
};

export const hasNoteLabel = (content: string, value: string): boolean => {
  const label = normalizeNoteLabel(value);
  return !!label && countMarkdownLabel(content, label) > 0;
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

  const candidate = TRAILING_LABEL_LINE.test(trimmed)
    ? trimmed.replace(TRAILING_LABEL_LINE, (_match, prefix: string, line: string) => `${prefix}${line} #${label}`)
    : `${trimmed}\n\n#${label}`;

  // A trailing line can still be inside an unclosed opaque Markdown context
  // (for example, a fenced code block). If so, place the managed label before
  // the body where it remains a real Markdown tag without rewriting user text.
  return hasNoteLabel(candidate, label) ? candidate : `#${label}\n\n${trimmed}`;
};

const isHorizontalWhitespace = (value: string | undefined): boolean => value === " " || value === "\t";

const removeLabelFromBody = (content: string, label: string): string => {
  const matches = findRecognizedLabelMatches(content, label);
  let next = content;

  // Work right-to-left so source offsets from the original body remain valid.
  for (const match of matches.toReversed()) {
    let from = match.from;
    let to = match.to;
    let replacement = "";
    const before = next[from - 1];
    const after = next[to];

    if (isHorizontalWhitespace(before) && isHorizontalWhitespace(after)) {
      from--;
      replacement = " ";
    } else if (isHorizontalWhitespace(before)) {
      from--;
    } else if (isHorizontalWhitespace(after)) {
      while (to < next.length && isHorizontalWhitespace(next[to])) to++;
    }

    next = `${next.slice(0, from)}${replacement}${next.slice(to)}`;
  }

  return next.trimEnd();
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
