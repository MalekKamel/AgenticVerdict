import type IORedis from "ioredis";

const PREFIX = "av:delivery:suppress:";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function deliverySuppressionRedisKey(tenantId: string): string {
  return `${PREFIX}${tenantId}`;
}

/**
 * Marks an address as unsendable for the tenant (bounce / complaint path). Idempotent.
 */
export async function suppressRecipientForTenant(
  redis: IORedis,
  tenantId: string,
  email: string,
): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    return;
  }
  await redis.sadd(deliverySuppressionRedisKey(tenantId), normalized);
}

export async function isRecipientSuppressed(
  redis: IORedis,
  tenantId: string,
  email: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }
  const n = await redis.sismember(deliverySuppressionRedisKey(tenantId), normalized);
  return n === 1;
}
