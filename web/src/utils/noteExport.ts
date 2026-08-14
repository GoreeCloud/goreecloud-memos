import { create } from "@bufbuild/protobuf";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import { splitNoteTitle } from "@/components/MemoEditor/utils/noteTitle";
import { memoServiceClient } from "@/connect";
import { buildMemoCreatorFilter, extractMemoIdFromName } from "@/lib/resource-names";
import type { Attachment, MediaMetadata } from "@/types/proto/api/v1/attachment_service_pb";
import { MotionMediaFamily, MotionMediaRole } from "@/types/proto/api/v1/attachment_service_pb";
import { State } from "@/types/proto/api/v1/common_pb";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { ListMemosRequestSchema, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { getNoteColor, stripNoteColorMetadata } from "./noteColor";
import { getNoteTrashOrigin, isNoteTrashed, stripNoteTrashMetadata } from "./noteTrash";

export type NoteExportFormat = "markdown" | "json";

const EXPORT_PAGE_SIZE = 1000;

const cleanMarkdown = (content: string): string => stripNoteColorMetadata(stripNoteTrashMetadata(content)).trimEnd();

const timestampToISO = (timestamp: Memo["createTime"]): string | null => (timestamp ? timestampDate(timestamp).toISOString() : null);

const visibilityName = (visibility: Visibility): string => Visibility[visibility] ?? "PRIVATE";

const relationTypeName = (type: number): string => {
  if (type === 1) return "REFERENCE";
  if (type === 2) return "COMMENT";
  return "TYPE_UNSPECIFIED";
};

const motionMediaFamilyName = (family: MotionMediaFamily): string => MotionMediaFamily[family] ?? "MOTION_MEDIA_FAMILY_UNSPECIFIED";

const motionMediaRoleName = (role: MotionMediaRole): string => MotionMediaRole[role] ?? "MOTION_MEDIA_ROLE_UNSPECIFIED";

const serializeMediaMetadata = (metadata: MediaMetadata | undefined) => {
  if (!metadata) return null;

  let details = null;
  if (metadata.details.case === "photo") {
    const photo = metadata.details.value;
    details = {
      type: "photo" as const,
      captureTime: photo.captureTime
        ? {
            localDateTime: photo.captureTime.localDateTime || null,
            utcOffset: photo.captureTime.utcOffset ?? null,
          }
        : null,
      location: photo.location
        ? {
            latitude: photo.location.latitude ?? null,
            longitude: photo.location.longitude ?? null,
            altitudeMeters: photo.location.altitudeMeters ?? null,
          }
        : null,
      sourceExifOrientation: photo.sourceExifOrientation ?? null,
      cameraMake: photo.cameraMake || null,
      cameraModel: photo.cameraModel || null,
      lensModel: photo.lensModel || null,
      fNumber: photo.fNumber ?? null,
      exposureTimeSeconds: photo.exposureTimeSeconds ?? null,
      iso: photo.iso ?? null,
      focalLengthMm: photo.focalLengthMm ?? null,
    };
  } else if (metadata.details.case === "video") {
    details = {
      type: "video" as const,
      durationSeconds: metadata.details.value.durationSeconds ?? null,
    };
  }

  return {
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    details,
  };
};

const serializeAttachmentForExport = (attachment: Attachment, memoName: string) => ({
  name: attachment.name,
  filename: attachment.filename,
  externalLink: attachment.externalLink || null,
  mimeType: attachment.type,
  sizeBytes: String(attachment.size),
  createTime: attachment.createTime ? timestampDate(attachment.createTime).toISOString() : null,
  memo: attachment.memo ?? memoName,
  motionMedia: attachment.motionMedia
    ? {
        family: motionMediaFamilyName(attachment.motionMedia.family),
        role: motionMediaRoleName(attachment.motionMedia.role),
        groupId: attachment.motionMedia.groupId || null,
        presentationTimestampUs: String(attachment.motionMedia.presentationTimestampUs),
        hasEmbeddedVideo: attachment.motionMedia.hasEmbeddedVideo,
      }
    : null,
  mediaMetadata: serializeMediaMetadata(attachment.mediaMetadata),
});

const getExportState = (memo: Memo): { state: "normal" | "archived" | "trash"; restoreTarget?: "normal" | "archived" } => {
  const trashOrigin = getNoteTrashOrigin(memo.content);
  if (trashOrigin) {
    return { state: "trash", restoreTarget: trashOrigin };
  }
  return { state: memo.state === State.ARCHIVED ? "archived" : "normal" };
};

export const serializeNoteForExport = (memo: Memo) => {
  const markdown = cleanMarkdown(memo.content);
  const titleParts = splitNoteTitle(markdown);
  const exportState = getExportState(memo);

  return {
    name: memo.name,
    uid: extractMemoIdFromName(memo.name),
    title: titleParts.title || null,
    markdown,
    state: exportState.state,
    restoreTarget: exportState.restoreTarget ?? null,
    visibility: visibilityName(memo.visibility),
    pinned: memo.pinned,
    color: getNoteColor(memo.content),
    tags: [...memo.tags],
    createTime: timestampToISO(memo.createTime),
    updateTime: timestampToISO(memo.updateTime),
    location: memo.location
      ? {
          placeholder: memo.location.placeholder,
          latitude: memo.location.latitude,
          longitude: memo.location.longitude,
        }
      : null,
    attachments: memo.attachments.map((attachment) => serializeAttachmentForExport(attachment, memo.name)),
    relations: memo.relations.map((relation) => ({
      memo: relation.memo?.name ?? memo.name,
      relatedMemo: relation.relatedMemo?.name ?? null,
      type: relationTypeName(relation.type),
    })),
  };
};

const safeFilenamePart = (value: string): string => {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return normalized.slice(0, 80) || "note";
};

export const buildNoteMarkdownFilename = (memo: Memo): string => {
  const cleanContent = cleanMarkdown(memo.content);
  const { title } = splitNoteTitle(cleanContent);
  const uid = extractMemoIdFromName(memo.name);
  return `${safeFilenamePart(title || uid || "note")}.md`;
};

export const buildLibraryMarkdown = (memos: Memo[], exportedAt: string): string => {
  const notes = memos.map(serializeNoteForExport);
  const header = [
    "# GoreeCloud Notes Export",
    "",
    `Exported: ${exportedAt}`,
    `Notes: ${notes.length}`,
    "",
    "This Markdown export contains clean note content. GoreeCloud state, color, attachment metadata, and other structured metadata are preserved in the JSON export.",
  ].join("\n");

  const documents = notes.map((note) => {
    const metadata = `<!-- goreecloud-export-note: ${note.name}; state=${note.state}; color=${note.color} -->`;
    return `${metadata}\n${note.markdown || "_Empty note_"}`;
  });

  return [header, ...documents].join("\n\n---\n\n");
};

export const buildLibraryJSON = (memos: Memo[], exportedAt: string): string =>
  JSON.stringify(
    {
      format: "goreecloud-notes",
      schemaVersion: 1,
      exportedAt,
      source: {
        application: "GoreeCloud Notes",
        upstream: "Memos",
      },
      scope: {
        includes: ["top-level notes", "note metadata", "labels", "attachment metadata", "relations"],
        excludes: ["attachment binary content", "comments", "reactions"],
      },
      notes: memos.map(serializeNoteForExport),
    },
    null,
    2,
  );

const downloadTextFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadNoteMarkdown = (memo: Memo) => {
  downloadTextFile(buildNoteMarkdownFilename(memo), `${cleanMarkdown(memo.content)}\n`, "text/markdown;charset=utf-8");
};

const listAllMemosForState = async (creatorName: string, state: State): Promise<Memo[]> => {
  const memos: Memo[] = [];
  let pageToken = "";
  const creatorFilter = buildMemoCreatorFilter(creatorName);

  do {
    const response = await memoServiceClient.listMemos(
      create(ListMemosRequestSchema, {
        pageSize: EXPORT_PAGE_SIZE,
        pageToken,
        state,
        orderBy: "create_time asc",
        filter: creatorFilter,
      }),
    );
    memos.push(...response.memos);
    pageToken = response.nextPageToken;
  } while (pageToken);

  return memos;
};

export const fetchAllNotesForExport = async (creatorName: string): Promise<Memo[]> => {
  const [normal, archived] = await Promise.all([
    listAllMemosForState(creatorName, State.NORMAL),
    listAllMemosForState(creatorName, State.ARCHIVED),
  ]);

  return [...normal, ...archived].sort((a, b) => {
    const aTime = a.createTime ? timestampDate(a.createTime).getTime() : 0;
    const bTime = b.createTime ? timestampDate(b.createTime).getTime() : 0;
    return aTime - bTime;
  });
};

export const downloadLibraryExport = async (creatorName: string, format: NoteExportFormat): Promise<number> => {
  const memos = await fetchAllNotesForExport(creatorName);
  const exportedAt = new Date().toISOString();
  const date = exportedAt.slice(0, 10);

  if (format === "markdown") {
    downloadTextFile(`goreecloud-notes-${date}.md`, buildLibraryMarkdown(memos, exportedAt), "text/markdown;charset=utf-8");
  } else {
    downloadTextFile(`goreecloud-notes-${date}.json`, buildLibraryJSON(memos, exportedAt), "application/json;charset=utf-8");
  }

  return memos.length;
};

export const isExportedAsTrash = (memo: Memo): boolean => isNoteTrashed(memo.content);
