import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appRuntime = readFileSync(join(process.cwd(), "src/AppRuntime.tsx"), "utf8");
const routerGuards = readFileSync(join(process.cwd(), "src/router/guards.tsx"), "utf8");

describe("GoreeCloud Memos startup contract", () => {
  it("uses authentication identity as the global first-render gate", () => {
    expect(appRuntime).toContain("if (!isIdentityInitialized)");
    expect(appRuntime).not.toContain("!isProfileInitialized");
    expect(appRuntime).not.toContain("const { isProfileInitialized, initialize: initInstance }");
  });

  it("starts instance and authentication initialization independently", () => {
    expect(appRuntime).toContain("void initInstance();");
    expect(appRuntime).toContain("void runAuthInitialize();");
    expect(appRuntime).not.toContain("Promise.all([initInstance(), runAuthInitialize()])");
  });

  it("retries incomplete initialization across Android foreground signals", () => {
    expect(appRuntime).toContain('window.addEventListener("online", handleOnline)');
    expect(appRuntime).toContain('window.addEventListener("offline", handleOffline)');
    expect(appRuntime).toContain('window.addEventListener("focus", retry)');
    expect(appRuntime).toContain('window.addEventListener("pageshow", retry)');
    expect(appRuntime).toContain('document.addEventListener("visibilitychange", retryWhenVisible)');
    expect(appRuntime).toContain('document.visibilityState === "visible"');
    expect(appRuntime).toContain('window.removeEventListener("online", handleOnline)');
    expect(appRuntime).toContain('window.removeEventListener("offline", handleOffline)');
    expect(appRuntime).toContain('document.removeEventListener("visibilitychange", retryWhenVisible)');
  });

  it("communicates offline and reconnecting startup states without discarding the session", () => {
    expect(appRuntime).toContain('type StartupStatus = "opening" | "offline" | "reconnecting"');
    expect(appRuntime).toContain("You’re offline. Memos will reconnect automatically.");
    expect(appRuntime).toContain("Reconnecting to your memos…");
    expect(appRuntime).toContain('const [isOnline, setIsOnline] = useState(() => navigator.onLine !== false)');
    expect(appRuntime).toContain('const status: StartupStatus = !isOnline ? "offline" : isAuthLoading ? "opening" : "reconnecting"');
    expect(appRuntime).toContain("return <GoreeCloudStartupScreen status={status} />;");
  });

  it("keeps routes that need instance or full settings behind route-level guards", () => {
    expect(routerGuards).toContain("export const RequireInstanceInitializationRoute");
    expect(routerGuards).toContain("return isInitialized ? <Outlet /> : null;");
    expect(routerGuards).toContain("export const RequireFullInitializationRoute");
    expect(routerGuards).toContain("return authInitialized && instanceInitialized ? <Outlet /> : null;");
  });
});
