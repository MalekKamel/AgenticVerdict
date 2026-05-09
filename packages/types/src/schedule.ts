import { z } from "zod";

/**
 * Unified Schedule Types
 * Replaces InsightSchedule (deprecated) and in-memory report schedule types.
 */

export const scheduleEntityTypeSchema = z.enum(["report", "insight"]);
export type ScheduleEntityType = z.infer<typeof scheduleEntityTypeSchema>;

export const scheduleExecutionStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);
export type ScheduleExecutionStatus = z.infer<typeof scheduleExecutionStatusSchema>;

export const scheduleRecordSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  entityType: scheduleEntityTypeSchema,
  entityId: z.string().uuid(),
  cronExpression: z.string().min(1).max(128),
  timezone: z.string().default("UTC"),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
  lastRunAt: z.coerce.date().nullable(),
  nextRunAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ScheduleRecord = z.infer<typeof scheduleRecordSchema>;

export const scheduleExecutionRecordSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  tenantId: z.string().uuid(),
  entityType: scheduleEntityTypeSchema,
  entityId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  status: scheduleExecutionStatusSchema,
  errorMessage: z.string().max(1024).nullable(),
  createdAt: z.coerce.date(),
});
export type ScheduleExecutionRecord = z.infer<typeof scheduleExecutionRecordSchema>;

export const scheduleCreateSchema = z.object({
  entityType: scheduleEntityTypeSchema,
  entityId: z.string().uuid(),
  cronExpression: z.string().min(1).max(128),
  timezone: z.string().default("UTC"),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ScheduleCreateInput = z.infer<typeof scheduleCreateSchema>;

export const scheduleUpdateSchema = scheduleCreateSchema.partial();
export type ScheduleUpdateInput = z.infer<typeof scheduleUpdateSchema>;

export const scheduleValidationSchema = z.object({
  cronExpression: z.string().min(1).max(128),
  timezone: z.string().default("UTC"),
});
export type ScheduleValidationInput = z.infer<typeof scheduleValidationSchema>;

export const scheduleValidationOutputSchema = z.object({
  cronExpression: z.string(),
  timezone: z.string(),
  nextRuns: z.array(z.coerce.date()),
});
export type ScheduleValidationOutput = z.infer<typeof scheduleValidationOutputSchema>;

export const scheduleConflictSchema = z.object({
  hasConflict: z.boolean(),
  conflictingScheduleId: z.string().uuid().nullable(),
  conflictingCronExpression: z.string().nullable(),
});
export type ScheduleConflict = z.infer<typeof scheduleConflictSchema>;

export const scheduleExecutionHistoryInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type ScheduleExecutionHistoryInput = z.infer<typeof scheduleExecutionHistoryInputSchema>;

export const scheduleExecutionHistoryOutputSchema = z.object({
  executions: z.array(scheduleExecutionRecordSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type ScheduleExecutionHistoryOutput = z.infer<typeof scheduleExecutionHistoryOutputSchema>;

export interface InsightScheduleTickJobData {
  tenantId: string;
  scheduleId: string;
  insightId: string;
  cronExpression: string;
}
