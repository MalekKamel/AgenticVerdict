import type { FastifyInstance } from "fastify";
import type { Redis } from "@upstash/redis";
import { normalizeToAppLocale } from "@agenticverdict/i18n";
import {
  createDefaultCompositeTemplateEngine,
  getBuiltInTemplateCatalog,
  mergePhase2IntoReportModel,
} from "@agenticverdict/report-generator";
import { z } from "zod";

import { jwtAuth } from "../../middleware/auth";
import { requireAnyRole } from "../../middleware/report-rbac";
import { rateLimit } from "../../middleware/rate-limit";
import {
  ensureTenantAnalysisStore,
  listAllInsightsForTenant,
  listAllVerdictsForTenant,
} from "../../services/analysis-store";
import {
  appendTemplateVersion,
  listTemplateVersions,
  templateHtmlOverrideSource,
} from "../../services/template-customization-store";

const readRoles = ["analyst", "reports:read"] as const;
const writeRoles = ["reports:write", "admin"] as const;

const previewBodySchema = z.object({
  model: z.unknown().optional(),
  locale: z.string().min(2).max(32).optional(),
  textDirection: z.enum(["ltr", "rtl"]).optional(),
  /** When true, merges the tenant demo analysis bundle (verdict + insights) into the view model. */
  integratePhase2: z.boolean().optional(),
});

const versionBodySchema = z.object({
  html: z.string().min(1).max(2_000_000),
  label: z.string().min(1).max(256).optional(),
});

const templateEngine = createDefaultCompositeTemplateEngine(templateHtmlOverrideSource);

export function registerReportTemplateRoutes(app: FastifyInstance, redis: Redis | null): void {
  const readChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...readRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 120, keyPrefix: "v1:report-templates:read" }),
  ];

  const writeChain = [
    jwtAuth({ required: true }),
    requireAnyRole(...writeRoles),
    rateLimit(redis, { windowMs: 60_000, maxRequests: 60, keyPrefix: "v1:report-templates:write" }),
  ];

  app.get(
    "/report-templates",
    {
      preHandler: readChain,
      schema: {
        tags: ["Report templates"],
        summary: "List built-in report template definitions (catalog)",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              templates: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
            required: ["templates"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async () => ({ templates: getBuiltInTemplateCatalog() }),
  );

  app.post(
    "/report-templates/:templateId/preview",
    {
      preHandler: readChain,
      schema: {
        tags: ["Report templates"],
        summary: "Render HTML preview for a template (uses tenant override when present)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["templateId"],
          properties: { templateId: { type: "string", minLength: 1, maxLength: 256 } },
        },
        body: {
          type: "object",
          properties: {
            model: { description: "Report template view-model JSON" },
            locale: { type: "string" },
            textDirection: { type: "string", enum: ["ltr", "rtl"] },
            integratePhase2: {
              type: "boolean",
              description: "Merge tenant Phase 2 verdict and insights into the model before render",
            },
          },
          additionalProperties: true,
        },
        response: {
          200: {
            type: "object",
            properties: { html: { type: "string" } },
            required: ["html"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = previewBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "invalid_body", details: parsed.error.flatten() });
      }
      const tenantId = request.auth!.tenantId;
      const { templateId } = request.params as { templateId: string };
      const locale = normalizeToAppLocale(parsed.data.locale, "en");
      let model: unknown = parsed.data.model ?? {};
      if (parsed.data.integratePhase2) {
        ensureTenantAnalysisStore(tenantId);
        const verdicts = listAllVerdictsForTenant(tenantId);
        const insights = listAllInsightsForTenant(tenantId);
        model = mergePhase2IntoReportModel(model, {
          verdict: verdicts[0],
          insights,
        });
      }
      const html = await templateEngine.render(
        {
          tenantId,
          reportId: "preview",
          locale,
          templateId,
          textDirection: parsed.data.textDirection,
        },
        model,
      );
      return { html };
    },
  );

  app.get(
    "/report-templates/:templateId/versions",
    {
      preHandler: readChain,
      schema: {
        tags: ["Report templates"],
        summary: "List saved HTML versions for a template (tenant-scoped)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["templateId"],
          properties: { templateId: { type: "string", minLength: 1, maxLength: 256 } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              versions: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
            required: ["versions"],
          },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request) => {
      const tenantId = request.auth!.tenantId;
      const { templateId } = request.params as { templateId: string };
      return { versions: listTemplateVersions(tenantId, templateId) };
    },
  );

  app.post(
    "/report-templates/:templateId/versions",
    {
      preHandler: writeChain,
      schema: {
        tags: ["Report templates"],
        summary: "Append a new HTML template version (becomes active for preview/generation)",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["templateId"],
          properties: { templateId: { type: "string", minLength: 1, maxLength: 256 } },
        },
        body: {
          type: "object",
          required: ["html"],
          properties: {
            html: { type: "string", minLength: 1 },
            label: { type: "string", minLength: 1, maxLength: 256 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: { version: { type: "object", additionalProperties: true } },
            required: ["version"],
          },
          400: { type: "object", additionalProperties: true },
          401: { type: "object", additionalProperties: true },
          403: { type: "object", additionalProperties: true },
          429: { type: "object", additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const parsed = versionBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "invalid_body", details: parsed.error.flatten() });
      }
      const tenantId = request.auth!.tenantId;
      const { templateId } = request.params as { templateId: string };
      const version = appendTemplateVersion(tenantId, templateId, parsed.data);
      return reply.status(201).send({ version });
    },
  );
}
