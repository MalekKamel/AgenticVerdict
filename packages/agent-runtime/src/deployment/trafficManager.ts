import { AsyncLocalStorage } from "async_hooks";
import { Redis } from "ioredis";
import { createPinoLogger } from "@agenticverdict/observability";

const logger = createPinoLogger("agent-runtime");

export type TrafficTarget = "legacy" | "new";

export interface TrafficManagerConfig {
  redisClient: Redis;
  tenantPrefix?: string;
}

export interface TrafficConfig {
  globalPercentage: number;
  tenantOverrides: Map<string, TrafficTarget>;
  abTests: Map<string, ABTestConfig>;
}

export interface ABTestConfig {
  id: string;
  variants: ABTestVariant[];
  active: boolean;
}

export interface ABTestVariant {
  id: string;
  providerId: string;
  modelId: string;
  trafficPercentage: number;
}

export interface RollbackTrigger {
  type: "error_rate" | "latency" | "isolation_breach" | "cost_anomaly";
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
}

export interface RollbackState {
  triggered: boolean;
  reason?: string;
  trigger?: RollbackTrigger;
  previousPercentage: number;
  rolledBackAt?: Date;
}

export interface TrafficDecision {
  target: TrafficTarget;
  reason: string;
  tenantId?: string;
  abTestId?: string;
  variantId?: string;
}

export interface TrafficMetrics {
  legacyCount: number;
  newCount: number;
  errorRate: number;
  p95Latency: number;
  lastUpdated: Date;
}

const DEFAULT_CONFIG: TrafficConfig = {
  globalPercentage: 0,
  tenantOverrides: new Map(),
  abTests: new Map(),
};

const TENANT_CONTEXT_KEY = "tenantId";

export class TrafficManager {
  private config: TrafficConfig;
  private redisClient: Redis;
  private tenantPrefix: string;
  private rollbackState: RollbackState;
  private static readonly CACHE_TTL = 5000;
  private configCache: { config: TrafficConfig; timestamp: number } | null = null;
  private static asyncLocalStorage: AsyncLocalStorage<Map<string, unknown>> =
    new AsyncLocalStorage();

  constructor(config: TrafficManagerConfig) {
    this.redisClient = config.redisClient;
    this.tenantPrefix = config.tenantPrefix || "agenticverdict";
    this.config = { ...DEFAULT_CONFIG };
    this.rollbackState = {
      triggered: false,
      previousPercentage: 0,
    };
  }

  static setTenantContext(tenantId: string): void {
    const store = new Map<string, unknown>();
    store.set(TENANT_CONTEXT_KEY, tenantId);
    TrafficManager.asyncLocalStorage.run(store, () => undefined);
  }

  static getTenantContext(): string | undefined {
    const store = TrafficManager.asyncLocalStorage.getStore();
    return store?.get(TENANT_CONTEXT_KEY) as string | undefined;
  }

  private async getConfigFromRedis(): Promise<TrafficConfig> {
    const cached = this.configCache;
    const now = Date.now();
    if (cached && now - cached.timestamp < TrafficManager.CACHE_TTL) {
      return cached.config;
    }

    try {
      const [globalPercentage, tenantOverridesRaw, abTestsRaw] = await Promise.all([
        this.redisClient.get(`${this.tenantPrefix}:traffic:global_percentage`),
        this.redisClient.hgetall(`${this.tenantPrefix}:traffic:tenant_overrides`),
        this.redisClient.hgetall(`${this.tenantPrefix}:traffic:ab_tests`),
      ]);

      const config: TrafficConfig = {
        globalPercentage: globalPercentage ? parseInt(globalPercentage, 10) : 0,
        tenantOverrides: new Map(
          Object.entries(tenantOverridesRaw || {}).map(([key, value]): [string, TrafficTarget] => [
            key,
            value as TrafficTarget,
          ]),
        ),
        abTests: new Map(),
      };

      if (abTestsRaw) {
        Object.entries(abTestsRaw).forEach(([key, value]) => {
          try {
            const parsed = JSON.parse(value as string) as ABTestConfig;
            config.abTests.set(key, parsed);
          } catch {
            // ignore malformed A/B test payloads and keep loading valid entries
          }
        });
      }

      this.configCache = { config, timestamp: now };
      this.config = config;
      return config;
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch config from Redis");
      return this.config;
    }
  }

