import { randomUUID } from "node:crypto";

import Fastify, { type FastifyInstance } from "fastify";

import { createUpstashRedisFromEnv } from "@agenticverdict/database";

import { registerSwagger, registerSwaggerUi } from "./openapi";
import { registerAnalysisResultRoutes } from "./routes/v1/analysis-results";
import { registerInsightRoutes } from "./routes/v1/insights";
import { registerValidationRoutes } from "./routes/v1/validation";
import { registerVerdictRoutes } from "./routes/v1/verdicts";

export async function buildApiServer(): Promise<FastifyInstance> {
  const redis = createUpstashRedisFromEnv();
  const app = Fastify({
    logger: process.env.VITEST === "true" ? false : true,
    genReqId: () => randomUUID(),
  });

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
      registerValidationRoutes(scope, redis);
    },
    { prefix: "/api/v1" },
  );

  await registerSwaggerUi(app);

  return app;
}
