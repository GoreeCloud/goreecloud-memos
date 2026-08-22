import { describe, expect, it } from "vitest";
import {
  getNoteTrashedAt,
  NOTE_TRASH_RETENTION_DAYS,
  setNoteTrashed,
  stripNoteTrashMetadata,
} from "../src/utils/noteTrash";

describe("GoreeCloud Trash retention metadata", () => {
  it("stamps newly trashed memos with an explicit retention timestamp", () => {
    const trashedAt = new Date("2026-08-21T20:00:00.000Z");
    const content = setNoteTrashed("Quick memo", "normal", trashedAt);

    expect(content).toContain("<!-- goreecloud-note-trash: normal -->");
    expect(content).toContain("<!-- goreecloud-note-trash-at: 2026-08-21T20:00:00.000Z -->");
    expect(getNoteTrashedAt(content)?.toISOString()).toBe(trashedAt.toISOString());
    expect(NOTE_TRASH_RETENTION_DAYS).toBe(30);
  });

  it("preserves the original retention clock while a memo remains in Trash", () => {
    const firstTrash = setNoteTrashed("Quick memo", "archived", new Date("2026-08-01T12:00:00.000Z"));
    const repeatedTrash = setNoteTrashed(firstTrash, "archived", new Date("2026-08-20T12:00:00.000Z"));

    expect(getNoteTrashedAt(repeatedTrash)?.toISOString()).toBe("2026-08-01T12:00:00.000Z");
  });

  it("removes the retention timestamp when a memo is restored", () => {
    const trashed = setNoteTrashed("Quick memo", "normal", new Date("2026-08-01T12:00:00.000Z"));
    const restored = stripNoteTrashMetadata(trashed);

    expect(restored).toBe("Quick memo");
    expect(getNoteTrashedAt(restored)).toBeUndefined();
  });

  it("starts a fresh retention clock after a restore and later re-trash", () => {
    const firstTrash = setNoteTrashed("Quick memo", "normal", new Date("2026-08-01T12:00:00.000Z"));
    const restored = stripNoteTrashMetadata(firstTrash);
    const secondTrash = setNoteTrashed(restored, "normal", new Date("2026-08-20T12:00:00.000Z"));

    expect(getNoteTrashedAt(secondTrash)?.toISOString()).toBe("2026-08-20T12:00:00.000Z");
  });

  it("fails safe when malformed legacy timestamp metadata is encountered", () => {
    expect(getNoteTrashedAt("Quick memo\n\n<!-- goreecloud-note-trash-at: not-a-date -->")).toBeUndefined();
  });
});
