import { afterEach, describe, expect, it } from "vitest";

import { createConnectorAdapter, isMockEnabledForConnector } from "./adapter-factory";
import { MockConnectorAdapter } from "./mock-adapter";
import { MetaConnectorAdapter } from "./meta/meta-adapter";

describe("createConnectorAdapter", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AGENTICVERDICT_RUNTIME_ENV;
    delete process.env.AGENTICVERDICT_MOCK_MODE;
    delete process.env.AGENTICVERDICT_MOCK_CONNECTORS;
  });

  it("uses mock adapter when master flag is enabled", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_MOCK_MODE = "all";

    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
    });

    expect(adapter).toBeInstanceOf(MockConnectorAdapter);
  });

  it("uses production adapter when connector is not in selective mode list", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_MOCK_MODE = "selective";
    process.env.AGENTICVERDICT_MOCK_CONNECTORS = "ga4";

    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
    });

    expect(adapter).toBeInstanceOf(MetaConnectorAdapter);
  });

  it("allows explicit useMock override", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_MOCK_MODE = "off";

    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
      useMock: true,
    });

    expect(adapter).toBeInstanceOf(MockConnectorAdapter);
  });
});

describe("isMockEnabledForConnector", () => {
  it("throws when mock is enabled in production", () => {
    const env = {
      NODE_ENV: "production",
      AGENTICVERDICT_MOCK_MODE: "all",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForConnector("ga4", env)).toThrow(
      /Connector mocks are forbidden in production/,
    );
  });

  it("throws for invalid runtime mock mode values", () => {
    const env = {
      NODE_ENV: "development",
      AGENTICVERDICT_MOCK_MODE: "enabled",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForConnector("gsc", env)).toThrow(
      /AGENTICVERDICT_MOCK_MODE must be one of/,
    );
  });
});
