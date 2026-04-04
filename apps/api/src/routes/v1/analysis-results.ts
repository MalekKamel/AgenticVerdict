import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";

import { jwtAuth } from "../../middleware/auth";
import { rateLimit } from "../../middleware/rate-limit";
import {
  ensureTenantAnalysisStore,
  getAnalysisBundleForTenant,
} from "../../services/analysis-store";

export function registerAnalysisResultRoutes(app: FastifyInstance, redis: Redis | null): void {
  const preHandlers = [
    jwtAuth({ required: true }),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 60, keyPrefix: "v1:analysis-results" }),
  ];

  app.get<{ Params: { id: string } }>(
    "/analysis-results/:id",
    {
      preHandler: preHandlers,
      schema: {
        tags: ["Analysis"],
        summary: "Get a single analysis bundle (insights, verdicts, provenance)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            additionalProperties: true,
            description: "AnalysisResultResponse",
          },
          401: { type: "object", additionalProperties: true },
          404: {
            type: "object",
            properties: {
              error: { type: "object", additionalProperties: true },
              requestId: { type: "string" },
            },
          },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const tenantId = request.auth?.tenantId;
      if (!tenantId) {
        return reply.status(401).send({
          error: { code: "unauthorized", message: "Unauthorized", details: {} },
          requestId: request.id,
        });
      }

      const { id } = request.params;
      ensureTenantAnalysisStore(tenantId);
      const bundle = getAnalysisBundleForTenant(tenantId, id);
      if (!bundle) {
        return reply.status(404).send({
          error: { code: "not_found", message: "Analysis result not found", details: {} },
          requestId: request.id,
        });
      }

      return reply.send(bundle);
    },
  );
}
