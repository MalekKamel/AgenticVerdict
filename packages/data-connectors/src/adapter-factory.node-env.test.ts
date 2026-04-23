import { afterEach, describe, expect, it, vi } from "vitest";

describe("createConnectorAdapter with NODE_ENV=production (fresh module graph)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses production adapters and ignores mock master flag", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AGENTICVERDICT_MOCK_MODE", "all");
    const [{ createConnectorAdapter }, { MetaConnectorAdapter }] = await Promise.all([
      import("./adapter-factory"),
      import("./meta/meta-adapter"),
    ]);
    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
    });
    expect(adapter).toBeInstanceOf(MetaConnectorAdapter);
  }, 15_000);
});
