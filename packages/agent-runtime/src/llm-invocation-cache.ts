import { createHash } from "node:crypto";

import type { AgentFactoryConfig } from "./agent-config";
import type { AgentRunResult } from "./interfaces";

export interface LlmInvocationCacheOptions {
  /** Maximum entries retained (LRU by last access). Default 512. */
  maxEntries?: number;
  /** Time-to-live in milliseconds. Default 5 minutes. */
  ttlMs?: number;
}

interface CacheEntry {
  expiresAt: number;
  result: AgentRunResult;
}

/**
 * In-process LRU + TTL cache for identical assembled LLM turns (tasks.md 6.6).
 * Keys must include tenant id and full prompt material so tenants never share entries.
 */
export class LlmInvocationCache {
  private readonly maxEntries: number;

  private readonly ttlMs: number;

  private readonly store = new Map<string, CacheEntry>();

  private hitCount = 0;

  private missCount = 0;

  constructor(options?: LlmInvocationCacheOptions) {
    this.maxEntries = options?.maxEntries ?? 512;
    this.ttlMs = options?.ttlMs ?? 300_000;
  }

  /** Resets hit/miss counters (entries retained). */
  resetMetrics(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }

  getMetrics(): { hits: number; misses: number; entries: number; hitRate: number } {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      entries: this.store.size,
      hitRate: total === 0 ? 0 : this.hitCount / total,
    };
  }

  get(key: string): AgentRunResult | undefined {
    const entry = this.store.get(key);
    if (entry === undefined) {
      this.missCount += 1;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.missCount += 1;
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    this.hitCount += 1;
    return entry.result;
  }

  set(key: string, result: AgentRunResult): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
    this.store.set(key, { expiresAt: Date.now() + this.ttlMs, result });
  }

  clear(): void {
    this.store.clear();
    this.resetMetrics();
  }
}

/**
 * Stable fingerprint for factory fields that affect assembly budgets (not full system text).
 */
export function factoryConfigCacheFingerprint(cfg: AgentFactoryConfig): string {
  return JSON.stringify({
    role: cfg.role,
    memoryMode: cfg.memoryMode,
    tenantContextMaxApproxTokens: cfg.tenantContextMaxApproxTokens,
    maxAssembledPromptApproxTokens: cfg.maxAssembledPromptApproxTokens,
    temperature: cfg.temperature ?? null,
  });
}

export interface BuildLlmInvocationCacheKeyInput {
  tenantId: string;
  factoryFingerprint: string;
  systemMessage: string;
  userMessage: string;
  memorySnapshotJson: string;
}

export function buildLlmInvocationCacheKey(input: BuildLlmInvocationCacheKeyInput): string {
  return createHash("sha256")
    .update(input.tenantId, "utf8")
    .update("\0", "utf8")
    .update(input.factoryFingerprint, "utf8")
    .update("\0", "utf8")
    .update(input.systemMessage, "utf8")
    .update("\0", "utf8")
    .update(input.userMessage, "utf8")
    .update("\0", "utf8")
    .update(input.memorySnapshotJson, "utf8")
    .digest("hex");
}
