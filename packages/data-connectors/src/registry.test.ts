import { describe, expect, it } from "vitest";

import { createAdapterRegistry } from "./registry";
import { createSyntheticAdapter } from "./test-utils";

describe("createAdapterRegistry", () => {
  it("resolves factories with context", () => {
    const registry = createAdapterRegistry<{ tenantId: string }>();
    registry.register("ga4", (ctx) =>
      createSyntheticAdapter("ga4", {
        fetchImpl: async () => ({ tenant: ctx.tenantId }),
      }),
    );

    const adapter = registry.resolve("ga4", { tenantId: "t-1" });
    expect(adapter.connector).toBe("ga4");
  });

  it("throws when connector is not registered", () => {
    const registry = createAdapterRegistry();
    expect(() => registry.resolve("meta", undefined)).toThrow(/No adapter registered/);
  });

  it("rejects context with empty string tenantId when the key is present (C-CONN-1)", () => {
    const registry = createAdapterRegistry<{ tenantId: string }>();
    registry.register("ga4", (ctx) =>
      createSyntheticAdapter("ga4", { fetchImpl: async () => ({ tenant: ctx.tenantId }) }),
    );
    expect(() => registry.resolve("ga4", { tenantId: "  " })).toThrow(/tenantId/);
  });

  it("lists registered connectors", () => {
    const registry = createAdapterRegistry();
    registry.register("meta", () => createSyntheticAdapter("meta"));
    expect(registry.has("meta")).toBe(true);
    expect(registry.connectors()).toEqual(["meta"]);
  });

  it("invokes the factory on each resolve (fresh adapter instances)", () => {
    const registry = createAdapterRegistry();
    let calls = 0;
    registry.register("ga4", () => {
      calls += 1;
      return createSyntheticAdapter("ga4");
    });
    registry.resolve("ga4", undefined);
    registry.resolve("ga4", undefined);
    expect(calls).toBe(2);
  });
});
