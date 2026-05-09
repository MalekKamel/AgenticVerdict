import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { recordWorkflowTriggerEnqueued } from "@agenticverdict/observability";
import { AppFault, toHttpErrorResponse } from "@agenticverdict/core";
import {
  workflowTriggerJobDataSchema,
  workflowTriggerJobResultSchema,
} from "@agenticverdict/types";
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

function isWorkflowTriggerStatusCode(
  statusCode: number,
): statusCode is 202 | 400 | 401 | 403 | 429 | 500 | 503 {
  return (
    statusCode === 202 ||
    statusCode === 400 ||
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 429 ||
    statusCode === 500 ||
    statusCode === 503
  );
}

function isWorkflowStatusStatusCode(
  statusCode: number,
): statusCode is 200 | 400 | 401 | 403 | 404 | 429 | 503 {
  return (
    statusCode === 200 ||
    statusCode === 400 ||
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 404 ||
    statusCode === 429 ||
    statusCode === 503
  );
}

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

function sendCanonicalFault(
  requestId: string,
  fault: AppFault,
): { statusCode: number; body: ReturnType<typeof toHttpErrorResponse>["body"] } {
  return toHttpErrorResponse(fault, requestId);
}

function toSafeWorkflowFailureMessage(error: unknown): string {
  if (typeof error === "string" && error.length > 0) {
    return replaceAsciiControlChars(error);
  }
  return "errors.common.unknownError";
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
        const translated = sendCanonicalFault(
          request.id,
          new AppFault({
            code: "VALIDATION_FAILED",
            category: "validation",
            httpStatus: 400,
            retryable: false,
            safeMessage: "errors.validation.failed",
            details: { validation: parsed.error.flatten() },
            surface: "http",
          }),
        );
        return reply.status(400).send(translated.body);
      }
      if (parsed.data.testMode !== true) {
        const translated = sendCanonicalFault(
          request.id,
          new AppFault({
            code: "VALIDATION_FAILED",
            category: "validation",
            httpStatus: 400,
            retryable: false,
            safeMessage: "errors.validation.failed",
            details: { testMode: ["testMode must be true"] },
            surface: "http",
          }),
        );
        return reply.status(400).send(translated.body);
      }

      const authTenantId = request.auth!.tenantId;
      const { workflowId, config } = parsed.data;
      if (parsed.data.tenantId !== authTenantId) {
        const translated = sendCanonicalFault(
          request.id,
          new AppFault({
            code: "TENANT_MISMATCH",
            category: "tenant",
            httpStatus: 403,
            retryable: false,
            safeMessage: "errors.tenantMismatch",
            details: {
              expectedTenantId: authTenantId,
              providedTenantId: parsed.data.tenantId,
            },
            surface: "http",
          }),
        );
        return reply.status(403).send(translated.body);
      }

      if (!isWorkflowTestTriggerAllowed()) {
        const translated = sendCanonicalFault(
          request.id,
          new AppFault({
            code: "VALIDATION_FAILED",
            category: "validation",
            httpStatus: 400,
            retryable: false,
            safeMessage: "errors.validation.failed",
            surface: "http",
          }),
        );
        return reply.status(400).send(translated.body);
      }

      if (!isBullmqConfigured()) {
        const translated = toHttpErrorResponse(
          new AppFault({
            code: "QUEUE_UNAVAILABLE",
            category: "dependency",
            httpStatus: 503,
            retryable: true,
            safeMessage: "errors.server.serviceUnavailable",
            surface: "queue",
          }),
          request.id,
        );
        const statusCode = isWorkflowTriggerStatusCode(translated.statusCode)
          ? translated.statusCode
          : 503;
        return reply.status(statusCode).send(translated.body);
      }

      try {
        const executionId = await enqueueWorkflowTrigger(
          {
            workflowId,
            testMode: true,
            tenantId: authTenantId,
            config,
            requestId: request.id,
          },
          `workflow-${workflowId}-${randomUUID()}`,
        );

        recordWorkflowTriggerEnqueued(workflowId, authTenantId);

        const startedAt = new Date().toISOString();
        return reply.status(202).send({
          executionId,
          status: "queued" as const,
          startedAt,
          estimatedCompletion: new Date(Date.now() + 60_000).toISOString(),
        });
      } catch (err) {
        request.log.error({ err }, "workflow_trigger_enqueue_failed");
        const translated = toHttpErrorResponse(err, request.id);
        const statusCode = isWorkflowTriggerStatusCode(translated.statusCode)
          ? translated.statusCode
          : 500;
        return reply.status(statusCode).send(translated.body);
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
        const translated = sendCanonicalFault(
          request.id,
          new AppFault({
            code: "VALIDATION_FAILED",
            category: "validation",
            httpStatus: 400,
            retryable: false,
            safeMessage: "errors.validation.failed",
            details: { validation: paramsParsed.error.flatten() },
            surface: "http",
          }),
        );
        return reply.status(400).send(translated.body);
      }

      if (!isBullmqConfigured()) {
        const translated = toHttpErrorResponse(
          new AppFault({
            code: "QUEUE_UNAVAILABLE",
            category: "dependency",
            httpStatus: 503,
            retryable: true,
            safeMessage: "errors.server.serviceUnavailable",
            surface: "queue",
          }),
          request.id,
        );
        const statusCode = isWorkflowStatusStatusCode(translated.statusCode)
          ? translated.statusCode
          : 503;
        return reply.status(statusCode).send(translated.body);
      }

      const snapshot = await getWorkflowTriggerJobStatus(paramsParsed.data.executionId);
      if (!snapshot) {
        return reply.status(404).send({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "errors.common.notFound",
            details: {},
          },
          requestId: request.id,
        });
      }
      const ownerTenantId = snapshot.tenantId ?? snapshot.result?.tenantId;
      if (!ownerTenantId || ownerTenantId !== request.auth!.tenantId) {
        const translated = sendCanonicalFault(
          request.id,
          new AppFault({
            code: "TENANT_MISMATCH",
            category: "tenant",
            httpStatus: 403,
            retryable: false,
            safeMessage: "errors.tenantMismatch",
            details: { executionId: snapshot.executionId },
            surface: "http",
          }),
        );
        return reply.status(403).send(translated.body);
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
        body.error = toSafeWorkflowFailureMessage(snapshot.error);
      }
      return reply.send(body);
    },
  );
}
