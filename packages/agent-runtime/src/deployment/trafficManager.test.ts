import { describe, it, expect, beforeEach, vi } from "vitest";
import { TrafficManager, ABTestConfig, withTenantContext } from "./trafficManager";

const createMockRedis = () => {
  const data = new Map<string, string>();
  const hashes = new Map<string, Map<string, string>>();
  const channels = new Map<string, Set<(message: string) => void>>();

  return {
    get: vi.fn(async (key: string) => data.get(key) || null),
    set: vi.fn(async (key: string, value: string) => {
      data.set(key, value);
      return "OK";
    }),
    setex: vi.fn(async (key: string, ttl: number, value: string) => {
      data.set(key, value);
      return "OK";
    }),
    hgetall: vi.fn(async (key: string) => {
      const hash = hashes.get(key);
      if (!hash) return {};
      const result: Record<string, string> = {};
      hash.forEach((value, field) => {
        result[field] = value;
      });
      return result;
    }),
    hset: vi.fn(async (key: string, field: string | Record<string, string>, value?: string) => {
      if (!hashes.has(key)) {
        hashes.set(key, new Map());
      }
      const hash = hashes.get(key)!;

      if (typeof field === "object") {
        Object.entries(field).forEach(([f, v]) => hash.set(f, v));
      } else if (value !== undefined) {
        hash.set(field, value);
      }
      return 1;
    }),
    hdel: vi.fn(async (key: string, ...fields: string[]) => {
      const hash = hashes.get(key);
      if (!hash) return 0;
      let deleted = 0;
      fields.forEach((field) => {
        if (hash.delete(field)) {
          deleted++;
        }
      });
      return deleted;
    }),
    publish: vi.fn(async (channel: string, message: string) => {
      const subscribers = channels.get(channel);
      if (subscribers) {
        subscribers.forEach((cb) => cb(message));
      }
      return 1;
    }),
    subscribe: vi.fn(async (channel: string, callback: (message: string) => void) => {
      if (!channels.has(channel)) {
        channels.set(channel, new Set());
      }
      channels.get(channel)!.add(callback);
      return "OK";
    }),
    del: vi.fn(async (key: string) => {
      data.delete(key);
      return 1;
    }),
  };
};

