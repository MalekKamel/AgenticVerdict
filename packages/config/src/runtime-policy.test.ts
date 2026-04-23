import { describe, expect, it } from "vitest";

import {
  assertProductionSafeRuntimePolicy,
  isFeatureMockEnabled,
  resolveRuntimePolicy,
} from "./runtime-policy";

describe("resolveRuntimePolicy", () => {
  it("defaults frontend auth mode to real", () => {
    const policy = resolveRuntimePolicy({
      AGENTICVERDICT_RUNTIME_ENV: "development",
    });
    expect(policy.frontend.authApiMode).toBe("real");
  });

  it("resolves selective connector mocks", () => {
    const policy = resolveRuntimePolicy({
      AGENTICVERDICT_RUNTIME_ENV: "development",
      AGENTICVERDICT_MOCK_MODE: "selective",
      AGENTICVERDICT_MOCK_CONNECTORS: "ga4,gsc",
    });
    expect(isFeatureMockEnabled(policy, "connectors", "ga4")).toBe(true);
    expect(isFeatureMockEnabled(policy, "connectors", "meta")).toBe(false);
  });

  it("rejects forbidden toggles in production-like runtime", () => {
    expect(() =>
      resolveRuntimePolicy({
        AGENTICVERDICT_RUNTIME_ENV: "production",
        AGENTICVERDICT_STUB_REPORT_FORMATS: "1",
      }),
    ).toThrow(/forbidden/i);
  });

  it("assertProductionSafeRuntimePolicy allows development mock usage", () => {
    const policy = resolveRuntimePolicy({
      AGENTICVERDICT_RUNTIME_ENV: "development",
      AGENTICVERDICT_MOCK_MODE: "all",
      AGENTICVERDICT_STUB_REPORT_FORMATS: "1",
      AGENTICVERDICT_STUB_EMAIL_DELIVERY: "1",
      VITE_PUBLIC_AUTH_API_MODE: "mock",
    });
    expect(() => assertProductionSafeRuntimePolicy(policy)).not.toThrow();
  });
});
