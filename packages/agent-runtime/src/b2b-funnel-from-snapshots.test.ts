import { describe, expect, it } from "vitest";

import { buildScenarioRecords } from "@agenticverdict/data-connectors";

import {
  buildB2bFunnelSnapshotFromNormalizedSnapshots,
  computeB2bMarketingKpisFromNormalizedSnapshots,
} from "./b2b-funnel-from-snapshots";
import type { TenantConfig } from "@agenticverdict/config";

const dateRange = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };

function metaSnapshotFromMock() {
  const records = buildScenarioRecords({
    connector: "meta",
    scenario: "normal",
    seed: 42,
    dateRange,
  });
  return {
    connector: "meta" as const,
    dateRange,
    records,
    metadata: { normalizedAt: "2026-01-01T00:00:00.000Z", pipelineVersion: "test" },
  };
}

const baseTenant: TenantConfig = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  tenantName: "Test",
  localization: {
    language: "ar",
    region: "SA",
    timezone: "Asia/Riyadh",
    currency: "SAR",
  },
  marketing: {
    channels: [{ platform: "meta", enabled: true }],
    b2bKpiProfile: {
      enabled: true,
      funnelMetricMapping: {
        totalLeadMetricSuffixes: ["mock.conversions"],
        qualifiedLeadMetricSuffixes: ["mock.qualified_conversions"],
        spendMetricSuffixes: ["mock.spend"],
        decisionMakerLeadMetricSuffixes: ["mock.leads_dm"],
        fleetQualifiedLeadMetricSuffixes: ["mock.leads_fleet"],
        regionalQualifiedLeadMetricSuffixes: ["mock.leads_regional"],
        regionalDimension: { key: "region", value: "SA" },
        sessionsMetricSuffixes: ["mock.sessions"],
        sessionLanguageDimensionKey: "language",
      },
      targetCpql: { maxAmount: 10_000, currencyCode: "SAR" },
    },
  },
  ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
  features: { enableInsights: true, enableVerdict: true },
};

describe("buildB2bFunnelSnapshotFromNormalizedSnapshots", () => {
  it("aggregates mock meta records using suffix mapping", () => {
    const snap = metaSnapshotFromMock();
    const funnel = buildB2bFunnelSnapshotFromNormalizedSnapshots([snap], {
      spendCurrencyCode: "SAR",
      funnelMetricMapping: baseTenant.marketing.b2bKpiProfile?.funnelMetricMapping,
    });
    expect(funnel.totalLeads).toBeGreaterThan(0);
    expect(funnel.qualifiedLeads).toBeGreaterThan(0);
    expect(funnel.spendAmount).toBeGreaterThan(0);
    expect(funnel.leadsFromDecisionMakerRoles).toBeGreaterThan(0);
    expect(funnel.leadsMeetingMinFleetSize).toBeGreaterThan(0);
    expect(funnel.regionalQualifiedLeads).toBeDefined();
    expect(funnel.regionalQualifiedLeads!).toBeGreaterThanOrEqual(0);
    expect(funnel.engagementByLanguage?.ar ?? 0).toBeGreaterThan(0);
  });

  it("computes KPI envelope via tenant config helper", () => {
    const { funnel, kpis } = computeB2bMarketingKpisFromNormalizedSnapshots(
      [metaSnapshotFromMock()],
      baseTenant,
    );
    expect(funnel.qualifiedLeads).toBeGreaterThan(0);
    expect(kpis.cpql).not.toBeNull();
    expect(kpis.profileApplied).toBe(true);
  });
});
