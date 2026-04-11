import { describe, expect, it } from "vitest";

import * as schema from "../src/schema/index";

describe("database schema exports", () => {
  it("exports all Phase 0 tables", () => {
    expect(Object.keys(schema).sort()).toEqual([
      "agencyPartners",
      "auditLogs",
      "companies",
      "connectorTagMappings",
      "connectorTags",
      "dataConnectors",
      "featureFlags",
      "i18nStrings",
      "insightConnectors",
      "insights",
      "marketingMetrics",
      "platformCredentials",
      "provenanceRecords",
      "reportTemplates",
      "reports",
      "tenantFeatureFlags",
      "usageTracking",
      "users",
    ]);
  });
});
