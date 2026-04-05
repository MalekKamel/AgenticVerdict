import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { z } from "zod";

import { jwtAuth } from "../../middleware/auth";
import { requireAnyRole } from "../../middleware/report-rbac";
import { rateLimit } from "../../middleware/rate-limit";
import {
  appendReportAuditEvent,
  countReportAuditSince,
  listReportAuditForTenant,
} from "../../services/report-audit-store";
import {
  compareReportVersions,
  createReportRecord,
  getReportBlob,
  getReportForTenant,
  getReportHistoryStats,
  getReportVersionSnapshot,
  listReportVersionsForTenant,
  listReportsForTenant,
  putReportBlob,
  setReportArchived,
  setReportRetentionDays,
  sweepReportsPastRetention,
} from "../../services/report-store";
import {
  listDeliveryEventsForTenant,
  recordDeliveryEvent,
  summarizeDeliveryEvents,
} from "../../services/delivery-analytics-store";
import { enqueueReportDelivery } from "../../services/report-bullmq";
import { createShareGrant, resolveShareGrant } from "../../services/share-store";

const createBodySchema = z.object({
  title: z.string().min(1).max(512),
});

const deliveryBodySchema = z.object({
  recipientEmail: z.string().email().max(320),
  format: z.enum(["pdf", "docx", "xlsx"]),
  subject: z.string().min(1).max(512).optional(),
  completionWebhookUrl: z.string().url().max(2048).optional(),
});

const shareBodySchema = z.object({
  expiresInHours: z.number().int().min(1).max(720).optional().default(168),
});

const compareVersionsBodySchema = z.object({
  versionA: z.number().int().min(1),
  versionB: z.number().int().min(1),
});

const retentionBodySchema = z.object({
  retentionDays: z.number().int().min(1).max(3650),
});

const readRoles = ["analyst", "reports:read"] as const;
const writeRoles = ["reports:write", "admin"] as const;
const shareRoles = ["admin", "reports:share", "reports:write"] as const;

