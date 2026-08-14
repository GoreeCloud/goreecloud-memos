import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { describe, expect, it } from "vitest";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";
import {
  AttachmentSchema,
  MediaCaptureTimeSchema,
  MediaLocationSchema,
  MediaMetadataSchema,
  MotionMediaFamily,
  MotionMediaRole,
  MotionMediaSchema,
  PhotoMetadataSchema,
  VideoMetadataSchema,
} from "@/types/proto/api/v1/attachment_service_pb";
import { State } from "@/types/proto/api/v1/common_pb";
import { MemoSchema, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { setNoteColor } from "./noteColor";
import { buildLibraryJSON, buildLibraryMarkdown, buildNoteMarkdownFilename, serializeNoteForExport } from "./noteExport";
import { setNoteTrashed } from "./noteTrash";

const buildMemo = (content: string, state = State.NORMAL, attachments: Attachment[] = []) =>
  create(MemoSchema, {
    name: "memos/abc123",
    state,
    creator: "users/1",
    content,
    visibility: Visibility.PRIVATE,
    pinned: true,
    tags: ["work"],
    attachments,
    createTime: timestampFromDate(new Date("2026-08-12T08:00:00.000Z")),
    updateTime: timestampFromDate(new Date("2026-08-12T08:05:00.000Z")),
  });

describe("GoreeCloud Notes export", () => {
  it("exports clean Markdown while preserving GoreeCloud metadata structurally", () => {
    const content = setNoteTrashed(setNoteColor("# Grocery List\n\nMilk", "yellow"), "archived");
    const exported = serializeNoteForExport(buildMemo(content));

    expect(exported.title).toBe("Grocery List");
    expect(exported.markdown).toBe("# Grocery List\n\nMilk");
    expect(exported.state).toBe("trash");
    expect(exported.restoreTarget).toBe("archived");
    expect(exported.color).toBe("yellow");
    expect(exported.visibility).toBe("PRIVATE");
  });

  it("preserves motion and photo metadata while excluding attachment binary content", () => {
    const attachment = create(AttachmentSchema, {
      name: "attachments/photo-1",
      filename: "photo.jpg",
      type: "image/jpeg",
      size: 123456n,
      memo: "memos/abc123",
      createTime: timestampFromDate(new Date("2026-08-12T08:02:00.000Z")),
      motionMedia: create(MotionMediaSchema, {
        family: MotionMediaFamily.APPLE_LIVE_PHOTO,
        role: MotionMediaRole.STILL,
        groupId: "live-photo-group",
        presentationTimestampUs: 987654n,
        hasEmbeddedVideo: true,
      }),
      mediaMetadata: create(MediaMetadataSchema, {
        width: 4032,
        height: 3024,
        details: {
          case: "photo",
          value: create(PhotoMetadataSchema, {
            captureTime: create(MediaCaptureTimeSchema, {
              localDateTime: "2026-08-12T03:02:00",
              utcOffset: "-05:00",
            }),
            location: create(MediaLocationSchema, {
              latitude: 32.3668,
              longitude: -86.3,
              altitudeMeters: 73.5,
            }),
            sourceExifOrientation: 6,
            cameraMake: "Apple",
            cameraModel: "iPhone",
            lensModel: "Wide Camera",
            fNumber: 1.8,
            exposureTimeSeconds: 0.008,
            iso: 64,
            focalLengthMm: 5.7,
          }),
        },
      }),
    });

    const exported = serializeNoteForExport(buildMemo("Body", State.NORMAL, [attachment]));

    expect(exported.attachments[0]).toMatchObject({
      name: "attachments/photo-1",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      sizeBytes: "123456",
      motionMedia: {
        family: "APPLE_LIVE_PHOTO",
        role: "STILL",
        groupId: "live-photo-group",
        presentationTimestampUs: "987654",
        hasEmbeddedVideo: true,
      },
      mediaMetadata: {
        width: 4032,
        height: 3024,
        details: {
          type: "photo",
          captureTime: {
            localDateTime: "2026-08-12T03:02:00",
            utcOffset: "-05:00",
          },
          location: {
            latitude: 32.3668,
            longitude: -86.3,
            altitudeMeters: 73.5,
          },
          sourceExifOrientation: 6,
          cameraMake: "Apple",
          cameraModel: "iPhone",
          lensModel: "Wide Camera",
          fNumber: 1.8,
          exposureTimeSeconds: 0.008,
          iso: 64,
          focalLengthMm: 5.7,
        },
      },
    });
    expect(exported.attachments[0]).not.toHaveProperty("content");
  });

  it("preserves normalized video metadata", () => {
    const attachment = create(AttachmentSchema, {
      name: "attachments/video-1",
      filename: "clip.mp4",
      type: "video/mp4",
      size: 999n,
      mediaMetadata: create(MediaMetadataSchema, {
        width: 1920,
        height: 1080,
        details: {
          case: "video",
          value: create(VideoMetadataSchema, {
            durationSeconds: 12.5,
          }),
        },
      }),
    });

    const exported = serializeNoteForExport(buildMemo("Body", State.NORMAL, [attachment]));

    expect(exported.attachments[0].mediaMetadata).toEqual({
      width: 1920,
      height: 1080,
      details: {
        type: "video",
        durationSeconds: 12.5,
      },
    });
  });

  it("uses a portable title-based Markdown filename", () => {
    expect(buildNoteMarkdownFilename(buildMemo("# My Important Note\n\nBody"))).toBe("my-important-note.md");
  });

  it("builds a full-library Markdown file without internal color or Trash markers", () => {
    const content = setNoteTrashed(setNoteColor("# Note\n\nBody", "blue"), "normal");
    const markdown = buildLibraryMarkdown([buildMemo(content)], "2026-08-12T08:10:00.000Z");

    expect(markdown).toContain("# GoreeCloud Notes Export");
    expect(markdown).toContain("# Note\n\nBody");
    expect(markdown).not.toContain("goreecloud-note-color");
    expect(markdown).not.toContain("goreecloud-note-trash");
  });

  it("builds JSON with stable export metadata and clean note content", () => {
    const json = JSON.parse(buildLibraryJSON([buildMemo("Body", State.ARCHIVED)], "2026-08-12T08:10:00.000Z"));

    expect(json.format).toBe("goreecloud-notes");
    expect(json.schemaVersion).toBe(1);
    expect(json.notes).toHaveLength(1);
    expect(json.notes[0].state).toBe("archived");
    expect(json.notes[0].markdown).toBe("Body");
  });
});
