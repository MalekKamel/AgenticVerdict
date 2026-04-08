import { beforeAll, describe, expect, it } from "vitest";

import {
  Ga4PlatformAdapter,
  MemoryPlatformCache,
  MetaPlatformAdapter,
  ga4CredentialKeys,
  metaCredentialKeys,
} from "@agenticverdict/platform-adapters";

const live = process.env.LIVE_ADAPTER_VALIDATION === "1";

const metaToken = process.env.META_LIVE_ACCESS_TOKEN?.trim();
const metaAdAccount = process.env.META_LIVE_AD_ACCOUNT_ID?.trim();
const ga4Token = process.env.GA4_LIVE_ACCESS_TOKEN?.trim();
const ga4Property = process.env.GA4_LIVE_PROPERTY_ID?.trim();

describe.skipIf(!live)("Phase 01 optional live adapter smoke (operator credentials)", () => {
  const range = { startInclusive: "2025-01-01", endInclusive: "2025-01-07" };

  beforeAll(() => {
    const metaOk = Boolean(metaToken && metaAdAccount);
    const ga4Ok = Boolean(ga4Token && ga4Property);
    if (live && !metaOk && !ga4Ok) {
      throw new Error(
        "LIVE_ADAPTER_VALIDATION=1 requires META_LIVE_ACCESS_TOKEN + META_LIVE_AD_ACCOUNT_ID and/or GA4_LIVE_ACCESS_TOKEN + GA4_LIVE_PROPERTY_ID.",
      );
    }
  });

  it.skipIf(!metaToken || !metaAdAccount)("Meta live: authenticate + fetchMetrics", async () => {
    const adapter = new MetaPlatformAdapter({
      tenantId: "live-smoke-meta",
      cache: new MemoryPlatformCache(),
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [metaCredentialKeys.accessToken]: metaToken!,
      [metaCredentialKeys.adAccountId]: metaAdAccount!,
    });
    const raw = await adapter.fetchMetrics(range);
    expect(raw).toBeDefined();
    const norm = adapter.normalizeData(raw, range);
    expect(norm.platform).toBe("meta");
  });

  it.skipIf(!ga4Token || !ga4Property)("GA4 live: authenticate + fetchMetrics", async () => {
    const adapter = new Ga4PlatformAdapter({
      tenantId: "live-smoke-ga4",
      cache: new MemoryPlatformCache(),
      requestTokenBucket: null,
      dailyQuotaOptions: { maxRequestsPerUtcDay: 50_000, currentUtcDay: () => "2026-04-08" },
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: ga4Token!,
      [ga4CredentialKeys.propertyId]: ga4Property!,
    });
    const raw = await adapter.fetchMetrics(range);
    expect(raw).toBeDefined();
    const norm = adapter.normalizeData(raw, range);
    expect(norm.platform).toBe("ga4");
  });
});
