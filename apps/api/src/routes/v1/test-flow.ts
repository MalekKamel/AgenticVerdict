import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { z } from "zod";

import {
  recordScenarioAssertion,
  recordScenarioDurationSeconds,
} from "@agenticverdict/observability";

import { jwtAuth } from "../../middleware/auth";
import { bindJwtTenantAsyncContext } from "../../middleware/jwt-tenant-context";
import { rateLimit } from "../../middleware/rate-limit";
import {
  getWorkflowTriggerJobStatus,
  isBullmqConfigured,
  type WorkflowTriggerJobState,
} from "../../services/report-bullmq";

const adminRoles = ["admin"] as const;

const scenarioCategorySchema = z.enum([
  "generation",
  "integration",
  "delivery",
  "scheduling",
  "system",
]);

const telemetryScenarioBodySchema = z.object({
  scenarioId: z.string().min(1).max(64),
  category: scenarioCategorySchema,
  outcome: z.enum(["passed", "failed"]),
  durationSeconds: z.number().finite().nonnegative(),
});

const telemetryAssertionBodySchema = z.object({
  scenarioId: z.string().min(1).max(64),
  assertionType: z.string().min(1).max(64),
  result: z.enum(["passed", "failed"]),
});

function mapAggregateStatus(state: WorkflowTriggerJobState): "completed" | "failed" | "running" {
  if (state === "completed") {
    return "completed";
  }
  if (state === "failed") {
    return "failed";
  }
  return "running";
}

export function registerTestFlowRoutes(app: FastifyInstance, redis: Redis | null): void {
  const adminChain = [
    jwtAuth({ required: true, roles: [...adminRoles] }),
    bindJwtTenantAsyncContext(),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 120, keyPrefix: "v1:test-flow" }),
  ];

  app.get(
    "/test/results/:executionId",
    {
      preHandler: adminChain,
      schema: {
        tags: ["Production-flow testing"],
        summary: "Aggregated execution snapshot for production-flow validation",
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
            code: "VALIDATION_FAILED",
            message: "Invalid execution id",
            details: paramsParsed.error.flatten(),
          },
          requestId: request.id,
        });
      }

      if (!isBullmqConfigured()) {
        return reply.status(503).send({
          error: {
            code: "QUEUE_UNAVAILABLE",
            message: "Set REDIS_URL for BullMQ execution lookups",
            details: {},
          },
          requestId: request.id,
        });
      }

      const snapshot = await getWorkflowTriggerJobStatus(paramsParsed.data.executionId);
      if (!snapshot) {
        return reply.status(404).send({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Execution not found",
            details: {},
          },
          requestId: request.id,
        });
      }

      const status = mapAggregateStatus(snapshot.status);
      const durationMs = snapshot.durationMs;
      const errors =
        snapshot.status === "failed" && snapshot.error ? [{ message: snapshot.error }] : undefined;

      const wfResult = snapshot.result;
      const reportGenerationDurationMs =
        wfResult &&
        typeof wfResult === "object" &&
        "reportGenerationDurationMs" in wfResult &&
        typeof (wfResult as { reportGenerationDurationMs: unknown }).reportGenerationDurationMs ===
          "number"
          ? Math.max(
              0,
              Math.round(
                (wfResult as { reportGenerationDurationMs: number }).reportGenerationDurationMs,
              ),
            )
          : 0;

      return reply.send({
        executionId: snapshot.executionId,
        status,
        bullmqState: snapshot.bullmqState,
        workflowStatus: snapshot.status,
        durationMs,
        queuedAtMs: snapshot.queuedAtMs,
        startedAtMs: snapshot.startedAtMs,
        finishedAtMs: snapshot.finishedAtMs,
        metrics: {
          llmCalls: 0,
          llmDurationMs: 0,
          platformFetchCount: 0,
          platformFetchDurationMs: 0,
          reportGenerationDurationMs,
        },
        logs: [] as { level: string; message: string; timestamp?: string }[],
        result: snapshot.result,
        errors,
      });
    },
  );

  app.post(
    "/test/telemetry/scenario",
    {
      preHandler: adminChain,
      schema: {
        tags: ["Production-flow testing"],
        summary: "Record scenario timing for Prometheus (orchestrator)",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["scenarioId", "category", "outcome", "durationSeconds"],
          properties: {
            scenarioId: { type: "string" },
            category: { type: "string" },
            outcome: { type: "string", enum: ["passed", "failed"] },
            durationSeconds: { type: "number" },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = telemetryScenarioBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_FAILED",
            message: "Invalid telemetry payload",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      const { scenarioId, category, outcome, durationSeconds } = parsed.data;
      recordScenarioDurationSeconds({
        scenarioId,
        category,
        status: outcome,
        durationSeconds,
      });
      return reply.code(204).send();
    },
  );

  app.post(
    "/test/telemetry/assertion",
    {
      preHandler: adminChain,
      schema: {
        tags: ["Production-flow testing"],
        summary: "Record a single assertion outcome for Prometheus",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["scenarioId", "assertionType", "result"],
          properties: {
            scenarioId: { type: "string" },
            assertionType: { type: "string" },
            result: { type: "string", enum: ["passed", "failed"] },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = telemetryAssertionBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_FAILED",
            message: "Invalid telemetry payload",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      recordScenarioAssertion(parsed.data);
      return reply.code(204).send();
    },
  );
}
