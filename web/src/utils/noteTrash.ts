import { getNoteColor, setNoteColor, stripNoteColorMetadata } from "./noteColor";

export const NOTE_TRASH_FILTER_TOKEN = "<!-- goreecloud-note-trash:";
export const NOTE_TRASH_RETENTION_DAYS = 30;

export type NoteTrashOrigin = "normal" | "archived";

const NOTE_TRASH_PATTERN = /\n*<!--\s*goreecloud-note-trash:\s*(normal|archived)\s*-->/i;
const NOTE_TRASHED_AT_PATTERN = /\n*<!--\s*goreecloud-note-trash-at:\s*([^>]+?)\s*-->/i;

export function getNoteTrashOrigin(content: string): NoteTrashOrigin | undefined {
  const match = content.match(NOTE_TRASH_PATTERN);
  const origin = match?.[1]?.toLowerCase();
  return origin === "normal" || origin === "archived" ? origin : undefined;
}

export function getNoteTrashedAt(content: string): Date | undefined {
  const rawValue = content.match(NOTE_TRASHED_AT_PATTERN)?.[1]?.trim();
  if (!rawValue) return undefined;

  const trashedAt = new Date(rawValue);
  return Number.isNaN(trashedAt.getTime()) ? undefined : trashedAt;
}

export function isNoteTrashed(content: string): boolean {
  return getNoteTrashOrigin(content) !== undefined;
}

export function stripNoteTrashMetadata(content: string): string {
  return content.replace(NOTE_TRASHED_AT_PATTERN, "").replace(NOTE_TRASH_PATTERN, "").trimEnd();
}

export function setNoteTrashed(content: string, origin: NoteTrashOrigin, trashedAt = new Date()): string {
  const color = getNoteColor(content);
  const existingTrashedAt = getNoteTrashedAt(content);
  const baseContent = stripNoteTrashMetadata(stripNoteColorMetadata(content));
  const marker = `<!-- goreecloud-note-trash: ${origin} -->`;
  const timestampMarker = `<!-- goreecloud-note-trash-at: ${(existingTrashedAt ?? trashedAt).toISOString()} -->`;
  const trashMetadata = `${marker}\n${timestampMarker}`;
  const trashedContent = baseContent ? `${baseContent}\n\n${trashMetadata}` : trashMetadata;
  return setNoteColor(trashedContent, color);
}

export function withTrashFilter(filter: string | undefined, includeTrashed: boolean): string {
  const token = JSON.stringify(NOTE_TRASH_FILTER_TOKEN);
  const trashCondition = includeTrashed ? `content.contains(${token})` : `!content.contains(${token})`;
  return filter ? `(${filter}) && ${trashCondition}` : trashCondition;
}
