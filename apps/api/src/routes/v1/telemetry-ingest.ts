import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";

import { telemetryEnvelopeSchema } from "@agenticverdict/types";

import { parseTelemetrySampleRate } from "../../lib/telemetry-sampling";
import { rateLimit } from "../../middleware/rate-limit";

const MAX_BODY_BYTES = 65_536;

function getIngestSecret(): string | undefined {
  const raw = process.env.TELEMETRY_INGEST_SECRET?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

function isNodeProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getIngestLogSampleRate(): number {
  return parseTelemetrySampleRate(process.env.TELEMETRY_INGEST_LOG_SAMPLE_RATE);
}

function extractBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization?.startsWith("Bearer ")) {
    return undefined;
  }
  const t = authorization.slice(7).trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Public browser telemetry ingest (web vitals, client errors, product events).
 * - In production, `TELEMETRY_INGEST_SECRET` must be set; requests must send
 *   `Authorization: Bearer <same value>` (shared with `VITE_PUBLIC_TELEMETRY_INGEST_TOKEN` on the client).
 * - In non-production, when the secret is unset, accepts valid JSON envelopes for local testing.
 */
export function registerTelemetryIngestRoutes(app: FastifyInstance, redis: Redis | null): void {
  const preHandlers = [
    rateLimit(redis, {
      windowMs: 60_000,
      maxRequests: 120,
      keyPrefix: "v1:telemetry-ingest",
      perTenant: false,
    }),
  ];

  app.post(
    "/telemetry/ingest",
    {
      preHandler: preHandlers,
      schema: {
        tags: ["Observability"],
        summary: "Ingest browser telemetry envelope (JSON)",
        description:
          "Authenticates with TELEMETRY_INGEST_SECRET in production. Payload must match telemetryEnvelopeSchema.",
        body: {
          type: "object",
          additionalProperties: true,
        },
        response: {
          202: {
            type: "object",
            properties: { accepted: { type: "boolean" } },
            required: ["accepted"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          413: { type: "object", additionalProperties: true },
          503: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const secret = getIngestSecret();
      if (isNodeProduction() && !secret) {
        return reply.status(503).send({
          error: { code: "RUNTIME_UNAVAILABLE", message: "errors.server.serviceUnavailable" },
          requestId: request.id,
        });
      }

      if (secret) {
        const bearer = extractBearerToken(request.headers.authorization);
        const headerToken =
          typeof request.headers["x-telemetry-token"] === "string"
            ? request.headers["x-telemetry-token"].trim()
            : undefined;
        const presented = bearer ?? headerToken;
        if (presented !== secret) {
          return reply.status(401).send({
            error: { code: "AUTH_UNAUTHORIZED", message: "errors.auth.unauthorized" },
            requestId: request.id,
          });
        }
      }

      const raw = request.body;
      const serialized = JSON.stringify(raw ?? null);
      if (serialized.length > MAX_BODY_BYTES) {
        return reply.status(413).send({
          error: { code: "VALIDATION_FAILED", message: "errors.validation.failed" },
          requestId: request.id,
        });
      }

      const parsed = telemetryEnvelopeSchema.safeParse(raw);
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

      const logRate = getIngestLogSampleRate();
      if (logRate > 0 && Math.random() < logRate) {
        request.log.info(
          {
            event: "telemetry.ingest",
            kind: parsed.data.kind,
            tenantId: parsed.data.tenantId,
          },
          "telemetry envelope accepted",
        );
      }

      return reply.status(202).send({ accepted: true });
    },
  );
}
