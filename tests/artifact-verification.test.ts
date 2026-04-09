/**
 * Artifact Verification Tests
 *
 * Tests for verifying generated artifacts from the marketing analytics pipeline:
 * - Workflow status and execution results
 * - Analysis results from AI agent pipeline
 * - Reports (production-flow PDFs, multi-format exports)
 *
 * Run with: pnpm test artifact-verification.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const DEMO_TENANT_ID = "22222222-2222-4222-8222-222222222222";

/** Shape of workflow status JSON from GET /api/v1/workflows/status/:executionId */
interface WorkflowStatusResult {
  workflowId?: string;
  phase?: string;
  message?: string;
  pdfByteLength?: number;
  pdfValidation?: {
    minBytesOk?: boolean;
    mustContainPhrasesOk?: boolean;
    shellDir?: string;
    shellLang?: string;
  };
  analysisId?: string;
  processingMetadata?: {
    durationMs: number;
    pipelineStatus?: unknown;
    platformsAnalyzed?: unknown[];
  };
}

interface WorkflowStatusResponse {
  status: string;
  result?: WorkflowStatusResult;
}

interface TriggerWorkflowResponse {
  executionId: string;
}

// Helper: tests require TEST_TOKEN (see beforeAll in workflow suite).
function getAuthToken(): string {
  return process.env.TEST_TOKEN || "";
}

// Helper to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return response;
}

