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

  it("keeps routes that need instance or full settings behind route-level guards", () => {
    expect(routerGuards).toContain("export const RequireInstanceInitializationRoute");
    expect(routerGuards).toContain("return isInitialized ? <Outlet /> : null;");
    expect(routerGuards).toContain("export const RequireFullInitializationRoute");
    expect(routerGuards).toContain("return authInitialized && instanceInitialized ? <Outlet /> : null;");
  });
});
