import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const connectSource = readFileSync(join(process.cwd(), "src/connect.ts"), "utf8");
const authContext = readFileSync(join(process.cwd(), "src/contexts/AuthContext.tsx"), "utf8");
const focusRefreshHook = readFileSync(join(process.cwd(), "src/hooks/useTokenRefreshOnFocus.ts"), "utf8");
const mainSource = readFileSync(join(process.cwd(), "src/main.tsx"), "utf8");
const appRuntime = readFileSync(join(process.cwd(), "src/AppRuntime.tsx"), "utf8");
const webIndex = readFileSync(join(process.cwd(), "index.html"), "utf8");
const nativeLib = readFileSync(join(process.cwd(), "../clients/goreecloud-memos/src-tauri/src/lib.rs"), "utf8");
const nativeLaunch = readFileSync(join(process.cwd(), "../clients/goreecloud-memos/frontend/launch.js"), "utf8");
const nativeIndex = readFileSync(join(process.cwd(), "../clients/goreecloud-memos/frontend/index.html"), "utf8");

describe("GoreeCloud Memos mobile session and startup contract", () => {
  it("only treats an explicit unauthenticated refresh response as a lost session", () => {
    expect(connectSource).toContain("export function isDefinitiveAuthFailure");
    expect(connectSource).toContain("error instanceof ConnectError && error.code === Code.Unauthenticated");
    expect(connectSource).toContain("if (isDefinitiveAuthFailure(refreshError))");
    expect(connectSource).toContain("redirectOnAuthFailure();");
    expect(connectSource).not.toContain("catch (refreshError) {\n      redirectOnAuthFailure();");
  });

  it("preserves stored login state across bounded mobile reconnect failures", () => {
    expect(authContext).toContain("Session refresh deferred until connectivity recovers");
    expect(authContext).toContain("for (let attempt = 0; attempt < 2 && !getAccessToken(); attempt += 1)");
    expect(authContext).toContain("for (let attempt = 0; attempt < 3; attempt += 1)");
    expect(authContext).toContain("if (isDefinitiveAuthFailure(refreshFailure))");
    expect(authContext).toContain("if (isDefinitiveAuthFailure(error))");
    expect(authContext).toContain("isUserSettingsInitialized: false");
  });

  it("refreshes on the lifecycle signals Android WebView can emit after inactivity", () => {
    expect(focusRefreshHook).toContain('document.addEventListener("visibilitychange"');
    expect(focusRefreshHook).toContain('window.addEventListener("focus"');
    expect(focusRefreshHook).toContain('window.addEventListener("pageshow"');
    expect(focusRefreshHook).toContain('window.addEventListener("online"');
    expect(focusRefreshHook).toContain("void refreshIfNeeded();");
  });

  it("keeps Browser capture isolated while the normal workspace shows a launch surface", () => {
    expect(mainSource).toContain('await import("@/pages/BrowserCapture")');
    expect(mainSource).toContain('await import("./AppRuntime")');
    expect(mainSource).not.toContain("AuthProvider");
    expect(appRuntime).toContain("function GoreeCloudStartupScreen");
    expect(appRuntime).toContain("Opening your memos…");
    expect(appRuntime).toContain("return <GoreeCloudStartupScreen />;");
    expect(appRuntime).toContain('window.addEventListener("online", retry)');
    expect(appRuntime).toContain("runSettingsRetry");
    expect(appRuntime).not.toContain("ReactQueryDevtools");
  });

  it("keeps a static first paint and does not force document no-cache metadata", () => {
    expect(webIndex).toContain('aria-label="Opening GoreeCloud Memos"');
    expect(webIndex).toContain("Opening your memos…");
    expect(webIndex).not.toContain('http-equiv="Cache-Control"');
    expect(webIndex).not.toContain('http-equiv="Pragma"');
    expect(webIndex).not.toContain('http-equiv="Expires"');
  });

  it("uses a bundled native first frame before navigating to the canonical private app", () => {
    expect(nativeLib).toContain('WebviewUrl::App(PathBuf::from("index.html"))');
    expect(nativeLib).toContain('("tauri", Some("localhost"))');
    expect(nativeLib).toContain('("http", Some("tauri.localhost"))');
    expect(nativeLib).toContain('url.host_str() == Some(APP_HOST)');
    expect(nativeLaunch).toContain('const APP_URL = "https://memos.goreecloud.com/"');
    expect(nativeLaunch).toContain("requestAnimationFrame");
    expect(nativeLaunch).toContain("window.location.replace(APP_URL)");
    expect(nativeIndex).toContain('rel="preconnect" href="https://memos.goreecloud.com"');
    expect(nativeIndex).toContain("Opening your memos…");
  });
});
