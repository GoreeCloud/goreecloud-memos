import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(join(process.cwd(), "public/site.webmanifest"), "utf8")) as Record<string, unknown>;
const glazeCss = readFileSync(join(process.cwd(), "src/themes/goreecloud-glaze.css"), "utf8");

describe("GoreeCloud Memos mobile PWA shell", () => {
  it("keeps browser zoom available and opts into display safe areas", () => {
    expect(indexHtml).toContain('content="width=device-width, initial-scale=1, viewport-fit=cover"');
    expect(indexHtml).not.toContain("user-scalable=no");
    expect(indexHtml).toContain('name="apple-mobile-web-app-title" content="GoreeCloud Memos"');
  });

  it("provides one app-controlled browser theme color", () => {
    expect(indexHtml).toContain('name="theme-color" content="#faf9f5"');
    expect(indexHtml.match(/name="theme-color"/g)).toHaveLength(1);
    expect(indexHtml).not.toContain('name="theme-color" content="#faf9f5" media=');
    expect(indexHtml).not.toContain('name="theme-color" content="#303236" media=');
  });

  it("keeps mobile navigation touch targets at least 44px high", () => {
    expect(glazeCss).toContain('[data-slot="sheet-content"] aside button,');
    expect(glazeCss).toContain('[data-slot="sheet-content"] aside [role="button"]');
    expect(glazeCss).toContain('[data-slot="sheet-content"] aside [role="button"][aria-label]');
    expect(glazeCss).toContain("min-height: 2.75rem;");
    expect(glazeCss).toContain("min-width: 2.75rem;");
  });

  it("keeps an explicit standalone GoreeCloud Memos app identity", () => {
    expect(manifest).toMatchObject({
      id: "/",
      name: "GoreeCloud Memos",
      short_name: "GC Memos",
      lang: "en",
      dir: "ltr",
      display: "standalone",
      scope: "/",
      start_url: "/",
    });
    expect(manifest.categories).toEqual(expect.arrayContaining(["productivity", "utilities"]));
  });
});
