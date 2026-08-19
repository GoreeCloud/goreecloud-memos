import { useEffect, useMemo, useState } from "react";
import { clearBrowserCaptureAuthentication, createBrowserCaptureMemo } from "@/browser-capture/client";
import {
  consumeBrowserCapturePayload,
  subscribeToBrowserCapturePayload,
  type BrowserCapturePayload,
} from "@/browser-capture/inbox";
import GoreeCloudMemosMark from "@/components/GoreeCloudMemosMark";

const RESULT_EVENT = "GoreeCloudCaptureResult";
const MAX_EDITOR_LENGTH = 16_384;

type CaptureState = "waiting" | "ready" | "saving" | "saved" | "cancelled";

function initialMemoContent(payload: BrowserCapturePayload): string {
  const sourceUrl = payload.linkUrl || payload.pageUrl;
  const body = payload.text.trim();
  const title = payload.title.trim();

  const parts: string[] = [];
  if (body) {
    parts.push(body);
  } else if (title) {
    parts.push(title);
  }
  if (sourceUrl) {
    parts.push(`Source: ${sourceUrl}`);
  }
  return parts.join("\n\n").slice(0, MAX_EDITOR_LENGTH);
}

function reportResult(status: "saved" | "cancelled") {
  document.dispatchEvent(
    new CustomEvent(RESULT_EVENT, {
      bubbles: false,
      cancelable: false,
      detail: { status },
    }),
  );
}

const BrowserCapture = () => {
  const [payload, setPayload] = useState<BrowserCapturePayload | null>(() => consumeBrowserCapturePayload());
  const [content, setContent] = useState(() => (payload ? initialMemoContent(payload) : ""));
  const [state, setState] = useState<CaptureState>(payload ? "ready" : "waiting");
  const [error, setError] = useState("");
  const [savedMemoName, setSavedMemoName] = useState("");

  useEffect(() => {
    if (payload) {
      return;
    }
    return subscribeToBrowserCapturePayload(() => {
      const next = consumeBrowserCapturePayload();
      if (!next) {
        return;
      }
      setPayload(next);
      setContent(initialMemoContent(next));
      setState("ready");
    });
  }, [payload]);

  useEffect(() => () => clearBrowserCaptureAuthentication(), []);

  const sourceUrl = useMemo(() => payload?.linkUrl || payload?.pageUrl || "", [payload]);

  const save = async () => {
    if (state !== "ready" || !content.trim()) {
      return;
    }
    setState("saving");
    setError("");
    try {
      const memoName = await createBrowserCaptureMemo(content);
      setSavedMemoName(memoName);
      setState("saved");
      reportResult("saved");
    } catch (cause) {
      setState("ready");
      setError(cause instanceof Error ? cause.message : "The memo could not be saved.");
    }
  };

  const cancel = () => {
    if (state === "saved" || state === "cancelled") {
      return;
    }
    clearBrowserCaptureAuthentication();
    setState("cancelled");
    reportResult("cancelled");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur-xl sm:p-7">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/80">
            <GoreeCloudMemosMark className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">GoreeCloud Browser</p>
            <h1 className="text-xl font-semibold tracking-tight">Create GoreeCloud Memo</h1>
          </div>
        </header>

        {state === "waiting" && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
            <h2 className="font-medium">Waiting for Browser capture</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This page accepts a one-time capture from GoreeCloud Browser. No memo is created until you review and save it.
            </p>
          </div>
        )}

        {(state === "ready" || state === "saving") && payload && (
          <div className="space-y-5">
            {sourceUrl && (
              <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</p>
                <p className="mt-1 break-all text-sm">{sourceUrl}</p>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Memo</span>
              <textarea
                autoFocus
                value={content}
                maxLength={MAX_EDITOR_LENGTH}
                disabled={state === "saving"}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-56 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                aria-describedby={error ? "browser-capture-error" : undefined}
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Saved as a private memo.</span>
                <span>{content.length.toLocaleString()} / {MAX_EDITOR_LENGTH.toLocaleString()}</span>
              </div>
            </label>

            {error && (
              <div id="browser-capture-error" role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
                {error} If your Memos session expired, sign in to GoreeCloud Memos in another tab and retry here.
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancel}
                disabled={state === "saving"}
                className="min-h-11 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={state === "saving" || !content.trim()}
                className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "saving" ? "Saving…" : "Save Memo"}
              </button>
            </div>
          </div>
        )}

        {state === "saved" && (
          <div className="rounded-2xl border border-border bg-muted/30 p-5" role="status">
            <h2 className="font-medium">Memo saved</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              GoreeCloud Memos confirmed the write{savedMemoName ? ` (${savedMemoName})` : ""}. You can close this tab.
            </p>
          </div>
        )}

        {state === "cancelled" && (
          <div className="rounded-2xl border border-border bg-muted/30 p-5" role="status">
            <h2 className="font-medium">Capture cancelled</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">No memo was created. You can close this tab.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default BrowserCapture;
