import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(join(process.cwd(), "public/site.webmanifest"), "utf8")) as Record<string, unknown>;

describe("GoreeCloud Notes mobile PWA shell", () => {
  it("keeps browser zoom available and opts into display safe areas", () => {
    expect(indexHtml).toContain('content="width=device-width, initial-scale=1, viewport-fit=cover"');
    expect(indexHtml).not.toContain("user-scalable=no");
    expect(indexHtml).toContain('name="apple-mobile-web-app-title" content="GoreeCloud Notes"');
    expect(indexHtml).toContain('name="theme-color" content="#faf9f5" media="(prefers-color-scheme: light)"');
    expect(indexHtml).toContain('name="theme-color" content="#303236" media="(prefers-color-scheme: dark)"');
  });

  it("keeps an explicit standalone GoreeCloud Notes app identity", () => {
    expect(manifest).toMatchObject({
      id: "/",
      name: "GoreeCloud Notes",
      short_name: "GC Notes",
      lang: "en",
      dir: "ltr",
      display: "standalone",
      scope: "/",
      start_url: "/",
    });
    expect(manifest.categories).toEqual(expect.arrayContaining(["productivity", "utilities"]));
  });
});
