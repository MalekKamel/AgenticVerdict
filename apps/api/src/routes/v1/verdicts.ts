import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { z } from "zod";

import type { MarketingVerdict } from "@agenticverdict/types";

import { jwtAuth } from "../../middleware/auth";
import { bindJwtTenantAsyncContext } from "../../middleware/jwt-tenant-context";
import { rateLimit } from "../../middleware/rate-limit";
import { listTenantVerdicts } from "../../services/analysis-repository";
import { readJsonCache, stableQueryKey, writeJsonCache } from "../../services/response-cache";

const verdictQuerySchema = z.object({
  campaignId: z.string().uuid().optional(),
  verdictType: z
    .enum(["budget_allocation", "platform_performance", "creative_effectiveness", "overall_health"])
    .optional(),
  start: z.string().min(10).optional(),
  end: z.string().min(10).optional(),
});

function rangesOverlap(
  vr: MarketingVerdict["dateRange"],
  start: string | undefined,
  end: string | undefined,
): boolean {
  if (!start || !end) {
    return true;
  }
  return vr.start <= end && vr.end >= start;
}

export function registerVerdictRoutes(app: FastifyInstance, redis: Redis | null): void {
  const preHandlers = [
    jwtAuth({ required: true }),
    bindJwtTenantAsyncContext(),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 100, keyPrefix: "v1:verdicts" }),
  ];

  app.get(
    "/verdicts",
    {
      preHandler: preHandlers,
      schema: {
        tags: ["Verdicts"],
        summary: "List MarketingVerdict records for the tenant",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            campaignId: { type: "string", format: "uuid" },
            verdictType: {
              type: "string",
              enum: [
                "budget_allocation",
                "platform_performance",
                "creative_effectiveness",
                "overall_health",
              ],
            },
            start: { type: "string", minLength: 10 },
            end: { type: "string", minLength: 10 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              verdicts: { type: "array", items: { type: "object", additionalProperties: true } },
              total: { type: "integer" },
            },
            required: ["verdicts", "total"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = verdictQuerySchema.safeParse(request.query);
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
      const cacheKey = `cache:v1:verdicts:${tenantId}:${stableQueryKey(q as Record<string, unknown>)}`;
      const cached = await readJsonCache<{ verdicts: MarketingVerdict[]; total: number }>(
        redis,
        cacheKey,
      );
      if (cached) {
        return reply.send(cached);
      }

      let rows = listTenantVerdicts(tenantId);

      if (q.campaignId) {
        rows = rows.filter((v) => v.campaignId === q.campaignId);
      }
      if (q.verdictType) {
        rows = rows.filter((v) => v.verdictType === q.verdictType);
      }
      if (q.start && q.end) {
        rows = rows.filter((v) => rangesOverlap(v.dateRange, q.start, q.end));
      }

      const body = { verdicts: rows, total: rows.length };
      await writeJsonCache(redis, cacheKey, body, 600);
      return reply.send(body);
    },
  );
}
