import { describe, expect, it } from "vitest";

import { GscConnectorAdapter, gscCredentialKeys } from "./gsc-adapter";

const token = process.env.GSC_INTEGRATION_ACCESS_TOKEN ?? "";
const siteUrl = process.env.GSC_INTEGRATION_SITE_URL ?? "";

const enabled = token.length > 0 && siteUrl.length > 0;

describe.skipIf(!enabled)("GscConnectorAdapter integration", () => {
  it("authenticates and fetches metrics for a short range", async () => {
    const adapter = new GscConnectorAdapter({
      tenantId: "00000000-0000-4000-8000-000000000001",
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [gscCredentialKeys.accessToken]: token,
      [gscCredentialKeys.siteUrl]: siteUrl,
    });
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
    const range = { startInclusive: start, endInclusive: end };
    const raw = await adapter.fetchMetrics(range);
    const snap = adapter.normalizeData(raw, range);
    expect(snap.records.length).toBeGreaterThan(0);
  });
});
