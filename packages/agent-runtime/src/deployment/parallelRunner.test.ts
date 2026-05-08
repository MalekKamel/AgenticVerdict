import { describe, it, expect, vi, beforeEach } from "vitest";
import { ParallelRunner, ParallelRunConfig, ProviderResponse } from "./parallelRunner";
import { TrafficManager } from "./trafficManager";

type RunnerInternals = {
  compareResults: (
    requestId: string,
    tenantId: string,
    legacyResponse: ProviderResponse,
    newResponse: ProviderResponse,
  ) => Promise<{
    match: boolean;
    discrepancyType?: string;
    latencyDifference?: number;
    costDifference?: number;
  }>;
};

const createMockTrafficManager = () => {
  return {
    route: vi.fn(),
    setGlobalPercentage: vi.fn(),
    setTenantOverride: vi.fn(),
    removeTenantOverride: vi.fn(),
    getMetrics: vi.fn(),
    updateMetrics: vi.fn(),
    triggerRollback: vi.fn(),
    getRollbackState: vi.fn(),
  } as unknown as TrafficManager;
};

const createMockResponse = (overrides?: Partial<ProviderResponse>): ProviderResponse => ({
  providerId: "openai",
  modelId: "gpt-4",
  output: "Test response",
  latency: 500,
  tokensUsed: {
    prompt: 10,
    completion: 20,
    total: 30,
  },
  cost: 0.001,
  ...overrides,
});

