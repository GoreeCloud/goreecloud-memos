import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "src/components/AppSidebar/QuickFindDialog.tsx"), "utf8");

describe("GoreeCloud Memos Quick Find scope indicator", () => {
  it("keeps the current search scope visible after the placeholder disappears", () => {
    expect(source).toContain("{scopeLabel}");
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain('title={`${t("common.search")} ${scopeLabel}`}');
    expect(source).toContain("max-w-24 shrink-0 truncate");
  });

  it("keeps the input readable and shrink-safe beside the compact scope indicator", () => {
    expect(source).toContain("h-10 min-w-0 flex-1 border-0");
    expect(source).toContain('placeholder={`${t("common.search")} ${scopeLabel}`}');
    expect(source).toContain('aria-label={`${t("common.search")} ${scopeLabel}`}');
  });

  it("preserves the existing scoped-search filter behavior", () => {
    expect(source).toContain('replaceFiltersByFactor(currentFilters, "contentSearch", contentFilters)');
    expect(source).toContain("if (collectionRoute) {");
    expect(source).toContain("setFilters(nextFilters);");
    expect(source).toContain("setMemoView(undefined);");
  });
});
