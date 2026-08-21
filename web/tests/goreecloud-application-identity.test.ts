import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = process.cwd();
const repoRoot = join(webRoot, "..");

const canonicalIconSource = readFileSync(join(webRoot, "public/goreecloud-memos.svg"), "utf8");
const indexSource = readFileSync(join(webRoot, "index.html"), "utf8");
const userMenuSource = readFileSync(join(webRoot, "src/components/UserMenu.tsx"), "utf8");
const nativeLaunchSource = readFileSync(
  join(repoRoot, "clients/goreecloud-memos/frontend/index.html"),
  "utf8",
);
const nativeLaunchIconSource = readFileSync(
  join(repoRoot, "clients/goreecloud-memos/frontend/goreecloud-memos.svg"),
  "utf8",
);
const manifest = JSON.parse(readFileSync(join(webRoot, "public/site.webmanifest"), "utf8")) as {
  name: string;
  short_name: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
};
const cargoManifestSource = readFileSync(
  join(repoRoot, "clients/goreecloud-memos/src-tauri/Cargo.toml"),
  "utf8",
);
const appStreamSource = readFileSync(
  join(repoRoot, "clients/goreecloud-memos/src-tauri/linux/com.goreecloud.memos.metainfo.xml"),
  "utf8",
);
const tauriConfig = JSON.parse(
  readFileSync(join(repoRoot, "clients/goreecloud-memos/src-tauri/tauri.conf.json"), "utf8"),
) as {
  productName: string;
  version: string;
  identifier: string;
  bundle: {
    homepage: string;
    license: string;
    licenseFile: string;
    publisher: string;
    icon: string[];
    linux: {
      appimage: { files: Record<string, string> };
      deb: { files: Record<string, string> };
    };
  };
};
const clientWorkflowSource = readFileSync(join(repoRoot, ".github/workflows/goreecloud-memos-clients.yml"), "utf8");
const cargoVersion = cargoManifestSource.match(/^version = "([^"]+)"$/m)?.[1];

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

  it("keeps the native launch surface on the exact canonical Memos icon", () => {
    expect(nativeLaunchSource).toContain('src="./goreecloud-memos.svg"');
    expect(nativeLaunchSource).not.toContain('<div class="mark"');
    expect(nativeLaunchSource).not.toContain(".mark span");
    expect(nativeLaunchIconSource).toBe(canonicalIconSource);
  });

  it("keeps account export language aligned with the Memos product identity", () => {
    expect(userMenuSource).toContain("Export memos");
    expect(userMenuSource).toContain('count === 1 ? "memo" : "memos"');
    expect(userMenuSource).toContain('toast.error("Unable to export memos"');
    expect(userMenuSource).not.toContain("Export notes");
    expect(userMenuSource).not.toContain('toast.error("Unable to export notes"');
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

  it("ships complete Linux installer metadata for the same product identity", () => {
    const appStreamInstallPath = "/usr/share/metainfo/com.goreecloud.memos.metainfo.xml";
    const appStreamSourcePath = "linux/com.goreecloud.memos.metainfo.xml";

    expect(cargoVersion).toBeDefined();
    expect(tauriConfig.version).toBe(cargoVersion);
    expect(cargoManifestSource).toContain('license = "MIT"');
    expect(cargoManifestSource).toContain('homepage = "https://memos.goreecloud.com"');
    expect(tauriConfig.bundle.publisher).toBe("GoreeCloud");
    expect(tauriConfig.bundle.homepage).toBe("https://memos.goreecloud.com");
    expect(tauriConfig.bundle.license).toBe("MIT");
    expect(tauriConfig.bundle.licenseFile).toBe("../../../LICENSE");
    expect(tauriConfig.bundle.linux.deb.files[appStreamInstallPath]).toBe(appStreamSourcePath);
    expect(tauriConfig.bundle.linux.appimage.files[appStreamInstallPath]).toBe(appStreamSourcePath);

    expect(appStreamSource).toContain("<id>com.goreecloud.memos</id>");
    expect(appStreamSource).toContain("<metadata_license>CC0-1.0</metadata_license>");
    expect(appStreamSource).toContain("<project_license>MIT</project_license>");
    expect(appStreamSource).toContain("<name>GoreeCloud Memos</name>");
    expect(appStreamSource).toContain("<developer id=\"com.goreecloud\">");
    expect(appStreamSource).toContain('<url type="homepage">https://memos.goreecloud.com</url>');
    expect(appStreamSource).toContain('<launchable type="desktop-id">GoreeCloud Memos.desktop</launchable>');
    expect(appStreamSource).toContain('<icon type="stock">goreecloud-memos-client</icon>');
    expect(appStreamSource).toContain('<content_rating type="oars-1.1" />');
    expect(appStreamSource).toContain(`<release version="${tauriConfig.version}"`);
    expect(clientWorkflowSource).toContain("Validate Debian installer metadata");
    expect(clientWorkflowSource).toContain("appstreamcli validate --no-net");
  });
});
