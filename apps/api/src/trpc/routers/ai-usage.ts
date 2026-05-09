import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AiUsageService } from "../../services/ai-usage.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import {
  usageQueryInputSchema,
  usageSummaryOutputSchema,
  recordUsageInputSchema,
} from "@agenticverdict/types";

const logger = console;

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
    .input(z.object({ startDate: z.iso.datetime(), endDate: z.iso.datetime() }))
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
    .input(z.object({ startDate: z.iso.datetime(), endDate: z.iso.datetime() }))
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
