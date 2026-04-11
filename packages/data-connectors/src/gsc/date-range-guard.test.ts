import { describe, expect, it } from "vitest";

import { PlatformError } from "../errors";
import {
  assertGscSearchAnalyticsDateRange,
  GSC_MAX_INCLUSIVE_HISTORY_DAYS,
} from "./date-range-guard";

describe("assertGscSearchAnalyticsDateRange", () => {
  it("allows ranges within 16-month style cap", () => {
    expect(() =>
      assertGscSearchAnalyticsDateRange({
        startInclusive: "2025-01-01",
        endInclusive: "2025-12-31",
      }),
    ).not.toThrow();
  });

  it("rejects ranges longer than the GSC history cap", () => {
    expect(() =>
      assertGscSearchAnalyticsDateRange({
        startInclusive: "2020-01-01",
        endInclusive: "2025-12-31",
      }),
    ).toThrow(PlatformError);
  });

  it("documents the inclusive day budget", () => {
    expect(GSC_MAX_INCLUSIVE_HISTORY_DAYS).toBe(486);
  });
});
