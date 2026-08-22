import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const indexCss = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
const homePage = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const settingPage = readFileSync(join(process.cwd(), "src/pages/Setting.tsx"), "utf8");
const preferences = readFileSync(join(process.cwd(), "src/components/Settings/PreferencesSection.tsx"), "utf8");
const memberSection = readFileSync(join(process.cwd(), "src/components/Settings/MemberSection.tsx"), "utf8");

describe("GoreeCloud Memos physical mobile visual regression contract", () => {
  it("keeps the Compact sticky app header opaque and isolated from scrolling content", () => {
    expect(indexCss).toContain(".gc-main-shell > header:not(.gc-topbar)");
    expect(indexCss).toContain("isolation: isolate");
    expect(indexCss).toContain("z-index: 50");
    expect(indexCss).toContain("background: var(--background)");
    expect(indexCss).toContain("backdrop-filter: none");
    expect(indexCss).toContain("-webkit-backdrop-filter: none");
  });

  it("keeps the Home capture surface eligible for two compact masonry columns on representative phones", () => {
    expect(homePage).toContain("const HOME_MASONRY_MIN_COLUMN_WIDTH = 168;");
    expect(homePage).toContain("minColumnWidth={HOME_MASONRY_MIN_COLUMN_WIDTH}");
    expect(homePage).toContain("preferMultiColumn");
    expect(homePage).toContain("leadingFullWidth");
    expect(homePage).toContain("groupPinned");
  });

  it("avoids double horizontal padding on Compact settings while retaining larger breakpoints", () => {
    expect(settingPage).toContain('className="mx-auto w-full max-w-4xl px-0 pb-12 pt-4 sm:px-6 md:pt-8"');
  });

  it("uses Memos terminology for English preference defaults", () => {
    expect(preferences).toContain('"Memo defaults"');
    expect(preferences).toContain('"Set the defaults used when creating new memos."');
    expect(preferences).toContain('"Default memo visibility"');
    expect(preferences).toContain('"Visibility applied to newly created memos unless changed in the editor."');
    expect(preferences).not.toContain('"Note defaults"');
    expect(preferences).not.toContain('"Default note visibility"');
  });

  it("uses stacked member cards on Compact screens and keeps the table for larger viewports", () => {
    expect(memberSection).toContain('className="gc-member-mobile-list grid gap-3 md:hidden"');
    expect(memberSection).toContain('className="gc-member-desktop-table hidden md:block"');
    expect(memberSection).toContain('className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"');
    expect(memberSection).toContain('className="flex min-w-0 items-start justify-between gap-3"');
    expect(memberSection).toContain('className="mt-4 min-w-0 border-t border-border/60 pt-4"');
  });
});
