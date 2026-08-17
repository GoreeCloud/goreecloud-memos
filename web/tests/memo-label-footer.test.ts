import { describe, expect, it } from "vitest";
import { splitTrailingNoteLabels } from "../src/utils/noteLabels";

describe("memo label footer", () => {
  it("promotes a trailing label-only line out of the clamped body", () => {
    expect(splitTrailingNoteLabels("Long note body\nthat can be clamped.\n\n#Research #Agent")).toEqual({
      body: "Long note body\nthat can be clamped.",
      labels: ["Research", "Agent"],
    });
  });

  it("leaves inline tags in the body", () => {
    const content = "Discuss #Research findings in this paragraph.";
    expect(splitTrailingNoteLabels(content)).toEqual({ body: content, labels: [] });
  });

  it("does not confuse a Markdown title with a label footer", () => {
    const content = "# Build Application\n\nImplementation notes";
    expect(splitTrailingNoteLabels(content)).toEqual({ body: content, labels: [] });
  });

  it("supports a label-only memo", () => {
    expect(splitTrailingNoteLabels("#Task")).toEqual({ body: "", labels: ["Task"] });
  });
});
