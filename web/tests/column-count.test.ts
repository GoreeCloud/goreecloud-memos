import { describe, expect, it } from "vitest";
import { columnCountForWidth } from "@/components/ColumnGrid";

// Default min column width 260px, gap 12px. A width fits N columns when
// floor((width + gap) / (minColumnWidth + gap)) === N, never below 1.
describe("columnCountForWidth", () => {
  it("never returns fewer than one column, even at zero width", () => {
    expect(columnCountForWidth(0)).toBe(1);
    expect(columnCountForWidth(100)).toBe(1);
    expect(columnCountForWidth(259)).toBe(1);
  });

  it("stays at one column just below the default two-column threshold", () => {
    // 2*260 + 12 = 532 is the first width that fits two default columns.
    expect(columnCountForWidth(531)).toBe(1);
  });

  it("reaches two columns exactly at the default threshold (the list-fallback boundary)", () => {
    expect(columnCountForWidth(532)).toBe(2);
  });

  it("scales up with width", () => {
    expect(columnCountForWidth(804)).toBe(3);
    expect(columnCountForWidth(1152)).toBe(4);
    expect(columnCountForWidth(1600)).toBe(5);
  });

  it("supports a denser route-specific minimum without changing the shared default", () => {
    // Home uses 168px compact cards: 2*168 + 12 = 348px.
    expect(columnCountForWidth(347, 168)).toBe(1);
    expect(columnCountForWidth(348, 168)).toBe(2);
    expect(columnCountForWidth(358, 168)).toBe(2);

    // The same widths still remain one column for ordinary feeds.
    expect(columnCountForWidth(358)).toBe(1);
  });
});
