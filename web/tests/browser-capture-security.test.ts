import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CLIENT_SOURCE = readFileSync(new URL("../src/browser-capture/client.ts", import.meta.url), "utf8");
const INBOX_SOURCE = readFileSync(new URL("../src/browser-capture/inbox.ts", import.meta.url), "utf8");
const LOCATION_SOURCE = readFileSync(new URL("../src/browser-capture/location.ts", import.meta.url), "utf8");
const MAIN_SOURCE = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const APP_RUNTIME_SOURCE = readFileSync(new URL("../src/AppRuntime.tsx", import.meta.url), "utf8");
const ROUTER_SOURCE = readFileSync(new URL("../src/router/index.tsx", import.meta.url), "utf8");

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
