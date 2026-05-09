import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InsightTemplatesService } from "../../services/insight-templates.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import { createPinoLogger } from "@agenticverdict/observability";
import {
  listInsightTemplatesInput,
  getInsightTemplateInput,
  applyInsightTemplateInput,
  validateInsightTemplateInput,
  insightTemplateSummarySchema,
  insightTemplateSchema,
  appliedTemplateConfigSchema,
  templateValidationResultSchema,
  type ScheduleFrequency,
} from "@agenticverdict/types";

const logger = createPinoLogger("api");

function deriveLocale(ctx: {
  req: { headers: Record<string, string | string[] | undefined> };
}): string {
  const acceptLang = ctx.req.headers["accept-language"];
  if (typeof acceptLang === "string" && acceptLang) {
    const primary = acceptLang.split(",")[0].split(";")[0].trim();
    if (primary === "ar" || primary === "fr") {
      return primary;
    }
  }
  return "en";
}

export const insightTemplatesRouter = t.router({
  /**
   * List template summaries visible to the tenant (platform-shared + tenant-owned)
   */
  list: authedProcedure
    .input(listInsightTemplatesInput)
    .output(z.array(insightTemplateSummarySchema))
    .query(async ({ ctx, input }) => {
      const service = new InsightTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const locale = deriveLocale(ctx);

      try {
        return await service.listTemplates(tenantId, input.domain, locale);
      } catch (error) {
        logger.error({ err: error }, "Error listing insight templates");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list insight templates",
        });
      }
    }),

  /**
   * Get full template detail with resolved relations
   */
  detail: authedProcedure
    .input(getInsightTemplateInput)
    .output(insightTemplateSchema)
    .query(async ({ ctx, input }) => {
      const service = new InsightTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const locale = deriveLocale(ctx);

      try {
        const template = await service.getTemplateDetail(tenantId, input.id, locale);
        const nameTranslations = (template.nameTranslations as Record<string, string>) || {};
        const descriptionTranslations =
          (template.descriptionTranslations as Record<string, string>) || {};
        return {
          id: template.id,
          tenantId: template.tenantId,
          nameTranslations,
          name: template.name,
          descriptionTranslations,
          description: template.description || "",
          domains: template.domains,
          connectors: template.connectors,
          aiTemplateId: template.aiTemplateId,
          schedule: template.schedule as {
            frequency: ScheduleFrequency;
            time: number;
          },
          delivery: template.delivery as {
            format: "pdf" | "excel" | "both";
            emailRecipients: string[];
            enableWebhook: boolean;
            webhookUrl: string | null;
          },
          icon: template.icon || "",
          isActive: template.isActive,
          version: template.version,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get template detail",
        });
      }
    }),

  /**
   * Apply a template, returning pre-filled insight configuration
   */
  applyTemplate: authedProcedure
    .input(applyInsightTemplateInput)
    .output(appliedTemplateConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new InsightTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const locale = deriveLocale(ctx);

      try {
        const result = await service.applyTemplate(tenantId, input.id, locale);
        return {
          ...result,
          schedule: result.schedule as {
            frequency: ScheduleFrequency;
            time: number;
          },
          delivery: {
            ...result.delivery,
            format: result.delivery.format as "pdf" | "excel" | "both",
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error instanceof Error && error.message.includes("invalid connector")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to apply template",
        });
      }
    }),

  /**
   * Validate template connector/metric mappings without applying
   */
  validate: authedProcedure
    .input(validateInsightTemplateInput)
    .output(templateValidationResultSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new InsightTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const locale = deriveLocale(ctx);

      try {
        return await service.validateTemplate(tenantId, input.id, locale);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate template",
        });
      }
    }),
});

export type InsightTemplatesRouter = typeof insightTemplatesRouter;
