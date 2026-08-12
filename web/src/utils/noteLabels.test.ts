import { describe, expect, it } from "vitest";
import { addNoteLabel, hasNoteLabel, normalizeNoteLabel, removeNoteLabel, setNoteLabelEnabled } from "./noteLabels";

describe("GoreeCloud note labels", () => {
  it("normalizes a user-facing label name", () => {
    expect(normalizeNoteLabel(" #validation ")).toBe("validation");
    expect(normalizeNoteLabel("two words")).toBe("");
  });

  it("adds the first label as a trailing Markdown tag", () => {
    expect(addNoteLabel("Release candidate note.", "validation")).toBe("Release candidate note.\n\n#validation");
  });

  it("groups additional labels on the trailing label line", () => {
    expect(addNoteLabel("Release candidate note.\n\n#validation", "family")).toBe(
      "Release candidate note.\n\n#validation #family",
    );
  });

  it("does not duplicate a label that is already present", () => {
    const content = "Release candidate note.\n\n#validation";
    expect(addNoteLabel(content, "validation")).toBe(content);
    expect(hasNoteLabel(content, "validation")).toBe(true);
  });

  it("removes only the selected label token", () => {
    expect(removeNoteLabel("Release candidate note.\n\n#validation #family", "validation")).toBe(
      "Release candidate note.\n\n#family",
    );
  });

  it("toggles labels through one helper", () => {
    const labeled = setNoteLabelEnabled("Body", "validation", true);
    expect(hasNoteLabel(labeled, "validation")).toBe(true);
    expect(hasNoteLabel(setNoteLabelEnabled(labeled, "validation", false), "validation")).toBe(false);
  });
});
