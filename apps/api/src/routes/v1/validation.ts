import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { z } from "zod";

import { ValidationService } from "@agenticverdict/agent-runtime";
import { generatedInsightSchema, marketingVerdictSchema } from "@agenticverdict/types";

import { jwtAuth } from "../../middleware/auth";
import { bindJwtTenantAsyncContext } from "../../middleware/jwt-tenant-context";
import { rateLimit } from "../../middleware/rate-limit";

const insightValidateBodySchema = z.object({
  insights: z.array(z.unknown()),
});

const verdictValidateBodySchema = z.object({
  verdict: z.unknown(),
});

export function registerValidationRoutes(app: FastifyInstance, redis: Redis | null): void {
  const preHandlers = [
    jwtAuth({ required: true }),
    bindJwtTenantAsyncContext(),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 30, keyPrefix: "v1:validate" }),
  ];

  const dq = new ValidationService();

  app.post(
    "/insights/validate",
    {
      preHandler: preHandlers,
      schema: {
        tags: ["Validation"],
        summary: "Run data-quality validation on one or more insights",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["insights"],
          properties: {
            insights: { type: "array", items: { type: "object", additionalProperties: true } },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              isValid: { type: "boolean" },
              score: { type: "number" },
              errors: { type: "array", items: { type: "object", additionalProperties: true } },
              warnings: { type: "array", items: { type: "object", additionalProperties: true } },
              recommendations: { type: "array", items: { type: "string" } },
              perInsight: { type: "array", items: { type: "object", additionalProperties: true } },
            },
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = insightValidateBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid body",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }

      const results: ReturnType<ValidationService["validateInsight"]>[] = [];
      for (let i = 0; i < parsed.data.insights.length; i += 1) {
        const row = parsed.data.insights[i];
        const asInsight = generatedInsightSchema.safeParse(row);
        if (!asInsight.success) {
          results.push({
            isValid: false,
            score: 0,
            errors: [
              {
                field: `insights[${i}]`,
                code: "SCHEMA_VIOLATION",
                message: asInsight.error.message,
                severity: "critical",
              },
            ],
            warnings: [],
            recommendations: ["Fix insight schema before validation."],
            metadata: { validatedAt: new Date(), validatorVersion: "1.0.0" },
          });
          continue;
        }
        results.push(dq.validateInsight(asInsight.data));
      }

      const mergedScore =
        results.length === 0
          ? 100
          : Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

      return reply.send({
        isValid: results.every((r) => r.isValid),
        score: mergedScore,
        errors: results.flatMap((r) => r.errors),
        warnings: results.flatMap((r) => r.warnings),
        recommendations: [...new Set(results.flatMap((r) => r.recommendations))],
        perInsight: results,
      });
    },
  );

  app.post(
    "/verdicts/validate",
    {
      preHandler: preHandlers,
      schema: {
        tags: ["Validation"],
        summary: "Validate a MarketingVerdict against Zod schema and quality rules",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["verdict"],
          properties: { verdict: { type: "object", additionalProperties: true } },
        },
        response: {
          200: { type: "object", additionalProperties: true, description: "ValidationResult" },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = verdictValidateBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid body",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }

      const verdictParsed = marketingVerdictSchema.safeParse(parsed.data.verdict);
      if (!verdictParsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Verdict failed schema validation",
            details: verdictParsed.error.flatten(),
          },
          requestId: request.id,
        });
      }

      const result = dq.validateVerdict(verdictParsed.data);
      return reply.send(result);
    },
  );
}
