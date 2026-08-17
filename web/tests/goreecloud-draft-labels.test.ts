import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addNoteLabel, hasNoteLabel } from "@/utils/noteLabels";

const editorSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/index.tsx"), "utf8");
const toolbarSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/Toolbar/EditorToolbar.tsx"), "utf8");
const saveSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/hooks/useMemoSave.ts"), "utf8");

describe("GoreeCloud draft labels", () => {
  it("persists a selected label through the existing portable Markdown tag model", () => {
    const content = addNoteLabel("# Draft title\n\nCapture this quickly.", "Research");
    expect(hasNoteLabel(content, "Research")).toBe(true);
    expect(content).toContain("#Research");
  });

  it("exposes label selection only for new top-level memo drafts", () => {
    expect(editorSource).toContain("const canAssignDraftLabels = !memo && !parentMemoName;");
    expect(editorSource).toContain("onToggleDraftLabel={canAssignDraftLabels ? handleToggleDraftLabel : undefined}");
    expect(toolbarSource).toContain('aria-label={draftLabels.length > 0 ? `Labels, ${draftLabels.length} selected` : "Add labels"}');
    expect(toolbarSource).toContain('aria-label={`Remove ${label} label`}');
  });

  it("applies selected labels before save and clears them only after a successful confirmation", () => {
    expect(editorSource).toContain("draftLabels.reduce((nextContent, label) => addNoteLabel(nextContent, label), content)");
    expect(editorSource).toContain("contentTransform: canAssignDraftLabels && draftLabels.length > 0 ? applyDraftLabels : undefined");
    expect(editorSource).toContain("setDraftLabels([])");
    expect(saveSource).toContain("contentTransform(state.content)");
    expect(saveSource).toContain("onConfirm?.(result.memoName)");
  });
});
