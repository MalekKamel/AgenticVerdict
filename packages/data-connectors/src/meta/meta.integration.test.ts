import { describe, expect, it } from "vitest";

import { MetaConnectorAdapter, metaCredentialKeys } from "./meta-adapter";

const token = process.env.META_INTEGRATION_ACCESS_TOKEN ?? "";
const adAccount = process.env.META_INTEGRATION_AD_ACCOUNT_ID ?? "";

const integrationEnabled = token.length > 0 && adAccount.length > 0;

describe.skipIf(!integrationEnabled)("Meta adapter integration (META_INTEGRATION_*)", () => {
  it("authenticates and returns campaigns and insights-shaped payload", async () => {
    const adapter = new MetaConnectorAdapter({
      tenantId: "00000000-0000-4000-8000-000000000001",
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: token,
      [metaCredentialKeys.adAccountId]: adAccount,
    });

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 7);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const raw = (await adapter.fetchMetrics({
      startInclusive: fmt(start),
      endInclusive: fmt(end),
    })) as {
      campaigns: { id?: string; name?: string }[];
      insights: { impressions?: string; spend?: string }[];
    };

    expect(Array.isArray(raw.campaigns)).toBe(true);
    expect(Array.isArray(raw.insights)).toBe(true);

    const normalized = adapter.normalizeData(raw, {
      startInclusive: fmt(start),
      endInclusive: fmt(end),
    });
    expect(normalized.connector).toBe("meta");
    expect(normalized.records.length).toBeGreaterThan(0);
  }, 120_000);
});
