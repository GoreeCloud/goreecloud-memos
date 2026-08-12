import { describe, expect, it } from "vitest";
import { composeNoteContent, splitNoteTitle } from "./noteTitle";

describe("GoreeCloud note title helpers", () => {
  it("leaves an untitled Markdown note unchanged", () => {
    expect(splitNoteTitle("Body text\n\n- item")).toEqual({
      title: "",
      body: "Body text\n\n- item",
      hasTitle: false,
    });
  });

  it("extracts a leading H1 as the note title", () => {
    expect(splitNoteTitle("# Grocery list\n\nMilk\nEggs")).toEqual({
      title: "Grocery list",
      body: "Milk\nEggs",
      hasTitle: true,
    });
  });

  it("composes a title and body as ordinary Markdown", () => {
    expect(composeNoteContent("Grocery list", "Milk\nEggs")).toBe("# Grocery list\n\nMilk\nEggs");
  });

  it("keeps the body when the title is cleared", () => {
    expect(composeNoteContent("", "Milk\nEggs")).toBe("Milk\nEggs");
  });

  it("normalizes whitespace in the title without changing the body", () => {
    expect(composeNoteContent("  Trip   ideas  ", "## Alabama\nVisit Birmingham")).toBe("# Trip ideas\n\n## Alabama\nVisit Birmingham");
  });
});
