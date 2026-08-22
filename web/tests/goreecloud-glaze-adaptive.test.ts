import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adaptiveCss = readFileSync(join(process.cwd(), "src/themes/goreecloud-glaze-adaptive.css"), "utf8");
const indexCss = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
const settingTable = readFileSync(join(process.cwd(), "src/components/Settings/SettingTable.tsx"), "utf8");
const settingRow = readFileSync(join(process.cwd(), "src/components/Settings/SettingRow.tsx"), "utf8");
const memberSection = readFileSync(join(process.cwd(), "src/components/Settings/MemberSection.tsx"), "utf8");
const editorToolbar = readFileSync(join(process.cwd(), "src/components/MemoEditor/Toolbar/EditorToolbar.tsx"), "utf8");
const memoEditor = readFileSync(join(process.cwd(), "src/components/MemoEditor/index.tsx"), "utf8");
const memoContent = readFileSync(join(process.cwd(), "src/components/MemoContent/index.tsx"), "utf8");
const memoCardConstants = readFileSync(join(process.cwd(), "src/components/MemoView/constants.ts"), "utf8");
const memoHeader = readFileSync(join(process.cwd(), "src/components/MemoView/components/MemoHeader.tsx"), "utf8");
const homePage = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const aboutPage = readFileSync(join(process.cwd(), "src/pages/About.tsx"), "utf8");
const authPageLayout = readFileSync(join(process.cwd(), "src/components/AuthPageLayout.tsx"), "utf8");
const memosLogo = readFileSync(join(process.cwd(), "src/components/MemosLogo.tsx"), "utf8");
const switchControl = readFileSync(join(process.cwd(), "src/components/ui/switch.tsx"), "utf8");
const checkboxControl = readFileSync(join(process.cwd(), "src/components/ui/checkbox.tsx"), "utf8");
const radioGroupControl = readFileSync(join(process.cwd(), "src/components/ui/radio-group.tsx"), "utf8");
const tabsControl = readFileSync(join(process.cwd(), "src/components/ui/tabs.tsx"), "utf8");
const dialogControl = readFileSync(join(process.cwd(), "src/components/ui/dialog.tsx"), "utf8");
const sheetControl = readFileSync(join(process.cwd(), "src/components/ui/sheet.tsx"), "utf8");

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
    expect(adaptiveCss).toContain("font-size: 20px");
    expect(indexCss).toContain("font-size: 20px");
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

  it("keeps compact reading density deliberate without shrinking interaction targets", () => {
    expect(homePage).toContain("max-[599px]:!text-[1.45rem]");
    expect(homePage).toContain("max-[599px]:!text-[0.95rem]");
    expect(homePage).toContain("max-[599px]:!min-h-[3.25rem]");
    expect(memoContent).toContain("max-[599px]:text-[0.98rem]");
    expect(memoContent).toContain("max-[599px]:[&>h1:first-child]:text-[1.15rem]");
    expect(memoCardConstants).toContain("px-3 py-3");
    expect(memoCardConstants).toContain("sm:px-4");
    expect(memoEditor).toContain("max-[599px]:px-3");
    expect(memoEditor).toContain("max-[599px]:gap-1.5");
    expect(editorToolbar).toContain("max-[599px]:!border-border/80");
    expect(aboutPage).toContain("max-[599px]:!p-4");
    expect(aboutPage).toContain("max-[599px]:!text-[1.2rem]");
    expect(authPageLayout).toContain("max-[599px]:pt-[clamp(1.5rem,7dvh,4rem)]");
    expect(authPageLayout).toContain("gc-auth-card");
    expect(adaptiveCss).toContain("--gc-target-min: 2.75rem");
    expect(adaptiveCss).toContain("font-size: 0.98rem");
    expect(adaptiveCss).toContain("font-size: 0.88rem");
  });

  it("keeps compact memo metadata and editor actions reachable without hover or a fixed keyboard viewport", () => {
    expect(memoHeader).toContain('type="button"');
    expect(memoHeader).toContain("aria-label={visibilityLabel}");
    expect(memoHeader).toContain("size-11");
    expect(memoHeader).toContain("min-h-11");
    expect(memoHeader).toContain("md:min-h-0");
    expect(memoEditor).toContain("gc-editor-container");
    expect(memoEditor).toContain("max-[599px]:scroll-mt-[calc(4.5rem+env(safe-area-inset-top))]");
    expect(memoEditor).toContain("max-[599px]:scroll-mb-[calc(7rem+env(safe-area-inset-bottom))]");
    expect(editorToolbar).toContain("max-[599px]:sticky");
    expect(editorToolbar).toContain("max-[599px]:bottom-[max(0.25rem,env(safe-area-inset-bottom))]");
    expect(authPageLayout).toContain("min-h-dvh");
    expect(authPageLayout).toContain("overflow-y-auto");
    expect(authPageLayout).toContain("overscroll-y-contain");
    expect(authPageLayout).toContain("sm:min-h-svh");
  });

  it("keeps semantic menu choices inside adaptive touch and focus treatment", () => {
    expect(adaptiveCss).toContain('[role="menuitemradio"]');
    expect(adaptiveCss).toContain('[role="menuitemcheckbox"]');
    expect(adaptiveCss).toContain(":focus-visible");
    expect(adaptiveCss).toContain("min-height: var(--gc-target-min)");
  });

  it("keeps semantic select options inside adaptive touch, focus, and forced-color treatment", () => {
    expect(adaptiveCss.match(/\[role="option"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(adaptiveCss.match(/\[data-slot="select-content"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
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

  it("keeps portaled overlays inside the adaptive resilience contract", () => {
    expect(dialogControl).toContain('data-slot="dialog-content"');
    expect(dialogControl).toContain('data-slot="dialog-close"');
    expect(sheetControl).toContain('data-slot="sheet-content"');
    expect(sheetControl).toContain("<SheetClose");
    expect(adaptiveCss.match(/\[data-slot="dialog-content"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
    expect(adaptiveCss.match(/\[data-slot="sheet-content"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(10);
    expect(adaptiveCss.match(/\[data-slot="dropdown-menu-content"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
    expect(adaptiveCss.match(/\[data-slot="popover-content"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
    expect(adaptiveCss.match(/\[data-slot="tooltip-content"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    expect(adaptiveCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(adaptiveCss).toContain("@media (forced-colors: active)");
  });

  it("gives shared tabs roving keyboard semantics and adaptive target treatment", () => {
    expect(tabsControl).toContain('role="tablist"');
    expect(tabsControl).toContain('aria-orientation="horizontal"');
    expect(tabsControl).toContain('data-slot="tabs-list"');
    expect(tabsControl).toContain('data-slot="tabs-trigger"');
    expect(tabsControl).toContain('data-state={active ? "active" : "inactive"}');
    expect(tabsControl).toContain('tabIndex={active ? 0 : -1}');
    expect(tabsControl).toContain('"ArrowLeft"');
    expect(tabsControl).toContain('"ArrowRight"');
    expect(tabsControl).toContain('"Home"');
    expect(tabsControl).toContain('"End"');
    expect(tabsControl).toContain("window.getComputedStyle(tabList).direction");
    expect(tabsControl).toContain("nextTab.focus()");
    expect(tabsControl).toContain("nextTab.click()");
    expect(adaptiveCss.match(/\[role="tab"\]/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(adaptiveCss).toContain('[data-slot="tabs-list"]');
    expect(adaptiveCss).toContain('[data-slot="tabs-trigger"][data-state="active"]');
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
