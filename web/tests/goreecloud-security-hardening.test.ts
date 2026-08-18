import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GOREECLOUD_MEMOS_DEFAULT_LOGO_URL,
  isSafeLocalBrandAssetPath,
  resolveInstanceLogoUrl,
} from "../src/utils/instance-branding";

const appSource = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
const instanceSettingsSource = readFileSync(join(process.cwd(), "src/components/Settings/InstanceSection.tsx"), "utf8");
const profileDialogSource = readFileSync(join(process.cwd(), "src/components/UpdateCustomizedProfileDialog.tsx"), "utf8");
const normalizedProfileDialogSource = profileDialogSource.replace(/\s+/g, " ");
const markSource = readFileSync(join(process.cwd(), "src/components/GoreeCloudMemosMark.tsx"), "utf8");

describe("GoreeCloud Memos security hardening", () => {
  it("never executes stored arbitrary instance code in the browser shell", () => {
    expect(appSource).not.toContain('document.createElement("script")');
    expect(appSource).not.toContain('document.createElement("style")');
    expect(appSource).not.toContain("instanceGeneralSetting.additionalScript");
    expect(appSource).not.toContain("instanceGeneralSetting.additionalStyle");
  });

  it("does not expose inherited arbitrary-code editors in GoreeCloud Settings", () => {
    expect(instanceSettingsSource).not.toContain("SettingCodeEditor");
    expect(instanceSettingsSource).not.toContain('value={instanceGeneralSetting.additionalScript}');
    expect(instanceSettingsSource).not.toContain('value={instanceGeneralSetting.additionalStyle}');
    expect(instanceSettingsSource).toContain('additionalScript: ""');
    expect(instanceSettingsSource).toContain('additionalStyle: ""');
  });

  it("accepts only local root-relative branding assets", () => {
    expect(isSafeLocalBrandAssetPath("/goreecloud-memos.svg")).toBe(true);
    expect(isSafeLocalBrandAssetPath("/api/v1/attachments/example?thumbnail=1")).toBe(true);
    expect(isSafeLocalBrandAssetPath("https://tracker.example/logo.svg")).toBe(false);
    expect(isSafeLocalBrandAssetPath("//tracker.example/logo.svg")).toBe(false);
    expect(isSafeLocalBrandAssetPath("data:image/svg+xml;base64,abc")).toBe(false);
    expect(isSafeLocalBrandAssetPath("javascript:alert(1)")).toBe(false);
    expect(isSafeLocalBrandAssetPath("/\\tracker.example/logo.svg")).toBe(false);
  });

  it("fails unsafe and legacy branding back to the canonical local asset", () => {
    expect(resolveInstanceLogoUrl("https://tracker.example/logo.svg")).toBe(GOREECLOUD_MEMOS_DEFAULT_LOGO_URL);
    expect(resolveInstanceLogoUrl(undefined)).toBe(GOREECLOUD_MEMOS_DEFAULT_LOGO_URL);
    expect(markSource).toContain("resolveInstanceLogoUrl(logoUrl)");
    expect(appSource).toContain("resolveInstanceLogoUrl(customProfile?.logoUrl)");
  });

  it("keeps profile customization bounded and explains the local-asset rule", () => {
    expect(profileDialogSource).toContain("MAX_PROFILE_TITLE_LENGTH = 80");
    expect(profileDialogSource).toContain("MAX_PROFILE_DESCRIPTION_LENGTH = 280");
    expect(profileDialogSource).toContain("MAX_PROFILE_LOGO_PATH_LENGTH = 2048");
    expect(normalizedProfileDialogSource).toContain("Remote and protocol-relative URLs are blocked for privacy and security.");
    expect(profileDialogSource).toContain("GOREECLOUD_MEMOS_DEFAULT_LOGO_URL");
  });
});
