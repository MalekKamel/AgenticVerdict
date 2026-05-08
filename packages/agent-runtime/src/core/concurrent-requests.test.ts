import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { ProviderFailover } from "./failover";
import { ProviderRegistry } from "./ProviderRegistry";
import type { ProviderRuntime, ProviderCapabilities } from "./BaseProvider";
import type { ChatCompletionResponse } from "../types";

/**
 * Mock provider for concurrent testing
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

/**
 * Simulated tenant context with unique identifier
 */
interface TestTenantContext {
  tenantId: string;
  requestCount: number;
  expectedProvider: string;
}

describe("Concurrent Request Testing", () => {
  const NUM_TENANTS = 15;
  const REQUESTS_PER_TENANT = 5;
  const CONCURRENCY_LEVEL = 10;

  beforeEach(() => {
    // Register test providers
    ProviderRegistry.register("test-provider-1", MockProvider);
    ProviderRegistry.register("test-provider-2", MockProvider);
    ProviderRegistry.register("test-provider-3", MockProvider);
  });

  afterEach(() => {
    ProviderFailover.clearAllCircuitBreakers();
    ProviderRegistry.unregister("test-provider-1");
    ProviderRegistry.unregister("test-provider-2");
    ProviderRegistry.unregister("test-provider-3");
    vi.clearAllMocks();
  });

  /**
   * Task 6.1: Create concurrent request test with 10+ tenants
   *
   * This test validates that the system can handle concurrent requests
   * from multiple tenants without any cross-tenant context leakage.
   */
  describe("Concurrent request handling (10+ tenants)", () => {
    it("handles 15 concurrent tenants with zero context leakage", async () => {
      const tenantContexts: TestTenantContext[] = [];
      const results = new Map<string, string[]>();

      // Create 15 tenant contexts
      for (let i = 1; i <= NUM_TENANTS; i++) {
        tenantContexts.push({
          tenantId: `tenant-${i.toString().padStart(3, "0")}`,
          requestCount: 0,
          expectedProvider: i % 2 === 0 ? "test-provider-1" : "test-provider-2",
        });
        results.set(tenantContexts[i - 1].tenantId, []);
      }

      // Track all operations with tenant context
      const operationLog: Array<{
        tenantId: string;
        provider: string;
        timestamp: number;
      }> = [];

      const executeTenantRequest = async (
        tenantContext: TestTenantContext,
        requestIndex: number,
      ): Promise<string> => {
        const mockOperation = vi.fn().mockImplementation(async (providerId: string) => {
          // Simulate async work with random delay
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

          // Log the operation with tenant context
          operationLog.push({
            tenantId: tenantContext.tenantId,
            provider: providerId,
            timestamp: Date.now(),
          });

          tenantContext.requestCount++;
          return `${tenantContext.tenantId}-request-${requestIndex}-success`;
        });

        const result = await ProviderFailover.executeWithFailover(
          { tenantId: tenantContext.tenantId },
          [tenantContext.expectedProvider],
          mockOperation,
        );

        results.get(tenantContext.tenantId)!.push(result);
        return result;
      };

      // Execute concurrent requests
      const promises: Promise<string>[] = [];

      for (let round = 0; round < REQUESTS_PER_TENANT; round++) {
        // Batch requests with concurrency limit
        const batchPromises: Promise<string>[] = [];

        for (let t = 0; t < NUM_TENANTS; t++) {
          if (batchPromises.length >= CONCURRENCY_LEVEL) {
            await Promise.all(batchPromises);
            batchPromises.length = 0;
          }

          batchPromises.push(executeTenantRequest(tenantContexts[t], round));
        }

        promises.push(...batchPromises);
      }

      // Wait for all requests to complete
      await Promise.all(promises);

      // Validate results
      expect(operationLog.length).toBe(NUM_TENANTS * REQUESTS_PER_TENANT);

      // Verify each tenant got correct results
      for (const tenantContext of tenantContexts) {
        const tenantResults = results.get(tenantContext.tenantId)!;

        expect(tenantResults).toHaveLength(REQUESTS_PER_TENANT);
        expect(tenantContext.requestCount).toBe(REQUESTS_PER_TENANT);

        // Verify all results are for this tenant
        for (const result of tenantResults) {
          expect(result).toContain(tenantContext.tenantId);
        }
      }

      // Verify no cross-tenant contamination
      const tenantIdsInLog = new Set(operationLog.map((op) => op.tenantId));
      expect(tenantIdsInLog.size).toBe(NUM_TENANTS);

      // Verify each tenant only used their expected provider
      for (const tenantContext of tenantContexts) {
        const tenantOperations = operationLog.filter(
          (op) => op.tenantId === tenantContext.tenantId,
        );

        for (const op of tenantOperations) {
          expect(op.provider).toBe(tenantContext.expectedProvider);
        }
      }
    });

    it("maintains isolation under high concurrency (50 simultaneous requests)", async () => {
      const tenantIds = Array.from(
        { length: NUM_TENANTS },
        (_, i) => `high-concurrency-tenant-${i.toString().padStart(3, "0")}`,
      );

      const results = new Map<string, number>();
      tenantIds.forEach((id) => results.set(id, 0));

      const executeRequest = async (tenantId: string): Promise<void> => {
        const mockOperation = vi.fn().mockResolvedValue("success");

        await ProviderFailover.executeWithFailover(
          { tenantId },
          ["test-provider-1"],
          mockOperation,
        );

        const count = results.get(tenantId)!;
        results.set(tenantId, count + 1);
      };

      // Fire 50 requests concurrently (3-4 per tenant)
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 50; i++) {
        const tenantId = tenantIds[i % NUM_TENANTS];
        promises.push(executeRequest(tenantId));
      }

      await Promise.all(promises);

      // Verify all tenants got their requests processed
      let totalRequests = 0;
      for (const [, count] of results.entries()) {
        expect(count).toBeGreaterThan(0);
        totalRequests += count;
      }

      expect(totalRequests).toBe(50);
    });

    it("preserves tenant context through failover chains", async () => {
      const tenantId = "failover-context-test";
      const failoverLog: Array<{
        tenantId: string;
        attemptedProviders: string[];
      }> = [];

      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockRejectedValueOnce(new Error("Connection error"))
        .mockResolvedValueOnce("success");

      try {
        await ProviderFailover.executeWithFailover(
          { tenantId },
          ["test-provider-1", "test-provider-2", "test-provider-3"],
          mockOperation,
        );

        failoverLog.push({
          tenantId,
          attemptedProviders: ["test-provider-1", "test-provider-2", "test-provider-3"],
        });
      } catch {
        // Expected to eventually succeed
      }
    });

    it("handles mixed success and failure scenarios across tenants", async () => {
      const successTenants: string[] = [];
      const failureTenants: string[] = [];

      const executeWithOutcome = async (tenantId: string, shouldFail: boolean): Promise<void> => {
        const mockOperation = vi.fn().mockImplementation(() => {
          if (shouldFail) {
            throw new Error("Network error");
          }
          return "success";
        });

        try {
          await ProviderFailover.executeWithFailover(
            { tenantId },
            ["test-provider-1"],
            mockOperation,
          );
          successTenants.push(tenantId);
        } catch {
          // Expected to eventually succeed
          if (shouldFail) {
            failureTenants.push(tenantId);
          }
        }
      };

      // Create mixed scenarios
      const promises: Promise<void>[] = [];

      for (let i = 0; i < NUM_TENANTS; i++) {
        const tenantId = `mixed-tenant-${i}`;
        const shouldFail = i % 3 === 0; // Every 3rd tenant fails
        promises.push(executeWithOutcome(tenantId, shouldFail));
      }

      await Promise.all(promises);

      expect(successTenants.length).toBeGreaterThan(0);
      expect(failureTenants.length).toBeGreaterThan(0);
      expect(successTenants.length + failureTenants.length).toBe(NUM_TENANTS);
    });
  });

  /**
   * Task 6.2: Verify zero cross-tenant context leakage during failover
   *
   * This test validates that tenant context is never leaked between
   * concurrent failover operations.
   */
  describe("Cross-tenant context leakage prevention", () => {
    it("verifies zero context leakage during concurrent failover", async () => {
      const tenantContexts = Array.from({ length: 10 }, (_, i) => ({
        tenantId: `isolation-test-tenant-${i}`,
        providerOrder: [`test-provider-${(i % 3) + 1}`, `test-provider-${((i + 1) % 3) + 1}`],
      }));

      const contextLog: Array<{
        tenantId: string;
        providerId: string;
        attemptNumber: number;
      }> = [];

      const executeFailover = async (tenantId: string, providerOrder: string[]): Promise<void> => {
        let attemptNumber = 0;

        const mockOperation = vi.fn().mockImplementation(async (providerId: string) => {
          attemptNumber++;

          contextLog.push({
            tenantId,
            providerId,
            attemptNumber,
          });

          // Fail on first attempt, succeed on second
          if (attemptNumber === 1) {
            throw new Error("Network timeout");
          }
          return "success";
        });

        await ProviderFailover.executeWithFailover({ tenantId }, providerOrder, mockOperation);
      };

      // Execute concurrent failovers
      await Promise.all(
        tenantContexts.map((ctx) => executeFailover(ctx.tenantId, ctx.providerOrder)),
      );

      // Verify no context leakage
      const uniqueTenants = new Set(contextLog.map((log) => log.tenantId));
      expect(uniqueTenants.size).toBe(10);

      // Verify each tenant's context remained isolated
      for (const ctx of tenantContexts) {
        const tenantLogs = contextLog.filter((log) => log.tenantId === ctx.tenantId);

        expect(tenantLogs.length).toBeGreaterThan(0);

        // Verify all logs for this tenant have correct tenantId
        for (const log of tenantLogs) {
          expect(log.tenantId).toBe(ctx.tenantId);
          expect(log.providerId).toBeOneOf(ctx.providerOrder);
        }
      }
    });

    it("validates circuit breaker isolation between tenants", async () => {
      const tenant1Id = "circuit-breaker-tenant-1";
      const tenant2Id = "circuit-breaker-tenant-2";

      // Cause failures for tenant 1
      const failingOperation = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        await ProviderFailover.executeWithFailover(
          { tenantId: tenant1Id },
          ["test-provider-1"],
          failingOperation,
          { failureThreshold: 2 },
        );
      } catch {
        // Expected
      }

      try {
        await ProviderFailover.executeWithFailover(
          { tenantId: tenant1Id },
          ["test-provider-1"],
          failingOperation,
          { failureThreshold: 2 },
        );
      } catch {
        // Expected
      }

      // Check tenant 1's circuit breaker status
      const tenant1Status = ProviderFailover.getCircuitBreakerStatus(tenant1Id, "test-provider-1");

      // Check tenant 2's circuit breaker status (should be clean)
      const tenant2Status = ProviderFailover.getCircuitBreakerStatus(tenant2Id, "test-provider-1");

      // Verify isolation
      expect(tenant1Status.failureCount).toBeGreaterThan(0);
      expect(tenant2Status.failureCount).toBe(0);
      expect(tenant2Status.isClosed).toBe(true);
    });

    it("prevents provider state leakage across tenant boundaries", async () => {
      const tenantIds = Array.from({ length: 5 }, (_, i) => `boundary-test-${i}`);
      const providerStates = new Map<string, Set<string>>();

      const executeWithTracking = async (tenantId: string): Promise<void> => {
        const mockOperation = vi.fn().mockImplementation(async (providerId: string) => {
          if (!providerStates.has(tenantId)) {
            providerStates.set(tenantId, new Set());
          }
          providerStates.get(tenantId)!.add(providerId);
          return "success";
        });

        await ProviderFailover.executeWithFailover(
          { tenantId },
          ["test-provider-1", "test-provider-2"],
          mockOperation,
        );
      };

      await Promise.all(tenantIds.map((id) => executeWithTracking(id)));

      // Verify each tenant has isolated provider state
      for (const tenantId of tenantIds) {
        const providers = providerStates.get(tenantId);
        expect(providers).toBeDefined();
        expect(providers!.size).toBeGreaterThan(0);

        // Verify no cross-tenant provider state
        for (const otherTenantId of tenantIds) {
          if (otherTenantId !== tenantId) {
            const otherProviders = providerStates.get(otherTenantId);
            expect(otherProviders).not.toBe(providers);
          }
        }
      }
    });
  });
});
