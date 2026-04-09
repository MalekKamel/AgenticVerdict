import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";

import type { WorkflowTriggerStatusPayload } from "../../services/report-bullmq";
import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";

const JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";
const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeee66";

const completedSnapshot: WorkflowTriggerStatusPayload = {
  executionId: "status-contract-exec-1",
  status: "completed",
  bullmqState: "completed",
  queuedAtMs: 1,
  startedAtMs: 2,
  finishedAtMs: 3,
  durationMs: 1,
  result: {
    workflowId: "marketing-analysis",
    tenantId: TENANT,
    testMode: true,
    phase: "marketing-analysis",
    message: "marketing-analysis_processed",
    analysisId: "aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa",
    insights: [
      {
        id: "bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb",
        type: "trend",
        title: "Status contract trend",
        description: "Trend text\u0007",
        confidence: 0.8,
      },
    ],
    processingMetadata: {
      durationMs: 1000,
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
    getWorkflowTriggerJobStatus: vi.fn(async (executionId: string) => {
      if (executionId === completedSnapshot.executionId) {
        return completedSnapshot;
      }
      if (executionId === "missing-exec") {
        return null;
      }
      if (executionId === "pending-with-null-result") {
        return {
          executionId,
          status: "waiting" as const,
          bullmqState: "waiting",
          result: null,
        };
      }
      return {
        executionId,
        status: "failed" as const,
        bullmqState: "failed",
        error: "simulated failure",
      };
    }),
  };
});

import { buildApiServer } from "../../server";

describe("workflow status endpoint contract", () => {
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

  it("returns stable status/result envelope fields for completed execution", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/workflows/status/${completedSnapshot.executionId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.executionId).toBe(completedSnapshot.executionId);
    expect(body.status).toBe("completed");
    expect(body.bullmqState).toBe("completed");
    expect(typeof body.result).toBe("object");
    const result = body.result as { insights?: Array<{ description?: string }> };
    expect(result.insights?.[0]?.description).toBe("Trend text ");
  });

  it("returns stable error envelope for not found execution", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/workflows/status/missing-exec",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("not_found");
    expect(body.error.message).toBe("Execution not found");
  });

  it("returns 200 when result is temporarily null", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/workflows/status/pending-with-null-result",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.status).toBe("waiting");
    expect(body.bullmqState).toBe("waiting");
    expect(body.result).toBeUndefined();
  });
});
