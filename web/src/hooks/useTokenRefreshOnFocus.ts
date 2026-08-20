import { useEffect } from "react";
import { FOCUS_TOKEN_EXPIRY_BUFFER_MS, hasStoredToken, isTokenExpired } from "@/auth-state";

/**
 * Proactively refreshes an expiring access token when a browser/PWA/native
 * webview returns to the foreground or regains connectivity.
 *
 * Android WebView lifecycle transitions are not represented consistently by a
 * single DOM event across OS versions. Listening to visibilitychange, focus,
 * pageshow, and online keeps the refresh path reliable without polling in the
 * background. Concurrent attempts are safe because connect.ts deduplicates them.
 */
export function useTokenRefreshOnFocus(refreshFn: () => Promise<void>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    let disposed = false;

    const refreshIfNeeded = async () => {
      if (disposed || document.visibilityState === "hidden") {
        return;
      }

      if (!hasStoredToken() || !isTokenExpired(FOCUS_TOKEN_EXPIRY_BUFFER_MS)) {
        return;
      }

      try {
        await refreshFn();
      } catch (error) {
        // A transient mobile-network/server failure is intentionally non-fatal.
        // connect.ts only redirects after an explicit Unauthenticated refresh
        // response, so the next foreground/online event can recover the session.
        console.warn("[useTokenRefreshOnFocus] Session refresh deferred", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshIfNeeded();
      }
    };
    const handleForegroundSignal = () => void refreshIfNeeded();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleForegroundSignal);
    window.addEventListener("pageshow", handleForegroundSignal);
    window.addEventListener("online", handleForegroundSignal);

    // Also cover the case where the hook becomes enabled after authentication
    // while the app is already visible.
    void refreshIfNeeded();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleForegroundSignal);
      window.removeEventListener("pageshow", handleForegroundSignal);
      window.removeEventListener("online", handleForegroundSignal);
    };
  }, [refreshFn, enabled]);
}
