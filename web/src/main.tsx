import "@github/relative-time-element";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import "./i18n";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { refreshAccessToken } from "@/connect";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { InstanceProvider, useInstance } from "@/contexts/InstanceContext";
import { ViewProvider } from "@/contexts/ViewContext";
import { useLiveMemoRefresh } from "@/hooks/useLiveMemoRefresh";
import { useTokenRefreshOnFocus } from "@/hooks/useTokenRefreshOnFocus";
import { queryClient } from "@/lib/query-client";
import router from "./router";
import { applyLocaleEarly } from "./utils/i18n";
import { applyThemeEarly } from "./utils/theme";

// Apply theme and locale early to prevent flash
applyThemeEarly();
applyLocaleEarly();

function GoreeCloudStartupScreen() {
  return (
    <main className="gc-boot-screen" role="status" aria-live="polite" aria-label="Opening GoreeCloud Memos">
      <div className="gc-boot-card">
        <div className="gc-boot-mark" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div>
          <div className="gc-boot-title">GoreeCloud Memos</div>
          <div className="gc-boot-status">Opening your memos…</div>
        </div>
      </div>
    </main>
  );
}

// Inner component that initializes contexts
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isIdentityInitialized, initialize: initAuth, currentUser } = useAuth();
  const { isProfileInitialized, initialize: initInstance } = useInstance();
  const initStartedRef = useRef(false);
  const authRetryPromiseRef = useRef<Promise<void> | null>(null);

  const runAuthInitialize = useCallback(() => {
    if (authRetryPromiseRef.current) return authRetryPromiseRef.current;
    const promise = initAuth().finally(() => {
      if (authRetryPromiseRef.current === promise) {
        authRetryPromiseRef.current = null;
      }
    });
    authRetryPromiseRef.current = promise;
    return promise;
  }, [initAuth]);

  // Initialize on mount - run in parallel for better performance.
  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    void Promise.all([initInstance(), runAuthInitialize()]);
  }, [initInstance, runAuthInitialize]);

  // If a cold start happened while Android was still restoring connectivity,
  // AuthContext intentionally keeps identity unsettled rather than falsely signing
  // the user out. Retry on the lifecycle/network signals that commonly follow.
  useEffect(() => {
    if (isIdentityInitialized) return;

    const retry = () => {
      if (navigator.onLine === false) return;
      void runAuthInitialize();
    };

    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    window.addEventListener("pageshow", retry);

    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      window.removeEventListener("pageshow", retry);
    };
  }, [isIdentityInitialized, runAuthInitialize]);

  // Proactively refresh token on foreground/reconnect signals to prevent stale
  // access tokens from reaching queries after Android resumes the webview.
  useTokenRefreshOnFocus(refreshAccessToken, !!currentUser);

  // Live refresh: listen for memo changes via SSE and invalidate caches.
  useLiveMemoRefresh();

  // Keep a real first-paint surface visible instead of clearing the webview to a
  // blank page while identity/profile verification is in flight.
  if (!isIdentityInitialized || !isProfileInitialized) {
    return <GoreeCloudStartupScreen />;
  }

  return <>{children}</>;
}

function Main() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <InstanceProvider>
          <AuthProvider>
            <TooltipProvider>
              <ViewProvider>
                <AppInitializer>
                  <RouterProvider router={router} />
                  <Toaster position="top-right" />
                </AppInitializer>
              </ViewProvider>
            </TooltipProvider>
          </AuthProvider>
        </InstanceProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);
root.render(<Main />);