export function registerReportRoutes(app: FastifyInstance, redis: Redis | null): void {
  const readChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...readRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 120, keyPrefix: "v1:reports:read" }),
  ];

  const writeChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...writeRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 60, keyPrefix: "v1:reports:write" }),
  ];

  const shareChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...shareRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 60, keyPrefix: "v1:reports:share" }),
  ];

  const sharedDownloadChain = [
    rateLimit(redis, {
      windowMs: 60_000,
      maxRequests: 300,
      keyPrefix: "v1:reports:shared",
      perTenant: false,
    }),
  ];

  app.get(
    "/reports/delivery-metrics",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports"],
        summary:
          "Delivery analytics (queued emails, share links, schedule registrations) for the tenant",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              summary: { type: "object", additionalProperties: true },
              recentEvents: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
            required: ["summary", "recentEvents"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request) => {
      const tenantId = request.auth!.tenantId;
      return {
        summary: summarizeDeliveryEvents(tenantId),
        recentEvents: listDeliveryEventsForTenant(tenantId, 50),
      };
    },
  );

  app.get(
    "/reports/compliance/audit",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary:
          "Tenant-scoped immutable-style audit trail for report lifecycle and compliance views",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 500 },
            since: { type: "string", format: "date-time" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              events: { type: "array", items: { type: "object", additionalProperties: true } },
            },
            required: ["events"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request) => {
      const tenantId = request.auth!.tenantId;
      const q = request.query as { limit?: string; since?: string };
      const limit = q.limit ? Number.parseInt(q.limit, 10) : 100;
      appendReportAuditEvent({
        tenantId,
        actorSub: request.auth!.userId,
        action: "compliance.audit_viewed",
        requestId: request.id,
        details: { limit },
      });
      return {
        events: listReportAuditForTenant(tenantId, {
          since: q.since,
          limit: Number.isFinite(limit) ? limit : 100,
        }),
      };
    },
  );

  app.get(
    "/reports/compliance/summary",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary: "Aggregated report history and recent audit activity for compliance reporting",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              reports: { type: "object", additionalProperties: true },
              auditEventsLast30Days: { type: "integer" },
              generatedAt: { type: "string" },
            },
            required: ["reports", "auditEventsLast30Days", "generatedAt"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request) => {
      const tenantId = request.auth!.tenantId;
      appendReportAuditEvent({
        tenantId,
        actorSub: request.auth!.userId,
        action: "compliance.summary_viewed",
        requestId: request.id,
      });
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      return {
        reports: getReportHistoryStats(tenantId),
        auditEventsLast30Days: countReportAuditSince(tenantId, since),
        generatedAt: new Date().toISOString(),
      };
    },
  );

  app.post(
    "/reports/retention/sweep",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary:
          "Apply retention policy: purge bytes for reports past retain-until (metadata retained)",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              purgedReportIds: { type: "array", items: { type: "string", format: "uuid" } },
            },
            required: ["purgedReportIds"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request) => {
      const tenantId = request.auth!.tenantId;
      const nowIso = new Date().toISOString();
      const { purgedReportIds } = sweepReportsPastRetention(tenantId, nowIso);
      appendReportAuditEvent({
        tenantId,
        actorSub: request.auth!.userId,
        action: "report.retention_sweep",
        requestId: request.id,
        details: { purgedCount: purgedReportIds.length },
      });
      return { purgedReportIds };
    },
  );

  app.get(
    "/reports/shared/:token/content",
    {
      preHandler: sharedDownloadChain,
      schema: {
        tags: ["Reports"],
        summary: "Download report bytes using a time-limited share token (no JWT)",
        params: {
          type: "object",
          required: ["token"],
          properties: { token: { type: "string", minLength: 8, maxLength: 512 } },
        },
        response: {
          200: { type: "string", format: "binary" },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const grant = resolveShareGrant(token);
      if (!grant) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Share link invalid or expired", details: {} },
          requestId: request.id,
        });
      }
      const row = getReportForTenant(grant.reportId, grant.tenantId);
      if (!row || !row.objectKey) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report content not available", details: {} },
          requestId: request.id,
        });
      }
      const buf = getReportBlob(row.objectKey);
      if (!buf) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report blob missing", details: {} },
          requestId: request.id,
        });
      }
      reply.header("content-type", row.contentType ?? "application/octet-stream");
      reply.header("content-length", String(buf.byteLength));
      return reply.send(buf);
    },
  );

  app.get(
    "/reports",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports"],
        summary:
          "List report metadata for the authenticated tenant (excludes archived unless includeArchived=true)",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            includeArchived: { type: "string", enum: ["true", "false"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              reports: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
            required: ["reports"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request) => {
      const tenantId = request.auth!.tenantId;
      const q = request.query as { includeArchived?: string };
      const list = listReportsForTenant(tenantId, {
        includeArchived: q.includeArchived === "true",
      });
      return { reports: list };
    },
  );

  app.post(
    "/reports",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Reports"],
        summary: "Create a report record (binary upload via PUT …/content)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["title"],
          properties: { title: { type: "string", minLength: 1, maxLength: 512 } },
        },
        response: {
          201: {
            type: "object",
            properties: { report: { type: "object", additionalProperties: true } },
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = createBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid body",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      const tenantId = request.auth!.tenantId;
      const report = createReportRecord(tenantId, parsed.data.title);
      appendReportAuditEvent({
        tenantId,
        actorSub: request.auth!.userId,
        action: "report.created",
        reportId: report.id,
        requestId: request.id,
      });
      return reply.status(201).send({ report });
    },
  );

  app.post(
    "/reports/:id/delivery",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Reports"],
        summary: "Enqueue email delivery for a report (BullMQ; requires TCP REDIS_URL)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["recipientEmail", "format"],
          properties: {
            recipientEmail: { type: "string" },
            format: { type: "string", enum: ["pdf", "docx", "xlsx"] },
            subject: { type: "string" },
            completionWebhookUrl: { type: "string" },
          },
        },
        response: {
          202: {
            type: "object",
            properties: {
              status: { type: "string" },
              jobId: { type: "string" },
            },
            required: ["status", "jobId"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
          503: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = deliveryBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid body",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      const { id } = request.params as { id: string };
      const tenantId = request.auth!.tenantId;
      const row = getReportForTenant(id, tenantId);
      if (!row) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      try {
        const jobId = await enqueueReportDelivery({
          tenantId,
          reportId: id,
          recipientEmail: parsed.data.recipientEmail,
          format: parsed.data.format,
          subject: parsed.data.subject,
          completionWebhookUrl: parsed.data.completionWebhookUrl,
        });
        recordDeliveryEvent({
          tenantId,
          type: "email_queued",
          reportId: id,
          meta: { recipientEmail: parsed.data.recipientEmail, jobId },
        });
        return reply.status(202).send({ status: "queued", jobId });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "queue_error";
        if (msg === "queue_unavailable") {
          return reply.status(503).send({
            error: {
              code: "queue_unavailable",
              message: "Set REDIS_URL for BullMQ so the worker can process delivery jobs",
              details: {},
            },
            requestId: request.id,
          });
        }
        return reply.status(503).send({
          error: { code: "queue_error", message: msg, details: {} },
          requestId: request.id,
        });
      }
    },
  );

  app.post(
    "/reports/:id/share-links",
    {
      preHandler: shareChain,
      schema: {
        tags: ["Reports"],
        summary: "Create a time-limited share link for report download (collaboration)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          properties: { expiresInHours: { type: "number" } },
        },
        response: {
          201: {
            type: "object",
            properties: {
              token: { type: "string" },
              expiresAt: { type: "string" },
              downloadPath: { type: "string" },
            },
            required: ["token", "expiresAt", "downloadPath"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = shareBodySchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid body",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      const { id } = request.params as { id: string };
      const tenantId = request.auth!.tenantId;
      const row = getReportForTenant(id, tenantId);
      if (!row) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      const hours = parsed.data.expiresInHours;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const grant = createShareGrant({
        tenantId,
        reportId: id,
        createdBySub: request.auth!.userId,
        expiresAt,
      });
      recordDeliveryEvent({
        tenantId,
        type: "share_issued",
        reportId: id,
        meta: { tokenPrefix: grant.token.slice(0, 6) },
      });
      const downloadPath = `/api/v1/reports/shared/${grant.token}/content`;
      return reply.status(201).send({
        token: grant.token,
        expiresAt: grant.expiresAt,
        downloadPath,
      });
    },
  );

  app.get(
    "/reports/:id",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports"],
        summary: "Get report metadata",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { report: { type: "object", additionalProperties: true } },
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const row = getReportForTenant(id, request.auth!.tenantId);
      if (!row) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      return { report: row };
    },
  );

  app.put(
    "/reports/:id/content",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Reports"],
        summary: "Upload report bytes (object storage placeholder backed by in-memory store)",
        security: [{ bearerAuth: [] }],
        consumes: ["application/octet-stream", "application/pdf"],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        headers: {
          type: "object",
          properties: { "content-type": { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: { report: { type: "object", additionalProperties: true } },
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as Buffer;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        return reply.status(400).send({
          error: { code: "validation_error", message: "Empty body", details: {} },
          requestId: request.id,
        });
      }
      const ct =
        typeof request.headers["content-type"] === "string"
          ? request.headers["content-type"]
          : "application/octet-stream";
      const updated = putReportBlob(request.auth!.tenantId, id, body, ct);
      if (!updated) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      const v = updated.versionSnapshots[updated.versionSnapshots.length - 1]?.version ?? 1;
      appendReportAuditEvent({
        tenantId: request.auth!.tenantId,
        actorSub: request.auth!.userId,
        action: "report.content_uploaded",
        reportId: id,
        requestId: request.id,
        details: { version: v, byteLength: updated.byteLength ?? 0 },
      });
      return { report: updated };
    },
  );

  app.get(
    "/reports/:id/versions",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary: "List immutable version snapshots (hash, size) for report history",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              versions: { type: "array", items: { type: "object", additionalProperties: true } },
            },
            required: ["versions"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.auth!.tenantId;
      if (!getReportForTenant(id, tenantId)) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      return { versions: listReportVersionsForTenant(id, tenantId) };
    },
  );

  app.get(
    "/reports/:id/versions/:version/content",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary: "Download a specific historical version (when blob still retained)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id", "version"],
          properties: {
            id: { type: "string", format: "uuid" },
            version: { type: "string", pattern: "^[0-9]+$" },
          },
        },
        response: {
          200: { type: "string", format: "binary" },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id, version: verStr } = request.params as { id: string; version: string };
      const version = Number.parseInt(verStr, 10);
      if (!Number.isFinite(version) || version < 1) {
        return reply.status(400).send({
          error: { code: "validation_error", message: "Invalid version", details: {} },
          requestId: request.id,
        });
      }
      const snap = getReportVersionSnapshot(id, request.auth!.tenantId, version);
      if (!snap) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Version not found", details: {} },
          requestId: request.id,
        });
      }
      const buf = getReportBlob(snap.objectKey);
      if (!buf) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Version bytes purged or missing", details: {} },
          requestId: request.id,
        });
      }
      reply.header("content-type", snap.contentType);
      reply.header("content-length", String(buf.byteLength));
      return reply.send(buf);
    },
  );

  app.post(
    "/reports/:id/compare-versions",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary: "Compare two versions (hash equality and size delta) for side-by-side UI",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["versionA", "versionB"],
          properties: {
            versionA: { type: "integer", minimum: 1 },
            versionB: { type: "integer", minimum: 1 },
          },
        },
        response: {
          200: { type: "object", additionalProperties: true },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = compareVersionsBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid body",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      const { id } = request.params as { id: string };
      const tenantId = request.auth!.tenantId;
      const cmp = compareReportVersions(id, tenantId, parsed.data.versionA, parsed.data.versionB);
      if (!cmp.ok) {
        const message =
          cmp.code === "not_found" ? "Report not found" : "One or both versions not found";
        return reply.status(404).send({
          error: { code: cmp.code, message, details: {} },
          requestId: request.id,
        });
      }
      appendReportAuditEvent({
        tenantId,
        actorSub: request.auth!.userId,
        action: "report.versions_compared",
        reportId: id,
        requestId: request.id,
        details: {
          versionA: parsed.data.versionA,
          versionB: parsed.data.versionB,
          identical: cmp.identical,
        },
      });
      return {
        reportId: cmp.reportId,
        identical: cmp.identical,
        sizeDeltaBytes: cmp.sizeDeltaBytes,
        sideBySide: {
          left: {
            version: cmp.versionA.version,
            byteLength: cmp.versionA.byteLength,
            contentType: cmp.versionA.contentType,
            sha256: cmp.versionA.sha256,
            createdAt: cmp.versionA.createdAt,
          },
          right: {
            version: cmp.versionB.version,
            byteLength: cmp.versionB.byteLength,
            contentType: cmp.versionB.contentType,
            sha256: cmp.versionB.sha256,
            createdAt: cmp.versionB.createdAt,
          },
        },
      };
    },
  );

  app.patch(
    "/reports/:id/archive",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary: "Mark report archived (hidden from default list)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { report: { type: "object", additionalProperties: true } },
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const row = setReportArchived(request.auth!.tenantId, id, true);
      if (!row) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      appendReportAuditEvent({
        tenantId: request.auth!.tenantId,
        actorSub: request.auth!.userId,
        action: "report.archived",
        reportId: id,
        requestId: request.id,
      });
      return { report: row };
    },
  );

  app.patch(
    "/reports/:id/unarchive",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary: "Restore archived report to active list",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { report: { type: "object", additionalProperties: true } },
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const row = setReportArchived(request.auth!.tenantId, id, false);
      if (!row) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      appendReportAuditEvent({
        tenantId: request.auth!.tenantId,
        actorSub: request.auth!.userId,
        action: "report.unarchived",
        reportId: id,
        requestId: request.id,
      });
      return { report: row };
    },
  );

  app.patch(
    "/reports/:id/retention",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Reports", "Report history"],
        summary: "Set per-report retention window (days until bytes eligible for sweep)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          required: ["retentionDays"],
          properties: { retentionDays: { type: "integer", minimum: 1, maximum: 3650 } },
        },
        response: {
          200: {
            type: "object",
            properties: { report: { type: "object", additionalProperties: true } },
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = retentionBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid body",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      const { id } = request.params as { id: string };
      const row = setReportRetentionDays(request.auth!.tenantId, id, parsed.data.retentionDays);
      if (!row) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report not found", details: {} },
          requestId: request.id,
        });
      }
      appendReportAuditEvent({
        tenantId: request.auth!.tenantId,
        actorSub: request.auth!.userId,
        action: "report.retention_updated",
        reportId: id,
        requestId: request.id,
        details: { retentionDays: parsed.data.retentionDays },
      });
      return { report: row };
    },
  );

  app.get(
    "/reports/:id/content",
    {
      preHandler: readChain,
      schema: {
        tags: ["Reports"],
        summary: "Download generated report bytes",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: { type: "string", format: "binary" },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const row = getReportForTenant(id, request.auth!.tenantId);
      if (!row || !row.objectKey) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report content not available", details: {} },
          requestId: request.id,
        });
      }
      const buf = getReportBlob(row.objectKey);
      if (!buf) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Report blob missing", details: {} },
          requestId: request.id,
        });
      }
      reply.header("content-type", row.contentType ?? "application/octet-stream");
      reply.header("content-length", String(buf.byteLength));
      return reply.send(buf);
    },
  );
}
