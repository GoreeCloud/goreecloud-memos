import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homePage = readFileSync(join(process.cwd(), "src/pages/Home.tsx"), "utf8");

describe("GoreeCloud Memos Home composer spacing", () => {
  it("keeps deliberate separation between quick capture and the first completed memo", () => {
    expect(homePage).toContain('aria-label="Create note" className="mb-4 max-[599px]:!mb-5"');
    expect(homePage).toContain("{composerOpen ? (");
    expect(homePage).toContain("<MemoEditor");
    expect(homePage).toContain("gc-composer-collapsed");
  });
});
