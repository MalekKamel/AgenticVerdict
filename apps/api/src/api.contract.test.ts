import type { OutgoingHttpHeaders } from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import { marketingVerdictSchema } from "@agenticverdict/types";

import { buildApiServer } from "./server";

const TENANT_A = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const TENANT_B = "99999999-9999-4999-8999-999999999999";
const TENANT_RL = "11111111-1111-4111-8111-111111111111";
const JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";

async function signToken(tenantId: string, roles: string[], sub: string): Promise<string> {
  return new SignJWT({ tenant_id: tenantId, roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

describe("api v1 integration (remediation R-13)", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let tokenA: string;
  let tokenB: string;
  let tokenRl: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApiServer();
    await app.ready();
    tokenA = await signToken(TENANT_A, ["analyst"], "user-a");
    tokenB = await signToken(TENANT_B, ["analyst"], "user-b");
    tokenRl = await signToken(TENANT_RL, ["analyst"], "user-rl");
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /documentation/json exposes OpenAPI with v1 paths (R-14)", async () => {
    const res = await app.inject({ method: "GET", url: "/documentation/json" });
    expect(res.statusCode).toBe(200);
    const doc = res.json() as { paths?: Record<string, unknown> };
    expect(doc.paths?.["/api/v1/insights"]).toBeDefined();
    expect(doc.paths?.["/api/v1/verdicts"]).toBeDefined();
    expect(doc.paths?.["/api/v1/analysis-results/{id}"]).toBeDefined();
    expect(doc.paths?.["/api/v1/insights/validate"]).toBeDefined();
    expect(doc.paths?.["/api/v1/verdicts/validate"]).toBeDefined();
  });

  it("GET /health is public", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("returns 401 for protected routes without bearer token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/insights" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for invalid JWT", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/insights",
      headers: { authorization: "Bearer not-a-jwt" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/v1/insights supports type filter and sort", async () => {
    const all = await app.inject({
      method: "GET",
      url: "/api/v1/insights",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const totalAll = (all.json() as { total: number }).total;

    const trend = await app.inject({
      method: "GET",
      url: "/api/v1/insights?type=trend",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(trend.statusCode).toBe(200);
    const trendBody = trend.json() as { insights: { type: string }[]; total: number };
    expect(trendBody.total).toBeLessThanOrEqual(totalAll);
    expect(trendBody.insights.every((i) => i.type === "trend")).toBe(true);

    const highConf = await app.inject({
      method: "GET",
      url: "/api/v1/insights?minConfidence=0.8",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(highConf.statusCode).toBe(200);
    const hc = highConf.json() as { insights: { confidence: number }[] };
    expect(hc.insights.every((i) => i.confidence >= 0.8)).toBe(true);

    const byConfidence = await app.inject({
      method: "GET",
      url: "/api/v1/insights?sort=confidence&limit=2",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(byConfidence.statusCode).toBe(200);
    const bc = byConfidence.json() as { insights: { confidence: number }[] };
    if (bc.insights.length >= 2) {
      expect(bc.insights[0]!.confidence).toBeGreaterThanOrEqual(bc.insights[1]!.confidence);
    }
  });

  it("GET /api/v1/verdicts returns unified MarketingVerdict payloads", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/verdicts",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { verdicts: unknown[] };
    expect(body.verdicts.length).toBeGreaterThan(0);
    const parsed = marketingVerdictSchema.safeParse(body.verdicts[0]);
    expect(parsed.success).toBe(true);
    const v = parsed.success ? parsed.data : null;
    expect(v?.keyInsights.length).toBeGreaterThan(0);
    expect(v?.dataSources.length).toBeGreaterThan(0);
    expect(v?.evidence.every((e) => typeof e.id === "string")).toBe(true);
  });

  it("GET /api/v1/verdicts filters by verdictType and date range", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/verdicts?verdictType=overall_health&start=2026-03-01&end=2026-03-31",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { verdicts: { verdictType: string }[] };
    expect(body.verdicts.every((v) => v.verdictType === "overall_health")).toBe(true);
  });

  it("tenant B cannot read tenant A analysis bundle (404)", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/insights",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const analysisId = (list.json() as { insights: { analysisId: string }[] }).insights[0]!
      .analysisId;

    const cross = await app.inject({
      method: "GET",
      url: `/api/v1/analysis-results/${analysisId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(cross.statusCode).toBe(404);
  });

  it("GET /api/v1/analysis-results/:id includes provenance data sources", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/insights",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const analysisId = (list.json() as { insights: { analysisId: string }[] }).insights[0]!
      .analysisId;

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/analysis-results/${analysisId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    const bundle = res.json() as {
      provenance: { dataSources: unknown[]; transformations: unknown[] };
    };
    expect(bundle.provenance.dataSources.length).toBeGreaterThan(0);
    expect(bundle.provenance.transformations.length).toBeGreaterThan(0);
  });

  it("POST /api/v1/insights/validate aggregates quality results", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/insights?limit=1",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const insight = (list.json() as { insights: Record<string, unknown>[] }).insights[0];

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/insights/validate",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { insights: [insight] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { isValid: boolean; score: number; perInsight: unknown[] };
    expect(typeof body.isValid).toBe("boolean");
    expect(typeof body.score).toBe("number");
    expect(body.perInsight.length).toBe(1);
  });

  it("POST /api/v1/verdicts/validate returns quality score for unified verdict", async () => {
    const vRes = await app.inject({
      method: "GET",
      url: "/api/v1/verdicts",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const verdict = (vRes.json() as { verdicts: Record<string, unknown>[] }).verdicts[0];
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/verdicts/validate",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { verdict },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { isValid: boolean; score: number };
    expect(typeof body.score).toBe("number");
  });

  it("rate limits validation route with 429 and Retry-After (dedicated tenant)", async () => {
    const limit = 30;
    let lastStatus = 200;
    let lastHeaders: OutgoingHttpHeaders = {};
    for (let i = 0; i < limit + 3; i += 1) {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/insights/validate",
        headers: { authorization: `Bearer ${tokenRl}`, "content-type": "application/json" },
        payload: { insights: [] },
      });
      lastStatus = res.statusCode;
      lastHeaders = res.headers;
      if (res.statusCode === 429) {
        expect(res.headers["retry-after"]).toBeDefined();
        break;
      }
    }
    expect(lastStatus).toBe(429);
    expect(lastHeaders["retry-after"]).toBeDefined();
  });
});
