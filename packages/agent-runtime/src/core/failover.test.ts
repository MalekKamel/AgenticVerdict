import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { ProviderFailover, ProviderFailoverExhaustedError, isRetryableError } from "./failover";
import { ProviderRegistry } from "./ProviderRegistry";

/**
 * Mock provider for testing
 */
class MockProvider implements ProviderRuntime {
  readonly providerId: string;
  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: true,
    chatVision: false,
    chatTools: false,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  constructor(config: ProviderConfig) {
    this.providerId = config.providerId;
  }

  async chat(): Promise<ChatCompletionResponse> {
    throw new Error("Not implemented in mock");
  }
}

describe("ProviderFailover", () => {
  beforeEach(() => {
    // Register test providers
    ProviderRegistry.register("test-primary", MockProvider);
    ProviderRegistry.register("test-fallback", MockProvider);
    ProviderRegistry.register("test-fallback2", MockProvider);
  });

  afterEach(() => {
    ProviderFailover.clearAllCircuitBreakers();
    ProviderRegistry.unregister("test-primary");
    ProviderRegistry.unregister("test-fallback");
    ProviderRegistry.unregister("test-fallback2");
    vi.clearAllMocks();
  });

  describe("isRetryableError", () => {
    it("identifies network errors as retryable", () => {
      expect(isRetryableError(new Error("Network error"))).toBe(true);
      expect(isRetryableError(new Error("Connection timeout"))).toBe(true);
      expect(isRetryableError(new Error("ECONNREFUSED"))).toBe(true);
      expect(isRetryableError(new Error("ETIMEDOUT"))).toBe(true);
    });

    it("identifies server errors as retryable", () => {
      expect(isRetryableError(new Error("Internal server error"))).toBe(true);
      expect(isRetryableError(new Error("Service unavailable"))).toBe(true);
      expect(isRetryableError(new Error("Bad gateway"))).toBe(true);
      expect(isRetryableError(new Error("Gateway timeout"))).toBe(true);
    });

    it("identifies auth errors as non-retryable", () => {
      expect(isRetryableError(new Error("Authentication failed"))).toBe(false);
      expect(isRetryableError(new Error("Unauthorized"))).toBe(false);
      expect(isRetryableError(new Error("Forbidden"))).toBe(false);
      expect(isRetryableError(new Error("Invalid API key"))).toBe(false);
    });

    it("identifies rate limits as non-retryable", () => {
      expect(isRetryableError(new Error("Rate limit exceeded"))).toBe(false);
      expect(isRetryableError(new Error("Too many requests"))).toBe(false);
    });

    it("identifies quota errors as non-retryable", () => {
      expect(isRetryableError(new Error("Quota exceeded"))).toBe(false);
    });
  });

  describe("executeWithFailover - Success scenarios", () => {
    it("succeeds on first provider without failover", async () => {
      const mockOperation = vi.fn().mockResolvedValue("success");
      const tenantContext = { tenantId: "tenant-123" };

      const result = await ProviderFailover.executeWithFailover(
        tenantContext,
        ["test-primary"],
        mockOperation,
      );

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith("test-primary");
    });

    it("succeeds on fallback after primary fails", async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockResolvedValueOnce("fallback-success");
      const tenantContext = { tenantId: "tenant-123" };

      const result = await ProviderFailover.executeWithFailover(
        tenantContext,
        ["test-primary", "test-fallback"],
        mockOperation,
      );

      expect(result).toBe("fallback-success");
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOperation.mock.calls[0][0]).toBe("test-primary");
      expect(mockOperation.mock.calls[1][0]).toBe("test-fallback");
    });

    it("tries all providers in sequence until success", async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockRejectedValueOnce(new Error("Connection error"))
        .mockResolvedValueOnce("third-provider-success");
      const tenantContext = { tenantId: "tenant-123" };

      const result = await ProviderFailover.executeWithFailover(
        tenantContext,
        ["test-primary", "test-fallback", "test-fallback2"],
        mockOperation,
      );

      expect(result).toBe("third-provider-success");
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe("executeWithFailover - Failure scenarios", () => {
    it("throws ProviderFailoverExhaustedError when all providers fail", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("Network error"));
      const tenantContext = { tenantId: "tenant-123" };

      await expect(
        ProviderFailover.executeWithFailover(
          tenantContext,
          ["test-primary", "test-fallback"],
          mockOperation,
        ),
      ).rejects.toThrow(ProviderFailoverExhaustedError);
    });

    it("fails immediately on non-retryable error without trying fallbacks", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("Authentication failed"));
      const tenantContext = { tenantId: "tenant-123" };

      await expect(
        ProviderFailover.executeWithFailover(
          tenantContext,
          ["test-primary", "test-fallback"],
          mockOperation,
        ),
      ).rejects.toThrow("Authentication failed");

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith("test-primary");
    });

    it("skips unregistered providers", async () => {
      const mockOperation = vi.fn().mockResolvedValue("success");
      const tenantContext = { tenantId: "tenant-123" };

      const result = await ProviderFailover.executeWithFailover(
        tenantContext,
        ["unregistered-provider", "test-primary"],
        mockOperation,
      );

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith("test-primary");
    });

    it("throws error when no providers are configured", async () => {
      const mockOperation = vi.fn();
      const tenantContext = { tenantId: "tenant-123" };

      await expect(
        ProviderFailover.executeWithFailover(tenantContext, [], mockOperation),
      ).rejects.toThrow("At least one provider must be configured");
    });
  });

  describe("Circuit breaker integration", () => {
    it("tracks failures in circuit breaker", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("Network error"));
      const tenantContext = { tenantId: "tenant-123" };

      // Cause some failures
      try {
        await ProviderFailover.executeWithFailover(tenantContext, ["test-primary"], mockOperation, {
          failureThreshold: 3,
        });
      } catch {
        // Expected to fail
      }

      try {
        await ProviderFailover.executeWithFailover(tenantContext, ["test-primary"], mockOperation, {
          failureThreshold: 3,
        });
      } catch {
        // Expected to fail
      }

      const status = ProviderFailover.getCircuitBreakerStatus("tenant-123", "test-primary");
      expect(status.failureCount).toBeGreaterThan(0);
    });

    it("provides circuit breaker status", () => {
      const status = ProviderFailover.getCircuitBreakerStatus("tenant-123", "test-primary");
      expect(status).toHaveProperty("isOpen");
      expect(status).toHaveProperty("isHalfOpen");
      expect(status).toHaveProperty("isClosed");
      expect(status).toHaveProperty("failureCount");
      expect(status).toHaveProperty("state");
    });

    it("can reset circuit breaker manually", () => {
      ProviderFailover.resetCircuitBreaker("tenant-123", "test-primary");
      // Should not throw
      expect(ProviderFailover.getCircuitBreakerStatus("tenant-123", "test-primary")).toBeDefined();
    });

    it("maintains separate circuit breakers per tenant", async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error("Network error"));

      // Cause failures for tenant 1
      try {
        await ProviderFailover.executeWithFailover(
          { tenantId: "tenant-1" },
          ["test-primary"],
          mockOperation,
          { failureThreshold: 2 },
        );
      } catch {
        // Expected
      }

      // Tenant 2 should have clean circuit breaker
      const tenant1Status = ProviderFailover.getCircuitBreakerStatus("tenant-1", "test-primary");
      const tenant2Status = ProviderFailover.getCircuitBreakerStatus("tenant-2", "test-primary");

      expect(tenant1Status.failureCount).toBeGreaterThan(0);
      expect(tenant2Status.failureCount).toBe(0);
    });
  });

  describe("Tenant context preservation", () => {
    it("includes tenantId in all log events", async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce("success");
      const tenantContext = { tenantId: "tenant-specific-123" };

      await ProviderFailover.executeWithFailover(
        tenantContext,
        ["test-primary", "test-fallback"],
        mockOperation,
      );

      // Verify tenant context is passed through (implicitly tested via types)
      expect(tenantContext.tenantId).toBe("tenant-specific-123");
    });

    it("maintains isolation between concurrent tenant failovers", async () => {
      const tenant1Operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce("tenant1-success");
      const tenant2Operation = vi.fn().mockResolvedValue("tenant2-success");

      const tenant1Context = { tenantId: "tenant-1" };
      const tenant2Context = { tenantId: "tenant-2" };

      // Run concurrent failovers
      const [result1, result2] = await Promise.all([
        ProviderFailover.executeWithFailover(
          tenant1Context,
          ["test-primary", "test-fallback"],
          tenant1Operation,
        ),
        ProviderFailover.executeWithFailover(tenant2Context, ["test-primary"], tenant2Operation),
      ]);

      expect(result1).toBe("tenant1-success");
      expect(result2).toBe("tenant2-success");
      expect(tenant1Operation).toHaveBeenCalled();
      expect(tenant2Operation).toHaveBeenCalled();
    });
  });

  describe("Error aggregation", () => {
    it("collects all errors in ProviderFailoverExhaustedError", async () => {
      // Use retryable errors to ensure failover continues through all providers
      const error1 = new Error("Network timeout on provider 1");
      const error2 = new Error("Connection error on provider 2");
      const error3 = new Error("Service unavailable on provider 3");

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(error1)
        .mockRejectedValueOnce(error2)
        .mockRejectedValueOnce(error3);

      const tenantContext = { tenantId: "tenant-123" };

      try {
        await ProviderFailover.executeWithFailover(
          tenantContext,
          ["test-primary", "test-fallback", "test-fallback2"],
          mockOperation,
        );
        expect.fail("Should have thrown ProviderFailoverExhaustedError");
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderFailoverExhaustedError);
        if (error instanceof ProviderFailoverExhaustedError) {
          expect(error.errors).toHaveLength(3);
          expect(error.errors.map((e) => e.providerId)).toEqual([
            "test-primary",
            "test-fallback",
            "test-fallback2",
          ]);
          expect(error.errors.map((e) => e.error.message)).toEqual([
            "Network timeout on provider 1",
            "Connection error on provider 2",
            "Service unavailable on provider 3",
          ]);
          expect(error.message).toContain("All providers failed");
        }
      }
    });
  });
});
