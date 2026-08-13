import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const memoBody = readFileSync(join(process.cwd(), "src/components/MemoView/components/MemoBody.tsx"), "utf8");
const memoActionMenu = readFileSync(join(process.cwd(), "src/components/MemoActionMenu/MemoActionMenu.tsx"), "utf8");

describe("GoreeCloud Notes Trash integrity", () => {
  it("keeps implementation metadata out of rendered top-level note content", () => {
    expect(memoBody).toContain("stripNoteTrashMetadata(stripNoteColorMetadata(memo.content))");
    expect(memoBody).toContain("content={displayContent}");
  });

  it("requires a trashed note to be restored before double-click editing", () => {
    expect(memoBody).toContain("const trashed = !memo.parent && isNoteTrashed(memo.content);");
    expect(memoBody).toContain("const editingDisabled = readonly || trashed;");
    expect(memoBody).toContain("readonly: editingDisabled");
  });

  it("keeps the explicit Trash action menu recovery-only before permanent deletion", () => {
    expect(memoActionMenu).toContain("!readonly && !isArchived && !isTrashed");
    expect(memoActionMenu).toContain("!isComment && isTrashed");
    expect(memoActionMenu).toContain("handleRestoreFromTrash");
    expect(memoActionMenu).toContain('isTrashed ? "Delete permanently"');
  });
});