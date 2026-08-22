import { create } from "@bufbuild/protobuf";
import { attachmentServiceClient } from "@/connect";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";
import { AttachmentSchema, MotionMediaSchema } from "@/types/proto/api/v1/attachment_service_pb";
import type { LocalFile } from "../types/attachment";

export const uploadService = {
  async uploadFile(localFile: LocalFile): Promise<Attachment> {
    const { file, motionMedia } = localFile;
    const [mediaMetadata, arrayBuffer] = await Promise.all([localFile.mediaMetadata, file.arrayBuffer()]);
    const buffer = new Uint8Array(arrayBuffer);
    return attachmentServiceClient.createAttachment({
      attachment: create(AttachmentSchema, {
        filename: file.name,
        size: BigInt(file.size),
        type: file.type,
        content: buffer,
        motionMedia: motionMedia ? create(MotionMediaSchema, motionMedia) : undefined,
        mediaMetadata,
      }),
    });
  },

  /**
   * Best-effort cleanup for newly uploaded attachments after a failed save or
   * upload batch. Re-read each attachment before deletion and delete it only
   * while the server still reports it as unlinked. This matters when a memo
   * write committed successfully but its response was lost: an ambiguous
   * transport failure must not delete an attachment that is already linked.
   *
   * Read/delete failures are intentionally contained so cleanup never replaces
   * the original transaction error. In uncertainty, retaining an orphan is
   * safer than deleting data that may have become durable memo content.
   */
  async cleanupUnlinkedAttachments(attachments: Attachment[]): Promise<void> {
    const names = attachments.map((attachment) => attachment.name).filter(Boolean);
    if (names.length === 0) return;

    const results = await Promise.allSettled(
      names.map(async (name) => {
        const attachment = await attachmentServiceClient.getAttachment({ name });
        if (attachment.memo) return;
        await attachmentServiceClient.deleteAttachment({ name });
      }),
    );
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      console.warn(`Could not verify or clean up ${failures.length} attachment(s) after a save/upload failure.`);
    }
  },

  async uploadFiles(localFiles: LocalFile[]): Promise<Attachment[]> {
    if (localFiles.length === 0) return [];

    const attachments: Attachment[] = [];

    try {
      for (const localFile of localFiles) {
        attachments.push(await uploadService.uploadFile(localFile));
      }
      return attachments;
    } catch (error) {
      await uploadService.cleanupUnlinkedAttachments(attachments);
      throw error;
    }
  },
};
