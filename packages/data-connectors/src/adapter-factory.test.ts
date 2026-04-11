import { afterEach, describe, expect, it } from "vitest";

import { createConnectorAdapter, isMockEnabledForConnector } from "./adapter-factory";
import { MockConnectorAdapter } from "./mock-adapter";
import { MetaConnectorAdapter } from "./meta/meta-adapter";

describe("createConnectorAdapter", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
    delete process.env.AGENTICVERDICT_MOCK_META;
  });

  it("uses mock adapter when master flag is enabled", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";

    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
    });

    expect(adapter).toBeInstanceOf(MockConnectorAdapter);
  });

  it("lets platform flag override master flag", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";
    process.env.AGENTICVERDICT_MOCK_META = "0";

    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-1",
    });

    expect(adapter).toBeInstanceOf(MetaConnectorAdapter);
  });

  it("allows explicit useMock override", () => {
    process.env.NODE_ENV = "development";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "0";

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
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "1",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForConnector("ga4", env)).toThrow(/Mock adapters cannot be enabled/);
  });

  it("throws for invalid binary flags", () => {
    const env = {
      NODE_ENV: "development",
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "true",
    } as NodeJS.ProcessEnv;

    expect(() => isMockEnabledForConnector("gsc", env)).toThrow(/must be "0" or "1"/);
  });
});
