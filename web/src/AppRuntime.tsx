import "@github/relative-time-element";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef } from "react";
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

function GoreeCloudStartupScreen() {
  return (
    <main
      className="fixed inset-0 grid min-h-dvh place-items-center bg-background px-6 text-foreground"
      role="status"
      aria-live="polite"
      aria-label="Opening GoreeCloud Memos"
    >
      <div className="flex min-w-0 items-center gap-4 rounded-[1.35rem] border border-border/70 bg-card/95 px-5 py-4 shadow-lg backdrop-blur-md">
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
          <div className="mt-0.5 text-[0.95rem] text-muted-foreground">Opening your memos…</div>
        </div>
      </div>
    </main>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isIdentityInitialized, isUserSettingsInitialized, initialize: initAuth, refetchSettings, currentUser } = useAuth();
  const { initialize: initInstance } = useInstance();
  const initStartedRef = useRef(false);
  const authRetryPromiseRef = useRef<Promise<void> | null>(null);
  const settingsRetryPromiseRef = useRef<Promise<void> | null>(null);

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

    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    window.addEventListener("pageshow", retry);

    if (isIdentityInitialized && !isUserSettingsInitialized) {
      void runSettingsRetry();
    }

    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      window.removeEventListener("pageshow", retry);
    };
  }, [isIdentityInitialized, isUserSettingsInitialized, runAuthInitialize, runSettingsRetry]);

  useTokenRefreshOnFocus(refreshAccessToken, !!currentUser);
  useLiveMemoRefresh();

  if (!isIdentityInitialized) {
    return <GoreeCloudStartupScreen />;
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