  private async saveConfigToRedis(config: TrafficConfig): Promise<void> {
    try {
      const tenantOverridesKey = `${this.tenantPrefix}:traffic:tenant_overrides`;
      const abTestsKey = `${this.tenantPrefix}:traffic:ab_tests`;

      await Promise.all([
        this.redisClient.set(
          `${this.tenantPrefix}:traffic:global_percentage`,
          config.globalPercentage.toString(),
        ),
        this.redisClient.del(tenantOverridesKey),
        this.redisClient.del(abTestsKey),
      ]);

      const tenantOverridesEntries = Array.from(config.tenantOverrides.entries());
      const abTestsEntries = Array.from(config.abTests.entries());

      if (tenantOverridesEntries.length > 0) {
        await Promise.all(
          tenantOverridesEntries.map(([tenantId, target]) =>
            this.redisClient.hset(tenantOverridesKey, tenantId, target),
          ),
        );
      }

      if (abTestsEntries.length > 0) {
        await Promise.all(
          abTestsEntries.map(([key, value]) =>
            this.redisClient.hset(abTestsKey, key, JSON.stringify(value)),
          ),
        );
      }

      this.configCache = null;
    } catch (error) {
      logger.error({ err: error }, "Failed to save config to Redis");
      throw error;
    }
  }

  async route(tenantId?: string): Promise<TrafficDecision> {
    const config = await this.getConfigFromRedis();

    if (this.rollbackState.triggered) {
      return {
        target: "legacy",
        reason: "Rollback triggered",
        tenantId,
      };
    }

    if (tenantId) {
      const tenantOverride = config.tenantOverrides.get(tenantId);
      if (tenantOverride) {
        return {
          target: tenantOverride,
          reason: `Tenant ${tenantId} is enrolled in ${tenantOverride} system`,
          tenantId,
        };
      }
    }

    const useNewSystem = Math.random() * 100 < config.globalPercentage;
    return {
      target: useNewSystem ? "new" : "legacy",
      reason: `Global traffic percentage: ${config.globalPercentage}%`,
      tenantId,
    };
  }

  async setGlobalPercentage(percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Traffic percentage must be between 0 and 100");
    }

    if (this.rollbackState.triggered && percentage > 0) {
      throw new Error(
        "Cannot increase traffic while rollback is active. Clear rollback state first.",
      );
    }

