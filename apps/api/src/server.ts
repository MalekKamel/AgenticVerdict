import { randomUUID } from "node:crypto";

import Fastify, { type FastifyInstance } from "fastify";

import { createUpstashRedisFromEnv } from "@agenticverdict/database";

import { registerSwagger, registerSwaggerUi } from "./openapi";
import { registerAnalysisResultRoutes } from "./routes/v1/analysis-results";
import { registerInsightRoutes } from "./routes/v1/insights";
import { registerReportRoutes } from "./routes/v1/reports";
import { registerReportScheduleRoutes } from "./routes/v1/report-schedules";
import { registerReportTemplateRoutes } from "./routes/v1/report-templates";
import { registerTranslationRoutes } from "./routes/v1/translations";
import { registerValidationRoutes } from "./routes/v1/validation";
import { registerVerdictRoutes } from "./routes/v1/verdicts";

export async function buildApiServer(): Promise<FastifyInstance> {
  const redis = createUpstashRedisFromEnv();
  const app = Fastify({
    logger: process.env.VITEST === "true" ? false : true,
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
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Liveness probe",
        response: {
          200: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              service: { type: "string" },
            },
            required: ["ok", "service"],
          },
        },
      },
    },
    async () => ({ ok: true as const, service: "@agenticverdict/api" }),
  );

  await app.register(
    async (scope) => {
      registerInsightRoutes(scope, redis);
      registerVerdictRoutes(scope, redis);
      registerAnalysisResultRoutes(scope, redis);
      registerReportRoutes(scope, redis);
      registerReportScheduleRoutes(scope, redis);
      registerReportTemplateRoutes(scope, redis);
      registerTranslationRoutes(scope, redis);
      registerValidationRoutes(scope, redis);
    },
    { prefix: "/api/v1" },
  );

  await registerSwaggerUi(app);

  return app;
}
