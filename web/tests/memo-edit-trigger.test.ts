import { describe, expect, it } from "vitest";
import {
  enableDoubleClickEditFromTrigger,
  isMemoEditInteractionTarget,
  memoEditTriggerFromSetting,
  shouldOpenMemoEditor,
} from "../src/components/MemoView/editTrigger";

describe("memo edit trigger", () => {
  it("maps the existing instance boolean to exclusive single and double click modes", () => {
    expect(memoEditTriggerFromSetting(false)).toBe("single");
    expect(memoEditTriggerFromSetting(true)).toBe("double");
    expect(enableDoubleClickEditFromTrigger("single")).toBe(false);
    expect(enableDoubleClickEditFromTrigger("double")).toBe(true);
  });

  it("opens only for the configured pointer gesture", () => {
    const content = document.createElement("span");

    expect(
      shouldOpenMemoEditor({
        readonly: false,
        trigger: "single",
        interaction: "single",
        target: content,
      }),
    ).toBe(true);
    expect(
      shouldOpenMemoEditor({
        readonly: false,
        trigger: "single",
        interaction: "double",
        target: content,
      }),
    ).toBe(false);
    expect(
      shouldOpenMemoEditor({
        readonly: false,
        trigger: "double",
        interaction: "double",
        target: content,
      }),
    ).toBe(true);
  });

  it("never opens the generic editor for readonly content", () => {
    const content = document.createElement("span");

    expect(
      shouldOpenMemoEditor({
        readonly: true,
        trigger: "single",
        interaction: "single",
        target: content,
      }),
    ).toBe(false);
  });

  it("preserves nested interactive controls and media actions", () => {
    const link = document.createElement("a");
    const linkText = document.createElement("span");
    link.append(linkText);

    const button = document.createElement("button");
    const image = document.createElement("img");
    const roleButton = document.createElement("span");
    roleButton.setAttribute("role", "button");

    for (const target of [linkText, button, image, roleButton]) {
      expect(isMemoEditInteractionTarget(target)).toBe(true);
      expect(
        shouldOpenMemoEditor({
          readonly: false,
          trigger: "single",
          interaction: "single",
          target,
        }),
      ).toBe(false);
    }
  });
});
