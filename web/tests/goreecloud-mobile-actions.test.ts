import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cardActions = readFileSync(join(process.cwd(), "src/components/MemoView/components/GoreeCloudCardActions.tsx"), "utf8");
const memoActionMenu = readFileSync(join(process.cwd(), "src/components/MemoActionMenu/MemoActionMenu.tsx"), "utf8");
const memoHeader = readFileSync(join(process.cwd(), "src/components/MemoView/components/MemoHeader.tsx"), "utf8");
const noteTag = readFileSync(join(process.cwd(), "src/components/MemoContent/Tag.tsx"), "utf8");

describe("GoreeCloud Notes mobile note actions", () => {
  it("keeps primary card actions touch-sized on small screens", () => {
    expect(cardActions).toContain('"size-11 rounded-full');
    expect(cardActions).toContain('md:size-8";');
    expect(cardActions).toContain('className="min-h-11 rounded-full');
  });

  it("keeps the overflow menu trigger touch-sized on small screens", () => {
    expect(memoActionMenu).toContain('className="size-11 md:size-4"');
    expect(memoActionMenu).toContain('aria-label="More note actions"');
  });

  it("keeps pinned-note unpin as a real focusable button", () => {
    expect(memoHeader).toContain("<button");
    expect(memoHeader).toContain('className="flex size-11 items-center justify-center');
    expect(memoHeader).toContain('aria-label={t("common.unpin")}');
    expect(memoHeader).toContain("onClick={unpinMemo}");
  });

  it("keeps note label chips touch-sized and keyboard operable", () => {
    expect(noteTag).toContain('"min-h-11 cursor-pointer touch-manipulation');
    expect(noteTag).toContain('role="button"');
    expect(noteTag).toContain("tabIndex={0}");
    expect(noteTag).toContain('event.key === "Enter" || event.key === " "');
  });
});
