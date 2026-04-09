import { afterEach, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  canEnableMocksViaEnv,
  isMockEnabledForPlatform,
} from "./configuration";

describe("ConfigurationService", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
    delete process.env.AGENTICVERDICT_MOCK_GA4;
    delete process.env.ENABLE_NEW_REPORT_GENERATOR;
  });

  it("parses feature toggles from env", () => {
    process.env.NODE_ENV = "development";
    process.env.ENABLE_NEW_REPORT_GENERATOR = "true";
    const cfg = ConfigurationService.load();
    expect(cfg.features.enableNewReportGenerator).toBe(true);
  });

  it("marks mocks enabled when master flag is on in development", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";
    expect(ConfigurationService.areMockAdaptersEnabled()).toBe(true);
  });

  it("marks mocks enabled when only a per-platform flag is set", () => {
    process.env.NODE_ENV = "development";
    delete process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
    process.env.AGENTICVERDICT_MOCK_GA4 = "1";
    const cfg = ConfigurationService.load();
    expect(cfg.adapters.mocks.enabled).toBe(true);
    expect(cfg.adapters.mocks.platforms).toEqual(["ga4"]);
  });
});

describe("canEnableMocksViaEnv", () => {
  it("returns false when NODE_ENV is production", () => {
    expect(canEnableMocksViaEnv({ NODE_ENV: "production" })).toBe(false);
  });

  it("returns false for staging raw env", () => {
    expect(canEnableMocksViaEnv({ NODE_ENV: "staging" })).toBe(false);
  });
});

describe("isMockEnabledForPlatform (config package)", () => {
  it("matches platform-specific override semantics", () => {
    const env = {
      NODE_ENV: "development",
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "1",
      AGENTICVERDICT_MOCK_META: "0",
    } as NodeJS.ProcessEnv;
    expect(isMockEnabledForPlatform("meta", env)).toBe(false);
    expect(isMockEnabledForPlatform("ga4", env)).toBe(true);
  });
});
