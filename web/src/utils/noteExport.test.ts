import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { describe, expect, it } from "vitest";
import { State } from "@/types/proto/api/v1/common_pb";
import { MemoSchema, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { setNoteColor } from "./noteColor";
import { buildLibraryJSON, buildLibraryMarkdown, buildNoteMarkdownFilename, serializeNoteForExport } from "./noteExport";
import { setNoteTrashed } from "./noteTrash";

const buildMemo = (content: string, state = State.NORMAL) =>
  create(MemoSchema, {
    name: "memos/abc123",
    state,
    creator: "users/1",
    content,
    visibility: Visibility.PRIVATE,
    pinned: true,
    tags: ["work"],
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
