import { describe, expect, it, vi } from "vitest";

import { UpstashPlatformCache } from "./upstash-cache";

describe("UpstashPlatformCache", () => {
  it("get/set/delete delegate to Redis and track metrics", async () => {
    const redis = {
      get: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('{"a":1}'),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
    };

    const cache = new UpstashPlatformCache(redis as never);
    expect(await cache.get("k")).toBe(null);
    expect(await cache.get("k")).toBe('{"a":1}');
    await cache.set("k", "v", 10);
    await cache.delete("k");
    expect(redis.set).toHaveBeenCalledWith("k", "v", { ex: 10 });
    expect(cache.isDistributed()).toBe(true);
    const m = cache.getMetrics();
    expect(m.hits).toBe(1);
    expect(m.misses).toBe(1);
    expect(m.sets).toBe(1);
  });

  it("increments errors when Redis throws", async () => {
    const redis = {
      get: vi.fn().mockRejectedValue(new Error("boom")),
      set: vi.fn(),
      del: vi.fn(),
    };
    const cache = new UpstashPlatformCache(redis as never);
    await expect(cache.get("x")).rejects.toThrow("boom");
    expect(cache.getMetrics().errors).toBe(1);
  });
});
