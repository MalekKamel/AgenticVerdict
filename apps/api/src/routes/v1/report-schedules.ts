import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { z } from "zod";

import { jwtAuth } from "../../middleware/auth";
import { requireAnyRole } from "../../middleware/report-rbac";
import { rateLimit } from "../../middleware/rate-limit";
import { recordDeliveryEvent } from "../../services/delivery-analytics-store";
import {
  isBullmqConfigured,
  registerScheduleRepeatableJob,
  unregisterScheduleRepeatableJob,
} from "../../services/report-bullmq";
import {
  createScheduleRecord,
  deleteScheduleRecord,
  findEnabledScheduleConflict,
  getScheduleForTenant,
  isValidCronExpression,
  listSchedulesForTenant,
  updateScheduleRecord,
  type ReportScheduleRecord,
} from "../../services/schedule-store";

const readRoles = ["analyst", "reports:read"] as const;
const writeRoles = ["reports:write", "admin"] as const;

const postBodySchema = z.object({
  cronExpression: z.string().min(1).max(128),
  templateId: z.string().min(1).max(256),
  format: z.enum(["pdf", "docx", "xlsx"]),
  enabled: z.boolean().optional().default(true),
  locale: z.string().max(32).optional(),
  textDirection: z.enum(["ltr", "rtl"]).optional(),
});

const patchBodySchema = z
  .object({
    cronExpression: z.string().min(1).max(128).optional(),
    templateId: z.string().min(1).max(256).optional(),
    format: z.enum(["pdf", "docx", "xlsx"]).optional(),
    enabled: z.boolean().optional(),
    locale: z.string().max(32).optional(),
    textDirection: z.enum(["ltr", "rtl"]).optional(),
  })
  .strict();

async function refreshRepeatableForRow(row: ReportScheduleRecord): Promise<void> {
  if (!isBullmqConfigured()) {
    return;
  }
  await unregisterScheduleRepeatableJob(row.id);
  if (row.enabled) {
    await registerScheduleRepeatableJob(row);
    recordDeliveryEvent({
      tenantId: row.tenantId,
      type: "schedule_registered",
      scheduleId: row.id,
      meta: { cronExpression: row.cronExpression, templateId: row.templateId },
    });
  }
}

