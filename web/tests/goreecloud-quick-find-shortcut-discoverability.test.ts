import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sidebarSource = readFileSync(join(process.cwd(), "src/components/AppSidebar/GoreeCloudSidebar.tsx"), "utf8");
const quickFindSource = readFileSync(join(process.cwd(), "src/components/AppSidebar/QuickFindDialog.tsx"), "utf8");

describe("GoreeCloud Memos Quick Find shortcut discoverability", () => {
  it("publishes the existing Ctrl/Cmd+K shortcut through search-control accessibility metadata", () => {
    expect(sidebarSource).toContain('const QUICK_FIND_KEY_SHORTCUTS = "Control+K Meta+K";');
    expect(sidebarSource.match(/aria-keyshortcuts=\{QUICK_FIND_KEY_SHORTCUTS\}/g)).toHaveLength(2);
  });

  it("surfaces a visible hover hint without replacing the concise accessible search label", () => {
    expect(sidebarSource).toContain('const QUICK_FIND_SHORTCUT_HINT = "Ctrl/Cmd + K";');
    expect(sidebarSource).toContain("const QUICK_FIND_TOOLTIP = `Search memos (${QUICK_FIND_SHORTCUT_HINT})`;");
    expect(sidebarSource.match(/title=\{QUICK_FIND_TOOLTIP\}/g)).toHaveLength(2);
    expect(sidebarSource.match(/aria-label="Search memos"/g)).toHaveLength(2);
  });

  it("keeps both search controls wired to the existing Quick Find dialog", () => {
    expect(sidebarSource.match(/setQuickFindOpen\(true\)/g).length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the published shortcut aligned with the existing global keyboard handler", () => {
    expect(quickFindSource).toContain('(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"');
    expect(quickFindSource).toContain("event.preventDefault();");
    expect(quickFindSource).toContain("setQuickFindOpen(true);");
  });
});