describe("TrafficManager", () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let trafficManager: TrafficManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis = createMockRedis();
    trafficManager = new TrafficManager({
      redisClient: mockRedis as unknown as ConstructorParameters<
        typeof TrafficManager
      >[0]["redisClient"],
      tenantPrefix: "test",
    });
  });

  describe("Feature Flag-Based Traffic Routing", () => {
    it("should route to legacy when global percentage is 0", async () => {
      const decision = await trafficManager.route("tenant-1");

      expect(decision.target).toBe("legacy");
      expect(decision.reason).toContain("Global traffic percentage: 0%");
      expect(decision.tenantId).toBe("tenant-1");
    });

    it("should route to legacy when rollback is triggered", async () => {
      await trafficManager.triggerRollback(
        { type: "error_rate", threshold: 0.01, currentValue: 0.02, triggeredAt: new Date() },
        "High error rate detected",
      );

      const decision = await trafficManager.route("tenant-1");

      expect(decision.target).toBe("legacy");
      expect(decision.reason).toBe("Rollback triggered");
    });

    it("should respect tenant-specific override", async () => {
      await trafficManager.setTenantOverride("tenant-1", "new");

      const decision = await trafficManager.route("tenant-1");

      expect(decision.target).toBe("new");
      expect(decision.reason).toContain("Tenant tenant-1 is enrolled in new system");
    });

    it("should route deterministically for same tenant", async () => {
      await trafficManager.setGlobalPercentage(50);

      const decisions = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => trafficManager.route("tenant-1")),
      );

      const allSame = decisions.every((d) => d.target === decisions[0].target);
      expect(allSame).toBe(true);
    });

    it("should use global percentage when no tenant override exists", async () => {
      await trafficManager.setGlobalPercentage(100);

      const decision = await trafficManager.route("tenant-without-override");

      expect(decision.target).toBe("new");
      expect(decision.reason).toContain("Global traffic percentage: 100%");
    });
  });

  describe("Traffic Percentage Control", () => {
    it("should set global percentage", async () => {
      await trafficManager.setGlobalPercentage(50);

      const decision = await trafficManager.route();
      expect(decision.reason).toContain("Global traffic percentage: 50%");
    });

    it("should reject percentage outside 0-100 range", async () => {
      await expect(trafficManager.setGlobalPercentage(-1)).rejects.toThrow(
        "must be between 0 and 100",
      );
      await expect(trafficManager.setGlobalPercentage(101)).rejects.toThrow(
        "must be between 0 and 100",
      );
    });

    it("should prevent increasing traffic while rollback is active", async () => {
      await trafficManager.triggerRollback(
        { type: "error_rate", threshold: 0.01, currentValue: 0.02, triggeredAt: new Date() },
        "Test rollback",
      );

      await expect(trafficManager.setGlobalPercentage(10)).rejects.toThrow(
        "Cannot increase traffic while rollback is active",
      );
    });

    it("should update percentage in real-time", async () => {
      await trafficManager.setGlobalPercentage(0);
      let decision = await trafficManager.route();
      expect(decision.reason).toContain("0%");

      await trafficManager.setGlobalPercentage(100);
      decision = await trafficManager.route();
      expect(decision.reason).toContain("100%");
    });
  });

  describe("Tenant Overrides", () => {
    it("should set tenant override to new system", async () => {
      await trafficManager.setTenantOverride("tenant-1", "new");

      const decision = await trafficManager.route("tenant-1");
      expect(decision.target).toBe("new");
    });

    it("should set tenant override to legacy system", async () => {
      await trafficManager.setTenantOverride("tenant-1", "legacy");
      await trafficManager.setGlobalPercentage(100);

      const decision = await trafficManager.route("tenant-1");
      expect(decision.target).toBe("legacy");
    });

    it.skip("should remove tenant override", async () => {
      await trafficManager.setGlobalPercentage(0);
      await trafficManager.setTenantOverride("tenant-1", "new");

      let decision = await trafficManager.route("tenant-1");
      expect(decision.target).toBe("new");

      await trafficManager.removeTenantOverride("tenant-1");

      decision = await trafficManager.route("tenant-1");
      expect(decision.target).toBe("legacy");
    });
  });

  describe("A/B Testing", () => {
    it("should create A/B test with valid variants", async () => {
      const abTest: ABTestConfig = {
        id: "test-1",
        variants: [
          { id: "variant-a", providerId: "openai", modelId: "gpt-4", trafficPercentage: 50 },
          { id: "variant-b", providerId: "anthropic", modelId: "claude-3", trafficPercentage: 50 },
        ],
        active: true,
      };

      await expect(trafficManager.createABTest(abTest)).resolves.not.toThrow();
    });

    it("should reject A/B test with invalid traffic percentages", async () => {
      const abTest: ABTestConfig = {
        id: "test-1",
        variants: [
          { id: "variant-a", providerId: "openai", modelId: "gpt-4", trafficPercentage: 60 },
          { id: "variant-b", providerId: "anthropic", modelId: "claude-3", trafficPercentage: 60 },
        ],
        active: true,
      };

      await expect(trafficManager.createABTest(abTest)).rejects.toThrow("must sum to 100");
    });

    it("should assign variant based on traffic percentage", async () => {
      const abTest: ABTestConfig = {
        id: "test-1",
        variants: [
          { id: "variant-a", providerId: "openai", modelId: "gpt-4", trafficPercentage: 80 },
          { id: "variant-b", providerId: "anthropic", modelId: "claude-3", trafficPercentage: 20 },
        ],
        active: true,
      };

      await trafficManager.createABTest(abTest);

      const assignments = new Map<string, number>();
      for (let i = 0; i < 1000; i++) {
        const { variantId } = await trafficManager.getABTestVariant("test-1", `tenant-${i}`);
        assignments.set(variantId, (assignments.get(variantId) || 0) + 1);
      }

      const variantAPercentage = (assignments.get("variant-a") || 0) / 10;
      expect(variantAPercentage).toBeGreaterThan(70);
      expect(variantAPercentage).toBeLessThan(90);
    });

    it("should assign same variant for same tenant", async () => {
      const abTest: ABTestConfig = {
        id: "test-1",
        variants: [
          { id: "variant-a", providerId: "openai", modelId: "gpt-4", trafficPercentage: 50 },
          { id: "variant-b", providerId: "anthropic", modelId: "claude-3", trafficPercentage: 50 },
        ],
        active: true,
      };

      await trafficManager.createABTest(abTest);

      const results = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => trafficManager.getABTestVariant("test-1", "tenant-1")),
      );

      const allSame = results.every((r) => r.variantId === results[0].variantId);
      expect(allSame).toBe(true);
    });

    it("should reject inactive A/B test", async () => {
      const abTest: ABTestConfig = {
        id: "test-1",
        variants: [
          { id: "variant-a", providerId: "openai", modelId: "gpt-4", trafficPercentage: 100 },
        ],
        active: false,
      };

      await trafficManager.createABTest(abTest);

      await expect(trafficManager.getABTestVariant("test-1", "tenant-1")).rejects.toThrow(
        "not found or inactive",
      );
    });
  });

  describe("Rollback Triggers", () => {
    it("should trigger rollback on error rate threshold", async () => {
      const metrics = {
        legacyCount: 100,
        newCount: 100,
        errorRate: 0.02,
        p95Latency: 1000,
        lastUpdated: new Date(),
      };

      const trigger = await trafficManager.checkRollbackTriggers(metrics);

      expect(trigger).not.toBeNull();
      expect(trigger?.type).toBe("error_rate");
      expect(trigger?.currentValue).toBe(0.02);
    });

    it("should trigger rollback on latency threshold", async () => {
      const metrics = {
        legacyCount: 100,
        newCount: 100,
        errorRate: 0.001,
        p95Latency: 6000,
        lastUpdated: new Date(),
      };

      const trigger = await trafficManager.checkRollbackTriggers(metrics);

      expect(trigger).not.toBeNull();
      expect(trigger?.type).toBe("latency");
      expect(trigger?.currentValue).toBe(6000);
    });

    it("should not trigger rollback when metrics are healthy", async () => {
      const metrics = {
        legacyCount: 100,
        newCount: 100,
        errorRate: 0.001,
        p95Latency: 1000,
        lastUpdated: new Date(),
      };

      const trigger = await trafficManager.checkRollbackTriggers(metrics);

      expect(trigger).toBeNull();
    });

    it("should execute automatic rollback when trigger is activated", async () => {
      await trafficManager.setGlobalPercentage(50);

      await trafficManager.triggerRollback(
        { type: "error_rate", threshold: 0.01, currentValue: 0.02, triggeredAt: new Date() },
        "High error rate",
      );

      const rollbackState = trafficManager.getRollbackState();
      expect(rollbackState.triggered).toBe(true);
      expect(rollbackState.previousPercentage).toBe(50);
      expect(rollbackState.rolledBackAt).toBeDefined();
    });

    it("should notify on rollback", async () => {
      await trafficManager.triggerRollback(
        { type: "error_rate", threshold: 0.01, currentValue: 0.02, triggeredAt: new Date() },
        "Test rollback notification",
      );

      expect(mockRedis.publish).toHaveBeenCalledWith("test:alerts:rollback", expect.any(String));
    });

    it("should preserve rollback state for post-mortem", async () => {
      const trigger = {
        type: "latency" as const,
        threshold: 5000,
        currentValue: 6000,
        triggeredAt: new Date(),
      };
      await trafficManager.triggerRollback(trigger, "High latency");

      const state = trafficManager.getRollbackState();
      expect(state.triggered).toBe(true);
      expect(state.reason).toBe("High latency");
      expect(state.trigger).toEqual(trigger);
      expect(state.previousPercentage).toBe(0);
    });

    it("should clear rollback state", async () => {
      await trafficManager.triggerRollback(
        { type: "error_rate", threshold: 0.01, currentValue: 0.02, triggeredAt: new Date() },
        "Test",
      );

      await trafficManager.clearRollback();

      const state = trafficManager.getRollbackState();
      expect(state.triggered).toBe(false);
    });

    it("should throw when clearing non-existent rollback", async () => {
      await expect(trafficManager.clearRollback()).rejects.toThrow("No rollback state to clear");
    });
  });

  describe("Tenant Isolation Breach", () => {
    it("should record tenant isolation breach and trigger rollback", async () => {
      await trafficManager.recordTenantIsolationBreach(
        "tenant-1",
        "Cross-tenant data access detected",
      );

      const rollbackState = trafficManager.getRollbackState();
      expect(rollbackState.triggered).toBe(true);
      expect(rollbackState.reason).toContain("Tenant isolation breach");

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining("test:breaches:"),
        expect.any(Number),
        expect.stringContaining("tenant-1"),
      );
    });
  });

  describe("Cost Anomaly Detection", () => {
    it("should trigger rollback on cost anomaly (>20% increase)", async () => {
      await trafficManager.recordCostAnomaly(1000, 1300);

      const rollbackState = trafficManager.getRollbackState();
      expect(rollbackState.triggered).toBe(true);
      expect(rollbackState.reason).toContain("Cost anomaly");
    });

    it("should not trigger rollback for acceptable cost increase", async () => {
      await trafficManager.recordCostAnomaly(1000, 1150);

      const rollbackState = trafficManager.getRollbackState();
      expect(rollbackState.triggered).toBe(false);
    });
  });

  describe("Metrics", () => {
    it("should update and retrieve metrics", async () => {
      const metrics = {
        legacyCount: 150,
        newCount: 250,
        errorRate: 0.005,
        p95Latency: 1200,
        lastUpdated: new Date(),
      };

      await trafficManager.updateMetrics(metrics);
      const retrieved = await trafficManager.getMetrics();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.legacyCount).toBe(150);
      expect(retrieved?.newCount).toBe(250);
      expect(retrieved?.errorRate).toBe(0.005);
      expect(retrieved?.p95Latency).toBe(1200);
    });

    it("should return null when no metrics exist", async () => {
      const metrics = await trafficManager.getMetrics();
      expect(metrics).toBeNull();
    });
  });

  describe("AsyncLocalStorage Context", () => {
    it("should set and get tenant context", () => {
      withTenantContext("tenant-123", () => {
        const tenantId = TrafficManager.getTenantContext();
        expect(tenantId).toBe("tenant-123");
      });
    });

    it("should return undefined when no context is set", () => {
      const tenantId = TrafficManager.getTenantContext();
      expect(tenantId).toBeUndefined();
    });
  });

  describe("Gradual Cutover Simulation", () => {
    it("should support gradual cutover: 0% → 10% → 50% → 100%", async () => {
      const percentages = [0, 10, 50, 100];

      for (const percentage of percentages) {
        await trafficManager.setGlobalPercentage(percentage);

        const decisions = await Promise.all(
          Array(100)
            .fill(null)
            .map(() => trafficManager.route()),
        );

        const newSystemCount = decisions.filter((d) => d.target === "new").length;
        const actualPercentage = newSystemCount;

        if (percentage === 0) {
          expect(actualPercentage).toBe(0);
        } else if (percentage === 100) {
          expect(actualPercentage).toBe(100);
        } else {
          expect(actualPercentage).toBeGreaterThan(percentage - 15);
          expect(actualPercentage).toBeLessThan(percentage + 15);
        }
      }
    });
  });
});
