import { describe, expect, it } from "vitest";
import { removeNoteLabel } from "@/utils/noteLabels";

describe("GoreeCloud label data integrity", () => {
  it("preserves unrelated Markdown spacing while removing a label", () => {
    const content = "Paragraph  with   deliberate spacing.\n\n\n    indented\t\tcontent\n\n#validation #family";
    expect(removeNoteLabel(content, "validation")).toBe("Paragraph  with   deliberate spacing.\n\n\n    indented\t\tcontent\n\n#family");
  });

  it("preserves fenced and indented content while removing a trailing label", () => {
    const content = "```text\nalpha  beta\n    indented value\n```\n\n#validation #family";
    expect(removeNoteLabel(content, "validation")).toBe("```text\nalpha  beta\n    indented value\n```\n\n#family");
  });
});
