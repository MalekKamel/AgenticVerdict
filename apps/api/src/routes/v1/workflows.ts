import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { recordWorkflowTriggerEnqueued } from "@agenticverdict/observability";
import {
  workflowTriggerJobDataSchema,
  workflowTriggerJobResultSchema,
} from "@agenticverdict/worker";
import { z } from "zod";

import { jwtAuth } from "../../middleware/auth";
import { bindJwtTenantAsyncContext } from "../../middleware/jwt-tenant-context";
import { rateLimit } from "../../middleware/rate-limit";
import {
  enqueueWorkflowTrigger,
  getWorkflowTriggerJobStatus,
  isBullmqConfigured,
} from "../../services/report-bullmq";
import { persistWorkflowArtifactsFromStatus } from "../../services/workflow-status-persistence";
import { isWorkflowTestTriggerAllowed } from "./workflow-trigger-gate";

const triggerBodySchema = workflowTriggerJobDataSchema;
const statusResponseSchema = {
  type: "object",
  properties: {
    executionId: { type: "string" },
    status: {
      type: "string",
      enum: ["completed", "failed", "active", "waiting", "delayed", "paused", "unknown"],
    },
    bullmqState: { type: "string" },
    result: {
      type: "object",
      properties: {
        workflowId: {
          type: "string",
          enum: ["report-generation", "marketing-analysis", "verdict-generation"],
        },
        tenantId: { type: "string" },
        testMode: { type: "boolean" },
        phase: {
          type: "string",
          enum: ["foundation", "report-generation", "marketing-analysis", "verdict-generation"],
        },
        message: { type: "string" },
        analysisId: { type: "string" },
        insights: { type: "array", items: { type: "object", additionalProperties: true } },
        verdict: { type: "object", additionalProperties: true },
        processingMetadata: { type: "object", additionalProperties: true },
      },
      required: ["workflowId", "tenantId", "testMode", "phase", "message"],
      additionalProperties: true,
    },
    error: { type: "string" },
  },
  required: ["executionId", "status", "bullmqState"],
} as const;

const adminRoles = ["admin"] as const;

function replaceAsciiControlChars(value: string): string {
  let sanitized = "";
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) {
      sanitized += character;
      continue;
    }

    // Replace ASCII C0 controls except tab/newline/carriage return.
    if (codePoint <= 0x1f && codePoint !== 0x09 && codePoint !== 0x0a && codePoint !== 0x0d) {
      sanitized += " ";
      continue;
    }

    sanitized += character;
  }
  return sanitized;
}

function sanitizeControlChars(value: unknown): unknown {
  if (typeof value === "string") {
    return replaceAsciiControlChars(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeControlChars(item));
  }
  if (value !== null && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(input)) {
      output[key] = sanitizeControlChars(nested);
    }
    return output;
  }
  return value;
}

export function registerWorkflowRoutes(app: FastifyInstance, redis: Redis | null): void {
  const chain = [
    jwtAuth({ required: true, roles: [...adminRoles] }),
    bindJwtTenantAsyncContext(),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 30, keyPrefix: "v1:workflows" }),
  ];

  app.post(
    "/workflows/trigger",
    {
      preHandler: chain,
      schema: {
        tags: ["Workflows"],
        summary: "Enqueue a workflow run (production-flow testing; BullMQ)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["workflowId", "testMode", "tenantId", "config"],
          properties: {
            workflowId: {
              type: "string",
              enum: ["report-generation", "marketing-analysis", "verdict-generation"],
            },
            testMode: { type: "boolean", enum: [true] },
            tenantId: { type: "string", format: "uuid" },
            config: { type: "object" },
          },
        },
        response: {
          202: {
            type: "object",
            properties: {
              executionId: { type: "string" },
              status: { type: "string", enum: ["queued"] },
              startedAt: { type: "string" },
              estimatedCompletion: { type: "string" },
            },
            required: ["executionId", "status", "startedAt", "estimatedCompletion"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
          500: { type: "object", additionalProperties: true },
          503: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = triggerBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid workflow trigger payload",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      if (parsed.data.testMode !== true) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid workflow trigger payload",
            details: { testMode: ["testMode must be true"] },
          },
          requestId: request.id,
        });
      }

      const { workflowId, tenantId, config } = parsed.data;

      if (!isWorkflowTestTriggerAllowed()) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Workflow test triggers are not available in production builds",
            details: {},
          },
          requestId: request.id,
        });
      }

      if (!isBullmqConfigured()) {
        return reply.status(503).send({
          error: {
            code: "queue_unavailable",
            message: "Set REDIS_URL for BullMQ so the worker can process workflow jobs",
            details: {},
          },
          requestId: request.id,
        });
      }

      try {
        const executionId = await enqueueWorkflowTrigger(
          {
            workflowId,
            testMode: true,
            tenantId,
            config,
            requestId: request.id,
          },
          `workflow-${workflowId}-${randomUUID()}`,
        );

        recordWorkflowTriggerEnqueued(workflowId, tenantId);

        const startedAt = new Date().toISOString();
        return reply.status(202).send({
          executionId,
          status: "queued" as const,
          startedAt,
          estimatedCompletion: new Date(Date.now() + 60_000).toISOString(),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "enqueue_failed";
        if (msg === "queue_unavailable") {
          return reply.status(503).send({
            error: {
              code: "queue_unavailable",
              message: "Set REDIS_URL for BullMQ so the worker can process workflow jobs",
              details: {},
            },
            requestId: request.id,
          });
        }
        request.log.error({ err }, "workflow_trigger_enqueue_failed");
        return reply.status(500).send({
          error: {
            code: "internal_error",
            message: "Failed to enqueue workflow",
            details: {},
          },
          requestId: request.id,
        });
      }
    },
  );

  app.get(
    "/workflows/status/:executionId",
    {
      preHandler: chain,
      schema: {
        tags: ["Workflows"],
        summary: "Poll BullMQ job state for a workflow trigger execution",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["executionId"],
          properties: { executionId: { type: "string" } },
        },
        response: {
          200: statusResponseSchema,
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
      const paramsSchema = z.object({ executionId: z.string().min(1).max(256) });
      const paramsParsed = paramsSchema.safeParse(request.params);
      if (!paramsParsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid execution id",
            details: paramsParsed.error.flatten(),
          },
          requestId: request.id,
        });
      }

      if (!isBullmqConfigured()) {
        return reply.status(503).send({
          error: {
            code: "queue_unavailable",
            message: "Set REDIS_URL for BullMQ status lookups",
            details: {},
          },
          requestId: request.id,
        });
      }

      const snapshot = await getWorkflowTriggerJobStatus(paramsParsed.data.executionId);
      if (!snapshot) {
        return reply.status(404).send({
          error: {
            code: "not_found",
            message: "Execution not found",
            details: {},
          },
          requestId: request.id,
        });
      }

      const body: Record<string, unknown> = {
        executionId: snapshot.executionId,
        status: snapshot.status,
        bullmqState: snapshot.bullmqState,
      };
      if (snapshot.result !== undefined && snapshot.result !== null) {
        const parsedResult = workflowTriggerJobResultSchema.safeParse(snapshot.result);
        if (parsedResult.success) {
          await persistWorkflowArtifactsFromStatus(snapshot);
          body.result = sanitizeControlChars(parsedResult.data);
        } else {
          request.log.warn(
            {
              executionId: snapshot.executionId,
              issues: parsedResult.error.issues,
            },
            "workflow_status_result_validation_skipped",
          );
        }
      }
      if (snapshot.error !== undefined) {
        body.error = snapshot.error;
      }
      return reply.send(body);
    },
  );
}
