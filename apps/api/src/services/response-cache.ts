import { createHash } from "node:crypto";

import type { Redis } from "@upstash/redis";

export function stableQueryKey(query: Record<string, unknown>): string {
  const keys = Object.keys(query).sort();
  const normalized: Record<string, unknown> = {};
  for (const k of keys) {
    normalized[k] = query[k];
  }
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex").slice(0, 32);
}

export async function readJsonCache<T>(redis: Redis | null, key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }
  const raw = await redis.get(key);
  if (typeof raw !== "string") {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonCache(
  redis: Redis | null,
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) {
    return;
  }
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}
