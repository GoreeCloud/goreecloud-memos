import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useInstance } from "./contexts/InstanceContext";
import useNavigateTo from "./hooks/useNavigateTo";
import { useUserLocale } from "./hooks/useUserLocale";
import { useUserTheme } from "./hooks/useUserTheme";
import { GOREECLOUD_MEMOS_DEFAULT_TITLE, resolveInstanceLogoUrl } from "./utils/instance-branding";
import { cleanupExpiredOAuthState } from "./utils/oauth";

const App = () => {
  const navigateTo = useNavigateTo();
  const { profile: instanceProfile, profileLoaded, generalSetting: instanceGeneralSetting } = useInstance();

  // Apply user preferences reactively.
  useUserLocale();
  useUserTheme();

  // Clean up expired OAuth states on app initialization.
  useEffect(() => {
    cleanupExpiredOAuthState();
  }, []);

  // Redirect to sign up page if the instance needs initial setup (no users yet).
  // needsSetup is used instead of a missing admin so an instance that has lost its
  // admins isn't mistaken for a fresh install (which would create a normal user).
  // Guard with profileLoaded so a fetch failure doesn't incorrectly trigger the redirect.
  useEffect(() => {
    if (profileLoaded && instanceProfile.needsSetup) {
      navigateTo("/auth/signup");
    }
  }, [profileLoaded, instanceProfile.needsSetup, navigateTo]);

  // GoreeCloud intentionally does not execute the inherited additionalScript or
  // additionalStyle instance fields. Stored arbitrary code would run in every
  // signed-in browser context, can alter security-relevant UI, and can cause
  // unreviewed third-party network requests. The server also rejects new values.

  // Keep instance metadata customizable while resolving branding assets only
  // from the current Memos origin. Unsafe legacy logo URLs fail closed to the
  // canonical GoreeCloud Memos asset.
  useEffect(() => {
    const customProfile = instanceGeneralSetting.customProfile;
    document.title = customProfile?.title?.trim() || GOREECLOUD_MEMOS_DEFAULT_TITLE;

    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (link) {
      link.href = resolveInstanceLogoUrl(customProfile?.logoUrl);
    }
  }, [instanceGeneralSetting.customProfile]);

  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
};

export default App;
