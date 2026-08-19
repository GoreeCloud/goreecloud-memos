import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const CLIENT_SOURCE = readSource("src/browser-capture/client.ts");
const INBOX_SOURCE = readSource("src/browser-capture/inbox.ts");
const LOCATION_SOURCE = readSource("src/browser-capture/location.ts");
const MAIN_SOURCE = readSource("src/main.tsx");
const APP_RUNTIME_SOURCE = readSource("src/AppRuntime.tsx");
const ROUTER_SOURCE = readSource("src/router/index.tsx");

describe("Browser capture security contract", () => {
  it("keeps capture credentials out of persistent browser storage", () => {
    for (const forbidden of ["localStorage.", "sessionStorage.", "indexedDB.", "new BroadcastChannel", "document.cookie"]) {
      expect(CLIENT_SOURCE).not.toContain(forbidden);
    }
    expect(CLIENT_SOURCE).toContain('credentials: "include"');
    expect(CLIENT_SOURCE).toContain("refreshClient.refreshToken({})");
    expect(CLIENT_SOURCE).toContain("accessToken = null");
  });

  it("keeps captured content out of URL and storage channels", () => {
    for (const forbidden of ["URLSearchParams", "localStorage", "sessionStorage", "indexedDB"]) {
      expect(INBOX_SOURCE).not.toContain(forbidden);
    }
    expect(INBOX_SOURCE).toContain('const PAYLOAD_EVENT = "GoreeCloudCapturePayload"');
    expect(INBOX_SOURCE).toContain("isCanonicalBrowserCaptureLocation(window.location)");
    expect(INBOX_SOURCE).toContain('candidate.destination !== "memo"');
    expect(INBOX_SOURCE).toContain("candidate.isPrivate === true");
  });

  it("accepts only the canonical capture document URL forms", () => {
    expect(LOCATION_SOURCE).toContain('location.pathname === BROWSER_CAPTURE_PATH');
    expect(LOCATION_SOURCE).toContain('location.pathname === `${BROWSER_CAPTURE_PATH}/`');
    expect(LOCATION_SOURCE).toContain("!location.search");
    expect(LOCATION_SOURCE).toContain("!location.hash");
  });

  it("selects capture before importing the normal workspace runtime", () => {
    expect(MAIN_SOURCE).toContain("isCanonicalBrowserCaptureLocation(window.location)");
    expect(MAIN_SOURCE).toContain('await import("@/pages/BrowserCapture")');
    expect(MAIN_SOURCE).toContain('await import("./AppRuntime")');
    expect(MAIN_SOURCE.indexOf('await import("@/pages/BrowserCapture")')).toBeLessThan(
      MAIN_SOURCE.indexOf('await import("./AppRuntime")'),
    );

    for (const forbidden of [
      "AuthProvider",
      "InstanceProvider",
      "ViewProvider",
      "refreshAccessToken",
      "useTokenRefreshOnFocus",
      "useLiveMemoRefresh",
      "QueryClientProvider",
      "ReactQueryDevtools",
      "./router",
    ]) {
      expect(MAIN_SOURCE).not.toContain(forbidden);
    }
  });

  it("keeps persistent workspace authentication confined to the normal runtime", () => {
    for (const expected of [
      "AuthProvider",
      "InstanceProvider",
      "ViewProvider",
      "refreshAccessToken",
      "useTokenRefreshOnFocus",
      "useLiveMemoRefresh",
      "QueryClientProvider",
      "ReactQueryDevtools",
      "./router",
    ]) {
      expect(APP_RUNTIME_SOURCE).toContain(expected);
    }
  });

  it("keeps the privileged capture surface out of the normal workspace router", () => {
    expect(ROUTER_SOURCE).not.toContain('path: "/browser-capture"');
    expect(ROUTER_SOURCE).not.toContain("@/pages/BrowserCapture");
    expect(ROUTER_SOURCE).not.toContain("@/browser-capture/inbox");
  });
});
