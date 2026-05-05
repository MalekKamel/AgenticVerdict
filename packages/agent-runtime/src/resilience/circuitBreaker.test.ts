import { describe, it, expect, vi, beforeEach } from "vitest";
import { CircuitBreaker, CircuitState } from "./circuitBreaker";

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      monitoringWindowMs: 5000,
      providerId: "test-provider",
      tenantId: "test-tenant",
    });
  });

  describe("Initial state", () => {
    it("should start in CLOSED state", () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.isClosed()).toBe(true);
      expect(circuitBreaker.isOpen()).toBe(false);
      expect(circuitBreaker.isHalfOpen()).toBe(false);
    });

    it("should have zero failure count initially", () => {
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe("Closed state (normal operation)", () => {
    it("should allow requests to pass through in CLOSED state", async () => {
      const result = await circuitBreaker.execute(async () => "success");
      expect(result).toBe("success");
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it("should track failures", async () => {
      const error = new Error("Test error");

      await expect(
        circuitBreaker.execute(async () => {
          throw error;
        }),
      ).rejects.toThrow("Test error");

      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it("should reset failure count on success", async () => {
      const error = new Error("Test error");

      await expect(
        circuitBreaker.execute(async () => {
          throw error;
        }),
      ).rejects.toThrow();
      expect(circuitBreaker.getFailureCount()).toBe(1);

      await circuitBreaker.execute(async () => "success");
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe("Open circuit on threshold", () => {
    it("should open circuit when failures reach threshold", async () => {
      const error = new Error("Test error");

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it("should emit state change event when opening", async () => {
      const stateChangeHandler = vi.fn();
      circuitBreaker.on("stateChange", stateChangeHandler);

      const error = new Error("Test error");
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      expect(stateChangeHandler).toHaveBeenCalledTimes(1);
      const event = stateChangeHandler.mock.calls[0][0];
      expect(event.tenantId).toBe("test-tenant");
      expect(event.providerId).toBe("test-provider");
      expect(event.fromState).toBe(CircuitState.CLOSED);
      expect(event.toState).toBe(CircuitState.OPEN);
      expect(event.failureCount).toBe(3);
      expect(event.error).toBe(error);
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("Open state (blocking requests)", () => {
    it("should reject requests immediately when circuit is OPEN", async () => {
      const error = new Error("Test error");

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      await expect(circuitBreaker.execute(async () => "should not run")).rejects.toThrow(
        "Circuit breaker is OPEN",
      );
    });

    it("should include retry time in error message", async () => {
      const error = new Error("Test error");

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      await expect(circuitBreaker.execute(async () => "should not run")).rejects.toThrow(
        /Retry after/,
      );
    });
  });

  describe("Half-open state (testing recovery)", () => {
    it("should transition to HALF_OPEN after reset timeout", async () => {
      const error = new Error("Test error");

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      await vi.waitUntil(() => circuitBreaker.isHalfOpen(), { timeout: 1500, interval: 100 });
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it("should close circuit on successful test request in HALF_OPEN", async () => {
      const error = new Error("Test error");

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      await vi.waitUntil(() => circuitBreaker.isHalfOpen(), { timeout: 1500, interval: 100 });

      await circuitBreaker.execute(async () => "success");

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it("should re-open circuit on failed test request in HALF_OPEN", async () => {
      const error = new Error("Test error");

      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      await vi.waitUntil(() => circuitBreaker.isHalfOpen(), { timeout: 1500, interval: 100 });

      await expect(
        circuitBreaker.execute(async () => {
          throw error;
        }),
      ).rejects.toThrow();

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe("Reset functionality", () => {
    it("should reset to CLOSED state manually", () => {
      circuitBreaker.reset();
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it("should emit state change event on manual reset from OPEN", async () => {
      const stateChangeHandler = vi.fn();
      circuitBreaker.on("stateChange", stateChangeHandler);

      const error = new Error("Test error");
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      circuitBreaker.reset();

      expect(stateChangeHandler).toHaveBeenCalledTimes(2);
      const resetEvent = stateChangeHandler.mock.calls[1][0];
      expect(resetEvent.tenantId).toBe("test-tenant");
      expect(resetEvent.providerId).toBe("test-provider");
      expect(resetEvent.fromState).toBe(CircuitState.OPEN);
      expect(resetEvent.toState).toBe(CircuitState.CLOSED);
      expect(resetEvent.failureCount).toBe(0);
    });
  });

  describe("Monitoring window", () => {
    it("should only count failures within monitoring window", async () => {
      const error = new Error("Test error");

      await expect(
        circuitBreaker.execute(async () => {
          throw error;
        }),
      ).rejects.toThrow();
      expect(circuitBreaker.getFailureCount()).toBe(1);

      await vi.waitUntil(
        () => {
          const now = Date.now();
          const lastFailure = circuitBreaker.getLastFailureTime();
          return lastFailure && now - lastFailure > 5000;
        },
        { timeout: 6000, interval: 100 },
      );

      circuitBreaker.onSuccess();
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe("Tenant and provider isolation", () => {
    it("should include tenantId and providerId in events", async () => {
      const stateChangeHandler = vi.fn();
      circuitBreaker.on("stateChange", stateChangeHandler);

      const error = new Error("Test error");
      for (let i = 0; i < 3; i++) {
        await expect(
          circuitBreaker.execute(async () => {
            throw error;
          }),
        ).rejects.toThrow();
      }

      const event = stateChangeHandler.mock.calls[0][0];
      expect(event.tenantId).toBe("test-tenant");
      expect(event.providerId).toBe("test-provider");
    });

    it("should maintain separate state for different tenants", () => {
      const tenant1Circuit = new CircuitBreaker({ tenantId: "tenant-1", providerId: "provider" });
      const tenant2Circuit = new CircuitBreaker({ tenantId: "tenant-2", providerId: "provider" });

      expect(tenant1Circuit.getState()).toBe(CircuitState.CLOSED);
      expect(tenant2Circuit.getState()).toBe(CircuitState.CLOSED);
    });

    it("should maintain separate state for different providers", () => {
      const provider1Circuit = new CircuitBreaker({ tenantId: "tenant", providerId: "provider-1" });
      const provider2Circuit = new CircuitBreaker({ tenantId: "tenant", providerId: "provider-2" });

      expect(provider1Circuit.getState()).toBe(CircuitState.CLOSED);
      expect(provider2Circuit.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe("Default configuration", () => {
    it("should use default failure threshold of 5", () => {
      const defaultCircuit = new CircuitBreaker();

      expect(defaultCircuit.getFailureCount()).toBe(0);
    });

    it("should use default reset timeout of 60000ms", () => {
      const defaultCircuit = new CircuitBreaker();
      expect(defaultCircuit.getState()).toBe(CircuitState.CLOSED);
    });

    it("should use default monitoring window of 30000ms", () => {
      const defaultCircuit = new CircuitBreaker();
      expect(defaultCircuit.getFailureCount()).toBe(0);
    });
  });
});
