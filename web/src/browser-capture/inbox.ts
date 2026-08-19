const PAYLOAD_EVENT = "GoreeCloudCapturePayload";
const CAPTURE_PATH = "/browser-capture";
const MAX_TEXT_LENGTH = 8192;
const MAX_TITLE_LENGTH = 512;
const MAX_URL_LENGTH = 4096;

export type BrowserCapturePayload = Readonly<{
  destination: "memo";
  kind: string;
  text: string;
  title: string;
  pageUrl: string;
  linkUrl: string;
}>;

let pendingPayload: BrowserCapturePayload | null = null;
let consumed = false;
const subscribers = new Set<() => void>();

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function isCanonicalCaptureDocument(): boolean {
  const { pathname, search, hash } = window.location;
  return (pathname === CAPTURE_PATH || pathname === `${CAPTURE_PATH}/`) && !search && !hash;
}

function normalizePayload(value: unknown): BrowserCapturePayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.destination !== "memo" || candidate.isPrivate === true) {
    return null;
  }

  return Object.freeze({
    destination: "memo",
    kind: cleanString(candidate.kind, 64),
    text: cleanString(candidate.text, MAX_TEXT_LENGTH),
    title: cleanString(candidate.title, MAX_TITLE_LENGTH),
    pageUrl: cleanString(candidate.pageUrl, MAX_URL_LENGTH),
    linkUrl: cleanString(candidate.linkUrl, MAX_URL_LENGTH),
  });
}

function onPayload(event: Event) {
  if (!isCanonicalCaptureDocument() || consumed || pendingPayload) {
    return;
  }

  const payload = normalizePayload((event as CustomEvent<unknown>).detail);
  if (!payload) {
    return;
  }

  pendingPayload = payload;
  for (const subscriber of subscribers) {
    subscriber();
  }
}

document.addEventListener(PAYLOAD_EVENT, onPayload);

export function consumeBrowserCapturePayload(): BrowserCapturePayload | null {
  if (consumed || !pendingPayload) {
    return null;
  }
  const payload = pendingPayload;
  pendingPayload = null;
  consumed = true;
  return payload;
}

export function subscribeToBrowserCapturePayload(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export const browserCaptureInboxContract = Object.freeze({
  path: CAPTURE_PATH,
  trailingSlashAllowed: true,
  queryAllowed: false,
  fragmentAllowed: false,
  payloadEvent: PAYLOAD_EVENT,
  memoryOnly: true,
  onePayloadPerDocument: true,
  privateBrowsingAccepted: false,
  persistentStorage: false,
});
