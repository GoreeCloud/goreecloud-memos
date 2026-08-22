import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const uploadServiceSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/services/uploadService.ts"), "utf8");
const memoServiceSource = readFileSync(join(process.cwd(), "src/components/MemoEditor/services/memoService.ts"), "utf8");

describe("GoreeCloud Memos attachment transaction safety", () => {
  it("cleans up every successfully uploaded file when a later file in the same batch fails", () => {
    expect(uploadServiceSource).toContain("cleanupUnlinkedAttachments");
    expect(uploadServiceSource).toContain("Promise.allSettled");
    expect(uploadServiceSource).toContain("await uploadService.cleanupUnlinkedAttachments(attachments)");
    expect(uploadServiceSource).toContain("throw error;");
  });

  it("re-checks server linkage before deleting rollback candidates", () => {
    expect(uploadServiceSource).toContain("attachmentServiceClient.getAttachment({ name })");
    expect(uploadServiceSource).toContain("if (attachment.memo) return;");
    expect(uploadServiceSource).toContain("attachmentServiceClient.deleteAttachment({ name })");
  });

  it("cleans newly uploaded files when the memo read or write transaction fails", () => {
    expect(memoServiceSource).toContain("const newAttachments = await uploadService.uploadFiles(state.localFiles)");
    expect(memoServiceSource).toContain("await uploadService.cleanupUnlinkedAttachments(newAttachments)");
    expect(memoServiceSource).toContain("throw error;");
  });

  it("never includes pre-existing memo attachments in rollback cleanup", () => {
    expect(memoServiceSource).toContain("const allAttachments = [...state.metadata.attachments, ...newAttachments]");
    expect(memoServiceSource).toContain("cleanupUnlinkedAttachments(newAttachments)");
    expect(memoServiceSource).not.toContain("cleanupUnlinkedAttachments(allAttachments)");
  });
});
