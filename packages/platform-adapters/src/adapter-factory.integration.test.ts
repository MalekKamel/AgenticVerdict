import { afterEach, describe, expect, it, vi } from "vitest";

describe("createPlatformAdapter integration (dynamic NODE_ENV)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns mock adapter in development when master mock flag is on", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AGENTICVERDICT_USE_MOCK_ADAPTERS", "1");
    const { createPlatformAdapter } = await import("./adapter-factory");
    const { MockPlatformAdapter } = await import("./mock-adapter");
    const adapter = createPlatformAdapter({
      platform: "meta",
      tenantId: "tenant-1",
    });
    expect(adapter).toBeInstanceOf(MockPlatformAdapter);
  });

  it("returns production adapter in development when useMock is false", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AGENTICVERDICT_USE_MOCK_ADAPTERS", "1");
    const { createPlatformAdapter } = await import("./adapter-factory");
    const { MetaPlatformAdapter } = await import("./meta/meta-adapter");
    const adapter = createPlatformAdapter({
      platform: "meta",
      tenantId: "tenant-1",
      useMock: false,
    });
    expect(adapter).toBeInstanceOf(MetaPlatformAdapter);
  });
});
