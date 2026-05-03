import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import { productionFlowTestRegistry } from "@agenticverdict/observability";

import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";
import { buildApiServer } from "../../server";
import { resetBullmqConnectionForTests } from "../../services/report-bullmq";

const JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";
const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

describe("production-flow test routes (Phase 2 observability)", () => {
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
    productionFlowTestRegistry.resetMetrics();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /metrics exposes Prometheus text without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/metrics" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.body).toContain("test_workflow_trigger_enqueued_total");
  });

  it("GET /api/v1/test/results/:id returns 503 when Redis is unset", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/test/results/job-1",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(503);
  });

  it("rejects non-admin for test results", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/test/results/job-1",
      headers: { authorization: `Bearer ${analystToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("POST telemetry/scenario returns 204 and increments metrics", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/test/telemetry/scenario",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "content-type": "application/json",
      },
      payload: {
        scenarioId: "R01",
        category: "generation",
        outcome: "passed",
        durationSeconds: 2.5,
      },
    });
    expect(res.statusCode).toBe(204);
    const metrics = await app.inject({ method: "GET", url: "/metrics" });
    expect(metrics.body).toContain('scenario_id="R01"');
    expect(metrics.body).toContain("test_scenario_duration_seconds");
  });

  it("POST telemetry/assertion returns 204", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/test/telemetry/assertion",
      headers: {
        authorization: `Bearer ${adminToken}`,
        "content-type": "application/json",
      },
      payload: {
        scenarioId: "R01",
        assertionType: "status",
        result: "passed",
      },
    });
    expect(res.statusCode).toBe(204);
  });
});
