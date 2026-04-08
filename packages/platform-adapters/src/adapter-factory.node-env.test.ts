import { afterEach, describe, expect, it, vi } from "vitest";

import { MetaPlatformAdapter } from "./meta/meta-adapter";

describe("createPlatformAdapter with NODE_ENV=production (fresh module graph)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses production adapters and ignores mock master flag", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AGENTICVERDICT_USE_MOCK_ADAPTERS", "1");
    const { createPlatformAdapter } = await import("./adapter-factory");
    const adapter = createPlatformAdapter({
      platform: "meta",
      tenantId: "tenant-1",
    });
    expect(adapter).toBeInstanceOf(MetaPlatformAdapter);
  });
});
