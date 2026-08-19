import "@github/relative-time-element";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useEffect, useRef } from "react";
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

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isIdentityInitialized, initialize: initAuth, currentUser } = useAuth();
  const { isProfileInitialized, initialize: initInstance } = useInstance();
  const initStartedRef = useRef(false);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    const init = async () => {
      await Promise.all([initInstance(), initAuth()]);
    };
    init();
  }, [initAuth, initInstance]);

  useTokenRefreshOnFocus(refreshAccessToken, !!currentUser);
  useLiveMemoRefresh();

  if (!isIdentityInitialized || !isProfileInitialized) {
    return null;
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </ErrorBoundary>
);

export default AppRuntime;
