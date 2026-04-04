import { describe, expect, it } from "vitest";

import { createPlatformTokenBucket, defaultPlatformRateProfile } from "./platform-rate-config";

describe("platform-rate-config", () => {
  it("returns positive RPM per platform", () => {
    expect(defaultPlatformRateProfile("meta").requestsPerMinute).toBeGreaterThan(0);
  });

  it("applies Meta hourly cap for Marketing API", () => {
    expect(defaultPlatformRateProfile("meta").requestsPerHour).toBe(200);
    const b = createPlatformTokenBucket("meta");
    expect(b.snapshot().capacity).toBe(200);
    expect(b.snapshot().refillPerSecond).toBeCloseTo(200 / 3600, 5);
  });

  it("creates a GSC token bucket aligned with ~5 QPS", () => {
    const b = createPlatformTokenBucket("gsc");
    expect(b.snapshot().capacity).toBe(300);
    expect(b.snapshot().refillPerSecond).toBeCloseTo(5, 5);
  });
});
