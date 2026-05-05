import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthBasedRouter } from "./healthBasedRouter";
import { ProviderHealth } from "./failoverHandler";

describe("HealthBasedRouter", () => {
  let router: HealthBasedRouter;
  let healthCheckerMock: ReturnType<typeof vi.fn>;
  let onFailoverMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    healthCheckerMock = vi.fn();
    onFailoverMock = vi.fn();

    router = new HealthBasedRouter({
      tenantId: "test-tenant",
      defaultProvider: "primary",
      healthChecker: healthCheckerMock,
      onFailover: onFailoverMock,
      errorRateThreshold: 0.1,
      latencyThresholdMs: 5000,
    });
  });

  describe("Basic routing", () => {
    it("should route to default provider when healthy", async () => {
      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      const executor = vi.fn().mockResolvedValue("success");
      const result = await router.route(executor);

      expect(result).toBe("success");
      expect(executor).toHaveBeenCalledWith("primary");
    });

    it("should route to specified provider when provided", async () => {
      healthCheckerMock.mockResolvedValue({
        providerId: "secondary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      const executor = vi.fn().mockResolvedValue("success");
      const result = await router.route(executor, "secondary");

      expect(result).toBe("success");
      expect(executor).toHaveBeenCalledWith("secondary");
    });

    it("should use failover chain when configured", async () => {
      router = new HealthBasedRouter({
        tenantId: "test-tenant",
        defaultProvider: "primary",
        failoverChains: {
          primary: {
            providers: ["primary", "secondary", "tertiary"],
            skipUnhealthy: true,
          },
        },
        healthChecker: healthCheckerMock,
      });

      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      const executor = vi.fn().mockResolvedValue("success");
      await router.route(executor);

      expect(executor).toHaveBeenCalledWith("primary");
    });
  });

  describe("Health-based failover", () => {
    it("should failover to healthy provider when default is unhealthy", async () => {
      router = new HealthBasedRouter({
        tenantId: "test-tenant",
        defaultProvider: "primary",
        failoverChains: {
          primary: {
            providers: ["primary", "secondary"],
            skipUnhealthy: true,
          },
        },
        healthChecker: healthCheckerMock,
        onFailover: onFailoverMock,
      });

      healthCheckerMock
        .mockResolvedValueOnce({
          providerId: "primary",
          isHealthy: false,
          lastChecked: new Date(),
        })
        .mockResolvedValueOnce({
          providerId: "secondary",
          isHealthy: true,
          lastChecked: new Date(),
        });

      const executor = vi.fn().mockResolvedValue("success");
      const result = await router.route(executor);

      expect(result).toBe("success");
      expect(executor).toHaveBeenCalledWith("secondary");
    });

    it("should throw when all providers are unhealthy", async () => {
      router = new HealthBasedRouter({
        tenantId: "test-tenant",
        defaultProvider: "primary",
        failoverChains: {
          primary: {
            providers: ["primary", "secondary"],
            skipUnhealthy: true,
          },
        },
        healthChecker: healthCheckerMock,
      });

      healthCheckerMock
        .mockResolvedValueOnce({
          providerId: "primary",
          isHealthy: false,
          lastChecked: new Date(),
        })
        .mockResolvedValueOnce({
          providerId: "secondary",
          isHealthy: false,
          lastChecked: new Date(),
        });

      const executor = vi.fn();

      await expect(router.route(executor)).rejects.toThrow("No healthy providers available");
      expect(executor).not.toHaveBeenCalled();
    });
  });

  describe("Failover with retries", () => {
    it("should retry with next provider on failure", async () => {
      router = new HealthBasedRouter({
        tenantId: "test-tenant",
        defaultProvider: "primary",
        failoverChains: {
          primary: {
            providers: ["primary", "secondary"],
            skipUnhealthy: true,
          },
        },
        healthChecker: healthCheckerMock,
        onFailover: onFailoverMock,
      });

      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      const executor = vi
        .fn()
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockResolvedValueOnce("success");

      const result = await router.routeWithFailover(
        { providers: ["primary", "secondary"], skipUnhealthy: true },
        executor,
      );

      expect(result).toBe("success");
      expect(executor).toHaveBeenCalledTimes(2);
      expect(onFailoverMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Health evaluation", () => {
    it("should evaluate health from metrics", async () => {
      const healthy = await router.evaluateHealthFromMetrics("primary", {
        errorRate: 0.05,
        latencyMs: 200,
      });

      expect(healthy).toBe(true);
    });

    it("should mark unhealthy when error rate exceeds threshold", async () => {
      const healthy = await router.evaluateHealthFromMetrics("primary", {
        errorRate: 0.15,
        latencyMs: 200,
      });

      expect(healthy).toBe(false);
    });

    it("should mark unhealthy when latency exceeds threshold", async () => {
      const healthy = await router.evaluateHealthFromMetrics("primary", {
        errorRate: 0.05,
        latencyMs: 6000,
      });

      expect(healthy).toBe(false);
    });
  });

  describe("Provider health checking", () => {
    it("should check provider health", async () => {
      const mockHealth: ProviderHealth = {
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      };

      healthCheckerMock.mockResolvedValue(mockHealth);

      const health = await router.checkHealth("primary");

      expect(health).toEqual(mockHealth);
    });

    it("should return healthy status for healthy provider", async () => {
      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      expect(router.isProviderHealthy("primary")).toBe(true);
    });

    it("should return unhealthy status for unhealthy provider", async () => {
      router = new HealthBasedRouter({
        tenantId: "test-tenant",
        defaultProvider: "primary",
        failoverChains: {
          primary: {
            providers: ["primary"],
            skipUnhealthy: true,
          },
        },
        healthChecker: healthCheckerMock,
      });

      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: false,
        lastChecked: new Date(),
      });

      expect(router.isProviderHealthy("primary")).toBe(false);
    });

    router = new HealthBasedRouter({
      tenantId: "test-tenant",
      defaultProvider: "primary",
      healthChecker: healthCheckerMock,
    });

    expect(router.isProviderHealthy("primary")).toBe(false);
  });

  it("should get list of healthy providers", async () => {
    healthCheckerMock.mockResolvedValue({
      providerId: "primary",
      isHealthy: true,
      lastChecked: new Date(),
    });

    router = new HealthBasedRouter({
      tenantId: "test-tenant",
      defaultProvider: "primary",
      healthChecker: healthCheckerMock,
    });

    const healthy = await router.getHealthyProviders(["primary", "secondary"]);

    expect(healthy).toContain("primary");
  });
});

describe("Routing history", () => {
  it("should record routing decisions", async () => {
    healthCheckerMock.mockResolvedValue({
      providerId: "primary",
      isHealthy: true,
      lastChecked: new Date(),
    });

    const executor = vi.fn().mockResolvedValue("success");
    await router.route(executor);

    const history = router.getRoutingHistory();

    expect(history).toHaveLength(1);
    expect(history[0].providerId).toBe("primary");
    expect(history[0].reason).toBe("default");
  });

  it("should record failover routing decisions", async () => {
    router = new HealthBasedRouter({
      tenantId: "test-tenant",
      defaultProvider: "primary",
      failoverChains: {
        primary: {
          providers: ["primary", "secondary"],
          skipUnhealthy: true,
        },
      },
      healthChecker: healthCheckerMock,
      onFailover: onFailoverMock,
    });

    healthCheckerMock
      .mockResolvedValueOnce({
        providerId: "primary",
        isHealthy: false,
        lastChecked: new Date(),
      })
      .mockResolvedValueOnce({
        providerId: "secondary",
        isHealthy: true,
        lastChecked: new Date(),
      });

    const executor = vi.fn().mockResolvedValue("success");
    await router.route(executor);

    const history = router.getRoutingHistory();

    expect(history).toHaveLength(1);
    expect(history[0].reason).toBe("default");
  });

  it("should limit history size to maxHistorySize", async () => {
    healthCheckerMock.mockResolvedValue({
      providerId: "primary",
      isHealthy: true,
      lastChecked: new Date(),
    });

    const executor = vi.fn().mockResolvedValue("success");

    for (let i = 0; i < 150; i++) {
      await router.route(executor);
    }

    const history = router.getRoutingHistory();

    expect(history.length).toBeLessThanOrEqual(100);
  });

  it("should clear routing history", async () => {
    healthCheckerMock.mockResolvedValue({
      providerId: "primary",
      isHealthy: true,
      lastChecked: new Date(),
    });

    const executor = vi.fn().mockResolvedValue("success");
    await router.route(executor);

    expect(router.getRoutingHistory()).toHaveLength(1);

    router.clearRoutingHistory();

    expect(router.getRoutingHistory()).toHaveLength(0);
  });
});

describe("Reset functionality", () => {
  it("should reset single provider", async () => {
    router.resetProvider("primary");
  });

  it("should reset all providers and clear history", async () => {
    healthCheckerMock.mockResolvedValue({
      providerId: "primary",
      isHealthy: true,
      lastChecked: new Date(),
    });

    const executor = vi.fn().mockResolvedValue("success");
    await router.route(executor);

    expect(router.getRoutingHistory()).toHaveLength(1);

    router.resetAll();

    expect(router.getRoutingHistory()).toHaveLength(0);
  });
});

describe("Health cache management", () => {
  it("should refresh health cache", async () => {
    router = new HealthBasedRouter({
      tenantId: "test-tenant",
      defaultProvider: "primary",
      healthChecker: healthCheckerMock,
    });

    healthCheckerMock.mockResolvedValue({
      providerId: "primary",
      isHealthy: true,
      lastChecked: new Date(),
    });

    router.resetProvider("primary");
    await router.refreshHealthCache();

    expect(healthCheckerMock).toHaveBeenCalled();
  });

  it("should clear health cache", async () => {
    healthCheckerMock.mockResolvedValue({
      providerId: "primary",
      isHealthy: true,
      lastChecked: new Date(),
    });

    await router.checkHealth("primary");
    router.clearHealthCache();

    await router.checkHealth("primary");

    expect(healthCheckerMock).toHaveBeenCalledTimes(2);
  });
});

describe("Tenant isolation", () => {
  it("should maintain separate routing per tenant", () => {
    const tenant1Router = new HealthBasedRouter({
      tenantId: "tenant-1",
      defaultProvider: "primary",
    });

    const tenant2Router = new HealthBasedRouter({
      tenantId: "tenant-2",
      defaultProvider: "primary",
    });

    expect(tenant1Router.getRoutingHistory()).toEqual([]);
    expect(tenant2Router.getRoutingHistory()).toEqual([]);
  });
});
