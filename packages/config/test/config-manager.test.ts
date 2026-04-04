import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import { clearCompanyConfigCache, ConfigManager, companyConfigMergeEnvKey } from "../src/index";

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "companies",
);

const fixtureCompanyId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

afterEach(() => {
  clearCompanyConfigCache();
  vi.unstubAllGlobals();
  delete process.env[companyConfigMergeEnvKey(fixtureCompanyId)];
});

describe("ConfigManager", () => {
  it("loads and validates a fixture file", async () => {
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 60_000,
    });
    const config = await manager.loadCompanyConfig(fixtureCompanyId, {
      bypassCache: true,
    });
    expect(config.companyName).toBe("Fixture Co");
  });

  it("returns cached config within TTL", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 10_000,
      now: () => Date.now(),
    });
    const first = await manager.loadCompanyConfig(fixtureCompanyId);
    const second = await manager.loadCompanyConfig(fixtureCompanyId);
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
    const first = await manager.loadCompanyConfig(fixtureCompanyId);
    t += 2_000;
    const second = await manager.loadCompanyConfig(fixtureCompanyId);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });

  it("merges env JSON patch before validation", async () => {
    process.env[companyConfigMergeEnvKey(fixtureCompanyId)] = JSON.stringify({
      companyName: "Patched Name",
    });
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 0,
    });
    const config = await manager.loadCompanyConfig(fixtureCompanyId, {
      bypassCache: true,
    });
    expect(config.companyName).toBe("Patched Name");
  });

  it("throws ConfigValidationError when merge produces invalid config", async () => {
    process.env[companyConfigMergeEnvKey(fixtureCompanyId)] = JSON.stringify({
      localization: { language: "xx" },
    });
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 0,
    });
    await expect(
      manager.loadCompanyConfig(fixtureCompanyId, { bypassCache: true }),
    ).rejects.toMatchObject({ name: "ConfigValidationError" });
  });

  it("throws when JSON companyId does not match filename id", async () => {
    const manager = new ConfigManager({
      configDir: fixturesDir,
      defaultTtlMs: 0,
    });
    await expect(
      manager.loadCompanyConfig("bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", {
        bypassCache: true,
      }),
    ).rejects.toThrow(/expected bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb/);
  });
});
