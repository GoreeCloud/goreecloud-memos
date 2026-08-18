import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = process.cwd();
const repoRoot = join(webRoot, "..");

const canonicalIconSource = readFileSync(join(webRoot, "public/goreecloud-memos.svg"), "utf8");
const indexSource = readFileSync(join(webRoot, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(join(webRoot, "public/site.webmanifest"), "utf8")) as {
  name: string;
  short_name: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
};
const tauriConfig = JSON.parse(
  readFileSync(join(repoRoot, "clients/goreecloud-memos/src-tauri/tauri.conf.json"), "utf8"),
) as {
  productName: string;
  identifier: string;
  bundle: { icon: string[] };
};
const clientWorkflowSource = readFileSync(join(repoRoot, ".github/workflows/goreecloud-memos-clients.yml"), "utf8");

describe("GoreeCloud Memos application identity", () => {
  it("keeps one purpose-specific canonical Glaze app icon source", () => {
    expect(canonicalIconSource).toContain('viewBox="0 0 1024 1024"');
    expect(canonicalIconSource).toContain('aria-label="GoreeCloud Memos app icon"');
    expect(canonicalIconSource).toContain("Glaze UI product tile");
    expect(canonicalIconSource).toContain("Quick-capture mark and memo lines");
  });

  it("uses the canonical Memos identity throughout the web and PWA surfaces", () => {
    expect(indexSource).toContain('rel="icon" type="image/svg+xml" href="/goreecloud-memos.svg"');
    expect(indexSource).toContain('rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"');
    expect(indexSource).toContain('rel="manifest" href="/site.webmanifest"');
    expect(manifest.name).toBe("GoreeCloud Memos");
    expect(manifest.short_name).toBe("GC Memos");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/goreecloud-memos.svg", sizes: "any", type: "image/svg+xml" }),
        expect.objectContaining({ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }),
      ]),
    );
  });

  it("keeps Linux and Android launcher assets derived from the same canonical SVG", () => {
    const canonicalIconPath = "../../web/public/goreecloud-memos.svg";
    expect(clientWorkflowSource.match(new RegExp(canonicalIconPath.replaceAll(".", "\\."), "g"))?.length).toBe(2);
    expect(clientWorkflowSource).toContain(`run: tauri icon ${canonicalIconPath}`);
    expect(clientWorkflowSource).toContain(`run: cargo tauri icon ${canonicalIconPath}`);
    expect(tauriConfig.productName).toBe("GoreeCloud Memos");
    expect(tauriConfig.identifier).toBe("com.goreecloud.memos");
    expect(tauriConfig.bundle.icon).toEqual([
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.png",
    ]);
  });
});