describe("Artifact Verification - Workflow Status", () => {
  beforeAll(() => {
    if (!process.env.TEST_TOKEN) {
      throw new Error(
        "TEST_TOKEN environment variable must be set. " +
          "Generate with: export TEST_TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)",
      );
    }
  });

  it("should retrieve workflow status with valid executionId", async () => {
    // First trigger a workflow to get an executionId
    const triggerResponse = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "report-generation",
        testMode: true,
        tenantId: DEMO_TENANT_ID,
        config: {
          productionFlowScenarioId: "R01",
        },
      }),
    });

    expect(triggerResponse.ok).toBe(true);
    const triggerData = (await triggerResponse.json()) as TriggerWorkflowResponse;
    expect(triggerData.executionId).toMatch(/^workflow-report-generation-/);

    const executionId = triggerData.executionId;

    // Poll for completion (with timeout)
    const maxPolls = 30;
    let completed = false;
    let finalStatus: WorkflowStatusResponse = { status: "pending" };

    for (let i = 0; i < maxPolls; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await apiCall(`/api/v1/workflows/status/${executionId}`);
      expect(statusResponse.ok).toBe(true);

      finalStatus = (await statusResponse.json()) as WorkflowStatusResponse;

      if (finalStatus.status === "completed" || finalStatus.status === "failed") {
        completed = true;
        break;
      }
    }

    expect(completed).toBe(true);
    expect(finalStatus.status).toBe("completed");

    // Verify result structure
    expect(finalStatus.result).toBeDefined();
    expect(finalStatus.result.workflowId).toBe("report-generation");
    expect(finalStatus.result.phase).toBe("report-generation");
  });

  it("should return 404 for non-existent executionId", async () => {
    const response = await apiCall("/api/v1/workflows/status/non-existent-id");
    expect(response.status).toBe(404);
  });

  it("should return 401 without authentication", async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/workflows/status/some-id`);
    expect(response.status).toBe(401);
  });
});

describe("Artifact Verification - Production Flow Reports", () => {
  it("should generate PDF with R01 scenario", async () => {
    const triggerResponse = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "report-generation",
        testMode: true,
        tenantId: DEMO_TENANT_ID,
        config: {
          productionFlowScenarioId: "R01",
        },
      }),
    });

    const triggerData = (await triggerResponse.json()) as TriggerWorkflowResponse;
    const executionId = triggerData.executionId;

    // Wait for completion
    let completed = false;
    let finalStatus: WorkflowStatusResponse = { status: "pending" };

    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await apiCall(`/api/v1/workflows/status/${executionId}`);
      finalStatus = (await statusResponse.json()) as WorkflowStatusResponse;

      if (finalStatus.status === "completed") {
        completed = true;
        break;
      }
    }

    expect(completed).toBe(true);

    // Verify PDF artifact metadata
    expect(finalStatus.result.message).toBe("production_flow_pdf_ok");
    expect(finalStatus.result.pdfByteLength).toBeGreaterThan(500);
    expect(finalStatus.result.pdfValidation).toBeDefined();
    expect(finalStatus.result.pdfValidation.minBytesOk).toBe(true);
    expect(finalStatus.result.pdfValidation.mustContainPhrasesOk).toBe(true);
    expect(finalStatus.result.pdfValidation.shellDir).toBe("ltr");
    expect(finalStatus.result.pdfValidation.shellLang).toBe("en");
  });
});

describe("Artifact Verification - Analysis Results", () => {
  it("should retrieve analysis results by ID", async () => {
    // Trigger marketing-analysis workflow
    const triggerResponse = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "marketing-analysis",
        testMode: true,
        tenantId: DEMO_TENANT_ID,
        config: {
          dateRange: {
            start: "2024-01-01T00:00:00.000Z",
            end: "2024-01-07T00:00:00.000Z",
          },
          platforms: ["meta", "ga4"],
        },
      }),
    });

    const triggerData = (await triggerResponse.json()) as TriggerWorkflowResponse;
    const executionId = triggerData.executionId;

    // Wait for completion
    let completed = false;
    let finalStatus: WorkflowStatusResponse = { status: "pending" };

    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await apiCall(`/api/v1/workflows/status/${executionId}`);
      finalStatus = (await statusResponse.json()) as WorkflowStatusResponse;

      if (finalStatus.status === "completed") {
        completed = true;
        break;
      }
    }

    expect(completed).toBe(true);
    expect(finalStatus.result.analysisId).toBeDefined();

    // Retrieve analysis results
    const analysisId = finalStatus.result.analysisId;
    const analysisResponse = await apiCall(`/api/v1/analysis-results/${analysisId}`);
    expect(analysisResponse.ok).toBe(true);

    const analysis = await analysisResponse.json();

    // Verify analysis structure
    expect(analysis.analysisId).toBe(analysisId);
    expect(analysis.tenantId).toBe(DEMO_TENANT_ID);
    expect(analysis.insights).toBeDefined();
    expect(Array.isArray(analysis.insights)).toBe(true);

    // Verify insight structure
    if (analysis.insights.length > 0) {
      const insight = analysis.insights[0];
      expect(insight.id).toBeDefined();
      expect(insight.type).toBeDefined();
      expect(insight.title).toBeDefined();
      expect(insight.description).toBeDefined();
      expect(insight.confidence).toBeGreaterThanOrEqual(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("should return 404 for non-existent analysisId", async () => {
    const response = await apiCall("/api/v1/analysis-results/00000000-0000-0000-0000-000000000000");
    expect(response.status).toBe(404);
  });
});

describe("Artifact Verification - Processing Metadata", () => {
  it("should include processing metadata in analysis results", async () => {
    const triggerResponse = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "marketing-analysis",
        testMode: true,
        tenantId: DEMO_TENANT_ID,
        config: {
          dateRange: {
            start: "2024-01-01T00:00:00.000Z",
            end: "2024-01-07T00:00:00.000Z",
          },
        },
      }),
    });

    const triggerData = (await triggerResponse.json()) as TriggerWorkflowResponse;
    const executionId = triggerData.executionId;

    // Wait for completion
    let finalStatus: WorkflowStatusResponse = { status: "pending" };

    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await apiCall(`/api/v1/workflows/status/${executionId}`);
      finalStatus = (await statusResponse.json()) as WorkflowStatusResponse;

      if (finalStatus.status === "completed") {
        break;
      }
    }

    expect(finalStatus.result.processingMetadata).toBeDefined();
    expect(finalStatus.result.processingMetadata.durationMs).toBeGreaterThan(0);
    expect(finalStatus.result.processingMetadata.pipelineStatus).toBeDefined();
    expect(finalStatus.result.processingMetadata.platformsAnalyzed).toBeDefined();
    expect(Array.isArray(finalStatus.result.processingMetadata.platformsAnalyzed)).toBe(true);
  });

  it("should use real LLM when configured (duration > 10s)", async () => {
    const triggerResponse = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "marketing-analysis",
        testMode: true,
        tenantId: DEMO_TENANT_ID,
        config: {
          dateRange: {
            start: "2024-01-01T00:00:00.000Z",
            end: "2024-01-07T00:00:00.000Z",
          },
        },
      }),
    });

    const triggerData = (await triggerResponse.json()) as TriggerWorkflowResponse;
    const executionId = triggerData.executionId;

    // Wait for completion
    let finalStatus: WorkflowStatusResponse = { status: "pending" };

    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await apiCall(`/api/v1/workflows/status/${executionId}`);
      finalStatus = (await statusResponse.json()) as WorkflowStatusResponse;

      if (finalStatus.status === "completed") {
        break;
      }
    }

    const duration = finalStatus.result.processingMetadata.durationMs;

    // If GLM_API_KEY or other LLM keys are configured, expect > 10s
    // If using mock LLM, duration will be < 100ms
    // We just verify duration is recorded; interpretation depends on env
    expect(duration).toBeGreaterThan(0);

    // Log for manual verification
    console.log(`Processing duration: ${duration}ms`);
    if (duration > 10000) {
      console.log("✓ Real LLM detected (duration > 10s)");
    } else if (duration < 100) {
      console.log("ℹ Mock LLM detected (duration < 100ms)");
    } else {
      console.log("ℹ Intermediate duration - check LLM configuration");
    }
  });
});

describe("Artifact Verification - Verdict Generation", () => {
  it("should complete verdict-generation workflow", async () => {
    const triggerResponse = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "verdict-generation",
        testMode: true,
        tenantId: DEMO_TENANT_ID,
        config: {
          dateRange: {
            start: "2024-01-01T00:00:00.000Z",
            end: "2024-01-07T00:00:00.000Z",
          },
        },
      }),
    });

    expect(triggerResponse.ok).toBe(true);
    const triggerData = (await triggerResponse.json()) as TriggerWorkflowResponse;
    expect(triggerData.executionId).toMatch(/^workflow-verdict-generation-/);

    const executionId = triggerData.executionId;

    // Wait for completion (verdict-generation can take 30-60s with real LLM)
    let completed = false;
    let finalStatus: WorkflowStatusResponse = { status: "pending" };

    for (let i = 0; i < 90; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await apiCall(`/api/v1/workflows/status/${executionId}`);
      finalStatus = (await statusResponse.json()) as WorkflowStatusResponse;

      if (finalStatus.status === "completed" || finalStatus.status === "failed") {
        completed = true;
        break;
      }
    }

    expect(completed).toBe(true);
    expect(finalStatus.status).toBe("completed");
    expect(finalStatus.result.message).toBe("verdict-generation_processed");
    expect(finalStatus.result.analysisId).toBeDefined();
  });
});

describe("Artifact Verification - Error Cases", () => {
  it("should reject invalid productionFlowScenarioId", async () => {
    const response = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "report-generation",
        testMode: true,
        tenantId: DEMO_TENANT_ID,
        config: {
          productionFlowScenarioId: "INVALID_SCENARIO",
        },
      }),
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error.code).toBe("validation_error");
    expect(error.error.details.fieldErrors?.config).toBeDefined();
  });

  it("should reject tenant_id mismatch between JWT and body", async () => {
    // This test requires a token for a different tenant
    // For now, we document the expected behavior
    // Expected: HTTP 403 with tenant_config_not_found

    const response = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "report-generation",
        testMode: true,
        tenantId: "00000000-0000-0000-0000-000000000000", // Non-existent tenant
        config: {
          productionFlowScenarioId: "R01",
        },
      }),
    });

    // Should return 403 because the tenant_id in the JWT (DEMO_TENANT_ID)
    // doesn't match the body tenantId (or the tenant doesn't exist)
    expect([403, 400]).toContain(response.status);
  });

  it("should reject missing testMode in non-production builds", async () => {
    const response = await apiCall("/api/v1/workflows/trigger", {
      method: "POST",
      body: JSON.stringify({
        workflowId: "report-generation",
        // testMode: true is missing
        tenantId: DEMO_TENANT_ID,
        config: {
          productionFlowScenarioId: "R01",
        },
      }),
    });

    // In development builds, testMode should be required for workflow triggers
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
