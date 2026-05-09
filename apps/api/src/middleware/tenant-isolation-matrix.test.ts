import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

import { buildApiServer } from "../server";
import { ensureTenantAnalysisStore } from "../services/analysis-store";
import {
  createReportRecord,
  getReportForTenant,
  __resetReportStoreForTests,
} from "../services/report-store";
import { appendTemplateVersion } from "../services/template-customization-store";
import { __clearRateLimitMemoryForTests } from "./rate-limit";
import { resetJwtSecretCacheForTests } from "./auth";
import { __resetDeliveryAnalyticsForTests } from "../services/delivery-analytics-store";
import { resetBullmqConnectionForTests } from "../services/report-bullmq";
import { __resetReportAuditForTests } from "../services/report-audit-store";
import { __resetShareStoreForTests } from "../services/share-store";
import { __resetTemplateCustomizationStoreForTests } from "../services/template-customization-store";
import { __resetTranslationStoreForTests } from "../services/translation-store";

const JWT_SECRET = "test-jwt-secret-isolation-matrix-32chars!";
const TENANT_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TENANT_B = "99999999-9999-4999-8999-999999999999";

const writeRoles = ["analyst", "reports:read", "reports:write", "reports:share"] as const;

async function signWriter(tenantId: string, sub: string): Promise<string> {
  return new SignJWT({
    tenant_id: tenantId,
    tenant_type: "agency" as const,
    tenant_status: "active" as const,
    roles: [...writeRoles],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

describe("P1 tenant isolation matrix (cross-tenant data boundaries)", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;
  let tokenWriterA: string;
  let tokenWriterB: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    app = await buildApiServer();
    await app.ready();
    tokenWriterA = await signWriter(TENANT_A, "writer-a");
    tokenWriterB = await signWriter(TENANT_B, "writer-b");
  });

  beforeEach(() => {
    __clearRateLimitMemoryForTests();
    resetJwtSecretCacheForTests();
    delete process.env.REDIS_URL;
    delete process.env.REPORT_DELIVERY_WEBHOOK_TOKEN;
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

  describe("report-store invariants", () => {
    it("getReportForTenant returns null when tenant mismatches record owner", () => {
      const row = createReportRecord(TENANT_A, "Secret");
      expect(getReportForTenant(row.id, TENANT_B)).toBeNull();
      expect(getReportForTenant(row.id, TENANT_A)?.id).toBe(row.id);
    });
  });

  describe("HTTP: tenant B cannot operate on tenant A report id", () => {
    let reportIdA: string;

    beforeEach(async () => {
      const created = await app.inject({
        method: "POST",
        url: "/api/v1/reports",
        headers: {
          authorization: `Bearer ${tokenWriterA}`,
          "content-type": "application/json",
        },
        payload: { title: "Tenant A confidential" },
      });
      expect(created.statusCode).toBe(201);
      reportIdA = (created.json() as { report: { id: string } }).report.id;
    });

    it("GET /reports lists only own tenant rows", async () => {
      const bList = await app.inject({
        method: "GET",
        url: "/api/v1/reports",
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(bList.statusCode).toBe(200);
      const ids = (bList.json() as { reports: { id: string }[] }).reports.map((r) => r.id);
      expect(ids).not.toContain(reportIdA);
    });

    it("GET /reports/:id → 404", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/reports/${reportIdA}`,
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("PUT /reports/:id/content → 404", async () => {
      const res = await app.inject({
        method: "PUT",
        url: `/api/v1/reports/${reportIdA}/content`,
        headers: {
          authorization: `Bearer ${tokenWriterB}`,
          "content-type": "application/pdf",
        },
        payload: Buffer.from("%PDF-1.4 minimal"),
      });
      expect(res.statusCode).toBe(404);
    });

    it("GET /reports/:id/versions → 404", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/reports/${reportIdA}/versions`,
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("GET /reports/:id/versions/1/content → 404", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/reports/${reportIdA}/versions/1/content`,
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("POST /reports/:id/compare-versions → 404", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/reports/${reportIdA}/compare-versions`,
        headers: {
          authorization: `Bearer ${tokenWriterB}`,
          "content-type": "application/json",
        },
        payload: { versionA: 1, versionB: 2 },
      });
      expect(res.statusCode).toBe(404);
    });

    it("POST /reports/:id/delivery → 404", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/reports/${reportIdA}/delivery`,
        headers: {
          authorization: `Bearer ${tokenWriterB}`,
          "content-type": "application/json",
        },
        payload: {
          recipientEmail: "evil@example.test",
          format: "pdf",
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it("GET /reports/:id/share-links → 404", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/reports/${reportIdA}/share-links`,
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("POST /reports/:id/share-links → 404", async () => {
      const res = await app.inject({
        method: "POST",
        url: `/api/v1/reports/${reportIdA}/share-links`,
        headers: {
          authorization: `Bearer ${tokenWriterB}`,
          "content-type": "application/json",
        },
        payload: { expiresInHours: 24 },
      });
      expect(res.statusCode).toBe(404);
    });

    it("PATCH /reports/:id/archive → 404", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/reports/${reportIdA}/archive`,
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("PATCH /reports/:id/unarchive → 404", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/reports/${reportIdA}/unarchive`,
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it("PATCH /reports/:id/retention → 404", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: `/api/v1/reports/${reportIdA}/retention`,
        headers: {
          authorization: `Bearer ${tokenWriterB}`,
          "content-type": "application/json",
        },
        payload: { retentionDays: 30 },
      });
      expect(res.statusCode).toBe(404);
    });

    it("GET /reports/compliance/audit does not include tenant A audit rows", async () => {
      await app.inject({
        method: "PUT",
        url: `/api/v1/reports/${reportIdA}/content`,
        headers: {
          authorization: `Bearer ${tokenWriterA}`,
          "content-type": "application/pdf",
        },
        payload: Buffer.from("%PDF-1.4"),
      });
      const bAudit = await app.inject({
        method: "GET",
        url: "/api/v1/reports/compliance/audit",
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(bAudit.statusCode).toBe(200);
      const body = bAudit.json() as { events: { reportId?: string }[] };
      expect(body.events.some((e) => e.reportId === reportIdA)).toBe(false);
    });
  });

  describe("HTTP: analysis results", () => {
    it("GET /analysis-results/:id → 404 when bundle belongs to another tenant", async () => {
      const { analysisId } = ensureTenantAnalysisStore(TENANT_A);
      const res = await app.inject({
        method: "GET",
        url: `/api/v1/analysis-results/${analysisId}`,
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe("HTTP: template customizations", () => {
    it("tenant B does not see tenant A template versions", async () => {
      appendTemplateVersion(TENANT_A, "executive-summary", {
        html: "<html>A-only</html>",
        label: "iso-test",
      });
      const bRes = await app.inject({
        method: "GET",
        url: "/api/v1/report-templates/executive-summary/versions",
        headers: { authorization: `Bearer ${tokenWriterB}` },
      });
      expect(bRes.statusCode).toBe(200);
      const body = bRes.json() as { versions: unknown[] };
      expect(body.versions.length).toBe(0);
    });
  });

  describe("HTTP: delivery metrics tenant scope", () => {
    it("tenant B summary excludes tenant A webhook-accepted events", async () => {
      process.env.REPORT_DELIVERY_WEBHOOK_TOKEN = "iso-webhook-token";
      try {
        await app.inject({
          method: "POST",
          url: "/api/v1/reports/delivery-events/webhook",
          headers: {
            "content-type": "application/json",
            "x-delivery-webhook-token": "iso-webhook-token",
          },
          payload: {
            tenantId: TENANT_A,
            provider: "resend",
            event: "delivered",
            recipientEmail: "a@example.test",
          },
        });
        const bMetrics = await app.inject({
          method: "GET",
          url: "/api/v1/reports/delivery-metrics",
          headers: { authorization: `Bearer ${tokenWriterB}` },
        });
        expect(bMetrics.statusCode).toBe(200);
        const summary = (bMetrics.json() as { summary: { emailSent: number } }).summary;
        expect(summary.emailSent).toBe(0);
      } finally {
        delete process.env.REPORT_DELIVERY_WEBHOOK_TOKEN;
      }
    });
  });
});
