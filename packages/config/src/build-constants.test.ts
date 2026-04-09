import { afterEach, describe, expect, it, vi } from "vitest";

describe("BUILD_CONFIG", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("infers environment and flags after dynamic import with stubbed NODE_ENV", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { BUILD_CONFIG, IS_PRODUCTION } = await import("./build-constants");
    expect(BUILD_CONFIG.environment).toBe("test");
    expect(typeof BUILD_CONFIG.isProduction).toBe("boolean");
    expect(BUILD_CONFIG.mockAdaptersEnabled).toBe(true);
    expect(IS_PRODUCTION).toBe(false);
  });

  it("marks production when NODE_ENV is production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { BUILD_CONFIG, IS_PRODUCTION } = await import("./build-constants");
    expect(BUILD_CONFIG.isProduction).toBe(true);
    expect(BUILD_CONFIG.mockAdaptersEnabled).toBe(false);
    expect(IS_PRODUCTION).toBe(true);
  });

  it("rejects assignment to frozen BUILD_CONFIG in strict mode", async () => {
    const { BUILD_CONFIG } = await import("./build-constants");
    expect(() => {
      (BUILD_CONFIG as { environment?: string }).environment = "test";
    }).toThrow();
  });
});

describe("type guards", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("isProductionBuild / isDevelopmentBuild / isTestBuild return booleans", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { isProductionBuild, isDevelopmentBuild, isTestBuild } =
      await import("./build-constants");
    expect(typeof isProductionBuild()).toBe("boolean");
    expect(typeof isDevelopmentBuild()).toBe("boolean");
    expect(typeof isTestBuild()).toBe("boolean");
    expect(isDevelopmentBuild()).toBe(true);
  });
});
