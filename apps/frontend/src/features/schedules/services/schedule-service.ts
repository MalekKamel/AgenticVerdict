/**
 * Schedule Service
 *
 * Encapsulates all schedule-related logic, decoupling components from direct tRPC calls.
 * Handles data transformation, derived computations, and schedule state management.
 */

import { trpcClient } from "@/lib/api/trpc-client";
import type {
  ScheduleRecord,
  ScheduleValidationOutput,
  ScheduleConflict,
  ScheduleExecutionHistoryInput,
} from "@agenticverdict/types";

export type ScheduleStatus = "scheduled" | "manual" | "overdue";

export type ScheduleHistoryOptions = ScheduleExecutionHistoryInput;

export interface ScheduleHistoryResult {
  executions: Array<{
    id: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    error: string | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export type ScheduleValidationResult = ScheduleValidationOutput;

export type ScheduleConflictResult = ScheduleConflict;

/**
 * Schedule service class — use singleton `scheduleService` export.
 */
export class ScheduleService {
  /**
   * Fetch all schedules for the current tenant, optionally filtered by entity type
   */
  async listSchedules(entityType?: "report" | "insight"): Promise<ScheduleRecord[]> {
    return trpcClient.schedules.list.query(entityType ? { entityType } : {});
  }

  /**
   * Fetch a single schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<ScheduleRecord> {
    return trpcClient.schedules.getById.query({ scheduleId });
  }

  /**
   * Compute the next run time for a schedule
   */
  async getNextRun(scheduleId: string): Promise<Date | null> {
    const result = await trpcClient.schedules.nextRun.query({ scheduleId });
    return result.nextRunAt;
  }

  /**
   * Fetch execution history for a schedule
   */
  async getHistory(
    scheduleId: string,
    options?: ScheduleHistoryOptions,
  ): Promise<ScheduleHistoryResult> {
    const result = await trpcClient.schedules.history.query({
      scheduleId,
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
    });
    return {
      executions: result.executions.map((e) => ({
        id: e.id,
        status: e.status,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        error: e.errorMessage,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  /**
   * Toggle a schedule's enabled state
   */
  async toggleSchedule(scheduleId: string): Promise<ScheduleRecord> {
    return trpcClient.schedules.toggle.mutate({ scheduleId });
  }

  /**
   * Validate a schedule configuration without saving
   */
  async validateSchedule(data: {
    cronExpression: string;
    timezone?: string;
  }): Promise<ScheduleValidationResult> {
    return trpcClient.schedules.validate.mutate(data);
  }

  /**
   * Check for schedule conflicts
   */
  async checkConflicts(
    entityType: "report" | "insight",
    cronExpression: string,
    excludeScheduleId?: string,
  ): Promise<ScheduleConflictResult> {
    return trpcClient.schedules.conflict.mutate({
      entityType,
      cronExpression,
      excludeScheduleId,
    });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Format next run time for display
   */
  formatNextRun(nextRun: Date | null, timezone?: string): string {
    if (!nextRun) return "Not scheduled";
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return "Running now";
    if (diffMins < 60) return `In ${diffMins}m`;
    if (diffHours < 24) return `In ${diffHours}h`;
    if (diffDays < 7) return `In ${diffDays}d`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone ?? "UTC",
    });
  }

  /**
   * Determine schedule status based on schedule record
   */
  getScheduleStatus(schedule: ScheduleRecord | null): ScheduleStatus {
    if (!schedule || !schedule.enabled) {
      return "manual";
    }
    if (schedule.nextRunAt && this.isOverdue(schedule.nextRunAt)) {
      return "overdue";
    }
    return "scheduled";
  }

  /**
   * Check if a schedule is overdue (next run was more than 1 hour ago)
   */
  isOverdue(nextRun: Date | null): boolean {
    if (!nextRun) return false;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(nextRun) < oneHourAgo;
  }

  /**
   * Format cron expression to human-readable description
   */
  formatCronHumanReadable(cronExpression: string): string {
    const parts = cronExpression.split(" ");
    if (parts.length < 5) return cronExpression;

    const minute = parts[0];
    const hour = parts[1];
    const dayOfMonth = parts[2];
    const month = parts[3];
    const dayOfWeek = parts[4];

    // Daily: 0 9 * * *
    if (dayOfMonth === "*" && dayOfWeek === "*" && month === "*") {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      return `Daily at ${timeStr}`;
    }

    // Weekly: 0 9 * * 1
    if (dayOfMonth === "*" && month === "*" && dayOfWeek !== "*") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = days[parseInt(dayOfWeek, 10)] ?? dayOfWeek;
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      return `Weekly on ${dayName} at ${timeStr}`;
    }

    // Monthly: 0 9 1 * *
    if (dayOfWeek === "*" && month === "*" && dayOfMonth !== "*") {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      return `Monthly on day ${dayOfMonth} at ${timeStr}`;
    }

    // Quarterly: 0 9 1 1,4,7,10 *
    if (dayOfWeek === "*" && dayOfMonth === "1" && month.includes(",")) {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      return `Quarterly at ${timeStr}`;
    }

    return cronExpression;
  }
}

/**
 * Singleton instance for use in React components
 */
export const scheduleService = new ScheduleService();
