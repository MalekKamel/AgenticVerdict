import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";

import type { WorkflowTriggerStatusPayload } from "../../services/report-bullmq";
import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";

const statusSnapshot: WorkflowTriggerStatusPayload = {
  executionId: "exec-roundtrip-1",
  tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeee44",
  status: "completed",
  bullmqState: "completed",
  result: {
    workflowId: "verdict-generation",
    tenantId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeee44",
    testMode: true,
    phase: "verdict-generation",
    message: "verdict-generation_processed",
    analysisId: "aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa",
    insights: [
      {
        id: "bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb",
        type: "trend",
        title: "Roundtrip insight",
        description: "Persisted from workflow status",
        confidence: 0.85,
      },
    ],
    processingMetadata: {
      durationMs: 1234,
      stagesCompleted: 3,
      pipelineStatus: "completed",
      platformsAnalyzed: ["meta", "ga4"],
    },
  },
};

vi.mock("../../services/report-bullmq", async () => {
  const actual = await vi.importActual<typeof import("../../services/report-bullmq")>(
    "../../services/report-bullmq",
  );
  return {
    ...actual,
    isBullmqConfigured: vi.fn(() => true),
    getWorkflowTriggerJobStatus: vi.fn(async (executionId: string) =>
      executionId === statusSnapshot.executionId ? statusSnapshot : null,
    ),
  };
});

import { buildApiServer } from "../../server";

const JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";
const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeee44";

describe("workflow status roundtrip persistence", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let adminToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApiServer();
    await app.ready();
    adminToken = await new SignJWT({ tenant_id: TENANT, roles: ["admin"] })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin-user")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));
  });

  beforeEach(() => {
    __clearRateLimitMemoryForTests();
  });

  afterAll(async () => {
    await app.close();
  });

  it("persists status result and serves it via analysis-results endpoint", async () => {
    const statusRes = await app.inject({
      method: "GET",
      url: `/api/v1/workflows/status/${statusSnapshot.executionId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(statusRes.statusCode).toBe(200);
    const statusBody = statusRes.json() as { result?: { analysisId?: string } };
    expect(statusBody.result?.analysisId).toBe(statusSnapshot.result?.analysisId);

    const analysisRes = await app.inject({
      method: "GET",
      url: `/api/v1/analysis-results/${statusSnapshot.result?.analysisId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(analysisRes.statusCode).toBe(200);
    const analysisBody = analysisRes.json() as {
      analysisId: string;
      insights: Array<{ title: string }>;
    };
    expect(analysisBody.analysisId).toBe(statusSnapshot.result?.analysisId);
    expect(analysisBody.insights[0]?.title).toBe("Roundtrip insight");
  });
});
