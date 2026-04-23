import { afterEach, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  canEnableMocksViaEnv,
  isMockEnabledForConnector,
} from "./configuration";

describe("ConfigurationService", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AGENTICVERDICT_MOCK_MODE;
    delete process.env.AGENTICVERDICT_MOCK_CONNECTORS;
    delete process.env.ENABLE_NEW_REPORT_GENERATOR;
  });

  it("parses feature toggles from env", () => {
    process.env.NODE_ENV = "development";
    process.env.ENABLE_NEW_REPORT_GENERATOR = "true";
    const cfg = ConfigurationService.load();
    expect(cfg.features.enableNewReportGenerator).toBe(true);
  });

  it("marks mocks enabled when mode=all in development", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_MOCK_MODE = "all";
    expect(ConfigurationService.areMockAdaptersEnabled()).toBe(true);
  });

  it("marks mocks enabled when selective connectors are provided", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_MOCK_MODE = "selective";
    process.env.AGENTICVERDICT_MOCK_CONNECTORS = "ga4";
    const cfg = ConfigurationService.load();
    expect(cfg.adapters.mocks.enabled).toBe(true);
    expect(cfg.adapters.mocks.connectors).toEqual(["ga4"]);
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

describe("isMockEnabledForConnector (config package)", () => {
  it("matches platform-specific override semantics", () => {
    const env = {
      NODE_ENV: "development",
      AGENTICVERDICT_MOCK_MODE: "selective",
      AGENTICVERDICT_MOCK_CONNECTORS: "ga4",
    } as NodeJS.ProcessEnv;
    expect(isMockEnabledForConnector("meta", env)).toBe(false);
    expect(isMockEnabledForConnector("ga4", env)).toBe(true);
  });
});
