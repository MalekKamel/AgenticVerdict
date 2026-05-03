import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import {
  workflowTriggerJobDataSchema,
  workflowTriggerJobResultSchema,
} from "@agenticverdict/worker";

import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";
import { buildApiServer } from "../../server";
import { resetBullmqConnectionForTests } from "../../services/report-bullmq";

const JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";
const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const OTHER_TENANT = "bbbbbbbb-cccc-4ddd-eeee-ffffffffffff";

describe("workflow routes (Phase 1 production-flow foundation)", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let adminToken: string;
  let analystToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApiServer();
    await app.ready();
    adminToken = await new SignJWT({
      tenant_id: TENANT,
      tenant_type: "agency" as const,
      tenant_status: "active" as const,
      roles: ["admin"],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin-user")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));
    analystToken = await new SignJWT({
      tenant_id: TENANT,
      tenant_type: "agency" as const,
      tenant_status: "active" as const,
      roles: ["analyst"],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("analyst-user")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(JWT_SECRET));
  });

  beforeEach(() => {
    __clearRateLimitMemoryForTests();
    delete process.env.REDIS_URL;
    resetBullmqConnectionForTests();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 401 without bearer token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/workflows/trigger",
      payload: {
        workflowId: "report-generation",
        testMode: true,
        tenantId: TENANT,
        config: {},
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 for non-admin roles", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/workflows/trigger",
      headers: { authorization: `Bearer ${analystToken}` },
      payload: {
        workflowId: "report-generation",
        testMode: true,
        tenantId: TENANT,
        config: {},
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 503 when REDIS_URL is unset", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/workflows/trigger",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        workflowId: "report-generation",
        testMode: true,
        tenantId: TENANT,
        config: {
          mockData: { scenario: "normal", seed: 42_001 },
        },
      },
    });
    expect(res.statusCode).toBe(503);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("QUEUE_UNAVAILABLE");
  });

  it("returns 403 when payload tenantId differs from JWT tenant", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/workflows/trigger",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        workflowId: "report-generation",
        testMode: true,
        tenantId: OTHER_TENANT,
        config: {},
      },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("TENANT_MISMATCH");
  });

  it("returns 400 for invalid productionFlowScenarioId", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/workflows/trigger",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        workflowId: "report-generation",
        testMode: true,
        tenantId: TENANT,
        config: {
          mockData: { scenario: "normal", seed: 1 },
          productionFlowScenarioId: "R99",
        },
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("enforces recipientEmail when deliveryEnabled=true", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/workflows/trigger",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        workflowId: "verdict-generation",
        testMode: true,
        tenantId: TENANT,
        config: {
          deliveryEnabled: true,
        },
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("workflow contract compatibility", () => {
  it("accepts API trigger payload with shared worker schema", () => {
    const payload = {
      workflowId: "marketing-analysis",
      testMode: true,
      tenantId: TENANT,
      config: {
        dateRange: { start: "2026-03-01T00:00:00.000Z", end: "2026-03-31T23:59:59.000Z" },
        platforms: ["meta", "ga4"],
        analysisDepth: "standard",
      },
      requestId: "req-contract-1",
    };
    expect(() => workflowTriggerJobDataSchema.parse(payload)).not.toThrow();
  });

  it("accepts worker result envelope with shared schema", () => {
    const result = {
      workflowId: "verdict-generation",
      tenantId: TENANT,
      testMode: true,
      phase: "verdict-generation",
      message: "verdict-generation_processed",
      insights: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          type: "trend",
          title: "t",
          description: "d",
          confidence: 0.8,
        },
      ],
      processingMetadata: {
        durationMs: 1200,
        stagesCompleted: 3,
        pipelineStatus: "degraded",
        platformsAnalyzed: ["meta"],
        errorCode: "INTERNAL_ERROR",
        partialFailure: true,
        platformFailures: [
          {
            platform: "meta",
            code: "CONNECTOR_UPSTREAM_FAILURE",
            message: "fetch failed",
            retryable: true,
          },
        ],
      },
    };
    expect(() => workflowTriggerJobResultSchema.parse(result)).not.toThrow();
  });

  it("accepts worker result envelope when delivery queue failure is reported", () => {
    const result = {
      workflowId: "verdict-generation",
      tenantId: TENANT,
      testMode: true,
      phase: "verdict-generation",
      message: "verdict-generation_processed_with_delivery_issue",
      processingMetadata: {
        durationMs: 800,
        stagesCompleted: 3,
        pipelineStatus: "completed",
        platformsAnalyzed: ["meta"],
        errorCode: "QUEUE_JOB_FAILED",
        partialFailure: true,
      },
    };
    expect(() => workflowTriggerJobResultSchema.parse(result)).not.toThrow();
  });

  it("rejects trigger payload outputFormat values not supported by report generator", () => {
    const payload = {
      workflowId: "marketing-analysis",
      testMode: true,
      tenantId: TENANT,
      config: {
        outputFormat: "xml",
      },
      requestId: "req-contract-invalid-format",
    };
    expect(() => workflowTriggerJobDataSchema.parse(payload)).toThrow();
  });
});
