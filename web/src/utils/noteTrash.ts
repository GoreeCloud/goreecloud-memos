import { getNoteColor, setNoteColor, stripNoteColorMetadata } from "./noteColor";

export const NOTE_TRASH_FILTER_TOKEN = "<!-- goreecloud-note-trash:";

export type NoteTrashOrigin = "normal" | "archived";

const NOTE_TRASH_PATTERN = /\n*<!--\s*goreecloud-note-trash:\s*(normal|archived)\s*-->/i;

export function getNoteTrashOrigin(content: string): NoteTrashOrigin | undefined {
  const match = content.match(NOTE_TRASH_PATTERN);
  const origin = match?.[1]?.toLowerCase();
  return origin === "normal" || origin === "archived" ? origin : undefined;
}

export function isNoteTrashed(content: string): boolean {
  return getNoteTrashOrigin(content) !== undefined;
}

export function stripNoteTrashMetadata(content: string): string {
  return content.replace(NOTE_TRASH_PATTERN, "").trimEnd();
}

export function setNoteTrashed(content: string, origin: NoteTrashOrigin): string {
  const color = getNoteColor(content);
  const baseContent = stripNoteTrashMetadata(stripNoteColorMetadata(content));
  const marker = `<!-- goreecloud-note-trash: ${origin} -->`;
  const trashedContent = baseContent ? `${baseContent}\n\n${marker}` : marker;
  return setNoteColor(trashedContent, color);
}

export function withTrashFilter(filter: string | undefined, includeTrashed: boolean): string {
  const token = JSON.stringify(NOTE_TRASH_FILTER_TOKEN);
  const trashCondition = includeTrashed ? `content.contains(${token})` : `!content.contains(${token})`;
  return filter ? `(${filter}) && ${trashCondition}` : trashCondition;
}
