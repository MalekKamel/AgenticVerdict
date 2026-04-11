import { describe, expect, it } from "vitest";

import { createConnectorTokenBucket, defaultConnectorRateProfile } from "./platform-rate-config";

describe("platform-rate-config", () => {
  it("returns positive RPM per platform", () => {
    expect(defaultConnectorRateProfile("meta").requestsPerMinute).toBeGreaterThan(0);
  });

  it("applies Meta hourly cap for Marketing API", () => {
    expect(defaultConnectorRateProfile("meta").requestsPerHour).toBe(200);
    const b = createConnectorTokenBucket("meta");
    expect(b.snapshot().capacity).toBe(200);
    expect(b.snapshot().refillPerSecond).toBeCloseTo(200 / 3600, 5);
  });

  it("creates a GSC token bucket aligned with ~5 QPS", () => {
    const b = createConnectorTokenBucket("gsc");
    expect(b.snapshot().capacity).toBe(300);
    expect(b.snapshot().refillPerSecond).toBeCloseTo(5, 5);
  });
});
