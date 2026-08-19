import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CLIENT_SOURCE = readFileSync(new URL("../src/browser-capture/client.ts", import.meta.url), "utf8");
const INBOX_SOURCE = readFileSync(new URL("../src/browser-capture/inbox.ts", import.meta.url), "utf8");
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
    for (const forbidden of ["URLSearchParams", "location.search", "location.hash", "localStorage", "sessionStorage", "indexedDB"]) {
      expect(INBOX_SOURCE).not.toContain(forbidden);
    }
    expect(INBOX_SOURCE).toContain('const PAYLOAD_EVENT = "GoreeCloudCapturePayload"');
    expect(INBOX_SOURCE).toContain('candidate.destination !== "memo"');
    expect(INBOX_SOURCE).toContain("candidate.isPrivate === true");
  });

  it("registers the exact top-level capture route outside the normal workspace layout", () => {
    expect(ROUTER_SOURCE).toContain('{ path: "browser-capture", element: <BrowserCapture /> }');
    expect(ROUTER_SOURCE).toContain('import "@/browser-capture/inbox"');
  });
});
