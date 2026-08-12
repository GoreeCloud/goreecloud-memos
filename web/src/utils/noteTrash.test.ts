import { describe, expect, it } from "vitest";
import { getNoteColor, setNoteColor } from "./noteColor";
import { getNoteTrashOrigin, isNoteTrashed, setNoteTrashed, stripNoteTrashMetadata, withTrashFilter } from "./noteTrash";

describe("GoreeCloud note Trash metadata", () => {
  it("marks a normal note as trashed", () => {
    const content = setNoteTrashed("# Grocery list\n\nMilk", "normal");
    expect(content).toBe("# Grocery list\n\nMilk\n\n<!-- goreecloud-note-trash: normal -->");
    expect(getNoteTrashOrigin(content)).toBe("normal");
    expect(isNoteTrashed(content)).toBe(true);
  });

  it("preserves note color while adding and removing Trash metadata", () => {
    const colored = setNoteColor("Body", "yellow");
    const trashed = setNoteTrashed(colored, "archived");

    expect(trashed).toBe("Body\n\n<!-- goreecloud-note-trash: archived -->\n\n<!-- goreecloud-note-color: yellow -->");
    expect(getNoteColor(trashed)).toBe("yellow");
    expect(stripNoteTrashMetadata(trashed)).toBe("Body\n\n<!-- goreecloud-note-color: yellow -->");
  });

  it("replaces an existing Trash marker without stacking markers", () => {
    const trashed = setNoteTrashed("Body", "normal");
    expect(setNoteTrashed(trashed, "archived")).toBe("Body\n\n<!-- goreecloud-note-trash: archived -->");
  });

  it("builds server-side filters for normal and Trash views", () => {
    expect(withTrashFilter(undefined, false)).toBe('!content.contains("<!-- goreecloud-note-trash:")');
    expect(withTrashFilter("pinned", true)).toBe('(pinned) && content.contains("<!-- goreecloud-note-trash:")');
  });
});
