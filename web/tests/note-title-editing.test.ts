import { describe, expect, it } from "vitest";
import { composeNoteContent, splitNoteTitle } from "../src/components/MemoEditor/utils/noteTitle";

describe("note title editing", () => {
  it("preserves a just-typed trailing space so a second word can be entered", () => {
    const afterSpace = composeNoteContent("Build ", "Body text");

    expect(afterSpace).toBe("# Build \n\nBody text");
    expect(splitNoteTitle(afterSpace)).toEqual({
      title: "Build ",
      body: "Body text",
      hasTitle: true,
    });

    const afterNextWord = composeNoteContent(`${splitNoteTitle(afterSpace).title}Application`, "Body text");
    expect(splitNoteTitle(afterNextWord).title).toBe("Build Application");
  });

  it("keeps ordinary internal title spacing and preserves the body", () => {
    const content = composeNoteContent("Export Change Logs", "Keep this body unchanged.");

    expect(splitNoteTitle(content)).toEqual({
      title: "Export Change Logs",
      body: "Keep this body unchanged.",
      hasTitle: true,
    });
  });

  it("does not create a Markdown heading for a whitespace-only title", () => {
    expect(composeNoteContent("   ", "Body only")).toBe("Body only");
  });
});
