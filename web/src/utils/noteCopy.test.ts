import { describe, expect, it } from "vitest";
import { getEntireMemoCopyContent, getMemoBodyCopyContent } from "./noteCopy";

describe("GoreeCloud memo clipboard copy helpers", () => {
  it("copies only the body when a memo has a title and managed labels", () => {
    const content =
      "# NetBird via Terminal\n\nhow can i see all of my netbird peers, groups, and access policies via the terminal?\n\n#Research #Tool";

    expect(getMemoBodyCopyContent(content)).toBe("how can i see all of my netbird peers, groups, and access policies via the terminal?");
  });

  it("preserves ordinary Markdown and inline tags inside the body", () => {
    const content = "# Research note\n\nUse #netbird in this paragraph.\n\n- peer one\n- peer two\n\n#Research";

    expect(getMemoBodyCopyContent(content)).toBe("Use #netbird in this paragraph.\n\n- peer one\n- peer two");
  });

  it("removes hidden GoreeCloud state metadata from body-only copy", () => {
    const content =
      "# Archived thought\n\nBody text\n\n#Document\n\n<!-- goreecloud-note-trash: archived -->\n\n<!-- goreecloud-note-color: blue -->";

    expect(getMemoBodyCopyContent(content)).toBe("Body text");
  });

  it("keeps title, body, and labels for the explicit entire-memo copy", () => {
    const content = "# Full memo\n\nBody text\n\n#Agent\n\n<!-- goreecloud-note-color: green -->";

    expect(getEntireMemoCopyContent(content)).toBe("# Full memo\n\nBody text\n\n#Agent");
  });

  it("copies an untitled and unlabeled memo unchanged", () => {
    expect(getMemoBodyCopyContent("Just the body\n\nSecond paragraph")).toBe("Just the body\n\nSecond paragraph");
  });
});
