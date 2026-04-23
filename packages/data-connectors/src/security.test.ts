import { describe, expect, it } from "vitest";

import { isMockEnabledForConnector } from "./adapter-factory";

describe("mock adapter security guard", () => {
  it("always disables mocks in staging when no enable flags are set", () => {
    const env = {
      NODE_ENV: "staging",
      AGENTICVERDICT_MOCK_MODE: "off",
    } as NodeJS.ProcessEnv;

    expect(isMockEnabledForConnector("meta", env)).toBe(false);
  });

  it("throws in staging when a platform flag enables mock mode", () => {
    const env = {
      NODE_ENV: "staging",
      AGENTICVERDICT_MOCK_MODE: "selective",
      AGENTICVERDICT_MOCK_CONNECTORS: "meta",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForConnector("meta", env)).toThrow(
      /Connector mocks are forbidden in staging/,
    );
  });
});
