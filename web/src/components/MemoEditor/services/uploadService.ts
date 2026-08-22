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
   * Best-effort cleanup for newly uploaded attachments that have not been linked
   * to a memo. Cleanup failures must never replace the original save/upload
   * error, but every successfully created attachment gets an independent delete
   * attempt so one failed cleanup does not prevent the rest.
   */
  async cleanupUnlinkedAttachments(attachments: Attachment[]): Promise<void> {
    const names = attachments.map((attachment) => attachment.name).filter(Boolean);
    if (names.length === 0) return;

    const results = await Promise.allSettled(names.map((name) => attachmentServiceClient.deleteAttachment({ name })));
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      console.warn(`Failed to clean up ${failures.length} unlinked attachment(s) after a save/upload failure.`);
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
