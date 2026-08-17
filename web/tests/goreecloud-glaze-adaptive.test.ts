import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adaptiveCss = readFileSync(join(process.cwd(), "src/themes/goreecloud-glaze-adaptive.css"), "utf8");
const indexCss = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
const settingTable = readFileSync(join(process.cwd(), "src/components/Settings/SettingTable.tsx"), "utf8");
const memberSection = readFileSync(join(process.cwd(), "src/components/Settings/MemberSection.tsx"), "utf8");
const editorToolbar = readFileSync(join(process.cwd(), "src/components/MemoEditor/Toolbar/EditorToolbar.tsx"), "utf8");

describe("GoreeCloud Memos Glaze UI adaptive contract", () => {
  it("loads the adaptive layer after the existing Glaze layers", () => {
    const baseIndex = indexCss.indexOf('./themes/goreecloud-glaze.css');
    const polishIndex = indexCss.indexOf('./themes/goreecloud-glaze-polish.css');
    const adaptiveIndex = indexCss.indexOf('./themes/goreecloud-glaze-adaptive.css');

    expect(baseIndex).toBeGreaterThanOrEqual(0);
    expect(polishIndex).toBeGreaterThan(baseIndex);
    expect(adaptiveIndex).toBeGreaterThan(polishIndex);
  });

  it("defines the official Compact, Medium, Expanded, and Wide ranges", () => {
    expect(adaptiveCss).toContain("@media (max-width: 599px)");
    expect(adaptiveCss).toContain("@media (min-width: 600px) and (max-width: 1023px)");
    expect(adaptiveCss).toContain("@media (min-width: 1024px) and (max-width: 1439px)");
    expect(adaptiveCss).toContain("@media (min-width: 1440px)");
  });

  it("keeps compact controls readable, touch-sized, and safe-area aware", () => {
    expect(adaptiveCss).toContain("font-size: 17px");
    expect(adaptiveCss).toContain("--gc-target-min: 2.75rem");
    expect(adaptiveCss).toContain("env(safe-area-inset-top)");
    expect(adaptiveCss).toContain("env(safe-area-inset-bottom)");
    expect(adaptiveCss).toContain("max-height: calc(100dvh");
  });

  it("provides accessibility and resilience fallbacks", () => {
    expect(adaptiveCss).toContain("@media (prefers-contrast: more)");
    expect(adaptiveCss).toContain("@media (forced-colors: active)");
    expect(adaptiveCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(adaptiveCss).toContain("--gc-focus-color");
  });

  it("transforms settings tables into compact cards instead of horizontal scrolling", () => {
    expect(settingTable).toContain('className="gc-setting-table-compact"');
    expect(settingTable).toContain('className="gc-setting-table-expanded');
    expect(settingTable).toContain("gc-setting-table-card");
    expect(memberSection).toContain("gc-member-identity");
    expect(memberSection).toContain("gc-member-summary");
  });

  it("keeps draft-label and save controls attached to the compact editor toolbar", () => {
    expect(editorToolbar).toContain("gc-editor-toolbar");
    expect(editorToolbar).toContain("gc-editor-toolbar-actions");
    expect(editorToolbar).toContain("Add labels");
  });
});
