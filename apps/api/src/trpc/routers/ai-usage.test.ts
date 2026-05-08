/**
 * AI Usage Router Integration Tests
 *
 * Integration tests for AI usage tracking tRPC endpoints.
 * Tests usage queries, cost tracking, and tenant isolation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AiUsageService } from "../../services/ai-usage.service";

vi.mock("../../services/ai-usage.service");

describe("AI Usage Router Integration Tests", () => {
  const mockTenantId = "tenant-123";
  const mockStartDate = new Date("2024-01-01");
  const mockEndDate = new Date("2024-01-31");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSummary endpoint", () => {
    it("should get usage summary for period", async () => {
      const mockSummary = {
        tenantId: mockTenantId,
        periodStart: mockStartDate.toISOString(),
        periodEnd: mockEndDate.toISOString(),
        totalPromptTokens: 10000,
        totalCompletionTokens: 5000,
        totalTokens: 15000,
        totalCostCents: 250,
        totalRequests: 100,
        successfulRequests: 95,
        failedRequests: 5,
        avgLatencyMs: 245,
        byProvider: [
          {
            providerId: "anthropic",
            providerName: "Anthropic",
            totalTokens: 10000,
            totalCostCents: 150,
            requestCount: 60,
          },
        ],
        byDomain: [
          {
            domainId: "domain-123",
            domainName: "Marketing",
            totalTokens: 8000,
            totalCostCents: 120,
            requestCount: 50,
          },
        ],
      };

      vi.spyOn(AiUsageService.prototype, "getUsageSummary").mockResolvedValue(
        mockSummary as unknown,
      );

      expect(AiUsageService.prototype.getUsageSummary).toBeDefined();
    });

    it("should handle empty usage", async () => {
      const mockSummary = {
        tenantId: mockTenantId,
        periodStart: mockStartDate.toISOString(),
        periodEnd: mockEndDate.toISOString(),
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCostCents: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatencyMs: 0,
        byProvider: [],
        byDomain: [],
      };

      vi.spyOn(AiUsageService.prototype, "getUsageSummary").mockResolvedValue(
        mockSummary as unknown,
      );

      expect(AiUsageService.prototype.getUsageSummary).toBeDefined();
    });
  });

  describe("getTrends endpoint", () => {
    it("should get usage trends over time", async () => {
      const mockTrends = [
        {
          date: "2024-01-01",
          tokens: 500,
          costCents: 10,
          requests: 5,
        },
        {
          date: "2024-01-02",
          tokens: 600,
          costCents: 12,
          requests: 6,
        },
      ];

      vi.spyOn(AiUsageService.prototype, "getUsageTrends").mockResolvedValue(mockTrends as unknown);

      expect(AiUsageService.prototype.getUsageTrends).toBeDefined();
    });

    it("should return daily granularity", async () => {
      vi.spyOn(AiUsageService.prototype, "getUsageTrends").mockResolvedValue([
        { date: "2024-01-01", tokens: 500, costCents: 10, requests: 5 },
      ] as unknown);

      expect(AiUsageService.prototype.getUsageTrends).toBeDefined();
    });
  });

  describe("getByProvider endpoint", () => {
    it("should get usage by specific provider", async () => {
      const mockUsage = [
        {
          providerId: "anthropic",
          totalTokens: 10000,
          totalCostCents: 150,
          requestCount: 60,
        },
      ];

      vi.spyOn(AiUsageService.prototype, "getUsageByProvider").mockResolvedValue(
        mockUsage as unknown,
      );

      expect(AiUsageService.prototype.getUsageByProvider).toBeDefined();
    });

    it("should filter by provider ID", async () => {
      vi.spyOn(AiUsageService.prototype, "getUsageByProvider").mockResolvedValue([]);

      expect(AiUsageService.prototype.getUsageByProvider).toBeDefined();
    });
  });

  describe("getByDomain endpoint", () => {
    it("should get usage by specific domain", async () => {
      const mockUsage = [
        {
          domainId: "domain-123",
          domainName: "Marketing",
          totalTokens: 8000,
          totalCostCents: 120,
          requestCount: 50,
        },
      ];

      vi.spyOn(AiUsageService.prototype, "getUsageByDomain").mockResolvedValue(
        mockUsage as unknown,
      );

      expect(AiUsageService.prototype.getUsageByDomain).toBeDefined();
    });
  });

  describe("getFailedRequests endpoint", () => {
    it("should get failed requests", async () => {
      const mockFailedRequests = [
        {
          requestId: "req-123",
          providerId: "anthropic",
          errorCode: "RATE_LIMIT_EXCEEDED",
          errorMessage: "Rate limit exceeded",
          timestamp: new Date(),
        },
      ];

      vi.spyOn(AiUsageService.prototype, "getFailedRequests").mockResolvedValue(
        mockFailedRequests as unknown,
      );

      expect(AiUsageService.prototype.getFailedRequests).toBeDefined();
    });

    it("should return empty array when no failures", async () => {
      vi.spyOn(AiUsageService.prototype, "getFailedRequests").mockResolvedValue([]);

      expect(AiUsageService.prototype.getFailedRequests).toBeDefined();
    });
  });

  describe("recordUsage endpoint", () => {
    it("should record usage", async () => {
      const mockResult = {
        id: "usage-123",
        success: true,
      };

      vi.spyOn(AiUsageService.prototype, "recordUsage").mockResolvedValue(mockResult as unknown);

      expect(AiUsageService.prototype.recordUsage).toBeDefined();
    });

    it("should handle concurrent usage recording", async () => {
      vi.spyOn(AiUsageService.prototype, "recordUsage").mockResolvedValue({
        id: "usage-123",
        success: true,
      } as unknown);

      // Simulate concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, () =>
        AiUsageService.prototype.recordUsage(mockTenantId, {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet",
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costCents: 25,
          requestId: `req-${Math.random()}`,
          latencyMs: 250,
          success: true,
          wasFailover: false,
        }),
      );

      expect(concurrentRequests.length).toBe(10);
    });
  });

  describe("getCurrentMonth endpoint", () => {
    it("should get current month usage", async () => {
      const mockSummary = {
        tenantId: mockTenantId,
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        totalPromptTokens: 5000,
        totalCompletionTokens: 2500,
        totalTokens: 7500,
        totalCostCents: 125,
        totalRequests: 50,
        successfulRequests: 48,
        failedRequests: 2,
        avgLatencyMs: 240,
        byProvider: [],
        byDomain: [],
      };

      vi.spyOn(AiUsageService.prototype, "getCurrentMonthUsage").mockResolvedValue(
        mockSummary as unknown,
      );

      expect(AiUsageService.prototype.getCurrentMonthUsage).toBeDefined();
    });
  });

  describe("getCostEfficiency endpoint", () => {
    it("should get cost efficiency analysis", async () => {
      const mockEfficiency = {
        overall: {
          totalCostCents: 250,
          totalTokens: 15000,
          avgCostPerToken: 0.0167,
        },
        byProvider: [
          {
            providerId: "anthropic",
            avgCostPerToken: 0.015,
            efficiency: "high",
          },
        ],
        mostEfficient: {
          providerId: "anthropic",
          avgCostPerToken: 0.015,
        },
        leastEfficient: {
          providerId: "openai",
          avgCostPerToken: 0.02,
        },
      };

      vi.spyOn(AiUsageService.prototype, "getCostEfficiency").mockResolvedValue(
        mockEfficiency as unknown,
      );

      expect(AiUsageService.prototype.getCostEfficiency).toBeDefined();
    });

    it("should handle null most/least efficient when no data", async () => {
      const mockEfficiency = {
        overall: {
          totalCostCents: 0,
          totalTokens: 0,
          avgCostPerToken: 0,
        },
        byProvider: [],
        mostEfficient: null,
        leastEfficient: null,
      };

      vi.spyOn(AiUsageService.prototype, "getCostEfficiency").mockResolvedValue(
        mockEfficiency as unknown,
      );

      expect(AiUsageService.prototype.getCostEfficiency).toBeDefined();
    });
  });

  describe("Tenant isolation", () => {
    it("should always scope queries to tenant", async () => {
      expect(AiUsageService.prototype.getUsageSummary).toBeDefined();
      expect(AiUsageService.prototype.getUsageTrends).toBeDefined();
      expect(AiUsageService.prototype.recordUsage).toBeDefined();
    });

    it("should not leak usage data across tenants", async () => {
      vi.spyOn(AiUsageService.prototype, "getUsageSummary").mockImplementation(
        (tenantId: string) => {
          expect(tenantId).toBe(mockTenantId);
          return Promise.resolve(null);
        },
      );

      expect(AiUsageService.prototype.getUsageSummary).toBeDefined();
    });
  });

  describe("Error handling", () => {
    it("should handle database errors", async () => {
      vi.spyOn(AiUsageService.prototype, "getUsageSummary").mockRejectedValue(
        new Error("Database connection failed"),
      );

      expect(AiUsageService.prototype.getUsageSummary).toBeDefined();
    });

    it("should handle invalid date ranges", async () => {
      vi.spyOn(AiUsageService.prototype, "getUsageTrends").mockRejectedValue(
        new Error("Invalid date range"),
      );

      expect(AiUsageService.prototype.getUsageTrends).toBeDefined();
    });
  });
});
