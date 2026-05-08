import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { BudgetAlertsService } from "../../services/budget-alerts.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";

const createAlertInputSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  type: z.enum(["threshold", "percentage", "rate"]),
  threshold: z.number().positive(),
  thresholdType: z.enum(["cost", "tokens", "requests"]),
  timeWindow: z.enum(["hourly", "daily", "weekly", "monthly"]),
  notifications: z
    .array(
      z.object({
        type: z.enum(["email", "webhook", "slack"]),
        target: z.string(),
        isEnabled: z.boolean().default(true),
      }),
    )
    .min(1),
});

const updateAlertInputSchema = createAlertInputSchema.partial().extend({
  alertId: z.string().uuid(),
});

const getAlertInputSchema = z.object({ alertId: z.string().uuid() });

const toggleAlertInputSchema = z.object({
  alertId: z.string().uuid(),
  status: z.enum(["active", "paused"]),
});

const alertOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(["threshold", "percentage", "rate"]),
  threshold: z.number(),
  thresholdType: z.enum(["cost", "tokens", "requests"]),
  timeWindow: z.enum(["hourly", "daily", "weekly", "monthly"]),
  status: z.enum(["active", "paused", "triggered"]),
  notifications: z.array(
    z.object({
      id: z.string().uuid().optional(),
      type: z.string(),
      target: z.string(),
      isEnabled: z.boolean(),
    }),
  ),
  lastTriggeredAt: z.date().nullable(),
  lastEvaluatedAt: z.date().nullable(),
  lastEvaluatedValue: z.number().nullable(),
  triggerCount: z.number().int(),
  cooldownMinutes: z.number().int(),
  createdById: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const budgetAlertsRouter = t.router({
  list: authedProcedure
    .input(
      z.object({
        status: z.enum(["active", "paused", "triggered", "all"]).optional().default("all"),
      }),
    )
    .output(z.array(alertOutputSchema))
    .query(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const status = input.status === "all" ? undefined : input.status;

      try {
        return await service.getAlertsForTenant(tenantId, status);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list alerts" });
      }
    }),

  getById: authedProcedure
    .input(getAlertInputSchema)
    .output(alertOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getAlertById(tenantId, input.alertId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get alert" });
      }
    }),

  create: authedProcedure
    .input(createAlertInputSchema)
    .output(alertOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const userId = ctx.auth.userId;

      try {
        return await service.createAlert(tenantId, input, userId);
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create alert" });
      }
    }),

  update: authedProcedure
    .input(updateAlertInputSchema)
    .output(alertOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const { alertId, ...data } = input;

      try {
        const result = await service.updateAlert(tenantId, alertId, data);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alert not found",
          });
        }
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update alert" });
      }
    }),

  delete: authedProcedure
    .input(getAlertInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const success = await service.deleteAlert(tenantId, input.alertId);
        return { success };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete alert" });
      }
    }),

  toggle: authedProcedure
    .input(toggleAlertInputSchema)
    .output(alertOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const result = await service.toggleAlert(tenantId, input.alertId, input.status);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Alert not found",
          });
        }
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to toggle alert" });
      }
    }),

  getTriggerHistory: authedProcedure
    .input(getAlertInputSchema.extend({ limit: z.number().int().min(1).max(100).default(50) }))
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          alertId: z.string().uuid(),
          tenantId: z.string().uuid(),
          triggeredValue: z.number(),
          thresholdValue: z.number(),
          exceededBy: z.number().nullable(),
          triggeredAt: z.date(),
          notificationsSent: z.array(z.unknown()).nullable(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getAlertTriggerHistory(tenantId, input.alertId, input.limit);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get trigger history",
        });
      }
    }),

  getCurrentPeriodSummary: authedProcedure
    .input(z.object({ periodType: z.enum(["daily", "monthly"]).default("monthly") }))
    .output(
      z
        .object({
          id: z.string().uuid(),
          tenantId: z.string().uuid(),
          periodType: z.string(),
          periodStart: z.date(),
          periodEnd: z.date(),
          totalCostCents: z.number().int(),
          totalTokens: z.number().int(),
          totalRequests: z.number().int(),
          budgetLimitCents: z.number().int().nullable(),
          budgetUsedPercent: z.number().int(),
          projectedCostCents: z.number().int().nullable(),
          daysRemaining: z.number().int().nullable(),
          dailyAverageCostCents: z.number().int(),
          alertsTriggered: z.number().int(),
        })
        .nullable(),
    )
    .query(async ({ ctx, input }) => {
      const service = new BudgetAlertsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const result = await service.getCurrentPeriodSummary(tenantId, input.periodType);
        if (!result) {
          return null;
        }
        return {
          ...result,
          dailyAverageCostCents: result.dailyAverageCostCents ?? 0,
        };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get period summary",
        });
      }
    }),
});

export type BudgetAlertsRouter = typeof budgetAlertsRouter;
