import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ConfigManager } from "../src/index";

const repoConfigsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "configs",
  "tenants",
);

describe("versioned repo configs", () => {
  it("validates Masafh and demo tenant JSON files", async () => {
    const manager = new ConfigManager({
      configDir: repoConfigsDir,
      defaultTtlMs: 0,
    });
    const masafh = await manager.loadTenantConfig("11111111-1111-4111-8111-111111111111", {
      bypassCache: true,
    });
    expect(masafh.tenantName).toBe("Masafh");
    const demo = await manager.loadTenantConfig("22222222-2222-4222-8222-222222222222", {
      bypassCache: true,
    });
    expect(demo.localization.language).toBe("en");
  });
});
