import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AiTemplatesService } from "../../services/ai-templates.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import {
  createTemplateSchema,
  updateTemplateSchema,
  deployTemplateSchema,
  paginationSchema,
  templateVariableSchema,
} from "@agenticverdict/types";

const logger = console;

// Input schemas
const listTemplatesInputSchema = paginationSchema.extend({
  status: z.enum(["draft", "published", "archived", "all"]).optional().default("all"),
  type: z.enum(["prompt", "configuration", "workflow"]).optional(),
  domainId: z.string().uuid().optional(),
});

const getTemplateInputSchema = z.object({ templateId: z.string().uuid() });

const createTemplateInputSchema = createTemplateSchema;

const updateTemplateInputSchema = updateTemplateSchema.extend({
  templateId: z.string().uuid(),
});

const deleteTemplateInputSchema = z.object({ templateId: z.string().uuid() });

const publishTemplateInputSchema = z.object({ templateId: z.string().uuid() });

const deployTemplateInputSchema = deployTemplateSchema;

const getUsageInputSchema = z.object({
  templateId: z.string().uuid(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
});

// Output schemas
const templateOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(["prompt", "configuration", "workflow"]),
  version: z.string(),
  content: z.string(),
  variables: z.array(templateVariableSchema).nullable(),
  providerId: z.string().nullable(),
  modelId: z.string().nullable(),
  domainId: z.string().uuid().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  isLatestVersion: z.boolean(),
  parentVersionId: z.string().uuid().nullable(),
  versionNumber: z.number().int(),
  deploymentCount: z.number().int(),
  lastDeployedAt: z.date().nullable(),
  createdById: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const aiTemplatesRouter = t.router({
  list: authedProcedure
    .input(listTemplatesInputSchema)
    .output(z.array(templateOutputSchema))
    .query(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const status = input.status === "all" ? undefined : input.status;
        return await service.getTemplatesForTenant(tenantId, status);
      } catch (error) {
        logger.error("Error listing templates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list templates",
        });
      }
    }),

  getById: authedProcedure
    .input(getTemplateInputSchema)
    .output(templateOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getTemplateById(tenantId, input.templateId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get template" });
      }
    }),

  create: authedProcedure
    .input(createTemplateInputSchema)
    .output(templateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const userId = ctx.auth.userId;

      try {
        return await service.createTemplate(tenantId, input, userId);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("already exists") || error.message.includes("Invalid"))
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }
    }),

  update: authedProcedure
    .input(updateTemplateInputSchema)
    .output(templateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const { templateId, ...data } = input;

      try {
        return await service.updateTemplate(tenantId, templateId, data);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update template",
        });
      }
    }),

  delete: authedProcedure
    .input(deleteTemplateInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const success = await service.deleteTemplate(tenantId, input.templateId);
        return { success };
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete template",
        });
      }
    }),

  publish: authedProcedure
    .input(publishTemplateInputSchema)
    .output(templateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.publishTemplate(tenantId, input.templateId);
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish template",
        });
      }
    }),

  archive: authedProcedure
    .input(publishTemplateInputSchema)
    .output(templateOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.archiveTemplate(tenantId, input.templateId);
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to archive template",
        });
      }
    }),

  deploy: authedProcedure
    .input(deployTemplateInputSchema)
    .output(
      z.object({
        id: z.string().uuid(),
        templateId: z.string().uuid(),
        tenantId: z.string().uuid(),
        scope: z.string(),
        targetId: z.string().uuid().nullable(),
        deploymentStatus: z.string(),
        createdAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const userId = ctx.auth.userId;

      try {
        return await service.deployTemplate(tenantId, input, userId);
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deploy template",
        });
      }
    }),

  getUsage: authedProcedure
    .input(getUsageInputSchema)
    .output(
      z.object({
        timeSeries: z.array(z.unknown()),
        total: z.object({
          totalExecutions: z.number(),
          totalSuccesses: z.number(),
          totalFailures: z.number(),
          totalTokens: z.number(),
          totalCostCents: z.number(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      try {
        return await service.getTemplateUsage(tenantId, input.templateId, startDate, endDate);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get template usage",
        });
      }
    }),

  getVersionHistory: authedProcedure
    .input(getTemplateInputSchema)
    .output(z.array(templateOutputSchema))
    .query(async ({ ctx, input }) => {
      const service = new AiTemplatesService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getVersionHistory(tenantId, input.templateId);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get version history",
        });
      }
    }),
});

export type AiTemplatesRouter = typeof aiTemplatesRouter;
