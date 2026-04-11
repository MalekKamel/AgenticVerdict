import { describe, expect, it } from "vitest";

import { PlatformError } from "../errors";
import { Ga4DailyQuotaTracker } from "./daily-quota";

describe("Ga4DailyQuotaTracker", () => {
  it("allows requests under the cap", () => {
    const q = new Ga4DailyQuotaTracker({
      maxRequestsPerUtcDay: 3,
      currentUtcDay: () => "2026-04-04",
    });
    q.consumeOrThrow();
    q.consumeOrThrow();
    expect(() => q.consumeOrThrow()).not.toThrow();
  });

  it("throws when the daily cap is reached", () => {
    const q = new Ga4DailyQuotaTracker({
      maxRequestsPerUtcDay: 2,
      currentUtcDay: () => "2026-04-04",
    });
    q.consumeOrThrow();
    q.consumeOrThrow();
    expect(() => q.consumeOrThrow()).toThrow(PlatformError);
  });

  it("resets when the UTC day changes", () => {
    let day = "2026-04-04";
    const q = new Ga4DailyQuotaTracker({
      maxRequestsPerUtcDay: 1,
      currentUtcDay: () => day,
    });
    q.consumeOrThrow();
    expect(() => q.consumeOrThrow()).toThrow(PlatformError);
    day = "2026-04-05";
    expect(() => q.consumeOrThrow()).not.toThrow();
  });
});
