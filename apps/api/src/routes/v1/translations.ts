import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import {
  APP_LOCALES,
  loadMessagesSync,
  mergeMessageDictionaries,
  normalizeToAppLocale,
  type AppLocale,
} from "@agenticverdict/i18n";
import { z } from "zod";

import { jwtAuth } from "../../middleware/auth";
import { requireAnyRole } from "../../middleware/report-rbac";
import { rateLimit } from "../../middleware/rate-limit";
import {
  deleteTenantTranslation,
  listTenantTranslationOverrides,
  upsertTenantTranslation,
} from "../../services/translation-store";

const readRoles = ["analyst", "reports:read", "admin", "translations:read"] as const;
const writeRoles = ["admin", "translations:write"] as const;

const messageKeySchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[a-zA-Z0-9._-]+$/);

const upsertBodySchema = z.object({
  locale: z.string().min(2).max(32),
  key: messageKeySchema,
  value: z.string().min(1).max(10_000),
});

const deleteQuerySchema = z.object({
  locale: z.string().min(2).max(32),
  key: messageKeySchema,
});

export function registerTranslationRoutes(app: FastifyInstance, redis: Redis | null): void {
  const readChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...readRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 120, keyPrefix: "v1:translations:read" }),
  ];

  const writeChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...writeRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 60, keyPrefix: "v1:translations:write" }),
  ];

  app.get(
    "/translations/meta",
    {
      preHandler: readChain,
      schema: {
        tags: ["Translations"],
        summary: "Supported UI locales and bundled message catalog metadata",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              locales: { type: "array", items: { type: "string" } },
              defaultLocale: { type: "string" },
            },
            required: ["locales", "defaultLocale"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async () => ({
      locales: [...APP_LOCALES],
      defaultLocale: "en",
    }),
  );

  app.get(
    "/translations",
    {
      preHandler: readChain,
      schema: {
        tags: ["Translations"],
        summary: "Merged messages (bundled defaults + tenant overrides) for a locale",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["locale"],
          properties: { locale: { type: "string", minLength: 2, maxLength: 32 } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              locale: { type: "string" },
              messages: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["locale", "messages"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request) => {
      const localeParam = (request.query as { locale?: string }).locale;
      const locale: AppLocale = normalizeToAppLocale(localeParam, "en");
      const tenantId = request.auth!.tenantId;
      const base = loadMessagesSync(locale);
      const overrides = listTenantTranslationOverrides(tenantId, locale);
      const messages = mergeMessageDictionaries(base, overrides);
      return { locale, messages };
    },
  );

  app.put(
    "/translations",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Translations"],
        summary: "Upsert a tenant-specific message override",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["locale", "key", "value"],
          properties: {
            locale: { type: "string", minLength: 2, maxLength: 32 },
            key: { type: "string", minLength: 1, maxLength: 512 },
            value: { type: "string", minLength: 1, maxLength: 10_000 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              locale: { type: "string" },
              key: { type: "string" },
            },
            required: ["locale", "key"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = upsertBodySchema.safeParse(request.body);
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
      const tenantId = request.auth!.tenantId;
      const locale = normalizeToAppLocale(parsed.data.locale, "en");
      upsertTenantTranslation(tenantId, locale, parsed.data.key, parsed.data.value);
      return { locale, key: parsed.data.key };
    },
  );

  app.delete(
    "/translations",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Translations"],
        summary: "Remove a tenant-specific override (falls back to bundled default)",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["locale", "key"],
          properties: {
            locale: { type: "string", minLength: 2, maxLength: 32 },
            key: { type: "string", minLength: 1, maxLength: 512 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { deleted: { type: "boolean" } },
            required: ["deleted"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = deleteQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "validation_error",
            message: "Invalid query",
            details: parsed.error.flatten(),
          },
          requestId: request.id,
        });
      }
      const tenantId = request.auth!.tenantId;
      const locale = normalizeToAppLocale(parsed.data.locale, "en");
      const deleted = deleteTenantTranslation(tenantId, locale, parsed.data.key);
      return { deleted };
    },
  );
}
