import { describe, expect, it } from "vitest";

import * as schema from "../src/schema/index";

describe("database schema exports", () => {
  it("exports all Phase 0 tables", () => {
    expect(Object.keys(schema).sort()).toEqual([
      "auditLogs",
      "companies",
      "i18nStrings",
      "marketingMetrics",
      "platformCredentials",
      "reportTemplates",
      "reports",
      "users",
    ]);
  });
});