describe("ParallelRunner", () => {
  let mockTrafficManager: ReturnType<typeof createMockTrafficManager>;
  let parallelRunner: ParallelRunner;

  beforeEach(() => {
    mockTrafficManager = createMockTrafficManager();
    parallelRunner = new ParallelRunner(mockTrafficManager);
  });

  describe("constructor", () => {
    it("should initialize with default config", () => {
      const config = parallelRunner.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.mirrorPercentage).toBe(10);
      expect(config.compareResults).toBe(true);
      expect(config.logDiscrepancies).toBe(true);
    });

    it("should initialize with custom config", () => {
      const customConfig: Partial<ParallelRunConfig> = {
        enabled: true,
        mirrorPercentage: 50,
        compareResults: false,
        logDiscrepancies: false,
      };
      const runner = new ParallelRunner(mockTrafficManager, customConfig);
      const config = runner.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.mirrorPercentage).toBe(50);
      expect(config.compareResults).toBe(false);
      expect(config.logDiscrepancies).toBe(false);
    });
  });

  describe("shouldMirrorRequest", () => {
    it("should return false when disabled", async () => {
      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "new",
        reason: "Test",
      });

      const result = await parallelRunner.shouldMirrorRequest();
      expect(result).toBe(false);
    });

    it("should return true when enabled and percentage allows", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      const result = await runner.shouldMirrorRequest();
      expect(result).toBe(true);
    });
  });

  describe("executeParallel", () => {
    beforeEach(() => {
      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });
    });

    it("should execute only primary when mirroring is disabled", async () => {
      const legacyExecutor = vi.fn().mockResolvedValue(createMockResponse());
      const newExecutor = vi.fn();

      const result = await parallelRunner.executeParallel(
        "req-1",
        "tenant-1",
        legacyExecutor,
        newExecutor,
      );

      expect(result.primary).toBeDefined();
      expect(result.mirrored).toBeUndefined();
      expect(result.comparison).toBeUndefined();
      expect(legacyExecutor).toHaveBeenCalledTimes(1);
      expect(newExecutor).not.toHaveBeenCalled();
    });

    it("should execute both executors when mirroring is enabled", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
        compareResults: true,
      });

      const legacyResponse = createMockResponse();
      const newResponse = createMockResponse({ output: "New response" });

      const legacyExecutor = vi.fn().mockResolvedValue(legacyResponse);
      const newExecutor = vi.fn().mockResolvedValue(newResponse);

      const result = await runner.executeParallel("req-1", "tenant-1", legacyExecutor, newExecutor);

      expect(result.primary).toBeDefined();
      expect(result.mirrored).toBeDefined();
      expect(result.comparison).toBeDefined();
      expect(legacyExecutor).toHaveBeenCalledTimes(1);
      expect(newExecutor).toHaveBeenCalledTimes(1);
    });

    it("should handle executor errors gracefully", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      const legacyExecutor = vi.fn().mockRejectedValue(new Error("Legacy error"));
      const newExecutor = vi.fn().mockResolvedValue(createMockResponse());

      const result = await runner.executeParallel("req-1", "tenant-1", legacyExecutor, newExecutor);

      expect(result.primary).toBeDefined();
      expect(result.mirrored).toBeDefined();
      expect(result.primary.error).toBeDefined();
    });

    it("should update metrics after execution", async () => {
      const legacyExecutor = vi.fn().mockResolvedValue(createMockResponse());

      await parallelRunner.executeParallel("req-1", "tenant-1", legacyExecutor, vi.fn());

      const metrics = parallelRunner.getMetrics();
      expect(metrics.totalRequests).toBe(1);
    });
  });

  describe("compareResults", () => {
    it("should detect matching responses", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      const response = createMockResponse();
      const comparison = await (runner as unknown as RunnerInternals).compareResults(
        "req-1",
        "tenant-1",
        response,
        response,
      );

      expect(comparison.match).toBe(true);
      expect(comparison.discrepancyType).toBeUndefined();
    });

    it("should detect output mismatch", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      const legacyResponse = createMockResponse({ output: "Legacy output" });
      const newResponse = createMockResponse({ output: "New output" });

      const comparison = await (runner as unknown as RunnerInternals).compareResults(
        "req-1",
        "tenant-1",
        legacyResponse,
        newResponse,
      );

      expect(comparison.match).toBe(false);
      expect(comparison.discrepancyType).toBe("output");
    });

    it("should detect latency regression", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      const legacyResponse = createMockResponse({ latency: 500 });
      const newResponse = createMockResponse({ latency: 700 });

      const comparison = await (runner as unknown as RunnerInternals).compareResults(
        "req-1",
        "tenant-1",
        legacyResponse,
        newResponse,
      );

      expect(comparison.latencyDifference).toBe(200);
    });

    it("should detect cost increase", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      const legacyResponse = createMockResponse({ cost: 0.001 });
      const newResponse = createMockResponse({ cost: 0.002 });

      const comparison = await (runner as unknown as RunnerInternals).compareResults(
        "req-1",
        "tenant-1",
        legacyResponse,
        newResponse,
      );

      expect(comparison.costDifference).toBe(0.001);
    });

    it("should detect error code mismatch", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      const legacyResponse = createMockResponse({
        error: { message: "Error", code: "ERROR_1" },
        output: undefined,
      });
      const newResponse = createMockResponse({
        error: { message: "Error", code: "ERROR_2" },
        output: undefined,
      });

      const comparison = await (runner as unknown as RunnerInternals).compareResults(
        "req-1",
        "tenant-1",
        legacyResponse,
        newResponse,
      );

      expect(comparison.match).toBe(false);
      expect(comparison.discrepancyType).toBe("error");
    });
  });

  describe("checkForAlerts", () => {
    it("should return null when insufficient data", async () => {
      const alert = await parallelRunner.checkForAlerts();
      expect(alert).toBeNull();
    });

    it("should detect latency regression alert", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 150; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse({ latency: 500, output: "same" })),
          vi.fn().mockResolvedValue(createMockResponse({ latency: 700, output: "same" })),
        );
      }

      const alert = await runner.checkForAlerts();
      expect(alert).toBeDefined();
      expect(["latency_regression", "output_mismatch"]).toContain(alert?.type);
      if (alert?.type === "latency_regression") {
        expect(alert.metrics.difference).toBeGreaterThan(0.2);
      }
    });

    it("should detect cost increase alert", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 150; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse({ cost: 0.001, output: "same" })),
          vi.fn().mockResolvedValue(createMockResponse({ cost: 0.002, output: "same" })),
        );
      }

      const alert = await runner.checkForAlerts();
      expect(alert).toBeDefined();
      expect(["cost_increase", "output_mismatch"]).toContain(alert?.type);
      if (alert?.type === "cost_increase") {
        expect(alert.metrics.difference).toBeGreaterThan(0.15);
      }
    });

    it("should detect error rate spike alert", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 150; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse({ output: "same" })),
          vi.fn().mockImplementation(() => {
            if (i % 10 === 0) {
              return Promise.resolve(
                createMockResponse({
                  error: { message: "Error", code: "ERR" },
                  output: undefined,
                }),
              );
            }
            return Promise.resolve(createMockResponse({ output: "same" }));
          }),
        );
      }

      const alert = await runner.checkForAlerts();
      expect(alert).toBeDefined();
      expect(["error_rate_spike", "output_mismatch"]).toContain(alert?.type);
    });
  });

  describe("generateReport", () => {
    it("should generate report with summary and recommendations", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 100; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse({ latency: 500, cost: 0.001 })),
          vi.fn().mockResolvedValue(createMockResponse({ latency: 450, cost: 0.0009 })),
        );
      }

      const report = await runner.generateReport();

      expect(report.summary.totalRequests).toBeGreaterThanOrEqual(1);
      expect(report.recommendations).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it("should recommend traffic increase when metrics are good", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 100; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse({ latency: 500 })),
          vi.fn().mockResolvedValue(createMockResponse({ latency: 400 })),
        );
      }

      const report = await runner.generateReport();
      expect(report.recommendations.some((r) => r.includes("increasing traffic"))).toBe(true);
    });
  });

  describe("updateConfig", () => {
    it("should update configuration", () => {
      parallelRunner.updateConfig({ enabled: true, mirrorPercentage: 50 });
      const config = parallelRunner.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.mirrorPercentage).toBe(50);
    });
  });

  describe("clearMetrics", () => {
    it("should reset all metrics", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 50; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse()),
          vi.fn().mockResolvedValue(createMockResponse()),
        );
      }

      const metrics = runner.getMetrics();
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(1);

      runner.clearMetrics();

      const clearedMetrics = runner.getMetrics();
      expect(clearedMetrics.totalRequests).toBe(0);
      expect(clearedMetrics.matchedRequests).toBe(0);
      expect(clearedMetrics.discrepancyCount).toBe(0);
    });
  });

  describe("getComparisonResults", () => {
    it("should return comparison results", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 5; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse()),
          vi.fn().mockResolvedValue(createMockResponse()),
        );
      }

      const results = runner.getComparisonResults();
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it("should limit results to specified count", async () => {
      const runner = new ParallelRunner(mockTrafficManager, {
        enabled: true,
        mirrorPercentage: 100,
      });

      vi.mocked(mockTrafficManager.route).mockResolvedValue({
        target: "legacy",
        reason: "Test",
      });

      for (let i = 0; i < 10; i++) {
        await runner.executeParallel(
          `req-${i}`,
          "tenant-1",
          vi.fn().mockResolvedValue(createMockResponse()),
          vi.fn().mockResolvedValue(createMockResponse()),
        );
      }

      const results = runner.getComparisonResults(5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });
});
