import { beforeAll, describe, expect, it } from "vitest";

let inbox: typeof import("@/browser-capture/inbox");

function dispatchPayload(detail: Record<string, unknown>) {
  document.dispatchEvent(new CustomEvent("GoreeCloudCapturePayload", { detail }));
}

describe("Browser capture inbox", () => {
  beforeAll(async () => {
    window.history.replaceState({}, "", "/browser-capture");
    inbox = await import("@/browser-capture/inbox");
  });

  it("rejects malformed, wrong-destination, and private payloads before accepting one valid memo payload", () => {
    dispatchPayload({ destination: "task", text: "wrong destination" });
    expect(inbox.consumeBrowserCapturePayload()).toBeNull();

    dispatchPayload({ destination: "memo", text: "private", isPrivate: true });
    expect(inbox.consumeBrowserCapturePayload()).toBeNull();

    dispatchPayload({
      destination: "memo",
      kind: "selection",
      text: "selected text",
      title: "Example",
      pageUrl: "https://example.com/page",
      linkUrl: "",
    });

    expect(inbox.consumeBrowserCapturePayload()).toEqual({
      destination: "memo",
      kind: "selection",
      text: "selected text",
      title: "Example",
      pageUrl: "https://example.com/page",
      linkUrl: "",
    });

    dispatchPayload({ destination: "memo", text: "second payload" });
    expect(inbox.consumeBrowserCapturePayload()).toBeNull();
  });

  it("advertises the fail-closed memory-only and canonical URL contract", () => {
    expect(inbox.browserCaptureInboxContract).toMatchObject({
      path: "/browser-capture",
      trailingSlashAllowed: true,
      queryAllowed: false,
      fragmentAllowed: false,
      memoryOnly: true,
      onePayloadPerDocument: true,
      privateBrowsingAccepted: false,
      persistentStorage: false,
    });
  });
});
