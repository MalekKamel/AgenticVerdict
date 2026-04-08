import { randomUUID } from "node:crypto";

import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { recordWorkflowTriggerEnqueued } from "@agenticverdict/observability";
import { z } from "zod";

import { jwtAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rate-limit";
import {
  enqueueWorkflowTrigger,
  getWorkflowTriggerJobStatus,
  isBullmqConfigured,
} from "../../services/report-bullmq";
import { isWorkflowTestTriggerAllowed } from "./workflow-trigger-gate";

const workflowIdSchema = z.enum(["report-generation", "marketing-analysis", "verdict-generation"]);

const triggerBodySchema = z.object({
  workflowId: workflowIdSchema,
  testMode: z.literal(true),
  tenantId: z.string().uuid(),
  config: z.object({
    dateRange: z
      .object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      })
      .optional(),
    platforms: z.array(z.string().min(1).max(64)).optional(),
    mockData: z
      .object({
        scenario: z.enum(["normal", "high-volume", "zero-conversions", "error"]),
        seed: z.number().int(),
      })
      .optional(),
    productionFlowScenarioId: z
      .enum(["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08", "R09", "R10", "R11", "R12"])
      .optional(),
  }),
});

const adminRoles = ["admin"] as const;

export function registerWorkflowRoutes(app: FastifyInstance, redis: Redis | null): void {
  const chain = [
    jwtAuth({ required: true, roles: [...adminRoles] }),
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
      if (snapshot.result !== undefined) {
        body.result = snapshot.result;
      }
      if (snapshot.error !== undefined) {
        body.error = snapshot.error;
      }
      return reply.send(body);
    },
  );
}
