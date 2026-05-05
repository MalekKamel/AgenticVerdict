import { describe, expect, it } from "vitest";

import * as schema from "../src/schema/index";

describe("database schema exports", () => {
  it("exports all Phase 0 tables", () => {
    expect(Object.keys(schema).sort()).toEqual([
      "agencyPartnerTierEnum",
      "agencyPartners",
      "auditLogs",
      "auditTrail",
      "connectorSyncHistory",
      "connectorTagMappings",
      "connectorTags",
      "dataConnectors",
      "featureFlags",
      "i18nStrings",
      "insightConnectors",
      "insights",
      "marketingMetrics",
      "permissions",
      "platformCredentials",
      "provenanceRecords",
      "reportShares",
      "reportTemplates",
      "reports",
      "rolePermissions",
      "roles",
      "tenantConnectors",
      "tenantFeatureFlags",
      "tenantStatusEnum",
      "tenantTypeEnum",
      "tenants",
      "usageTracking",
      "userRoles",
      "users",
    ]);
  });
});
