import type { OutgoingHttpHeaders } from "node:http";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import { marketingVerdictSchema } from "@agenticverdict/types";

import { __clearRateLimitMemoryForTests } from "./middleware/rate-limit";
import { buildApiServer } from "./server";
import { __resetDeliveryAnalyticsForTests } from "./services/delivery-analytics-store";
import { resetBullmqConnectionForTests } from "./services/report-bullmq";
import { __resetReportAuditForTests } from "./services/report-audit-store";
import {
  __resetReportStoreForTests,
  __setReportRetainUntilForTests,
} from "./services/report-store";
import { __resetScheduleStoreForTests } from "./services/schedule-store";
import { __resetShareStoreForTests } from "./services/share-store";
import { __resetTemplateCustomizationStoreForTests } from "./services/template-customization-store";
import { __resetTranslationStoreForTests } from "./services/translation-store";

const TENANT_A = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const TENANT_B = "99999999-9999-4999-8999-999999999999";
const TENANT_RL = "11111111-1111-4111-8111-111111111111";
const TENANT_REPORT_WRITE_RL = "22222222-2222-4222-8222-222222222222";
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
  let tokenReportWrite: string;
  let tokenAdmin: string;
  let tokenNoRoles: string;
  let tokenReportWriteRl: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApiServer();
    await app.ready();
    tokenA = await signToken(TENANT_A, ["analyst"], "user-a");
    tokenB = await signToken(TENANT_B, ["analyst"], "user-b");
    tokenRl = await signToken(TENANT_RL, ["analyst"], "user-rl");
    tokenReportWrite = await signToken(
      TENANT_A,
      ["analyst", "reports:read", "reports:write"],
      "user-rep",
    );
    tokenAdmin = await signToken(TENANT_A, ["admin"], "user-admin");
    tokenNoRoles = await signToken(TENANT_A, [], "user-no-roles");
    tokenReportWriteRl = await signToken(
      TENANT_REPORT_WRITE_RL,
      ["analyst", "reports:read", "reports:write"],
      "user-rep-rl",
    );
  });

  beforeEach(() => {
    __clearRateLimitMemoryForTests();
    delete process.env.REDIS_URL;
    resetBullmqConnectionForTests();
    __resetReportStoreForTests();
    __resetReportAuditForTests();
    __resetScheduleStoreForTests();
    __resetShareStoreForTests();
    __resetDeliveryAnalyticsForTests();
    __resetTemplateCustomizationStoreForTests();
    __resetTranslationStoreForTests();
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
    expect(doc.paths?.["/api/v1/workflows/trigger"]).toBeDefined();
    expect(doc.paths?.["/api/v1/workflows/status/{executionId}"]).toBeDefined();
    expect(doc.paths?.["/api/v1/test/results/{executionId}"]).toBeDefined();
    expect(doc.paths?.["/api/v1/test/telemetry/scenario"]).toBeDefined();
    expect(doc.paths?.["/api/v1/test/telemetry/assertion"]).toBeDefined();
    expect(doc.paths?.["/metrics"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/delivery-metrics"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/shared/{token}/content"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/content"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/delivery"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/share-links"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/compliance/audit"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/compliance/summary"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/retention/sweep"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/versions"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/versions/{version}/content"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/compare-versions"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/archive"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/unarchive"]).toBeDefined();
    expect(doc.paths?.["/api/v1/reports/{id}/retention"]).toBeDefined();
    expect(doc.paths?.["/api/v1/report-schedules"]).toBeDefined();
    expect(doc.paths?.["/api/v1/report-templates"]).toBeDefined();
    expect(doc.paths?.["/api/v1/report-templates/{templateId}/preview"]).toBeDefined();
    expect(doc.paths?.["/api/v1/translations"]).toBeDefined();
    expect(doc.paths?.["/api/v1/translations/meta"]).toBeDefined();
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

  it("returns 403 when analyst tries to create a report without reports:write", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { title: "Quarterly" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("exposes translation catalog, merges overrides, and enforces RBAC (Phase 03 i18n)", async () => {
    const meta = await app.inject({
      method: "GET",
      url: "/api/v1/translations/meta",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(meta.statusCode).toBe(200);
    const metaBody = meta.json() as { locales: string[]; defaultLocale: string };
    expect(metaBody.locales).toContain("zh");
    expect(metaBody.defaultLocale).toBe("en");

    const merged = await app.inject({
      method: "GET",
      url: "/api/v1/translations?locale=es",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(merged.statusCode).toBe(200);
    expect((merged.json() as { messages: Record<string, string> }).messages["reports.title"]).toBe(
      "Informes",
    );

    const put = await app.inject({
      method: "PUT",
      url: "/api/v1/translations",
      headers: { authorization: `Bearer ${tokenAdmin}`, "content-type": "application/json" },
      payload: { locale: "es", key: "reports.title", value: "Informes personalizados" },
    });
    expect(put.statusCode).toBe(200);

    const after = await app.inject({
      method: "GET",
      url: "/api/v1/translations?locale=es-ES",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(after.statusCode).toBe(200);
    expect((after.json() as { messages: Record<string, string> }).messages["reports.title"]).toBe(
      "Informes personalizados",
    );

    const denied = await app.inject({
      method: "PUT",
      url: "/api/v1/translations",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { locale: "en", key: "reports.title", value: "X" },
    });
    expect(denied.statusCode).toBe(403);
  });

  it("lists built-in report templates and previews HTML (Phase 03 TMP)", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/report-templates",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(list.statusCode).toBe(200);
    const ids = (list.json() as { templates: { id: string }[] }).templates.map((t) => t.id);
    expect(ids).toContain("executive-summary");

    const prev = await app.inject({
      method: "POST",
      url: "/api/v1/report-templates/executive-summary/preview",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { model: { title: "API Preview", executiveSummary: "Hello" } },
    });
    expect(prev.statusCode).toBe(200);
    const html = (prev.json() as { html: string }).html;
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("API Preview");

    const rtlOverride = await app.inject({
      method: "POST",
      url: "/api/v1/report-templates/executive-summary/preview",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: {
        locale: "ar",
        textDirection: "ltr",
        model: { title: "Mixed", executiveSummary: "text" },
      },
    });
    expect(rtlOverride.statusCode).toBe(200);
    expect((rtlOverride.json() as { html: string }).html).toContain('dir="ltr"');

    const integrated = await app.inject({
      method: "POST",
      url: "/api/v1/report-templates/executive-summary/preview",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { integratePhase2: true, model: { title: "Integrated", companyName: "Tenant A" } },
    });
    expect(integrated.statusCode).toBe(200);
    const intHtml = (integrated.json() as { html: string }).html;
    expect(intHtml).toContain("Verdict overview");
    expect(intHtml).toContain("Historical verdict score");
  });

  it("persists template HTML versions and uses latest for preview (TMP-4)", async () => {
    const postVer = await app.inject({
      method: "POST",
      url: "/api/v1/report-templates/executive-summary/versions",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { html: "<!DOCTYPE html><html><body>CUSTOM</body></html>", label: "v1" },
    });
    expect(postVer.statusCode).toBe(201);

    const prev = await app.inject({
      method: "POST",
      url: "/api/v1/report-templates/executive-summary/preview",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { model: { title: "Ignored" } },
    });
    expect(prev.statusCode).toBe(200);
    expect((prev.json() as { html: string }).html).toContain("CUSTOM");

    const vers = await app.inject({
      method: "GET",
      url: "/api/v1/report-templates/executive-summary/versions",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(vers.statusCode).toBe(200);
    expect((vers.json() as { versions: unknown[] }).versions.length).toBe(1);
  });

  it("returns 403 when posting template versions without reports:write", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/report-templates/executive-summary/versions",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { html: "<html></html>" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("creates, uploads, lists, and downloads report bytes with RBAC (Phase 03 INF)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { title: "Exec summary" },
    });
    expect(created.statusCode).toBe(201);
    const reportId = (created.json() as { report: { id: string } }).report.id;

    const put = await app.inject({
      method: "PUT",
      url: `/api/v1/reports/${reportId}/content`,
      headers: {
        authorization: `Bearer ${tokenReportWrite}`,
        "content-type": "application/pdf",
      },
      payload: Buffer.from("%PDF-1.4 stub"),
    });
    expect(put.statusCode).toBe(200);

    const listDenied = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenNoRoles}` },
    });
    expect(listDenied.statusCode).toBe(403);

    const listOk = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(listOk.statusCode).toBe(200);
    expect(
      (listOk.json() as { reports: { id: string }[] }).reports.some((r) => r.id === reportId),
    ).toBe(true);

    const dl = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${reportId}/content`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(dl.statusCode).toBe(200);
    expect(dl.body).toBe("%PDF-1.4 stub");
    expect(dl.headers["content-type"]).toBe("application/pdf");
  });

  it("returns 503 when enqueueing email delivery without REDIS_URL (Phase 03 delivery)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { title: "Mail me" },
    });
    const reportId = (created.json() as { report: { id: string } }).report.id;
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/reports/${reportId}/delivery`,
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { recipientEmail: "ops@example.test", format: "pdf" },
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { error: { code: string } }).error.code).toBe("queue_unavailable");
  });

  it("issues share links and allows unauthenticated download via token path", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { title: "Shared" },
    });
    const reportId = (created.json() as { report: { id: string } }).report.id;
    await app.inject({
      method: "PUT",
      url: `/api/v1/reports/${reportId}/content`,
      headers: {
        authorization: `Bearer ${tokenReportWrite}`,
        "content-type": "application/pdf",
      },
      payload: Buffer.from("%PDF-shared"),
    });
    const share = await app.inject({
      method: "POST",
      url: `/api/v1/reports/${reportId}/share-links`,
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { expiresInHours: 24 },
    });
    expect(share.statusCode).toBe(201);
    const body = share.json() as { downloadPath: string; token: string };
    expect(body.downloadPath).toContain("/reports/shared/");
    expect(body.downloadPath).toContain(body.token);

    const dl = await app.inject({
      method: "GET",
      url: body.downloadPath,
    });
    expect(dl.statusCode).toBe(200);
    expect(dl.body).toBe("%PDF-shared");

    const metrics = await app.inject({
      method: "GET",
      url: "/api/v1/reports/delivery-metrics",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(metrics.statusCode).toBe(200);
    const m = metrics.json() as { summary: { shareIssued: number } };
    expect(m.summary.shareIssued).toBeGreaterThanOrEqual(1);
  });

  it("manages report schedules with conflict detection and skips BullMQ without Redis", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/report-schedules",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: {
        cronExpression: "0 9 * * 1",
        templateId: "executive-summary",
        format: "pdf",
      },
    });
    expect(first.statusCode).toBe(201);
    expect((first.json() as { repeatableRegistered: boolean }).repeatableRegistered).toBe(false);

    const dup = await app.inject({
      method: "POST",
      url: "/api/v1/report-schedules",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: {
        cronExpression: "0 9 * * 1",
        templateId: "executive-summary",
        format: "pdf",
      },
    });
    expect(dup.statusCode).toBe(409);

    const badCron = await app.inject({
      method: "POST",
      url: "/api/v1/report-schedules",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: {
        cronExpression: "every minute",
        templateId: "executive-summary",
        format: "pdf",
      },
    });
    expect(badCron.statusCode).toBe(400);

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/report-schedules",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(list.statusCode).toBe(200);
    expect((list.json() as { schedules: unknown[] }).schedules.length).toBe(1);
  });

  it("versions report bytes, compares, archives, sweeps retention, and exposes compliance audit (Phase 03 HIST)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { title: "History report" },
    });
    expect(created.statusCode).toBe(201);
    const reportId = (created.json() as { report: { id: string } }).report.id;

    const put1 = await app.inject({
      method: "PUT",
      url: `/api/v1/reports/${reportId}/content`,
      headers: {
        authorization: `Bearer ${tokenReportWrite}`,
        "content-type": "application/pdf",
      },
      payload: Buffer.from("%PDF-v1"),
    });
    expect(put1.statusCode).toBe(200);

    const put2 = await app.inject({
      method: "PUT",
      url: `/api/v1/reports/${reportId}/content`,
      headers: {
        authorization: `Bearer ${tokenReportWrite}`,
        "content-type": "application/pdf",
      },
      payload: Buffer.from("%PDF-v2-longer"),
    });
    expect(put2.statusCode).toBe(200);

    const vers = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${reportId}/versions`,
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(vers.statusCode).toBe(200);
    expect((vers.json() as { versions: { version: number }[] }).versions.length).toBe(2);

    const cmp = await app.inject({
      method: "POST",
      url: `/api/v1/reports/${reportId}/compare-versions`,
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { versionA: 1, versionB: 2 },
    });
    expect(cmp.statusCode).toBe(200);
    const cmpBody = cmp.json() as { identical: boolean; sizeDeltaBytes: number };
    expect(cmpBody.identical).toBe(false);
    expect(cmpBody.sizeDeltaBytes).not.toBe(0);

    const v1Before = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${reportId}/versions/1/content`,
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(v1Before.statusCode).toBe(200);
    expect(v1Before.body).toBe("%PDF-v1");

    await app.inject({
      method: "PATCH",
      url: `/api/v1/reports/${reportId}/archive`,
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });

    const listActive = await app.inject({
      method: "GET",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(
      (listActive.json() as { reports: { id: string }[] }).reports.some((r) => r.id === reportId),
    ).toBe(false);

    const listAll = await app.inject({
      method: "GET",
      url: "/api/v1/reports?includeArchived=true",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(
      (listAll.json() as { reports: { id: string }[] }).reports.some((r) => r.id === reportId),
    ).toBe(true);

    __setReportRetainUntilForTests(reportId, TENANT_A, "2000-01-01T00:00:00.000Z");
    const sweep = await app.inject({
      method: "POST",
      url: "/api/v1/reports/retention/sweep",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(sweep.statusCode).toBe(200);
    expect((sweep.json() as { purgedReportIds: string[] }).purgedReportIds).toContain(reportId);

    const v1After = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${reportId}/versions/1/content`,
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(v1After.statusCode).toBe(404);

    const summary = await app.inject({
      method: "GET",
      url: "/api/v1/reports/compliance/summary",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(summary.statusCode).toBe(200);
    const sum = summary.json() as {
      reports: { retentionExpired: number };
      auditEventsLast30Days: number;
    };
    expect(sum.reports.retentionExpired).toBeGreaterThanOrEqual(1);
    expect(sum.auditEventsLast30Days).toBeGreaterThanOrEqual(1);

    const audit = await app.inject({
      method: "GET",
      url: "/api/v1/reports/compliance/audit?limit=50",
      headers: { authorization: `Bearer ${tokenReportWrite}` },
    });
    expect(audit.statusCode).toBe(200);
    const ev = (audit.json() as { events: { action: string }[] }).events;
    expect(ev.some((e) => e.action === "report.created")).toBe(true);
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

  it("Phase 03 Part 9: rate limits report writes with 429 and Retry-After (dedicated tenant)", async () => {
    const limit = 60;
    let lastStatus = 200;
    let lastHeaders: OutgoingHttpHeaders = {};
    for (let i = 0; i < limit + 5; i += 1) {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/reports",
        headers: {
          authorization: `Bearer ${tokenReportWriteRl}`,
          "content-type": "application/json",
        },
        payload: { title: `Rate-limit batch ${i}` },
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

  it("Phase 03 Part 9: tenant isolation on report content (cross-tenant 404)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { title: "Isolation" },
    });
    expect(created.statusCode).toBe(201);
    const reportId = (created.json() as { report: { id: string } }).report.id;
    await app.inject({
      method: "PUT",
      url: `/api/v1/reports/${reportId}/content`,
      headers: {
        authorization: `Bearer ${tokenReportWrite}`,
        "content-type": "application/pdf",
      },
      payload: Buffer.from("%PDF-iso"),
    });

    const cross = await app.inject({
      method: "GET",
      url: `/api/v1/reports/${reportId}/content`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(cross.statusCode).toBe(404);
  });

  it("Phase 03 Part 9: invalid share token returns 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/reports/shared/definitely-not-a-valid-token-1234567890/content",
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { error: { code: string } }).error.code).toBe("not_found");
  });

  it("Phase 03 Part 9: rejects oversized report title", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reports",
      headers: { authorization: `Bearer ${tokenReportWrite}`, "content-type": "application/json" },
      payload: { title: "x".repeat(513) },
    });
    expect(res.statusCode).toBe(400);
  });

  it("Phase 03 Part 9: rejects non-UUID report id on upload path", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/v1/reports/not-a-uuid/content",
      headers: {
        authorization: `Bearer ${tokenReportWrite}`,
        "content-type": "application/pdf",
      },
      payload: Buffer.from("%PDF"),
    });
    expect(res.statusCode).toBe(400);
  });

  it("Phase 03 Part 9: concurrent authenticated list requests succeed (smoke)", async () => {
    const batch = await Promise.all(
      Array.from({ length: 48 }, () =>
        app.inject({
          method: "GET",
          url: "/api/v1/reports",
          headers: { authorization: `Bearer ${tokenReportWrite}` },
        }),
      ),
    );
    expect(batch.every((r) => r.statusCode === 200)).toBe(true);
  });

  it("Phase 03 Part 9: template preview HTML exposes lang for accessibility (WCAG hint)", async () => {
    const prev = await app.inject({
      method: "POST",
      url: "/api/v1/report-templates/executive-summary/preview",
      headers: { authorization: `Bearer ${tokenA}`, "content-type": "application/json" },
      payload: { locale: "ar", model: { title: "A11y", executiveSummary: "body" } },
    });
    expect(prev.statusCode).toBe(200);
    const html = (prev.json() as { html: string }).html;
    expect(html).toMatch(/lang\s*=\s*["']ar["']/i);
    expect(html).toMatch(/dir\s*=\s*["']rtl["']/i);
  });
});
