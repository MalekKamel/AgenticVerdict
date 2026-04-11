import { describe, expect, it } from "vitest";

import type { ConnectorAdapter } from "./adapter";
import { Ga4ConnectorAdapter } from "./ga4/ga4-adapter";
import { GbpConnectorAdapter } from "./gbp/gbp-adapter";
import { GscConnectorAdapter } from "./gsc/gsc-adapter";
import { MetaConnectorAdapter } from "./meta/meta-adapter";
import { MockConnectorAdapter } from "./mock-adapter";
import { testAdapterTenantId } from "./test-utils";
import { TikTokConnectorAdapter } from "./tiktok/tiktok-adapter";

const SHARED_OPTIONS = {
  tenantId: testAdapterTenantId,
  tokenBucket: null,
  cache: null,
  requestTokenBucket: null,
} as const;

function assertConnectorAdapterSurface(adapter: ConnectorAdapter): void {
  expect(["meta", "ga4", "gsc", "gbp", "tiktok"]).toContain(adapter.connector);
  expect(typeof adapter.authenticate).toBe("function");
  expect(typeof adapter.fetchMetrics).toBe("function");
  expect(typeof adapter.normalizeData).toBe("function");
  expect(typeof adapter.isHealthy).toBe("function");
}

describe("ConnectorAdapter contract", () => {
  const factories: Array<{ label: string; create: () => ConnectorAdapter }> = [
    { label: "Ga4ConnectorAdapter", create: () => new Ga4ConnectorAdapter({ ...SHARED_OPTIONS }) },
    { label: "GscConnectorAdapter", create: () => new GscConnectorAdapter({ ...SHARED_OPTIONS }) },
    {
      label: "MetaConnectorAdapter",
      create: () => new MetaConnectorAdapter({ ...SHARED_OPTIONS }),
    },
    { label: "GbpConnectorAdapter", create: () => new GbpConnectorAdapter({ ...SHARED_OPTIONS }) },
    {
      label: "TikTokConnectorAdapter",
      create: () => new TikTokConnectorAdapter({ ...SHARED_OPTIONS }),
    },
    {
      label: "MockConnectorAdapter",
      create: () =>
        new MockConnectorAdapter("ga4", {
          tenantId: testAdapterTenantId,
          tokenBucket: null,
          cache: null,
        }),
    },
  ];

  it.each(factories)("$label implements the ConnectorAdapter surface", ({ create }) => {
    assertConnectorAdapterSurface(create());
  });
});
