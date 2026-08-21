import { splitNoteTitle } from "@/components/MemoEditor/utils/noteTitle";
import { stripNoteColorMetadata } from "./noteColor";
import { splitTrailingNoteLabels } from "./noteLabels";
import { stripNoteTrashMetadata } from "./noteTrash";

/**
 * Remove GoreeCloud-only state markers while preserving the user-authored
 * Markdown document. This is the legacy/full memo copy representation.
 */
export const getEntireMemoCopyContent = (content: string): string =>
  stripNoteColorMetadata(stripNoteTrashMetadata(content));

/**
 * Return only the user-authored memo body for clipboard copy.
 *
 * GoreeCloud Memos stores the optional title as a leading Markdown H1 and
 * managed labels as a trailing label-only line. Neither belongs in the common
 * "copy body" result. Ordinary Markdown, including inline tags authored inside
 * the body, is intentionally preserved.
 */
export const getMemoBodyCopyContent = (content: string): string => {
  const cleanContent = getEntireMemoCopyContent(content);
  const { body: contentWithoutTitle } = splitNoteTitle(cleanContent);
  const { body } = splitTrailingNoteLabels(contentWithoutTitle);
  return body;
};