    this.config.globalPercentage = percentage;
    await this.saveConfigToRedis(this.config);
  }

  async setTenantOverride(tenantId: string, target: TrafficTarget): Promise<void> {
    this.config.tenantOverrides.set(tenantId, target);
    await this.saveConfigToRedis(this.config);
  }

  async removeTenantOverride(tenantId: string): Promise<void> {
    this.config.tenantOverrides.delete(tenantId);
    this.configCache = null;
    this.config = { ...this.config, tenantOverrides: new Map(this.config.tenantOverrides) };
    await this.saveConfigToRedis(this.config);
  }

  async createABTest(config: ABTestConfig): Promise<void> {
    const totalPercentage = config.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Variant traffic percentages must sum to 100 (got ${totalPercentage})`);
    }

    this.config.abTests.set(config.id, config);
    await this.saveConfigToRedis(this.config);
  }

  async getABTestVariant(
    abTestId: string,
    tenantId: string,
  ): Promise<{ variantId: string; reason: string }> {
    const config = await this.getConfigFromRedis();
    const abTest = config.abTests.get(abTestId);

    if (!abTest || !abTest.active) {
      throw new Error(`A/B test ${abTestId} not found or inactive`);
    }

    const hash = this.hashString(`${abTestId}:${tenantId}`);
    const normalizedHash = hash % 100;

    let cumulative = 0;
    for (const variant of abTest.variants) {
      cumulative += variant.trafficPercentage;
      if (normalizedHash < cumulative) {
        return {
          variantId: variant.id,
          reason: `Assigned to variant ${variant.id} (${variant.trafficPercentage}% traffic)`,
        };
      }
    }

    const lastVariant = abTest.variants[abTest.variants.length - 1];
    return {
      variantId: lastVariant.id,
      reason: `Assigned to last variant ${lastVariant.id} (fallback)`,
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async triggerRollback(trigger: RollbackTrigger, reason: string): Promise<void> {
    const previousPercentage = this.config.globalPercentage;

    this.rollbackState = {
      triggered: true,
      reason,
      trigger,
      previousPercentage,
      rolledBackAt: new Date(),
    };

    this.config.globalPercentage = 0;
    await this.saveConfigToRedis(this.config);

    logger.error(
      {
        reason,
        triggerType: trigger.type,
        threshold: trigger.threshold,
        currentValue: trigger.currentValue,
        previousPercentage,
      },
      "ROLLBACK TRIGGERED",
    );

    await this.notifyRollback(reason, trigger);
  }

  private async notifyRollback(reason: string, trigger: RollbackTrigger): Promise<void> {
    try {
      const alertKey = `${this.tenantPrefix}:alerts:rollback:${Date.now()}`;
      const alertData = {
        type: "rollback",
        reason,
        trigger: trigger.type,
        threshold: trigger.threshold,
        currentValue: trigger.currentValue,
        timestamp: new Date().toISOString(),
      };
      await this.redisClient.setex(alertKey, 86400 * 7, JSON.stringify(alertData));
      await this.redisClient.publish(
        `${this.tenantPrefix}:alerts:rollback`,
        JSON.stringify(alertData),
      );
    } catch (error) {
      logger.error({ err: error }, "Failed to send rollback notification");
    }
  }

  async clearRollback(): Promise<void> {
    if (!this.rollbackState.triggered) {
      throw new Error("No rollback state to clear");
    }

    this.rollbackState = {
      triggered: false,
      previousPercentage: this.rollbackState.previousPercentage,
    };
  }

  getRollbackState(): RollbackState {
    return { ...this.rollbackState };
  }

  async updateMetrics(metrics: TrafficMetrics): Promise<void> {
    try {
      const metricsKey = `${this.tenantPrefix}:traffic:metrics`;
      await this.redisClient.hset(metricsKey, {
        legacy_count: metrics.legacyCount.toString(),
        new_count: metrics.newCount.toString(),
        error_rate: metrics.errorRate.toString(),
        p95_latency: metrics.p95Latency.toString(),
        last_updated: metrics.lastUpdated.toISOString(),
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to update metrics");
    }
  }

  async getMetrics(): Promise<TrafficMetrics | null> {
    try {
      const metricsKey = `${this.tenantPrefix}:traffic:metrics`;
      const data = await this.redisClient.hgetall(metricsKey);

      if (!data || !data.last_updated) {
        return null;
      }

      return {
        legacyCount: parseInt(data.legacy_count || "0", 10),
        newCount: parseInt(data.new_count || "0", 10),
        errorRate: parseFloat(data.error_rate || "0"),
        p95Latency: parseFloat(data.p95_latency || "0"),
        lastUpdated: new Date(data.last_updated),
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to get metrics");
      return null;
    }
  }

  async checkRollbackTriggers(metrics: TrafficMetrics): Promise<RollbackTrigger | null> {
    const triggers: Array<{
      type: RollbackTrigger["type"];
      threshold: number;
      currentValue: number;
    }> = [
      { type: "error_rate", threshold: 0.01, currentValue: metrics.errorRate },
      { type: "latency", threshold: 5000, currentValue: metrics.p95Latency },
    ];

    for (const trigger of triggers) {
      if (trigger.currentValue > trigger.threshold) {
        return {
          type: trigger.type,
          threshold: trigger.threshold,
          currentValue: trigger.currentValue,
          triggeredAt: new Date(),
        };
      }
    }

    return null;
  }

  async recordTenantIsolationBreach(tenantId: string, details: string): Promise<void> {
    const trigger: RollbackTrigger = {
      type: "isolation_breach",
      threshold: 0,
      currentValue: 1,
      triggeredAt: new Date(),
    };

    await this.triggerRollback(trigger, `Tenant isolation breach detected: ${details}`);

    try {
      const breachKey = `${this.tenantPrefix}:breaches:${Date.now()}`;
      await this.redisClient.setex(
        breachKey,
        86400 * 30,
        JSON.stringify({
          tenantId,
          details,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      logger.error({ err: error }, "Failed to record isolation breach");
    }
  }

  async recordCostAnomaly(baselineCost: number, currentCost: number): Promise<void> {
    const increase = (currentCost - baselineCost) / baselineCost;

    if (increase > 0.2) {
      const trigger: RollbackTrigger = {
        type: "cost_anomaly",
        threshold: 0.2,
        currentValue: increase,
        triggeredAt: new Date(),
      };

      await this.triggerRollback(
        trigger,
        `Cost anomaly detected: ${(increase * 100).toFixed(2)}% increase over baseline`,
      );
    }
  }
}

export function withTenantContext<T>(tenantId: string, fn: () => T): T {
  const store = new Map<string, unknown>();
  store.set(TENANT_CONTEXT_KEY, tenantId);
  return (
    TrafficManager as unknown as {
      asyncLocalStorage: { run: <T>(store: Map<string, unknown>, fn: () => T) => T };
    }
  ).asyncLocalStorage.run(store, fn);
}

export function getTenantContextFromAsyncLocalStorage(): string | undefined {
  return TrafficManager.getTenantContext();
}
