import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";
import { buildApiServer } from "../../server";
import { resetBullmqConnectionForTests } from "../../services/report-bullmq";

const JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";
const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

describe("workflow routes (Phase 1 production-flow foundation)", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let adminToken: string;
  let analystToken: string;

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
    analystToken = await new SignJWT({ tenant_id: TENANT, roles: ["analyst"] })
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
    expect(body.error.code).toBe("queue_unavailable");
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
});
