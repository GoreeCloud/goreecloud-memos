import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const memoBody = readFileSync(join(process.cwd(), "src/components/MemoView/components/MemoBody.tsx"), "utf8");

describe("GoreeCloud Notes state-view integrity", () => {
  it("keeps internal state metadata out of rendered top-level note content", () => {
    expect(memoBody).toContain("stripNoteTrashMetadata(stripNoteColorMetadata(memo.content))");
    expect(memoBody).toContain("content={displayContent}");
  });

  it("requires state-view notes to be restored before double-click editing", () => {
    expect(memoBody).toContain("const archived = memo.state === State.ARCHIVED;");
    expect(memoBody).toContain("const trashed = !memo.parent && isNoteTrashed(memo.content);");
    expect(memoBody).toContain("const editingDisabled = readonly || archived || trashed;");
    expect(memoBody).toContain("readonly: editingDisabled");
  });
});