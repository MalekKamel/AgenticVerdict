import { randomUUID } from "node:crypto";

import Fastify, { type FastifyInstance } from "fastify";

import { createUpstashRedisFromEnv } from "@agenticverdict/database";
import { createPinoLogger, renderProductionFlowTestMetrics } from "@agenticverdict/observability";

import { registerRequestAccessLogging } from "./middleware/request-logging";

import { registerSwagger, registerSwaggerUi } from "./openapi";
import { registerAnalysisResultRoutes } from "./routes/v1/analysis-results";
import { registerInsightRoutes } from "./routes/v1/insights";
import { registerReportRoutes } from "./routes/v1/reports";
import { registerReportScheduleRoutes } from "./routes/v1/report-schedules";
import { registerReportTemplateRoutes } from "./routes/v1/report-templates";
import { registerTranslationRoutes } from "./routes/v1/translations";
import { registerTestFlowRoutes } from "./routes/v1/test-flow";
import { registerValidationRoutes } from "./routes/v1/validation";
import { registerVerdictRoutes } from "./routes/v1/verdicts";
import { registerWorkflowRoutes } from "./routes/v1/workflows";
import "./middleware/jwt-tenant-context";
import { registerTenantAlsRouteWrapping } from "./middleware/tenant-route-als";

export async function buildApiServer(): Promise<FastifyInstance> {
  const redis = createUpstashRedisFromEnv();
  const app = Fastify({
    ...(process.env.VITEST === "true"
      ? { logger: false }
      : { loggerInstance: createPinoLogger("api") }),
    genReqId: () => randomUUID(),
  });

  const binaryBodyParser = (
    _request: unknown,
    body: Buffer,
    done: (err: Error | null, body?: Buffer) => void,
  ): void => {
    if (!Buffer.isBuffer(body)) {
      done(new Error("Expected buffer body"));
      return;
    }
    done(null, body);
  };
  for (const mime of ["application/octet-stream", "application/pdf"] as const) {
    app.addContentTypeParser(mime, { parseAs: "buffer" }, binaryBodyParser);
  }

  await registerSwagger(app);

  app.get(
    "/metrics",
    {
      schema: {
        tags: ["Metrics"],
        summary: "Prometheus metrics (production-flow test instrumentation)",
        response: { 200: { type: "string" } },
      },
    },
    async (_request, reply) => {
      const body = await renderProductionFlowTestMetrics();
      return reply.type("text/plain; version=0.0.4; charset=utf-8").send(body);
    },
  );

  const healthResponseSchema = {
    200: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        service: { type: "string" },
      },
      required: ["ok", "service"],
    },
  } as const;

  const healthHandler = async () => ({ ok: true as const, service: "@agenticverdict/api" });

  for (const path of ["/health", "/api/health"] as const) {
    app.get(
      path,
      {
        schema: {
          tags: ["Health"],
          summary: "Liveness probe",
          description:
            path === "/health"
              ? "Kubernetes/Docker-style liveness check (no authentication). Same response as GET /api/health."
              : "Same as GET /health; for load balancers or scripts that probe under /api.",
          response: healthResponseSchema,
        },
      },
      healthHandler,
    );
  }

  await app.register(
    async (scope) => {
      registerRequestAccessLogging(scope);
      registerTenantAlsRouteWrapping(scope);

      registerInsightRoutes(scope, redis);
      registerVerdictRoutes(scope, redis);
      registerAnalysisResultRoutes(scope, redis);
      registerReportRoutes(scope, redis);
      registerReportScheduleRoutes(scope, redis);
      registerReportTemplateRoutes(scope, redis);
      registerTranslationRoutes(scope, redis);
      registerValidationRoutes(scope, redis);
      registerWorkflowRoutes(scope, redis);
      registerTestFlowRoutes(scope, redis);
    },
    { prefix: "/api/v1" },
  );

  await registerSwaggerUi(app);

  return app;
}
