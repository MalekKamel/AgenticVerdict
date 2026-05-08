import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AiUsageService } from "../../services/ai-usage.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";

const logger = console;

const usageQueryInputSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  providerId: z.string().optional(),
  domainId: z.string().uuid().optional(),
  modelId: z.string().optional(),
});

const recordUsageInputSchema = z.object({
  providerId: z.string(),
  modelId: z.string(),
  domainId: z.string().uuid().optional(),
  connectorId: z.string().uuid().optional(),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  costCents: z.number().int().nonnegative(),
  requestId: z.string().uuid(),
  latencyMs: z.number().int().nonnegative(),
  success: z.boolean(),
  errorCode: z.string().max(64).optional(),
  errorMessage: z.string().max(512).optional(),
  wasFailover: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const usageSummaryOutputSchema = z.object({
  tenantId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  totalPromptTokens: z.number().int(),
  totalCompletionTokens: z.number().int(),
  totalTokens: z.number().int(),
  totalCostCents: z.number().int(),
  totalRequests: z.number().int(),
  successfulRequests: z.number().int(),
  failedRequests: z.number().int(),
  avgLatencyMs: z.number(),
  byProvider: z.array(
    z.object({
      providerId: z.string(),
      totalTokens: z.number().int(),
      totalCostCents: z.number().int(),
      requestCount: z.number().int(),
    }),
  ),
  byDomain: z.array(
    z.object({
      domainId: z.string().uuid().nullable(),
      totalTokens: z.number().int(),
      totalCostCents: z.number().int(),
      requestCount: z.number().int(),
    }),
  ),
});

export const aiUsageRouter = t.router({
  getSummary: authedProcedure
    .input(usageQueryInputSchema)
    .output(usageSummaryOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new AiUsageService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      try {
        return await service.getUsageSummary(tenantId, startDate, endDate);
      } catch (error) {
        logger.error("Error getting usage summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get usage summary",
        });
      }
    }),

  getTrends: authedProcedure
    .input(usageQueryInputSchema)
    .output(
      z.array(
        z.object({
          date: z.string(),
          tokens: z.number(),
          costCents: z.number(),
          requests: z.number(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const service = new AiUsageService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      try {
        return await service.getUsageTrends(tenantId, startDate, endDate);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get usage trends",
        });
      }
    }),

  getByProvider: authedProcedure
    .input(usageQueryInputSchema.extend({ providerId: z.string() }))
    .output(z.array(z.unknown()))
    .query(async ({ ctx, input }) => {
      const service = new AiUsageService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      try {
        return await service.getUsageByProvider(tenantId, input.providerId, startDate, endDate);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get usage by provider",
        });
      }
    }),

  getByDomain: authedProcedure
    .input(usageQueryInputSchema.extend({ domainId: z.string().uuid() }))
    .output(z.array(z.unknown()))
    .query(async ({ ctx, input }) => {
      const service = new AiUsageService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      try {
        return await service.getUsageByDomain(tenantId, input.domainId, startDate, endDate);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get usage by domain",
        });
      }
    }),

  getFailedRequests: authedProcedure
    .input(z.object({ startDate: z.string().datetime(), endDate: z.string().datetime() }))
    .output(z.array(z.unknown()))
    .query(async ({ ctx, input }) => {
      const service = new AiUsageService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      try {
        return await service.getFailedRequests(tenantId, startDate, endDate);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get failed requests",
        });
      }
    }),

  recordUsage: authedProcedure
    .input(recordUsageInputSchema)
    .output(z.object({ id: z.string().uuid(), success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AiUsageService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        await service.recordUsage(tenantId, input);
        return { id: input.requestId, success: true };
      } catch (error) {
        logger.error("Error recording usage:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to record usage" });
      }
    }),

  getCurrentMonth: authedProcedure.output(usageSummaryOutputSchema).query(async ({ ctx }) => {
    const service = new AiUsageService();
    const { tenant } = ctx;
    const tenantId = tenant.tenantId;

    try {
      return await service.getCurrentMonthUsage(tenantId);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get current month usage",
      });
    }
  }),

  getCostEfficiency: authedProcedure
    .input(z.object({ startDate: z.string().datetime(), endDate: z.string().datetime() }))
    .output(
      z.object({
        overall: z.object({
          totalCostCents: z.number(),
          totalTokens: z.number(),
          avgCostPerToken: z.number(),
        }),
        byProvider: z.array(z.unknown()),
        mostEfficient: z.unknown().nullable(),
        leastEfficient: z.unknown().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new AiUsageService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      try {
        return await service.getCostEfficiency(tenantId, startDate, endDate);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get cost efficiency",
        });
      }
    }),
});

export type AiUsageRouter = typeof aiUsageRouter;
