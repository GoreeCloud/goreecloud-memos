import { describe, expect, it } from "vitest";
import { getNoteColor, setNoteColor, stripNoteColorMetadata } from "./noteColor";

describe("GoreeCloud note color metadata", () => {
  it("uses the default color when no metadata marker exists", () => {
    expect(getNoteColor("# Grocery list\n\nMilk")).toBe("default");
  });

  it("adds a portable trailing metadata marker", () => {
    expect(setNoteColor("# Grocery list\n\nMilk", "yellow")).toBe("# Grocery list\n\nMilk\n\n<!-- goreecloud-note-color: yellow -->");
  });

  it("replaces an existing color without stacking markers", () => {
    const yellow = setNoteColor("Body", "yellow");
    expect(setNoteColor(yellow, "blue")).toBe("Body\n\n<!-- goreecloud-note-color: blue -->");
  });

  it("removes the marker when returning to the default color", () => {
    expect(setNoteColor("Body\n\n<!-- goreecloud-note-color: pink -->", "default")).toBe("Body");
  });

  it("strips only GoreeCloud color metadata from the end of a note", () => {
    expect(stripNoteColorMetadata("Body\n\n<!-- goreecloud-note-color: teal -->")).toBe("Body");
    expect(stripNoteColorMetadata("<!-- goreecloud-note-color: teal -->\n\nBody")).toBe("<!-- goreecloud-note-color: teal -->\n\nBody");
  });
});
