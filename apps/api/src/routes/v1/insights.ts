import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { z } from "zod";

import type { GeneratedInsight } from "@agenticverdict/types";

import { jwtAuth } from "../../middleware/auth";
import { bindJwtTenantAsyncContext } from "../../middleware/jwt-tenant-context";
import { rateLimit } from "../../middleware/rate-limit";
import { listTenantInsights } from "../../services/analysis-repository";
import { readJsonCache, stableQueryKey, writeJsonCache } from "../../services/response-cache";

const insightQuerySchema = z.object({
  type: z.enum(["anomaly", "trend", "opportunity", "warning"]).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  minRelevance: z.coerce.number().min(0).max(1).optional(),
  sort: z.enum(["relevance", "created", "confidence"]).optional().default("relevance"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export function registerInsightRoutes(app: FastifyInstance, redis: Redis | null): void {
  const preHandlers = [
    jwtAuth({ required: true }),
    bindJwtTenantAsyncContext(),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 100, keyPrefix: "v1:insights" }),
  ];

  app.get(
    "/insights",
    {
      preHandler: preHandlers,
      schema: {
        tags: ["Insights"],
        summary: "List insights for the authenticated tenant",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["anomaly", "trend", "opportunity", "warning"] },
            minConfidence: { type: "number", minimum: 0, maximum: 1 },
            minRelevance: { type: "number", minimum: 0, maximum: 1 },
            sort: {
              type: "string",
              enum: ["relevance", "created", "confidence"],
              default: "relevance",
            },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
            offset: { type: "integer", minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            description: "Paged insights",
            type: "object",
            properties: {
              insights: { type: "array", items: { type: "object", additionalProperties: true } },
              total: { type: "integer" },
              limit: { type: "integer" },
              offset: { type: "integer" },
            },
            required: ["insights", "total", "limit", "offset"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = insightQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }

      const tenantId = request.auth?.tenantId;
      if (!tenantId) {
        return reply.status(401).send({
          error: { code: "unauthorized", message: "Unauthorized", details: {} },
          requestId: request.id,
        });
      }

      const q = parsed.data;
      const cacheKey = `cache:v1:insights:${tenantId}:${stableQueryKey(q as Record<string, unknown>)}`;
      const cached = await readJsonCache<{
        insights: GeneratedInsight[];
        total: number;
        limit: number;
        offset: number;
      }>(redis, cacheKey);
      if (cached) {
        return reply.send(cached);
      }

      let rows = listTenantInsights(tenantId);

      if (q.type) {
        rows = rows.filter((i) => i.type === q.type);
      }
      const minConfidence = q.minConfidence;
      if (minConfidence !== undefined) {
        rows = rows.filter((i) => i.confidence >= minConfidence);
      }
      const minRelevance = q.minRelevance;
      if (minRelevance !== undefined) {
        rows = rows.filter((i) => i.relevanceScore >= minRelevance);
      }

      const sorted = [...rows];
      if (q.sort === "relevance") {
        sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
      } else if (q.sort === "confidence") {
        sorted.sort((a, b) => b.confidence - a.confidence);
      } else {
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      const total = sorted.length;
      const page = sorted.slice(q.offset, q.offset + q.limit);

      const body = {
        insights: page,
        total,
        limit: q.limit,
        offset: q.offset,
      };

      await writeJsonCache(redis, cacheKey, body, 300);
      return reply.send(body);
    },
  );
}
