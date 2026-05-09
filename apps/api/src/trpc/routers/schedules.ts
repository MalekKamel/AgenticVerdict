import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ScheduleService } from "../../services/schedule.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import {
  scheduleEntityTypeSchema,
  scheduleRecordSchema,
  scheduleExecutionRecordSchema,
} from "@agenticverdict/types";

const scheduleOutputSchema = scheduleRecordSchema;
const executionOutputSchema = scheduleExecutionRecordSchema;

export const schedulesRouter = t.router({
  list: authedProcedure
    .input(
      z.object({
        entityType: scheduleEntityTypeSchema.optional(),
      }),
    )
    .output(z.array(scheduleOutputSchema))
    .query(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        return await service.listSchedules(tenant.tenantId, input.entityType);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list schedules",
        });
      }
    }),

  getById: authedProcedure
    .input(z.object({ scheduleId: z.string().uuid() }))
    .output(scheduleOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        return await service.getSchedule(tenant.tenantId, input.scheduleId);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AppFault" &&
          (error as { httpStatus?: number }).httpStatus === 404
        ) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Schedule not found" });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get schedule",
        });
      }
    }),

  getByEntity: authedProcedure
    .input(
      z.object({
        entityType: scheduleEntityTypeSchema,
        entityId: z.string().uuid(),
      }),
    )
    .output(scheduleOutputSchema.nullable())
    .query(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        return await service.getScheduleByEntity(tenant.tenantId, input.entityType, input.entityId);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get schedule by entity",
        });
      }
    }),

  nextRun: authedProcedure
    .input(z.object({ scheduleId: z.string().uuid() }))
    .output(
      z.object({
        nextRunAt: z.date().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        const nextRunAt = await service.computeNextRun(tenant.tenantId, input.scheduleId);
        return { nextRunAt };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to compute next run",
        });
      }
    }),

  history: authedProcedure
    .input(
      z.object({
        scheduleId: z.string().uuid(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .output(
      z.object({
        executions: z.array(executionOutputSchema),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        return await service.getExecutionHistory(tenant.tenantId, input.scheduleId, {
          page: input.page,
          pageSize: input.pageSize,
        });
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get execution history",
        });
      }
    }),

  toggle: authedProcedure
    .input(z.object({ scheduleId: z.string().uuid() }))
    .output(scheduleOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        return await service.toggleSchedule(tenant.tenantId, input.scheduleId);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AppFault" &&
          (error as { httpStatus?: number }).httpStatus === 404
        ) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Schedule not found" });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to toggle schedule",
        });
      }
    }),

  validate: authedProcedure
    .input(
      z.object({
        cronExpression: z.string().min(1).max(128),
        timezone: z.string().default("UTC"),
      }),
    )
    .output(
      z.object({
        cronExpression: z.string(),
        timezone: z.string(),
        nextRuns: z.array(z.date()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        return await service.validateSchedule(tenant.tenantId, {
          cronExpression: input.cronExpression,
          timezone: input.timezone,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AppFault" &&
          (error as { httpStatus?: number }).httpStatus === 400
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate schedule",
        });
      }
    }),

  conflict: authedProcedure
    .input(
      z.object({
        entityType: scheduleEntityTypeSchema,
        cronExpression: z.string().min(1).max(128),
        excludeScheduleId: z.string().uuid().optional(),
      }),
    )
    .output(
      z.object({
        hasConflict: z.boolean(),
        conflictingScheduleId: z.string().uuid().nullable(),
        conflictingCronExpression: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = new ScheduleService();
      const { tenant } = ctx;

      try {
        return await service.checkConflicts(
          tenant.tenantId,
          input.entityType,
          input.cronExpression,
          input.excludeScheduleId,
        );
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check conflicts",
        });
      }
    }),
});
