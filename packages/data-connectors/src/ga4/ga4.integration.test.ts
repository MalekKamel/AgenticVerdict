import { describe, expect, it } from "vitest";

import { Ga4ConnectorAdapter, ga4CredentialKeys } from "./ga4-adapter";

const token = process.env.GA4_INTEGRATION_ACCESS_TOKEN ?? "";
const propertyId = process.env.GA4_INTEGRATION_PROPERTY_ID ?? "";

const enabled = token.length > 0 && propertyId.length > 0;

describe.skipIf(!enabled)("Ga4ConnectorAdapter integration", () => {
  it("authenticates and fetches metrics for a short range", async () => {
    const adapter = new Ga4ConnectorAdapter({
      tenantId: "00000000-0000-4000-8000-000000000001",
      requestTokenBucket: null,
    });
    await adapter.authenticate({
      [ga4CredentialKeys.accessToken]: token,
      [ga4CredentialKeys.propertyId]: propertyId,
    });
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
    const raw = await adapter.fetchMetrics({ startInclusive: start, endInclusive: end });
    const snap = adapter.normalizeData(raw, { startInclusive: start, endInclusive: end });
    expect(snap.records.length).toBeGreaterThan(0);
  });
});
