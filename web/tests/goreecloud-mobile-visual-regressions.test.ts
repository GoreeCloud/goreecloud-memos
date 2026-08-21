import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const indexCss = readFileSync(join(process.cwd(), "src/index.css"), "utf8");
const settingPage = readFileSync(join(process.cwd(), "src/pages/Setting.tsx"), "utf8");
const preferences = readFileSync(join(process.cwd(), "src/components/Settings/PreferencesSection.tsx"), "utf8");

describe("GoreeCloud Memos physical mobile visual regression contract", () => {
  it("keeps the Compact sticky app header opaque and isolated from scrolling content", () => {
    expect(indexCss).toContain(".gc-main-shell > header:not(.gc-topbar)");
    expect(indexCss).toContain("isolation: isolate");
    expect(indexCss).toContain("z-index: 50");
    expect(indexCss).toContain("background: var(--background)");
    expect(indexCss).toContain("backdrop-filter: none");
    expect(indexCss).toContain("-webkit-backdrop-filter: none");
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
});
