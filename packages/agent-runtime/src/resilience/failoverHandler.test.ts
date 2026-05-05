import { describe, it, expect, vi, beforeEach } from "vitest";
import { FailoverHandler, FailoverChainConfig, ProviderHealth } from "./failoverHandler";
import { CircuitState } from "./circuitBreaker";

describe("FailoverHandler", () => {
  let failoverHandler: FailoverHandler;
  let onFailoverMock: ReturnType<typeof vi.fn>;
  let healthCheckerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFailoverMock = vi.fn();
    healthCheckerMock = vi.fn();

    failoverHandler = new FailoverHandler({
      tenantId: "test-tenant",
      onFailover: onFailoverMock,
      healthChecker: healthCheckerMock,
      circuitBreakerOptions: {
        failureThreshold: 2,
        resetTimeoutMs: 500,
      },
    });
  });

  describe("Basic failover", () => {
    it("should succeed with primary provider on first try", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary"],
      };

      const executor = vi.fn().mockResolvedValue("success");
      const result = await failoverHandler.executeWithFailover(chain, executor);

      expect(result).toBe("success");
      expect(executor).toHaveBeenCalledTimes(1);
      expect(executor).toHaveBeenCalledWith("primary");
      expect(onFailoverMock).not.toHaveBeenCalled();
    });

    it("should failover to secondary when primary fails", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary"],
      };

      const executor = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("Primary failed");
        })
        .mockResolvedValueOnce("success");

      const result = await failoverHandler.executeWithFailover(chain, executor);

      expect(result).toBe("success");
      expect(executor).toHaveBeenCalledTimes(2);
      expect(executor).toHaveBeenNthCalledWith(1, "primary");
      expect(executor).toHaveBeenNthCalledWith(2, "secondary");
      expect(onFailoverMock).toHaveBeenCalledTimes(1);
    });

    it("should try all providers in chain before throwing", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary", "tertiary"],
        skipUnhealthy: false,
      };

      const error = new Error("All failed");
      const executor = vi.fn().mockRejectedValue(error);

      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow(
        "All failed",
      );

      expect(executor).toHaveBeenCalledTimes(3);
      expect(executor).toHaveBeenNthCalledWith(1, "primary");
      expect(executor).toHaveBeenNthCalledWith(2, "secondary");
      expect(executor).toHaveBeenNthCalledWith(3, "tertiary");
      expect(onFailoverMock).toHaveBeenCalledTimes(2);
    });

    it("should throw last error when all providers fail", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary"],
      };

      const primaryError = new Error("Primary failed");
      const secondaryError = new Error("Secondary failed");

      const executor = vi
        .fn()
        .mockRejectedValueOnce(primaryError)
        .mockRejectedValueOnce(secondaryError);

      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow(
        "Secondary failed",
      );
    });
  });

  describe("Failover events", () => {
    it("should emit failover event with correct details", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary"],
      };

      const error = new Error("Primary failed");
      const executor = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce("success");

      await failoverHandler.executeWithFailover(chain, executor);

      expect(onFailoverMock).toHaveBeenCalledTimes(1);
      const event = onFailoverMock.mock.calls[0][0];
      expect(event.tenantId).toBe("test-tenant");
      expect(event.fromProvider).toBe("primary");
      expect(event.toProvider).toBe("secondary");
      expect(event.error).toBe(error);
      expect(event.attemptNumber).toBe(1);
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it("should emit multiple failover events for multiple failovers", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary", "tertiary"],
      };

      const executor = vi
        .fn()
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockRejectedValueOnce(new Error("Secondary failed"))
        .mockResolvedValueOnce("success");

      await failoverHandler.executeWithFailover(chain, executor);

      expect(onFailoverMock).toHaveBeenCalledTimes(2);

      expect(onFailoverMock.mock.calls[0][0].fromProvider).toBe("primary");
      expect(onFailoverMock.mock.calls[0][0].toProvider).toBe("secondary");

      expect(onFailoverMock.mock.calls[1][0].fromProvider).toBe("secondary");
      expect(onFailoverMock.mock.calls[1][0].toProvider).toBe("tertiary");
    });
  });

  describe("Health-based routing", () => {
    it("should skip unhealthy providers when skipUnhealthy is true", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary", "tertiary"],
        skipUnhealthy: true,
      };

      healthCheckerMock
        .mockResolvedValueOnce({ providerId: "primary", isHealthy: false, lastChecked: new Date() })
        .mockResolvedValueOnce({
          providerId: "secondary",
          isHealthy: true,
          lastChecked: new Date(),
        })
        .mockResolvedValueOnce({
          providerId: "tertiary",
          isHealthy: true,
          lastChecked: new Date(),
        });

      const executor = vi.fn().mockResolvedValue("success");
      await failoverHandler.executeWithHealthCheck(chain, executor);

      expect(executor).not.toHaveBeenCalledWith("primary");
      expect(executor).toHaveBeenCalledWith("secondary");
    });

    it("should throw when no healthy providers available", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary"],
        skipUnhealthy: true,
      };

      healthCheckerMock
        .mockResolvedValueOnce({ providerId: "primary", isHealthy: false, lastChecked: new Date() })
        .mockResolvedValueOnce({
          providerId: "secondary",
          isHealthy: false,
          lastChecked: new Date(),
        });

      const executor = vi.fn();

      await expect(failoverHandler.executeWithHealthCheck(chain, executor)).rejects.toThrow(
        "No healthy providers available",
      );

      expect(executor).not.toHaveBeenCalled();
    });

    it("should cache health check results", async () => {
      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      await failoverHandler.checkProviderHealth("primary");
      await failoverHandler.checkProviderHealth("primary");

      expect(healthCheckerMock).toHaveBeenCalledTimes(1);
    });

    it("should refresh health cache after TTL", async () => {
      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      await failoverHandler.checkProviderHealth("primary");

      await vi.waitUntil(
        () => {
          const lastChecked = (
            failoverHandler as unknown as { healthLastChecked: Map<string, number> }
          ).healthLastChecked.get("primary");
          return lastChecked && Date.now() - lastChecked > 30000;
        },
        { timeout: 35000, interval: 100 },
      );

      await failoverHandler.checkProviderHealth("primary");

      expect(healthCheckerMock).toHaveBeenCalledTimes(2);
    });

    it("should clear health cache on demand", async () => {
      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      await failoverHandler.checkProviderHealth("primary");
      failoverHandler.clearHealthCache();
      await failoverHandler.checkProviderHealth("primary");

      expect(healthCheckerMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("Circuit breaker integration", () => {
    it("should open circuit breaker after failures", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary"],
        skipUnhealthy: false,
      };

      const error = new Error("Failed");
      const executor = vi.fn().mockRejectedValue(error);

      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();
      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();
      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();

      expect(failoverHandler.getCircuitBreakerState("primary")).toBe(CircuitState.OPEN);
    });

    it("should skip providers with open circuit breakers", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary"],
        skipUnhealthy: false,
      };

      const primaryCb = failoverHandler.getCircuitBreaker("primary");

      for (let i = 0; i < 2; i++) {
        try {
          await primaryCb.execute(async () => {
            throw new Error("Primary failed");
          });
        } catch {
          // Ignore
        }
      }

      expect(failoverHandler.getCircuitBreakerState("primary")).toBe(CircuitState.OPEN);

      const executor = vi.fn().mockResolvedValue("success");
      await failoverHandler.executeWithFailover(chain, executor);

      expect(executor).not.toHaveBeenCalledWith("primary");
      expect(executor).toHaveBeenCalledWith("secondary");
    });

    it("should reset circuit breaker on demand", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary"],
        skipUnhealthy: false,
      };

      const error = new Error("Failed");
      const executor = vi.fn().mockRejectedValue(error);

      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();
      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();
      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();

      expect(failoverHandler.getCircuitBreakerState("primary")).toBe(CircuitState.OPEN);

      failoverHandler.resetCircuitBreaker("primary");
      expect(failoverHandler.getCircuitBreakerState("primary")).toBe(CircuitState.CLOSED);
    });

    it("should reset all circuit breakers", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary"],
        skipUnhealthy: false,
      };

      const executor = vi.fn().mockRejectedValue(new Error("Failed"));

      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();
      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();
      await expect(failoverHandler.executeWithFailover(chain, executor)).rejects.toThrow();

      expect(failoverHandler.getCircuitBreakerState("primary")).toBe(CircuitState.OPEN);
      expect(failoverHandler.getCircuitBreakerState("secondary")).toBe(CircuitState.OPEN);

      failoverHandler.resetAllCircuitBreakers();

      expect(failoverHandler.getCircuitBreakerState("primary")).toBe(CircuitState.CLOSED);
      expect(failoverHandler.getCircuitBreakerState("secondary")).toBe(CircuitState.CLOSED);
    });
  });

  describe("Provider health checking", () => {
    it("should check provider health", async () => {
      const mockHealth: ProviderHealth = {
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
        errorRate: 0.01,
        latencyMs: 150,
      };

      healthCheckerMock.mockResolvedValue(mockHealth);

      const health = await failoverHandler.checkProviderHealth("primary");

      expect(health).toEqual(mockHealth);
    });

    it("should return cached health when available", async () => {
      const mockHealth: ProviderHealth = {
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      };

      healthCheckerMock.mockResolvedValue(mockHealth);

      await failoverHandler.checkProviderHealth("primary");
      await failoverHandler.checkProviderHealth("primary");

      expect(healthCheckerMock).toHaveBeenCalledTimes(1);
    });

    it("should check if provider is healthy", async () => {
      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      expect(failoverHandler.isProviderHealthy("primary")).toBe(true);
    });

    it("should return unhealthy for open circuit breaker", async () => {
      const primaryCb = failoverHandler.getCircuitBreaker("primary");

      for (let i = 0; i < 2; i++) {
        try {
          await primaryCb.execute(async () => {
            throw new Error("Failed");
          });
        } catch {
          // Ignore
        }
      }

      expect(failoverHandler.isProviderHealthy("primary")).toBe(false);
    });
  });

  describe("Tenant isolation", () => {
    it("should maintain separate circuit breakers per tenant", () => {
      const tenant1Handler = new FailoverHandler({
        tenantId: "tenant-1",
        circuitBreakerOptions: { failureThreshold: 2 },
      });

      const tenant2Handler = new FailoverHandler({
        tenantId: "tenant-2",
        circuitBreakerOptions: { failureThreshold: 2 },
      });

      const chain: FailoverChainConfig = { providers: ["primary"] };

      tenant1Handler
        .executeWithFailover(chain, async () => {
          throw new Error("Failed");
        })
        .catch(() => {});

      tenant2Handler
        .executeWithFailover(chain, async () => {
          throw new Error("Failed");
        })
        .catch(() => {});

      expect(tenant1Handler.getCircuitBreakerState("primary")).toBe(CircuitState.CLOSED);
      expect(tenant2Handler.getCircuitBreakerState("primary")).toBe(CircuitState.CLOSED);
    });
  });

  describe("Health cache refresh", () => {
    it("should refresh all provider health in cache", async () => {
      const chain: FailoverChainConfig = {
        providers: ["primary", "secondary", "tertiary"],
        skipUnhealthy: false,
      };

      healthCheckerMock.mockResolvedValue({
        providerId: "primary",
        isHealthy: true,
        lastChecked: new Date(),
      });

      await failoverHandler.executeWithFailover(chain, async () => "test");

      failoverHandler.getCircuitBreaker("secondary");
      failoverHandler.getCircuitBreaker("tertiary");

      await failoverHandler.refreshHealthCache();

      expect(healthCheckerMock).toHaveBeenCalledTimes(3);
    });
  });
});
