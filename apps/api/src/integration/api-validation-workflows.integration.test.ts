import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import { __clearRateLimitMemoryForTests } from "../middleware/rate-limit";
import { buildApiServer } from "../server";
import { resetBullmqConnectionForTests } from "../services/report-bullmq";

const JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";
const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const apiPackageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("API integration — workflows & secured reads", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let adminToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.COMPANY_CONFIG_DIR = path.join(apiPackageRoot, "test-fixtures/company-configs");
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
    delete process.env.REDIS_URL;
    resetBullmqConnectionForTests();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/v1/workflows/trigger returns 401 without auth", async () => {
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

  it("POST /api/v1/workflows/trigger returns 503 when queue unavailable", async () => {
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

  it("GET /api/v1/reports returns 401 without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/reports" });
    expect(res.statusCode).toBe(401);
  });
});
