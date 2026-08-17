import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const trashPage = readFileSync(join(process.cwd(), "src/pages/Trash.tsx"), "utf8");

describe("GoreeCloud Trash delete all", () => {
  it("requires an explicit destructive confirmation", () => {
    expect(trashPage).toContain('variant="destructive"');
    expect(trashPage).toContain('title="Delete all Trash items permanently?"');
    expect(trashPage).toContain("This cannot be undone.");
    expect(trashPage).toContain('confirmVariant="destructive"');
  });

  it("enumerates every Trash page before deleting and refreshes memo state", () => {
    expect(trashPage).toContain("do {");
    expect(trashPage).toContain("response.nextPageToken");
    expect(trashPage).toContain("memoServiceClient.deleteMemo({ name })");
    expect(trashPage).toContain("memoKeys.lists()");
    expect(trashPage).toContain("userKeys.stats()");
  });

  it("disables Delete all when Trash is empty or deletion is running", () => {
    expect(trashPage).toContain("isTrashPreviewLoading || !hasTrash || isDeletingAll");
    expect(trashPage).toContain('"Delete all"');
  });
});
