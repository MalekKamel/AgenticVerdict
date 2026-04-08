import { describe, expect, it } from "vitest";

import { computeB2bMarketingKpis, type B2bLeadFunnelSnapshot } from "./b2b-marketing-kpis";

const baseSnapshot: B2bLeadFunnelSnapshot = {
  totalLeads: 100,
  qualifiedLeads: 40,
  spendAmount: 12_000,
  spendCurrencyCode: "SAR",
  leadsFromDecisionMakerRoles: 55,
  leadsMeetingMinFleetSize: 50,
  regionalQualifiedLeads: 35,
  engagementByLanguage: { ar: 800, en: 200 },
};

describe("computeB2bMarketingKpis", () => {
  it("computes CPQL and rates without applying composite score when profile disabled", () => {
    const r = computeB2bMarketingKpis(baseSnapshot, { enabled: false });
    expect(r.cpql).toBe(300);
    expect(r.decisionMakerRate).toBeCloseTo(0.55);
    expect(r.fleetQualityRate).toBeCloseTo(0.5);
    expect(r.leadQualityScore0to100).toBeNull();
    expect(r.profileApplied).toBe(false);
    expect(r.arabicVsEnglishEngagement.arabicShare).toBeCloseTo(0.8);
  });

  it("applies weighted lead quality score and CPQL target when enabled", () => {
    const r = computeB2bMarketingKpis(baseSnapshot, {
      enabled: true,
      minFleetVehiclesQualified: 10,
      weights: {
        decisionMakerSignal: 0.5,
        fleetSizeSignal: 0.3,
        regionalFitSignal: 0.2,
      },
      targetCpql: { maxAmount: 500, currencyCode: "SAR" },
    });
    expect(r.profileApplied).toBe(true);
    expect(r.minFleetVehiclesThreshold).toBe(10);
    expect(r.leadQualityScore0to100).not.toBeNull();
    expect(r.leadQualityScore0to100).toBeGreaterThan(40);
    expect(r.targetCpqlMet).toBe(true);
  });

  it("marks CPQL target missed when above max", () => {
    const r = computeB2bMarketingKpis(
      { ...baseSnapshot, spendAmount: 40_000 },
      {
        enabled: true,
        targetCpql: { maxAmount: 500, currencyCode: "SAR" },
      },
    );
    expect(r.cpql).toBe(1000);
    expect(r.targetCpqlMet).toBe(false);
  });

  it("returns null rates when no leads", () => {
    const r = computeB2bMarketingKpis(
      {
        totalLeads: 0,
        qualifiedLeads: 0,
        spendAmount: 0,
        spendCurrencyCode: "SAR",
        leadsFromDecisionMakerRoles: 0,
        leadsMeetingMinFleetSize: 0,
      },
      { enabled: true },
    );
    expect(r.decisionMakerRate).toBeNull();
    expect(r.fleetQualityRate).toBeNull();
    expect(r.cpql).toBeNull();
  });
});
