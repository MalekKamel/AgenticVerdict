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
    expect(adapter.platform).toBe("ga4");
  });

  it("throws when platform is missing", () => {
    const registry = createAdapterRegistry();
    expect(() => registry.resolve("meta", undefined)).toThrow(/No adapter registered/);
  });

  it("lists registered platforms", () => {
    const registry = createAdapterRegistry();
    registry.register("meta", () => createSyntheticAdapter("meta"));
    expect(registry.has("meta")).toBe(true);
    expect(registry.platforms()).toEqual(["meta"]);
  });
});
