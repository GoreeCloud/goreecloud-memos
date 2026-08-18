import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adaptiveCss = readFileSync(join(process.cwd(), "src/themes/goreecloud-glaze-adaptive.css"), "utf8");
const indexCss = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
const settingTable = readFileSync(join(process.cwd(), "src/components/Settings/SettingTable.tsx"), "utf8");
const settingRow = readFileSync(join(process.cwd(), "src/components/Settings/SettingRow.tsx"), "utf8");
const memberSection = readFileSync(join(process.cwd(), "src/components/Settings/MemberSection.tsx"), "utf8");
const editorToolbar = readFileSync(join(process.cwd(), "src/components/MemoEditor/Toolbar/EditorToolbar.tsx"), "utf8");
const homePage = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const memosLogo = readFileSync(join(process.cwd(), "src/components/MemosLogo.tsx"), "utf8");
const switchControl = readFileSync(join(process.cwd(), "src/components/ui/switch.tsx"), "utf8");
const checkboxControl = readFileSync(join(process.cwd(), "src/components/ui/checkbox.tsx"), "utf8");
const radioGroupControl = readFileSync(join(process.cwd(), "src/components/ui/radio-group.tsx"), "utf8");

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
    expect(adaptiveCss).toContain("font-size: 19px");
    expect(adaptiveCss).toContain("--gc-target-min: 2.75rem");
    expect(adaptiveCss).toContain("env(safe-area-inset-top)");
    expect(adaptiveCss).toContain("env(safe-area-inset-bottom)");
    expect(adaptiveCss).toContain("max-height: calc(100dvh");
    expect(adaptiveCss).toContain(".gc-main-shell > header:not(.gc-topbar)");
    expect(adaptiveCss).toContain('[data-slot="sheet-content"] aside :is(a, button, [role="button"])');
    expect(adaptiveCss).toContain(".gc-composer-label");
    expect(memosLogo).toContain("gc-brand-mark");
    expect(memosLogo).toContain("gc-brand-title");
  });

  it("keeps semantic menu choices inside adaptive touch and focus treatment", () => {
    expect(adaptiveCss).toContain('[role="menuitemradio"]');
    expect(adaptiveCss).toContain('[role="menuitemcheckbox"]');
    expect(adaptiveCss).toContain(":focus-visible");
    expect(adaptiveCss).toContain("min-height: var(--gc-target-min)");
  });

  it("keeps semantic select options inside adaptive touch, focus, and forced-color treatment", () => {
    expect(adaptiveCss.match(/\[role="option"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(adaptiveCss.match(/\[data-slot="select-content"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(adaptiveCss).toContain("@media (min-width: 600px) and (max-width: 1023px)");
    expect(adaptiveCss).toContain("@media (forced-colors: active)");
    expect(adaptiveCss).toContain(":focus-visible");
  });

  it("keeps settings switches visually compact while expanding touch and focus treatment", () => {
    expect(switchControl).toContain('data-slot="switch"');
    expect(switchControl).toContain('h-[1.15rem] w-8');
    expect(adaptiveCss.match(/\[data-slot="switch"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(adaptiveCss).toContain("width: var(--gc-target-min)");
    expect(adaptiveCss).toContain("height: var(--gc-target-min)");
    expect(adaptiveCss).toContain("width: 2.625rem");
    expect(adaptiveCss).toContain("height: 2.625rem");
    expect(adaptiveCss).toContain(":focus-visible");
  });

  it("keeps checkbox and radio controls visually compact while expanding touch and focus treatment", () => {
    expect(checkboxControl).toContain('data-slot="checkbox"');
    expect(checkboxControl).toContain("size-4");
    expect(radioGroupControl).toContain('data-slot="radio-group-item"');
    expect(radioGroupControl).toContain("size-4");
    expect(adaptiveCss.match(/\[data-slot="checkbox"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(adaptiveCss.match(/\[data-slot="radio-group-item"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(adaptiveCss).toContain("width: var(--gc-target-min)");
    expect(adaptiveCss).toContain("height: var(--gc-target-min)");
    expect(adaptiveCss).toContain("width: 2.625rem");
    expect(adaptiveCss).toContain("height: 2.625rem");
    expect(adaptiveCss).toContain("@media (forced-colors: active)");
    expect(adaptiveCss).toContain(":focus-visible");
  });

  it("keeps settings help tooltips keyboard-focusable, touch-sized, labeled, and viewport-safe", () => {
    expect(settingRow).toContain('import { Button } from "@/components/ui/button"');
    expect(settingRow).toContain('type="button"');
    expect(settingRow).toContain('className="gc-setting-help size-11 rounded-full text-muted-foreground md:size-8"');
    expect(settingRow).toContain("aria-label={tooltipLabel}");
    expect(settingRow).toContain('<HelpCircleIcon className="size-4" aria-hidden />');
    expect(settingRow).toContain('className="gc-setting-help-tooltip max-w-[calc(100vw-2rem)]"');
  });

  it("starts Home quick capture as a clean transient draft", () => {
    expect(homePage).toContain('placeholder="Take a note…"');
    expect(homePage).toContain("onCancel={() => setComposerOpen(false)}");
    expect(homePage).not.toContain('cacheKey="home-memo-editor"');
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
