import { afterEach, describe, expect, it, vi } from "vitest";

describe("createConnectorAdapter integration (dynamic NODE_ENV)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns mock adapter in development when master mock flag is on", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AGENTICVERDICT_USE_MOCK_ADAPTERS", "1");
    const { createConnectorAdapter } = await import("./adapter-factory");
    const { MockConnectorAdapter } = await import("./mock-adapter");
    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
    });
    expect(adapter).toBeInstanceOf(MockConnectorAdapter);
  });

  it("returns production adapter in development when useMock is false", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AGENTICVERDICT_USE_MOCK_ADAPTERS", "1");
    const { createConnectorAdapter } = await import("./adapter-factory");
    const { MetaConnectorAdapter } = await import("./meta/meta-adapter");
    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
      useMock: false,
    });
    expect(adapter).toBeInstanceOf(MetaConnectorAdapter);
  });
});
