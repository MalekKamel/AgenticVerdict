import { describe, expect, it } from "vitest";

import { GbpPlatformAdapter, gbpCredentialKeys } from "./gbp-adapter";

const token = process.env.GBP_INTEGRATION_ACCESS_TOKEN ?? "";
const accountFilter = process.env.GBP_INTEGRATION_ACCOUNT_RESOURCE_NAME ?? "";

const enabled = token.length > 0;

describe.skipIf(!enabled)("GbpPlatformAdapter integration", () => {
  it("authenticates and fetches metrics for a short range", async () => {
    const adapter = new GbpPlatformAdapter({
      tenantId: "00000000-0000-4000-8000-000000000001",
      requestTokenBucket: null,
      maxLocations: 5,
    });
    await adapter.authenticate({
      [gbpCredentialKeys.accessToken]: token,
      ...(accountFilter.length > 0
        ? { [gbpCredentialKeys.accountResourceName]: accountFilter }
        : {}),
    });
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
    const range = { startInclusive: start, endInclusive: end };
    const raw = await adapter.fetchMetrics(range);
    const snap = adapter.normalizeData(raw, range);
    expect(snap.records.length).toBeGreaterThan(0);
  });
});
