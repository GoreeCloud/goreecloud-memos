export const GOREECLOUD_MEMOS_DEFAULT_TITLE = "GoreeCloud Memos";
export const GOREECLOUD_MEMOS_DEFAULT_LOGO_URL = "/goreecloud-memos.svg";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

/**
 * GoreeCloud instance branding may use only root-relative assets served by the
 * current Memos origin. Remote, protocol-relative, data, blob, and other
 * externally resolved URLs are intentionally rejected to prevent branding from
 * becoming a passive tracking or spoofing channel.
 */
export const isSafeLocalBrandAssetPath = (value: string | undefined): boolean => {
  const candidate = value?.trim();
  if (!candidate) {
    return false;
  }
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return false;
  }
  if (candidate.includes("\\") || CONTROL_CHARACTER_PATTERN.test(candidate)) {
    return false;
  }

  try {
    const parsed = new URL(candidate, "https://goreecloud.invalid");
    return parsed.origin === "https://goreecloud.invalid" && parsed.username === "" && parsed.password === "";
  } catch {
    return false;
  }
};

export const resolveInstanceLogoUrl = (value: string | undefined): string => {
  const candidate = value?.trim();
  return candidate && isSafeLocalBrandAssetPath(candidate) ? candidate : GOREECLOUD_MEMOS_DEFAULT_LOGO_URL;
};
