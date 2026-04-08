import { afterAll, describe, expect, it, vi } from "vitest";

import { TestOrchestrator } from "./index";

describe("TestOrchestrator (HTTP client)", () => {
  it("checkMockPlatformHealth returns false when fetch fails", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const orch = new TestOrchestrator("http://localhost:9999", {
      getAccessToken: async () => "t",
      mockPlatformBaseUrl: "http://mock:3001",
    });
    await expect(orch.checkMockPlatformHealth()).resolves.toBe(false);
    fetchSpy.mockRestore();
  });

  it("triggerWorkflow parses successful JSON", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          executionId: "job-1",
          status: "queued",
          startedAt: "2026-01-01T00:00:00.000Z",
          estimatedCompletion: "2026-01-01T00:01:00.000Z",
        }),
        { status: 202 },
      ),
    );
    const orch = new TestOrchestrator("http://api", {
      getAccessToken: async () => "token",
    });
    const res = await orch.triggerWorkflow({
      workflowId: "report-generation",
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      config: { mockData: { scenario: "normal", seed: 1 } },
    });
    expect(res.executionId).toBe("job-1");
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("executeScenario enriches from test-results and posts telemetry", async () => {
    const scenario = {
      id: "R01",
      name: "PDF",
      category: "generation" as const,
      workflow: "report-generation" as const,
      tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      mockData: { scenario: "normal" as const, seed: 42_001 },
    };
    const urls: string[] = [];
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      urls.push(url);
      if (url.endsWith("/api/v1/workflows/trigger")) {
        return new Response(
          JSON.stringify({
            executionId: "job-telemetry",
            status: "queued",
            startedAt: "2026-01-01T00:00:00.000Z",
            estimatedCompletion: "2026-01-01T00:01:00.000Z",
          }),
          { status: 202 },
        );
      }
      if (url.includes("/api/v1/workflows/status/job-telemetry")) {
        return new Response(
          JSON.stringify({
            executionId: "job-telemetry",
            status: "completed",
            bullmqState: "completed",
            result: { phase: "foundation" },
          }),
          { status: 200 },
        );
      }
      if (url.includes("/api/v1/test/results/job-telemetry")) {
        return new Response(
          JSON.stringify({
            executionId: "job-telemetry",
            status: "completed",
            bullmqState: "completed",
            workflowStatus: "completed",
            durationMs: 12,
            metrics: {
              llmCalls: 0,
              llmDurationMs: 0,
              platformFetchCount: 0,
              platformFetchDurationMs: 0,
              reportGenerationDurationMs: 0,
            },
            logs: [],
          }),
          { status: 200 },
        );
      }
      if (url.endsWith("/api/v1/test/telemetry/scenario")) {
        expect(init?.method).toBe("POST");
        return new Response(null, { status: 204 });
      }
      return new Response("not found", { status: 404 });
    });
    const orch = new TestOrchestrator("http://api", {
      getAccessToken: async () => "token",
      pollIntervalMs: 5,
    });
    const result = await orch.executeScenario(scenario, 5000);
    expect(result.status).toBe("completed");
    expect(result.metrics.queueDurationMs).toBe(12);
    expect(urls.some((u) => u.includes("/test/results/"))).toBe(true);
    expect(urls.some((u) => u.includes("/test/telemetry/scenario"))).toBe(true);
    fetchSpy.mockRestore();
  });

  it("pollUntilWorkflowSettles stops on completed", async () => {
    const states = [
      { status: "active", bullmqState: "active", executionId: "e1" },
      { status: "completed", bullmqState: "completed", executionId: "e1" },
    ];
    let i = 0;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      const body = states[Math.min(i, states.length - 1)]!;
      i += 1;
      return new Response(JSON.stringify(body), { status: 200 });
    });
    const orch = new TestOrchestrator("http://api", {
      getAccessToken: async () => "token",
      pollIntervalMs: 5,
    });
    const final = await orch.pollUntilWorkflowSettles("e1", 2000);
    expect(final.status).toBe("completed");
    fetchSpy.mockRestore();
  });
});

describe("TestOrchestrator env", () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("skips health check when mock base URL omitted", async () => {
    const orch = new TestOrchestrator("http://api", { getAccessToken: async () => "t" });
    await expect(orch.checkMockPlatformHealth()).resolves.toBe(true);
  });
});
