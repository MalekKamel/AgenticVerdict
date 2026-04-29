import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";

import { jwtAuth } from "../../middleware/auth";
import { bindJwtTenantAsyncContext } from "../../middleware/jwt-tenant-context";
import { rateLimit } from "../../middleware/rate-limit";
import {
  getTenantAnalysisBundle,
  getTenantAnalysisProvenanceWithFallback,
  listTenantInsights,
} from "../../services/analysis-repository";

export function registerAnalysisResultRoutes(app: FastifyInstance, redis: Redis | null): void {
  const preHandlers = [
    jwtAuth({ required: true }),
    bindJwtTenantAsyncContext(),
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
          error: { code: "AUTH_UNAUTHORIZED", message: "errors.auth.unauthorized", details: {} },
          requestId: request.id,
        });
      }

      const { id } = request.params;
      const bundle = getTenantAnalysisBundle(tenantId, id);
      if (!bundle) {
        // Keep fallback behavior for fresh tenants without persisted workflow runs yet.
        const seeded = listTenantInsights(tenantId);
        if (seeded.length > 0) {
          return reply.status(404).send({
            error: { code: "RESOURCE_NOT_FOUND", message: "errors.common.notFound", details: {} },
            requestId: request.id,
          });
        }
        return reply.status(404).send({
          error: { code: "RESOURCE_NOT_FOUND", message: "errors.common.notFound", details: {} },
          requestId: request.id,
        });
      }

      const provenance = await getTenantAnalysisProvenanceWithFallback(tenantId, id);
      return reply.send({
        ...bundle,
        provenance: provenance ?? bundle.provenance,
      });
    },
  );
}
