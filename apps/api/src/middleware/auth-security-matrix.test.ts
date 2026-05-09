import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { SignJWT } from "jose";

import { __clearRateLimitMemoryForTests } from "./rate-limit";
import { jwtAuth, resetJwtSecretCacheForTests } from "./auth";
import { bindJwtTenantAsyncContext } from "./jwt-tenant-context";
import { buildApiServer } from "../server";
import { __resetDeliveryAnalyticsForTests } from "../services/delivery-analytics-store";
import { resetBullmqConnectionForTests } from "../services/report-bullmq";
import { __resetReportAuditForTests } from "../services/report-audit-store";
import { __resetReportStoreForTests } from "../services/report-store";
import { __resetShareStoreForTests } from "../services/share-store";
import { __resetTemplateCustomizationStoreForTests } from "../services/template-customization-store";
import { __resetTranslationStoreForTests } from "../services/translation-store";

const JWT_SECRET = "test-jwt-secret-auth-matrix-32chars!!";
const TENANT_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TENANT_B = "99999999-9999-4999-8999-999999999999";

async function signToken(
  tenantId: string,
  roles: string[],
  sub: string,
  extraClaims?: Record<string, unknown>,
): Promise<string> {
  return new SignJWT({
    tenant_id: tenantId,
    tenant_type: "agency" as const,
    tenant_status: "active" as const,
    roles,
    ...extraClaims,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

/** Routes that accept GET with a standard analyst token (tenant A). */
const ANALYST_GET_ROUTES: [string, string][] = [
  ["insights", "/api/v1/insights"],
  ["verdicts", "/api/v1/verdicts"],
  ["reports list", "/api/v1/reports"],
  ["delivery-metrics", "/api/v1/reports/delivery-metrics"],
  ["translations meta", "/api/v1/translations/meta"],
  ["report-templates catalog", "/api/v1/report-templates"],
];

describe("P0 auth security matrix (JWT + tenant context)", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let tokenAnalystA: string;
  let tokenAdminA: string;
  let tokenAnalystB: string;
  let tokenNoRoles: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApiServer();
    await app.ready();
    tokenAnalystA = await signToken(TENANT_A, ["analyst"], "user-a");
    tokenAdminA = await signToken(TENANT_A, ["admin"], "user-admin");
    tokenAnalystB = await signToken(TENANT_B, ["analyst"], "user-b");
    tokenNoRoles = await signToken(TENANT_A, [], "user-noroles");
  });

  beforeEach(() => {
    __clearRateLimitMemoryForTests();
    resetJwtSecretCacheForTests();
    delete process.env.REDIS_URL;
    resetBullmqConnectionForTests();
    __resetReportStoreForTests();
    __resetReportAuditForTests();
    __resetShareStoreForTests();
    __resetDeliveryAnalyticsForTests();
    __resetTemplateCustomizationStoreForTests();
    __resetTranslationStoreForTests();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("401 without Authorization on protected GET routes", () => {
    it.each(ANALYST_GET_ROUTES)(
      "GET %s (%s) rejects unauthenticated callers with 401",
      async (_label, url) => {
        const res = await app.inject({ method: "GET", url });
        expect(res.statusCode).toBe(401);
        const body = res.json() as { error?: { code?: string } };
        expect(body.error?.code).toBe("unauthorized");
      },
    );
  });

  describe("401 with invalid bearer JWT on protected GET routes", () => {
    it.each(ANALYST_GET_ROUTES)(
      "GET %s (%s) rejects malformed JWT with 401",
      async (_label, url) => {
        const res = await app.inject({
          method: "GET",
          url,
          headers: { authorization: "Bearer not-a-valid-jwt" },
        });
        expect(res.statusCode).toBe(401);
      },
    );
  });

  describe("200 analyst access with valid JWT + tenant config", () => {
    it.each(ANALYST_GET_ROUTES)(
      "GET %s (%s) succeeds for tenant A analyst",
      async (_label, url) => {
        const res = await app.inject({
          method: "GET",
          url,
          headers: { authorization: `Bearer ${tokenAnalystA}` },
        });
        expect(res.statusCode).toBe(200);
      },
    );
  });

  describe("admin report list (manual testing / superuser)", () => {
    it("GET /api/v1/reports succeeds for tenant A admin (default dev JWT includes admin)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/reports",
        headers: { authorization: `Bearer ${tokenAdminA}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("JWT claim validation (middleware unit surface)", () => {
    let unit: Awaited<ReturnType<typeof buildUnit>>;

    async function buildUnit() {
      const instance = Fastify({ logger: false });
      instance.get("/p", { preHandler: jwtAuth({ required: true }) }, async () => ({ ok: true }));
      await instance.ready();
      return instance;
    }

    beforeAll(async () => {
      unit = await buildUnit();
    });

    afterAll(async () => {
      if (unit) {
        await unit.close();
      }
    });

    it.each([
      ["empty Bearer value", "Bearer "],
      ["Bearer with only spaces", "Bearer    "],
      ["wrong scheme", "Basic abcdef"],
      ["missing Bearer prefix", `${JWT_SECRET}`],
    ])("jwtAuth: %s → 401", async (_label, authorization) => {
      const res = await unit.inject({
        method: "GET",
        url: "/p",
        headers: { authorization },
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects token signed with a different secret", async () => {
      const rogue = await new SignJWT({ tenant_id: TENANT_A, roles: ["analyst"] })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("rogue")
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode("different-secret-at-least-32-chars-x"));
      const res = await unit.inject({
        method: "GET",
        url: "/p",
        headers: { authorization: `Bearer ${rogue}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects token without sub claim", async () => {
      const token = await new SignJWT({ tenant_id: TENANT_A, roles: ["analyst"] })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(JWT_SECRET));
      const res = await unit.inject({
        method: "GET",
        url: "/p",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects token without tenant_id claim", async () => {
      const token = await new SignJWT({ roles: ["analyst"] })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("u1")
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(JWT_SECRET));
      const res = await unit.inject({
        method: "GET",
        url: "/p",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects expired token", async () => {
      const token = await new SignJWT({ tenant_id: TENANT_A, roles: ["analyst"] })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("exp")
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) - 120)
        .sign(new TextEncoder().encode(JWT_SECRET));
      const res = await unit.inject({
        method: "GET",
        url: "/p",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("Role-based 403 (reports write)", () => {
    it("POST /api/v1/reports returns 403 for analyst without reports:write", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/reports",
        headers: {
          authorization: `Bearer ${tokenAnalystA}`,
          "content-type": "application/json",
        },
        payload: { title: "Unauthorized title" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("POST /api/v1/reports returns 200 for token with reports:write", async () => {
      const writer = await signToken(
        TENANT_A,
        ["analyst", "reports:read", "reports:write"],
        "writer-1",
      );
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/reports",
        headers: {
          authorization: `Bearer ${writer}`,
          "content-type": "application/json",
        },
        payload: { title: "Authorized title" },
      });
      expect(res.statusCode).toBe(201);
    });
  });

  describe("Admin-only workflow routes", () => {
    it("POST /api/v1/workflows/trigger returns 403 for non-admin analyst", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/workflows/trigger",
        headers: {
          authorization: `Bearer ${tokenAnalystA}`,
          "content-type": "application/json",
        },
        payload: {
          workflowId: "marketing-analysis",
          testMode: true,
          tenantId: TENANT_A,
          config: {},
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it("POST /api/v1/workflows/trigger returns 503 for admin when BullMQ is not configured", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/workflows/trigger",
        headers: {
          authorization: `Bearer ${tokenAdminA}`,
          "content-type": "application/json",
        },
        payload: {
          workflowId: "marketing-analysis",
          testMode: true,
          tenantId: TENANT_A,
          config: {},
        },
      });
      expect(res.statusCode).toBe(503);
    });
  });

  describe("Tenant isolation on insights (cross-tenant)", () => {
    it("tenant B receives only tenant B insights shape (200, tenant-scoped)", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/insights",
        headers: { authorization: `Bearer ${tokenAnalystB}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { insights: { tenantId?: string }[] };
      expect(body.insights.every((i) => i.tenantId === undefined || i.tenantId === TENANT_B)).toBe(
        true,
      );
    });
  });

  describe("Optional JWT (required: false) semantics", () => {
    let lax: Awaited<ReturnType<typeof buildLax>>;

    async function buildLax() {
      const instance = Fastify({ logger: false });
      instance.get("/publicish", { preHandler: jwtAuth({ required: false }) }, async (request) => ({
        authed: Boolean(request.auth),
      }));
      await instance.ready();
      return instance;
    }

    beforeAll(async () => {
      lax = await buildLax();
    });

    afterAll(async () => {
      if (lax) {
        await lax.close();
      }
    });

    it("allows request without Authorization when required is false", async () => {
      const res = await lax.inject({ method: "GET", url: "/publicish" });
      expect(res.statusCode).toBe(200);
      expect((res.json() as { authed: boolean }).authed).toBe(false);
    });

    it("still attaches auth when Bearer is valid", async () => {
      const res = await lax.inject({
        method: "GET",
        url: "/publicish",
        headers: { authorization: `Bearer ${tokenAnalystA}` },
      });
      expect(res.statusCode).toBe(200);
      expect((res.json() as { authed: boolean }).authed).toBe(true);
    });
  });

  describe("JWT structural edge cases (additional 401 coverage)", () => {
    let unit: Awaited<ReturnType<typeof buildUnit>>;

    async function buildUnit() {
      const instance = Fastify({ logger: false });
      instance.get("/p", { preHandler: jwtAuth({ required: true }) }, async () => ({ ok: true }));
      await instance.ready();
      return instance;
    }

    beforeAll(async () => {
      unit = await buildUnit();
    });

    afterAll(async () => {
      if (unit) {
        await unit.close();
      }
    });

    it.each(["eyJhbGciOiJIUzI1NiJ9.e30.signature", "a.b", "a.b.c.d", "not-even-jwt", ""])(
      "treats %p as invalid JWT",
      async (token) => {
        const res = await unit.inject({
          method: "GET",
          url: "/p",
          headers: { authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(401);
      },
    );
  });

  describe("403 missing role on admin-only unit route", () => {
    let adminRoute: Awaited<ReturnType<typeof buildAdminRoute>>;

    async function buildAdminRoute() {
      const instance = Fastify({ logger: false });
      instance.get(
        "/admin-only",
        { preHandler: jwtAuth({ required: true, roles: ["admin"] }) },
        async () => ({ ok: true }),
      );
      await instance.ready();
      return instance;
    }

    beforeAll(async () => {
      adminRoute = await buildAdminRoute();
    });

    afterAll(async () => {
      if (adminRoute) {
        await adminRoute.close();
      }
    });

    it("analyst token cannot access admin route", async () => {
      const res = await adminRoute.inject({
        method: "GET",
        url: "/admin-only",
        headers: { authorization: `Bearer ${tokenAnalystA}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("token with empty roles cannot access admin route", async () => {
      const res = await adminRoute.inject({
        method: "GET",
        url: "/admin-only",
        headers: { authorization: `Bearer ${tokenNoRoles}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it("admin token succeeds", async () => {
      const res = await adminRoute.inject({
        method: "GET",
        url: "/admin-only",
        headers: { authorization: `Bearer ${tokenAdminA}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("Tenant context binding rejects unknown tenant config", () => {
    let ctxApp: Awaited<ReturnType<typeof buildCtxApp>>;

    async function buildCtxApp() {
      const instance = Fastify({ logger: false });
      instance.get(
        "/z",
        { preHandler: [jwtAuth({ required: true }), bindJwtTenantAsyncContext()] },
        async () => ({ ok: true }),
      );
      await instance.ready();
      return instance;
    }

    beforeAll(async () => {
      ctxApp = await buildCtxApp();
    });

    afterAll(async () => {
      if (ctxApp) {
        await ctxApp.close();
      }
    });

    it("returns 403 when tenant UUID is valid JWT but no tenant JSON exists", async () => {
      const orphan = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
      const token = await signToken(orphan, ["analyst"], "orphan-user");
      const res = await ctxApp.inject({
        method: "GET",
        url: "/z",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("Additional protected mutations (401 / 403 coverage)", () => {
    it("POST /api/v1/insights/validate without token returns 401", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/insights/validate",
        headers: { "content-type": "application/json" },
        payload: { insights: [] },
      });
      expect(res.statusCode).toBe(401);
    });

    it("POST /api/v1/insights/validate with invalid JWT returns 401", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/insights/validate",
        headers: {
          authorization: "Bearer not.valid.jwt",
          "content-type": "application/json",
        },
        payload: { insights: [] },
      });
      expect(res.statusCode).toBe(401);
    });

    it("POST /api/v1/verdicts/validate without token returns 401", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/verdicts/validate",
        headers: { "content-type": "application/json" },
        payload: { verdict: {} },
      });
      expect(res.statusCode).toBe(401);
    });

    it("PUT /api/v1/translations without token returns 401", async () => {
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/translations",
        headers: { "content-type": "application/json" },
        payload: { locale: "en", key: "k", value: "v" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("PUT /api/v1/translations returns 403 for analyst without translations:write", async () => {
      const res = await app.inject({
        method: "PUT",
        url: "/api/v1/translations",
        headers: {
          authorization: `Bearer ${tokenAnalystA}`,
          "content-type": "application/json",
        },
        payload: { locale: "en", key: "k", value: "v" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("GET /api/v1/analysis-results/{uuid} without token returns 401", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analysis-results/00000000-0000-4000-8000-000000000001",
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
