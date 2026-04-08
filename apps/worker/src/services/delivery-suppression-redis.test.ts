import { describe, expect, it, vi } from "vitest";
import type IORedis from "ioredis";

import {
  deliverySuppressionRedisKey,
  isRecipientSuppressed,
  suppressRecipientForTenant,
} from "./delivery-suppression-redis";

describe("delivery-suppression-redis", () => {
  it("suppressRecipientForTenant sadds normalized email", async () => {
    const sadd = vi.fn().mockResolvedValue(1);
    const redis = { sadd } as unknown as IORedis;
    await suppressRecipientForTenant(redis, "tenant-1", "  User@Example.TEST ");
    expect(sadd).toHaveBeenCalledWith(deliverySuppressionRedisKey("tenant-1"), "user@example.test");
  });

  it("isRecipientSuppressed queries sismember", async () => {
    const sismember = vi.fn().mockResolvedValue(1);
    const redis = { sismember } as unknown as IORedis;
    const y = await isRecipientSuppressed(redis, "t1", "A@B.CO");
    expect(y).toBe(true);
    expect(sismember).toHaveBeenCalledWith(deliverySuppressionRedisKey("t1"), "a@b.co");
  });
});
