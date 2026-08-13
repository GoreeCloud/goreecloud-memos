import { describe, expect, it } from "vitest";
import { getNoteColor, setNoteColor } from "./noteColor";
import { addNoteLabel, hasNoteLabel, normalizeNoteLabel, removeNoteLabel, setNoteLabelEnabled } from "./noteLabels";
import { getNoteTrashOrigin, setNoteTrashed } from "./noteTrash";

describe("GoreeCloud note labels", () => {
  it("normalizes a user-facing label name", () => {
    expect(normalizeNoteLabel(" #validation ")).toBe("validation");
    expect(normalizeNoteLabel("two words")).toBe("");
  });

  it("adds the first label as a trailing Markdown tag", () => {
    expect(addNoteLabel("Release candidate note.", "validation")).toBe("Release candidate note.\n\n#validation");
  });

  it("groups additional labels on the trailing label line", () => {
    expect(addNoteLabel("Release candidate note.\n\n#validation", "family")).toBe("Release candidate note.\n\n#validation #family");
  });

  it("does not duplicate a label that is already present", () => {
    const content = "Release candidate note.\n\n#validation";
    expect(addNoteLabel(content, "validation")).toBe(content);
    expect(hasNoteLabel(content, "validation")).toBe(true);
  });

  it("removes only the selected label token", () => {
    expect(removeNoteLabel("Release candidate note.\n\n#validation #family", "validation")).toBe("Release candidate note.\n\n#family");
  });

  it("preserves unrelated spacing and blank lines when removing a label", () => {
    const content = "Paragraph  with   deliberate spacing.\n\n\n    indented\t\tcontent\n\n#validation #family";
    expect(removeNoteLabel(content, "validation")).toBe(
      "Paragraph  with   deliberate spacing.\n\n\n    indented\t\tcontent\n\n#family",
    );
  });

  it("toggles labels through one helper", () => {
    const labeled = setNoteLabelEnabled("Body", "validation", true);
    expect(hasNoteLabel(labeled, "validation")).toBe(true);
    expect(hasNoteLabel(setNoteLabelEnabled(labeled, "validation", false), "validation")).toBe(false);
  });

  it("preserves a note color marker while adding and removing labels", () => {
    const colored = setNoteColor("Body", "purple");
    const labeled = addNoteLabel(colored, "validation");

    expect(getNoteColor(labeled)).toBe("purple");
    expect(hasNoteLabel(labeled, "validation")).toBe(true);
    expect(labeled.endsWith("<!-- goreecloud-note-color: purple -->")).toBe(true);

    const unlabeled = removeNoteLabel(labeled, "validation");
    expect(getNoteColor(unlabeled)).toBe("purple");
    expect(hasNoteLabel(unlabeled, "validation")).toBe(false);
  });

  it("preserves Trash origin and color when label helpers encounter a trashed note", () => {
    const trashed = setNoteTrashed(setNoteColor("Body", "yellow"), "archived");
    const labeled = addNoteLabel(trashed, "validation");

    expect(getNoteTrashOrigin(labeled)).toBe("archived");
    expect(getNoteColor(labeled)).toBe("yellow");
    expect(hasNoteLabel(labeled, "validation")).toBe(true);
  });
});
