import { randomUUID } from "node:crypto";

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify, { type FastifyInstance } from "fastify";
import { toHttpErrorResponse } from "@agenticverdict/core";

import { createUpstashRedisFromEnv } from "@agenticverdict/database";
import { createPinoLogger, renderProductionFlowTestMetrics } from "@agenticverdict/observability";
import { getObjectStorage } from "@agenticverdict/core/storage";

const logger = createPinoLogger("api");

import { registerRequestAccessLogging } from "./middleware/request-logging";

import { registerSwagger, registerSwaggerUi } from "./openapi";
import { registerAnalysisResultRoutes } from "./routes/v1/analysis-results";
import { registerInsightRoutes } from "./routes/v1/insights";
import { registerReportRoutes } from "./routes/v1/reports";
import { registerReportTemplateRoutes } from "./routes/v1/report-templates";
import { registerTranslationRoutes } from "./routes/v1/translations";
import { registerTestFlowRoutes } from "./routes/v1/test-flow";
import { registerTelemetryIngestRoutes } from "./routes/v1/telemetry-ingest";
import { registerValidationRoutes } from "./routes/v1/validation";
import { registerVerdictRoutes } from "./routes/v1/verdicts";
import { registerWorkflowRoutes } from "./routes/v1/workflows";
import "./middleware/jwt-tenant-context";
import { registerTenantAlsRouteWrapping } from "./middleware/tenant-route-als";
import { runTenantRlsStartupCheck } from "./startup/tenant-rls-startup-check";
import { registerTrpc } from "./trpc/register-fastify";
import { recoverSchedules } from "@agenticverdict/worker";

/**
 * Swagger plugins use Fastify's default `FastifyBaseLogger` generic; this server uses Pino's `Logger`
 * for `loggerInstance`. Cast at the Swagger boundary only (see `@fastify/swagger` typings).
 */
export async function buildApiServer(): Promise<FastifyInstance> {
  await runTenantRlsStartupCheck();
  try {
    await recoverSchedules();
  } catch (error) {
    logger.warn(
      { err: error },
      "[schedule-recovery] Recovery failed during API startup (non-fatal)",
    );
  }
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

  const explicitCorsOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const localCorsOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
  ];
  const allowlistedOrigins = new Set<string>([...localCorsOrigins, ...explicitCorsOrigins]);

  await app.register(cors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin(origin, callback) {
      if (!origin || allowlistedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === "production" ? undefined : false,
  });

  await registerSwagger(app as unknown as FastifyInstance);

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
        storage: {
          type: "object",
          properties: {
            healthy: { type: "boolean" },
            provider: { type: "string" },
          },
        },
      },
      required: ["ok", "service"],
    },
  } as const;

  const healthHandler = async () => {
    const storage = getObjectStorage();
    let storageHealthy = false;
    try {
      storageHealthy = await storage.isHealthy();
    } catch {
      storageHealthy = false;
    }
    const provider = process.env.STORAGE_PROVIDER ?? "memory";

    return {
      ok: true as const,
      service: "@agenticverdict/api",
      storage: {
        healthy: storageHealthy,
        provider,
      },
    };
  };

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
      registerReportTemplateRoutes(scope, redis);
      registerTranslationRoutes(scope, redis);
      registerValidationRoutes(scope, redis);
      registerWorkflowRoutes(scope, redis);
      registerTestFlowRoutes(scope, redis);
      registerTelemetryIngestRoutes(scope, redis);
      await registerTrpc(scope);
    },
    { prefix: "/api/v1" },
  );

  await registerSwaggerUi(app as unknown as FastifyInstance);

  app.setErrorHandler((error, request, reply) => {
    const translated = toHttpErrorResponse(error, request.id);
    void reply.status(translated.statusCode).send(translated.body);
  });

  return app as unknown as FastifyInstance;
}
