import { describe, expect, it } from "vitest";

import { checkBullmqRedisHealth } from "./worker-infra-health";

describe("checkBullmqRedisHealth", () => {
  it("reports missing REDIS when connection is null", async () => {
    const h = await checkBullmqRedisHealth(null);
    expect(h.redisConfigured).toBe(false);
    expect(h.error).toMatch(/REDIS_URL/);
  });
});
