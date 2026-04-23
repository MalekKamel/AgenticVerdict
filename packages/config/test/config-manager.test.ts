import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearTenantConfigCache,
  ConfigManager,
  resolveConfigDir,
  tenantConfigMergeEnvKey,
} from "../src/index";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "tenants");

const fixtureTenantId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

afterEach(() => {
  clearTenantConfigCache();
  vi.unstubAllGlobals();
  delete process.env[tenantConfigMergeEnvKey(fixtureTenantId)];
});

describe("ConfigManager", () => {
  it("resolves configs/tenants when present in repo root", () => {
    const tenantsDir = path.join(process.cwd(), "configs", "tenants");
    if (!existsSync(tenantsDir)) {
      return;
    }
    expect(resolveConfigDir()).toBe(tenantsDir);
  });

  it("loads and validates a fixture file", async () => {
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 60_000,
    });
    const config = await manager.loadTenantConfig(fixtureTenantId, {
      bypassCache: true,
    });
    expect(config.tenantName).toBe("Fixture Co");
  });

  it("returns cached config within TTL", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 10_000,
      now: () => Date.now(),
    });
    const first = await manager.loadTenantConfig(fixtureTenantId);
    const second = await manager.loadTenantConfig(fixtureTenantId);
    expect(second).toBe(first);
    now.mockRestore();
  });

  it("refetches after TTL", async () => {
    let t = 0;
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 1_000,
      now: () => t,
    });
    const first = await manager.loadTenantConfig(fixtureTenantId);
    t += 2_000;
    const second = await manager.loadTenantConfig(fixtureTenantId);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });

  it("merges env JSON patch before validation", async () => {
    process.env[tenantConfigMergeEnvKey(fixtureTenantId)] = JSON.stringify({
      tenantName: "Patched Name",
    });
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 0,
    });
    const config = await manager.loadTenantConfig(fixtureTenantId, {
      bypassCache: true,
    });
    expect(config.tenantName).toBe("Patched Name");
  });

  it("throws ConfigValidationError when merge produces invalid config", async () => {
    process.env[tenantConfigMergeEnvKey(fixtureTenantId)] = JSON.stringify({
      localization: { language: "xx" },
    });
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 0,
    });
    await expect(
      manager.loadTenantConfig(fixtureTenantId, { bypassCache: true }),
    ).rejects.toMatchObject({ name: "ConfigValidationError" });
  });

  it("throws when JSON tenantId does not match filename id", async () => {
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 0,
    });
    await expect(
      manager.loadTenantConfig("bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", {
        bypassCache: true,
      }),
    ).rejects.toThrow(/expected bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb/);
  });
});
