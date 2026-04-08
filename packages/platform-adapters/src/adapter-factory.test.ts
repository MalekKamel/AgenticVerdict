import { afterEach, describe, expect, it } from "vitest";

import { createPlatformAdapter, isMockEnabledForPlatform } from "./adapter-factory";
import { MockPlatformAdapter } from "./mock-adapter";
import { MetaPlatformAdapter } from "./meta/meta-adapter";

describe("createPlatformAdapter", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
    delete process.env.AGENTICVERDICT_MOCK_META;
  });

  it("uses mock adapter when master flag is enabled", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";

    const adapter = createPlatformAdapter({
      platform: "meta",
      tenantId: "tenant-1",
    });

    expect(adapter).toBeInstanceOf(MockPlatformAdapter);
  });

  it("lets platform flag override master flag", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";
    process.env.AGENTICVERDICT_MOCK_META = "0";

    const adapter = createPlatformAdapter({
      platform: "meta",
      tenantId: "tenant-1",
    });

    expect(adapter).toBeInstanceOf(MetaPlatformAdapter);
  });

  it("allows explicit useMock override", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "0";

    const adapter = createPlatformAdapter({
      platform: "meta",
      tenantId: "tenant-1",
      useMock: true,
    });

    expect(adapter).toBeInstanceOf(MockPlatformAdapter);
  });
});

describe("isMockEnabledForPlatform", () => {
  it("throws when mock is enabled in production", () => {
    const env = {
      NODE_ENV: "production",
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "1",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForPlatform("ga4", env)).toThrow(/Mock adapters cannot be enabled/);
  });

  it("throws for invalid binary flags", () => {
    const env = {
      NODE_ENV: "development",
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "true",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForPlatform("gsc", env)).toThrow(/must be "0" or "1"/);
  });
});
