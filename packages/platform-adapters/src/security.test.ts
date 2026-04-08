import { describe, expect, it } from "vitest";

import { isMockEnabledForPlatform } from "./adapter-factory";

describe("mock adapter security guard", () => {
  it("always disables mocks in staging when no enable flags are set", () => {
    const env = {
      NODE_ENV: "staging",
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "0",
      AGENTICVERDICT_MOCK_META: "0",
    } as NodeJS.ProcessEnv;

    expect(isMockEnabledForPlatform("meta", env)).toBe(false);
  });

  it("throws in staging when a platform flag enables mock mode", () => {
    const env = {
      NODE_ENV: "staging",
      AGENTICVERDICT_MOCK_META: "1",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForPlatform("meta", env)).toThrow(/cannot be enabled in staging/);
  });
});
