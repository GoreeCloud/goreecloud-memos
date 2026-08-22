import "@github/relative-time-element";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import "./i18n";
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

// Apply the normal workspace theme and locale before the authenticated shell renders.
applyThemeEarly();
applyLocaleEarly();

type StartupStatus = "opening" | "offline" | "reconnecting";

function GoreeCloudStartupScreen({ status = "opening" }: { status?: StartupStatus }) {
  const message =
    status === "offline"
      ? "You’re offline. Memos will reconnect automatically."
      : status === "reconnecting"
        ? "Reconnecting to your memos…"
        : "Opening your memos…";
  const label = status === "offline" ? "GoreeCloud Memos is offline" : "Opening GoreeCloud Memos";

  return (
    <main
      className="fixed inset-0 grid min-h-dvh place-items-center bg-background px-6 text-foreground"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex min-w-0 max-w-[min(28rem,calc(100vw-3rem))] items-center gap-4 rounded-[1.35rem] border border-border/70 bg-card/95 px-5 py-4 shadow-lg backdrop-blur-md">
        <div
          className="flex size-14 shrink-0 flex-col justify-center gap-1 rounded-[1rem] border border-primary/20 bg-primary/10 px-3"
          aria-hidden
        >
          <span className="h-0.5 w-full rounded-full bg-primary/70" />
          <span className="h-0.5 w-4/5 rounded-full bg-primary/55" />
          <span className="h-0.5 w-3/5 rounded-full bg-primary/40" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[1.1rem] font-semibold tracking-[-0.025em]">GoreeCloud Memos</div>
          <div className="mt-0.5 text-[0.95rem] leading-snug text-muted-foreground">{message}</div>
        </div>
      </div>
    </main>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const {
    isIdentityInitialized,
    isUserSettingsInitialized,
    isLoading: isAuthLoading,
    initialize: initAuth,
    refetchSettings,
    currentUser,
  } = useAuth();
  const { initialize: initInstance } = useInstance();
  const initStartedRef = useRef(false);
  const authRetryPromiseRef = useRef<Promise<void> | null>(null);
  const settingsRetryPromiseRef = useRef<Promise<void> | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine !== false);

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

  const runSettingsRetry = useCallback(() => {
    if (!currentUser || isUserSettingsInitialized || settingsRetryPromiseRef.current) {
      return settingsRetryPromiseRef.current;
    }

    const promise = refetchSettings()
      .catch((error) => {
        console.warn("[AppInitializer] User settings retry deferred", error);
      })
      .finally(() => {
        if (settingsRetryPromiseRef.current === promise) {
          settingsRetryPromiseRef.current = null;
        }
      });
    settingsRetryPromiseRef.current = promise;
    return promise;
  }, [currentUser, isUserSettingsInitialized, refetchSettings]);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    // Authentication identity is the only global first-render gate. Instance
    // profile/settings still initialize in parallel, while route-level guards
    // keep setup/auth/settings pages behind the instance state they require.
    // This lets an authenticated Home route begin rendering as soon as identity
    // is verified instead of waiting on an unrelated public profile request.
    void initInstance();
    void runAuthInitialize();
  }, [initInstance, runAuthInitialize]);

  useEffect(() => {
    const retry = () => {
      if (navigator.onLine === false) return;
      if (!isIdentityInitialized) {
        void runAuthInitialize();
      } else if (!isUserSettingsInitialized) {
        void runSettingsRetry();
      }
    };
    const handleOnline = () => {
      setIsOnline(true);
      retry();
    };
    const handleOffline = () => setIsOnline(false);
    const retryWhenVisible = () => {
      if (document.visibilityState === "visible") {
        setIsOnline(navigator.onLine !== false);
        retry();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", retry);
    window.addEventListener("pageshow", retry);
    document.addEventListener("visibilitychange", retryWhenVisible);

    if (isIdentityInitialized && !isUserSettingsInitialized) {
      void runSettingsRetry();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", retry);
      window.removeEventListener("pageshow", retry);
      document.removeEventListener("visibilitychange", retryWhenVisible);
    };
  }, [isIdentityInitialized, isUserSettingsInitialized, runAuthInitialize, runSettingsRetry]);

  useTokenRefreshOnFocus(refreshAccessToken, !!currentUser);
  useLiveMemoRefresh();

  if (!isIdentityInitialized) {
    const status: StartupStatus = !isOnline ? "offline" : isAuthLoading ? "opening" : "reconnecting";
    return <GoreeCloudStartupScreen status={status} />;
  }

  return <>{children}</>;
}

const AppRuntime = () => (
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

export default AppRuntime;
