import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { z } from "zod";

import { dbScoped, generatedInsights, type GeneratedInsightDb } from "@agenticverdict/database";
import { getTrpcDatabase } from "../../trpc/database";
import type { GeneratedInsight } from "@agenticverdict/types";

import { jwtAuth } from "../../middleware/auth";
import { bindJwtTenantAsyncContext } from "../../middleware/jwt-tenant-context";
import { rateLimit } from "../../middleware/rate-limit";
import { listTenantInsights } from "../../services/analysis-repository";
import { readJsonCache, stableQueryKey, writeJsonCache } from "../../services/response-cache";
import { and, desc, eq, gte, sql } from "drizzle-orm";

const insightQuerySchema = z.object({
  type: z.enum(["opportunity", "risk", "observation", "recommendation"]).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  minRelevance: z.coerce.number().min(0).max(1).optional(),
  sort: z.enum(["relevance", "created", "confidence"]).optional().default("relevance"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

function mapDbRowToInsight(row: GeneratedInsightDb): GeneratedInsight {
  return {
    id: row.id,
    tenantId: row.tenantId,
    analysisId: row.analysisId ?? "",
    type: row.insightType,
    title: row.title,
    description: row.description,
    confidence: Number(row.confidence),
    relevanceScore: Number(row.relevanceScore),
    platforms: row.platforms,
    relatedMetricKeys: row.relatedMetricKeys,
    createdAt: row.createdAt,
  };
}

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
            type: {
              type: "string",
              enum: ["opportunity", "risk", "observation", "recommendation"],
            },
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
            code: "VALIDATION_FAILED",
            message: "errors.validation.failed",
            details: {
              issues: parsed.error.issues.map((issue) => ({ code: issue.code, path: issue.path })),
            },
          },
          requestId: request.id,
        });
      }

      const tenantId = request.auth?.tenantId;
      if (!tenantId) {
        return reply.status(401).send({
          error: { code: "AUTH_UNAUTHORIZED", message: "errors.auth.unauthorized", details: {} },
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

      // Query from database when available, fall back to in-memory store
      const db = getTrpcDatabase();
      let rows: { insights: GeneratedInsight[]; total: number };

      if (db) {
        rows = await dbScoped(db, async (tx) => {
          const whereConditions = [eq(generatedInsights.tenantId, tenantId)];

          if (q.type) {
            whereConditions.push(eq(generatedInsights.insightType, q.type));
          }
          if (q.minConfidence !== undefined) {
            whereConditions.push(gte(generatedInsights.confidence, String(q.minConfidence)));
          }

          let orderBy = desc(generatedInsights.relevanceScore);
          if (q.sort === "created") {
            orderBy = desc(generatedInsights.createdAt);
          } else if (q.sort === "confidence") {
            orderBy = desc(generatedInsights.confidence);
          }

          const [results, countResult] = await Promise.all([
            tx
              .select()
              .from(generatedInsights)
              .where(and(...whereConditions))
              .orderBy(orderBy)
              .limit(q.limit)
              .offset(q.offset),
            tx
              .select({ count: sql<number>`count(*)` })
              .from(generatedInsights)
              .where(and(...whereConditions)),
          ]);

          return {
            insights: results.map(mapDbRowToInsight),
            total: Number(countResult[0]?.count ?? 0),
          };
        });
      } else {
        let insights = listTenantInsights(tenantId);

        if (q.type) {
          insights = insights.filter((i) => i.type === q.type);
        }
        const minConfidence = q.minConfidence;
        if (minConfidence !== undefined) {
          insights = insights.filter((i) => i.confidence >= minConfidence);
        }
        const minRelevance = q.minRelevance;
        if (minRelevance !== undefined) {
          insights = insights.filter((i) => i.relevanceScore >= minRelevance);
        }

        const sorted = [...insights];
        if (q.sort === "relevance") {
          sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
        } else if (q.sort === "confidence") {
          sorted.sort((a, b) => b.confidence - a.confidence);
        } else {
          sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        rows = {
          insights: sorted.slice(q.offset, q.offset + q.limit),
          total: sorted.length,
        };
      }

      const body = {
        insights: rows.insights,
        total: rows.total,
        limit: q.limit,
        offset: q.offset,
      };

      await writeJsonCache(redis, cacheKey, body, 300);
      return reply.send(body);
    },
  );
}