export function registerReportScheduleRoutes(app: FastifyInstance, redis: Redis | null): void {
  const readChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...readRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 120, keyPrefix: "v1:report-schedules:read" }),
  ];

  const writeChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...writeRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 60, keyPrefix: "v1:report-schedules:write" }),
  ];

  app.get(
    "/report-schedules",
    {
      preHandler: readChain,
      schema: {
        tags: ["Report schedules"],
        summary: "List cron report schedules for the tenant",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              schedules: { type: "array", items: { type: "object", additionalProperties: true } },
              bullmqConfigured: { type: "boolean" },
            },
            required: ["schedules", "bullmqConfigured"],
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
        schedules: listSchedulesForTenant(tenantId),
        bullmqConfigured: isBullmqConfigured(),
      };
    },
  );

  app.post(
    "/report-schedules",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Report schedules"],
        summary: "Create a report schedule (optional BullMQ repeatable job when REDIS_URL is set)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cronExpression", "templateId", "format"],
          properties: {
            cronExpression: { type: "string" },
            templateId: { type: "string" },
            format: { type: "string", enum: ["pdf", "docx", "xlsx"] },
            enabled: { type: "boolean" },
            locale: { type: "string" },
            textDirection: { type: "string", enum: ["ltr", "rtl"] },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              schedule: { type: "object", additionalProperties: true },
              repeatableRegistered: { type: "boolean" },
            },
            required: ["schedule", "repeatableRegistered"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          409: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = postBodySchema.safeParse(request.body);
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
      if (!isValidCronExpression(parsed.data.cronExpression)) {
        return reply.status(400).send({
          error: {
            code: "invalid_cron",
            message:
              "cronExpression must be five space-separated fields (minute hour day month weekday)",
            details: {},
          },
          requestId: request.id,
        });
      }
      const tenantId = request.auth!.tenantId;
      const conflict = findEnabledScheduleConflict(
        tenantId,
        parsed.data.cronExpression,
        parsed.data.templateId,
      );
      if (conflict) {
        return reply.status(409).send({
          error: {
            code: "schedule_conflict",
            message: "An enabled schedule already exists for this cron template pair",
            details: { existingScheduleId: conflict.id },
          },
          requestId: request.id,
        });
      }
      const row = createScheduleRecord(tenantId, parsed.data);
      let repeatableRegistered = false;
      if (row.enabled && isBullmqConfigured()) {
        try {
          await registerScheduleRepeatableJob(row);
          repeatableRegistered = true;
          recordDeliveryEvent({
            tenantId,
            type: "schedule_registered",
            scheduleId: row.id,
            meta: { cronExpression: row.cronExpression, templateId: row.templateId },
          });
        } catch {
          repeatableRegistered = false;
        }
      }
      return reply.status(201).send({ schedule: row, repeatableRegistered });
    },
  );

  app.patch(
    "/report-schedules/:id",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Report schedules"],
        summary: "Update a schedule and refresh the BullMQ repeatable job when Redis is configured",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        body: { type: "object", additionalProperties: true },
        response: {
          200: {
            type: "object",
            properties: {
              schedule: { type: "object", additionalProperties: true },
              repeatableRegistered: { type: "boolean" },
            },
            required: ["schedule", "repeatableRegistered"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          404: { type: "object", additionalProperties: true },
          409: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.auth!.tenantId;
      const parsed = patchBodySchema.safeParse(request.body);
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
      const existing = getScheduleForTenant(id, tenantId);
      if (!existing) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Schedule not found", details: {} },
          requestId: request.id,
        });
      }
      if (
        parsed.data.cronExpression !== undefined &&
        !isValidCronExpression(parsed.data.cronExpression)
      ) {
        return reply.status(400).send({
          error: {
            code: "invalid_cron",
            message: "cronExpression must be five space-separated fields",
            details: {},
          },
          requestId: request.id,
        });
      }
      const nextCron = parsed.data.cronExpression ?? existing.cronExpression;
      const nextTemplate = parsed.data.templateId ?? existing.templateId;
      const nextEnabled = parsed.data.enabled ?? existing.enabled;
      if (nextEnabled) {
        const conflict = findEnabledScheduleConflict(tenantId, nextCron, nextTemplate, id);
        if (conflict) {
          return reply.status(409).send({
            error: {
              code: "schedule_conflict",
              message: "Another enabled schedule already uses this cron template pair",
              details: { existingScheduleId: conflict.id },
            },
            requestId: request.id,
          });
        }
      }
      const updated = updateScheduleRecord(id, tenantId, parsed.data);
      if (!updated) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Schedule not found", details: {} },
          requestId: request.id,
        });
      }
      let repeatableRegistered = false;
      if (isBullmqConfigured()) {
        await refreshRepeatableForRow(updated);
        repeatableRegistered = updated.enabled;
      }
      return { schedule: updated, repeatableRegistered };
    },
  );

  app.delete(
    "/report-schedules/:id",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Report schedules"],
        summary: "Delete a schedule and remove its repeatable BullMQ job",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: { type: "null" },
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
      const row = getScheduleForTenant(id, tenantId);
      if (!row) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Schedule not found", details: {} },
          requestId: request.id,
        });
      }
      if (isBullmqConfigured()) {
        await unregisterScheduleRepeatableJob(id);
        recordDeliveryEvent({
          tenantId,
          type: "schedule_removed",
          scheduleId: id,
        });
      }
      deleteScheduleRecord(id, tenantId);
      return reply.status(204).send();
    },
  );
}
