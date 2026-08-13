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
  });

  it("provides one app-controlled browser theme color", () => {
    expect(indexHtml).toContain('name="theme-color" content="#faf9f5"');
    expect(indexHtml.match(/name="theme-color"/g)).toHaveLength(1);
    expect(indexHtml).not.toContain('name="theme-color" content="#faf9f5" media=');
    expect(indexHtml).not.toContain('name="theme-color" content="#303236" media=');
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
