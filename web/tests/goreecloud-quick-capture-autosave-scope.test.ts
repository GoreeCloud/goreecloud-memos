import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");
const editorSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/index.tsx"), "utf8");
const toolbarSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/Toolbar/EditorToolbar.tsx"), "utf8");
const typeSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/types/components.ts"), "utf8");

describe("GoreeCloud Memos quick-capture autosave scope", () => {
  it("opts in only the Home quick-capture composer", () => {
    expect(homePage).toContain("quickCaptureAutoSave");
    expect(typeSource).toContain("quickCaptureAutoSave?: boolean");
    expect(editorSource).toContain("quickCaptureAutoSave = false");
    expect(editorSource).toContain("quickCaptureAutoSave={quickCaptureAutoSave}");
    expect(toolbarSource).toContain("if (memoName || !quickCaptureAutoSave) return;");
  });

  it("anchors outside-click detection to the active editor instance", () => {
    expect(toolbarSource).toContain('const toolbarRef = useRef<HTMLDivElement>(null);');
    expect(toolbarSource).toContain('ref={toolbarRef}');
    expect(toolbarSource).toContain('toolbarRef.current?.closest(".gc-editor-container")');
    expect(toolbarSource).not.toContain('document.querySelector(".gc-editor-container")');
  });

  it("keeps idle save, meaningful draft data, portal guards, and save-in-flight protection", () => {
    expect(toolbarSource).toContain("const QUICK_CAPTURE_IDLE_SAVE_MS = 3000;");
    expect(toolbarSource).toContain("state.content.trim()");
    expect(toolbarSource).toContain("state.metadata.attachments.length > 0");
    expect(toolbarSource).toContain("state.localFiles.length > 0");
    expect(toolbarSource).toContain("state.metadata.relations.length > 0");
    expect(toolbarSource).toContain("state.metadata.location");
    expect(toolbarSource).toContain("state.ui.isLoading.saving");
    expect(toolbarSource).toContain("validationService.canSave(state).valid");
    expect(toolbarSource).toContain("isPortalInteraction(target)");
  });
});
