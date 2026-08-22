import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const toolbarSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/Toolbar/EditorToolbar.tsx"), "utf8");
const extensionSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/Editor/extensions.ts"), "utf8");

describe("GoreeCloud Memos save shortcut discoverability", () => {
  it("publishes both supported save shortcuts through accessibility metadata", () => {
    expect(toolbarSource).toContain('const SAVE_KEY_SHORTCUTS = "Control+Enter Meta+Enter";');
    expect(toolbarSource).toContain("aria-keyshortcuts={SAVE_KEY_SHORTCUTS}");
  });

  it("shows a desktop shortcut affordance only while the normal save action is available", () => {
    expect(toolbarSource).toContain('const SAVE_SHORTCUT_HINT = "Ctrl/Cmd + Enter";');
    expect(toolbarSource).toContain("{!isSaving && (");
    expect(toolbarSource).toContain('className="hidden whitespace-nowrap text-xs text-muted-foreground md:inline"');
    expect(toolbarSource).toContain("{SAVE_SHORTCUT_HINT}");
  });

  it("keeps blocked-save validation messaging ahead of shortcut discoverability", () => {
    expect(toolbarSource).toContain("!valid && !isSaving && blockedMessage");
    expect(toolbarSource).toContain('<TooltipContent side="top">{blockedMessage}</TooltipContent>');
    expect(toolbarSource).not.toContain("<TooltipContent side=\"top\">{SAVE_SHORTCUT_HINT}</TooltipContent>");
  });

  it("keeps Ctrl+Enter and Cmd+Enter bound to the existing submit path ahead of CodeMirror defaults", () => {
    const metaIndex = extensionSource.indexOf('{ key: "Meta-Enter", run: submit }');
    const ctrlIndex = extensionSource.indexOf('{ key: "Ctrl-Enter", run: submit }');
    const keymapIndex = extensionSource.indexOf("keymap.of([...submitKeys, ...editorKeys, indentWithTab, ...defaultKeymap, ...historyKeymap])");

    expect(metaIndex).toBeGreaterThan(-1);
    expect(ctrlIndex).toBeGreaterThan(-1);
    expect(keymapIndex).toBeGreaterThan(ctrlIndex);
  });
});
