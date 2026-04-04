import { describe, expect, it } from "vitest";

import { TikTokPlatformAdapter, tiktokCredentialKeys } from "./tiktok-adapter";

const token = process.env.TIKTOK_INTEGRATION_ACCESS_TOKEN ?? "";
const advertiser = process.env.TIKTOK_INTEGRATION_ADVERTISER_ID ?? "";

const integrationEnabled = token.length > 0 && advertiser.length > 0;

describe.skipIf(!integrationEnabled)("TikTok adapter integration (TIKTOK_INTEGRATION_*)", () => {
  it("authenticates and returns campaigns-shaped payload with normalized records", async () => {
    const adapter = new TikTokPlatformAdapter({
      tenantId: "00000000-0000-4000-8000-000000000001",
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [tiktokCredentialKeys.accessToken]: token,
      [tiktokCredentialKeys.advertiserId]: advertiser,
    });

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const raw = (await adapter.fetchMetrics({
      startInclusive: fmt(start),
      endInclusive: fmt(end),
    })) as {
      campaigns: { campaign_id?: string }[];
      integratedRows: unknown[];
    };

    expect(Array.isArray(raw.campaigns)).toBe(true);
    expect(Array.isArray(raw.integratedRows)).toBe(true);

    const normalized = adapter.normalizeData(raw, {
      startInclusive: fmt(start),
      endInclusive: fmt(end),
    });
    expect(normalized.platform).toBe("tiktok");
    expect(normalized.records.length).toBeGreaterThan(0);
  }, 120_000);
});
