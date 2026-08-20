import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { clearAccessToken, getAccessToken } from "@/auth-state";
import { authServiceClient, isDefinitiveAuthFailure, refreshAccessToken, userServiceClient } from "@/connect";
import { userKeys } from "@/hooks/useUserQueries";
import type {
  User,
  UserSetting_GeneralSetting,
  UserSetting_TagsSetting,
  UserSetting_WebhooksSetting,
} from "@/types/proto/api/v1/user_service_pb";

interface AuthState {
  currentUser: User | undefined;
  userGeneralSetting: UserSetting_GeneralSetting | undefined;
  userWebhooksSetting: UserSetting_WebhooksSetting | undefined;
  userTagsSetting: UserSetting_TagsSetting | undefined;
  /** Authentication identity has settled, while user settings may still be loading. */
  isIdentityInitialized: boolean;
  /** User settings that affect memo presentation are safe to consume. */
  isUserSettingsInitialized: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refetchSettings: () => Promise<void>;
  setCurrentUser: (user: User | undefined) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Settled auth state for a request with no valid session (init finished, not loading). */
const UNAUTHENTICATED_STATE: AuthState = {
  currentUser: undefined,
  userGeneralSetting: undefined,
  userWebhooksSetting: undefined,
  userTagsSetting: undefined,
  isIdentityInitialized: true,
  isUserSettingsInitialized: true,
  isInitialized: true,
  isLoading: false,
};

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    currentUser: undefined,
    userGeneralSetting: undefined,
    userWebhooksSetting: undefined,
    userTagsSetting: undefined,
    isIdentityInitialized: false,
    isUserSettingsInitialized: false,
    isInitialized: false,
    isLoading: true,
  });

  const fetchUserSettings = useCallback(async (userName: string) => {
    const { settings } = await userServiceClient.listUserSettings({ parent: userName });
    const generalSetting = settings.find((s) => s.value.case === "generalSetting");
    const webhooksSetting = settings.find((s) => s.value.case === "webhooksSetting");
    const tagsSetting = settings.find((s) => s.value.case === "tagsSetting");
    const userSettings = {
      userGeneralSetting: generalSetting?.value.case === "generalSetting" ? generalSetting.value.value : undefined,
      userWebhooksSetting: webhooksSetting?.value.case === "webhooksSetting" ? webhooksSetting.value.value : undefined,
      userTagsSetting: tagsSetting?.value.case === "tagsSetting" ? tagsSetting.value.value : undefined,
    };

    // Tag settings control sensitive-content blurring. Publish them as soon as
    // this request settles; memo views are managed separately by React Query.
    setState((prev) =>
      prev.currentUser?.name === userName
        ? {
            ...prev,
            ...userSettings,
            isUserSettingsInitialized: true,
          }
        : prev,
    );

    return userSettings;
  }, []);

  const initialize = useCallback(async () => {
    // `initialize` also runs after sign-in, when the previous unauthenticated
    // state is already marked initialized. Reset the full-readiness flag so
    // consumers cannot render with the new identity and stale/default settings.
    setState((prev) => ({ ...prev, isUserSettingsInitialized: false, isInitialized: false, isLoading: true }));

    // Try to get or refresh the access token.
    // This handles PWA isolated storage scenarios (e.g., iOS Safari) where localStorage
    // may be empty but a valid HTTP-only refresh token cookie still exists.
    // getAccessToken() returns a cached token or loads from localStorage if valid.
    if (!getAccessToken()) {
      try {
        await refreshAccessToken();
      } catch (error) {
        // A missing/invalid refresh session is handled below. A temporary mobile
        // reconnect failure must not erase the stored login state.
        if (!isDefinitiveAuthFailure(error)) {
          console.warn("[AuthContext] Session refresh deferred until connectivity recovers", error);
        }
      }
    }

    // If we still don't have a token after refresh attempt, skip getCurrentUser call.
    // Only clear the persisted login when the server explicitly rejects the refresh
    // session; a transient network failure keeps initialization unsettled so the app
    // can retry on foreground/reconnect instead of showing a false signed-out state.
    if (!getAccessToken()) {
      try {
        await refreshAccessToken();
      } catch (error) {
        if (isDefinitiveAuthFailure(error)) {
          clearAccessToken();
          setState(UNAUTHENTICATED_STATE);
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
        return;
      }
    }

    let currentUser: User | undefined;
    try {
      // Android WebView can resume while connectivity is still settling. Give
      // identity verification a short bounded retry window before surfacing a
      // reconnecting state. Definitive authentication failures are never retried.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await authServiceClient.getCurrentUser({});
          currentUser = response.user;
          break;
        } catch (error) {
          if (isDefinitiveAuthFailure(error) || attempt === 2) {
            throw error;
          }
          await sleep(300 * (attempt + 1));
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth identity:", error);
      if (isDefinitiveAuthFailure(error)) {
        clearAccessToken();
        setState(UNAUTHENTICATED_STATE);
      } else {
        // Preserve the refresh cookie and local token. AppInitializer keeps the
        // Glaze startup/reconnecting surface visible and retries on foreground or
        // network restoration rather than forcing a sign-in.
        setState((prev) => ({ ...prev, isLoading: false }));
      }
      return;
    }

    if (!currentUser) {
      clearAccessToken();
      setState(UNAUTHENTICATED_STATE);
      return;
    }

    // Publish the verified identity immediately so route modules and their
    // data queries can start while display-sensitive settings are loading.
    setState((prev) => ({
      ...prev,
      currentUser,
      isIdentityInitialized: true,
    }));

    queryClient.setQueryData(userKeys.currentUser(), currentUser);
    queryClient.setQueryData(userKeys.detail(currentUser.name), currentUser);

    try {
      const settings = await fetchUserSettings(currentUser.name);

      setState({
        currentUser,
        ...settings,
        isIdentityInitialized: true,
        isUserSettingsInitialized: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      // Settings are presentation state, not proof that the login has expired.
      // Preserve the authenticated identity and fail closed by leaving sensitive
      // user settings unsettled until a later retry succeeds.
      console.error("Failed to initialize user settings:", error);
      setState((prev) => ({
        ...prev,
        currentUser,
        isIdentityInitialized: true,
        isUserSettingsInitialized: false,
        isInitialized: true,
        isLoading: false,
      }));
    }
  }, [fetchUserSettings, queryClient]);

  const logout = useCallback(async () => {
    try {
      await authServiceClient.signOut({});
    } catch (error) {
      console.error("[AuthContext] Failed to sign out:", error);
    } finally {
      clearAccessToken();
      setState(UNAUTHENTICATED_STATE);
      queryClient.clear();
    }
  }, [queryClient]);

  const refetchSettings = useCallback(async () => {
    const currentUserName = state.currentUser?.name;
    if (!currentUserName) {
      return;
    }

    const settings = await fetchUserSettings(currentUserName);
    setState((prev) => {
      if (prev.currentUser?.name !== currentUserName) {
        return prev;
      }
      return { ...prev, ...settings };
    });
  }, [fetchUserSettings, state.currentUser?.name]);

  // Sync the updated user to AuthContext and React Query cache after profile changes
  const setCurrentUser = useCallback(
    (user: User | undefined) => {
      const previousUser = queryClient.getQueryData<User>(userKeys.currentUser());
      setState((prev) => ({ ...prev, currentUser: user }));
      if (user) {
        queryClient.setQueryData(userKeys.currentUser(), user);
        queryClient.setQueryData(userKeys.detail(user.name), user);
      } else {
        queryClient.removeQueries({ queryKey: userKeys.currentUser(), exact: true });
        if (previousUser?.name) {
          queryClient.removeQueries({ queryKey: userKeys.detail(previousUser.name), exact: true });
        }
      }
    },
    [queryClient],
  );

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(
    () => ({
      ...state,
      initialize,
      logout,
      refetchSettings,
      setCurrentUser,
    }),
    [state, initialize, logout, refetchSettings, setCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Convenience hook for just the current user
export function useCurrentUserFromAuth() {
  const { currentUser } = useAuth();
  return currentUser;
}
