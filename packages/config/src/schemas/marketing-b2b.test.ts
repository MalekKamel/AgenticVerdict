import { describe, expect, it } from "vitest";

import { b2bKpiProfileSchema } from "./marketing-b2b";

describe("b2bKpiProfileSchema", () => {
  it("accepts a minimal enabled profile", () => {
    const parsed = b2bKpiProfileSchema.parse({ enabled: true });
    expect(parsed.enabled).toBe(true);
  });

  it("accepts weights and CPQL target", () => {
    const parsed = b2bKpiProfileSchema.parse({
      enabled: true,
      minFleetVehiclesQualified: 10,
      weights: { decisionMakerSignal: 0.5, fleetSizeSignal: 0.25, regionalFitSignal: 0.25 },
      targetCpql: { maxAmount: 500, currencyCode: "SAR" },
    });
    expect(parsed.targetCpql?.currencyCode).toBe("SAR");
  });

  it("accepts funnel metric mapping nested in profile", () => {
    const parsed = b2bKpiProfileSchema.parse({
      enabled: true,
      funnelMetricMapping: {
        totalLeadMetricSuffixes: ["mock.conversions"],
        regionalDimension: { key: "region", value: "SA" },
      },
    });
    expect(parsed.funnelMetricMapping?.regionalDimension?.value).toBe("SA");
  });
});
