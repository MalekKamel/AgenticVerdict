import { describe, expect, it, vi } from "vitest";

import { mockConnector } from "./fixtures/connectors";
import { createTenant } from "./factories/tenant";

describe("mockConnector", () => {
  it("returns a ConnectorAdapter-shaped double with the expected connector id", () => {
    const a = mockConnector({ connector: "meta" });
    expect(a.connector).toBe("meta");
    expect(typeof a.authenticate).toBe("function");
    expect(typeof a.fetchMetrics).toBe("function");
    expect(typeof a.normalizeData).toBe("function");
    expect(typeof a.isHealthy).toBe("function");
  });

  it("allows overriding methods while preserving connector id", async () => {
    const auth = vi.fn().mockRejectedValue(new Error("nope"));
    const a = mockConnector({ connector: "gsc", authenticate: auth });
    await expect(a.authenticate({})).rejects.toThrow(/nope/);
    expect(auth).toHaveBeenCalledTimes(1);
  });
});

describe("createTenant", () => {
  it("fills stable defaults and accepts overrides", () => {
    const t = createTenant({ name: "Acme", slug: "acme" });
    expect(t.name).toBe("Acme");
    expect(t.slug).toBe("acme");
    expect(t.active).toBe(true);
    expect(t.agencyPartnerId).toBeNull();
    expect(t.id).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
