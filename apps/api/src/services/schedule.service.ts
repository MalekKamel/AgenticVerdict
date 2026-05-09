import { AppFault } from "@agenticverdict/core";
import { SchedulesRepository, type ExecutionHistoryResult } from "@agenticverdict/database";
import type { ScheduleDb } from "@agenticverdict/database";
import type {
  ScheduleRecord,
  ScheduleEntityType,
  ScheduleCreateInput,
  ScheduleUpdateInput,
  ScheduleValidationOutput,
  ScheduleConflict,
} from "@agenticverdict/types";
import {
  isValidCronExpression,
  computeNextRun,
  computeNextRuns,
  registerScheduleRepeatableJob,
  unregisterScheduleRepeatableJob,
  registerInsightScheduleRepeatableJob,
  unregisterInsightScheduleRepeatableJob,
} from "./schedule-bullmq";
import { REPORT_SCHEDULE_QUEUE } from "@agenticverdict/worker";

/**
 * Schedule Service Layer
 *
 * Orchestrates schedule CRUD, cron validation, conflict checking,
 * and BullMQ job registration/unregistration.
 *
 * All BullMQ operations are wrapped in try/catch for graceful degradation.
 */
export class ScheduleService {
  private repository: SchedulesRepository;

  constructor(repository?: SchedulesRepository) {
    this.repository = repository ?? new SchedulesRepository();
  }

  /**
   * Allow injecting repository for testing
   */
  static forTest(repository: SchedulesRepository): ScheduleService {
    return new ScheduleService(repository);
  }

  // ==========================================================================
  // Schedule CRUD
  // ==========================================================================

  /**
   * List all schedules for a tenant, optionally filtered by entity type
   */
  async listSchedules(
    tenantId: string,
    entityType?: ScheduleEntityType,
  ): Promise<ScheduleRecord[]> {
    return this.repository.findAll(tenantId, entityType);
  }

  /**
   * Get a single schedule by ID
   */
  async getSchedule(tenantId: string, scheduleId: string): Promise<ScheduleRecord> {
    const schedule = await this.repository.findById(tenantId, scheduleId);
    if (!schedule) {
      throw new AppFault({
        code: "RESOURCE_NOT_FOUND",
        category: "data_access",
        httpStatus: 404,
        retryable: false,
        safeMessage: "Schedule not found.",
      });
    }
    return schedule;
  }

  /**
   * Get a schedule by entity type and entity ID
   */
  async getScheduleByEntity(
    tenantId: string,
    entityType: ScheduleEntityType,
    entityId: string,
  ): Promise<ScheduleRecord | null> {
    return this.repository.findByEntity(tenantId, entityType, entityId);
  }

  /**
   * Create a new schedule with cron validation, nextRun computation, and BullMQ registration
   */
  async createSchedule(tenantId: string, data: ScheduleCreateInput): Promise<ScheduleRecord> {
    if (!isValidCronExpression(data.cronExpression)) {
      throw new AppFault({
        code: "VALIDATION_FAILED",
        category: "validation",
        httpStatus: 400,
        retryable: false,
        safeMessage: "Invalid cron expression.",
      });
    }

    const nextRunAt = computeNextRun(data.cronExpression, data.timezone);

    const schedule = await this.repository.create(tenantId, {
      entityType: data.entityType,
      entityId: data.entityId,
      cronExpression: data.cronExpression,
      timezone: data.timezone,
      enabled: data.enabled,
      metadata: data.metadata ?? {},
      nextRunAt,
      lastRunAt: null,
    });

    if (schedule.enabled) {
      await this.registerScheduleJob(schedule).catch(() => {
        // Graceful degradation: schedule created in DB but queue registration failed
      });
    }

    return schedule;
  }

  /**
   * Update a schedule with job unregister/re-register
   */
  async updateSchedule(
    tenantId: string,
    scheduleId: string,
    data: ScheduleUpdateInput,
  ): Promise<ScheduleRecord> {
    const existing = await this.repository.findById(tenantId, scheduleId);
    if (!existing) {
      throw new AppFault({
        code: "RESOURCE_NOT_FOUND",
        category: "data_access",
        httpStatus: 404,
        retryable: false,
        safeMessage: "Schedule not found.",
      });
    }

    if (data.cronExpression && !isValidCronExpression(data.cronExpression)) {
      throw new AppFault({
        code: "VALIDATION_FAILED",
        category: "validation",
        httpStatus: 400,
        retryable: false,
        safeMessage: "Invalid cron expression.",
      });
    }

    const cronExpression = data.cronExpression ?? existing.cronExpression;
    const timezone = data.timezone ?? existing.timezone;
    const nextRunAt = computeNextRun(cronExpression, timezone);

    const updated = await this.repository.update(tenantId, scheduleId, {
      ...(data.cronExpression && { cronExpression: data.cronExpression }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
      ...(data.metadata && { metadata: data.metadata }),
      nextRunAt,
    });

    if (!updated) {
      throw new AppFault({
        code: "INTERNAL_ERROR",
        category: "internal",
        httpStatus: 500,
        retryable: false,
        safeMessage: "Failed to update schedule.",
      });
    }

    await this.unregisterScheduleJob(scheduleId, existing.entityType).catch(() => {});

    if (updated.enabled) {
      await this.registerScheduleJob(updated).catch(() => {});
    }

    return updated;
  }

  /**
   * Delete a schedule with job unregistration
   */
  async deleteSchedule(tenantId: string, scheduleId: string): Promise<boolean> {
    const existing = await this.repository.findById(tenantId, scheduleId);
    if (!existing) {
      return false;
    }

    await this.unregisterScheduleJob(scheduleId, existing.entityType).catch(() => {});

    return this.repository.delete(tenantId, scheduleId);
  }

  /**
   * Toggle a schedule's enabled state with job register/unregister
   */
  async toggleSchedule(tenantId: string, scheduleId: string): Promise<ScheduleRecord> {
    const existing = await this.repository.findById(tenantId, scheduleId);
    if (!existing) {
      throw new AppFault({
        code: "RESOURCE_NOT_FOUND",
        category: "data_access",
        httpStatus: 404,
        retryable: false,
        safeMessage: "Schedule not found.",
      });
    }

    const newEnabled = !existing.enabled;
    const updated = await this.repository.update(tenantId, scheduleId, {
      enabled: newEnabled,
    });

    if (!updated) {
      throw new AppFault({
        code: "INTERNAL_ERROR",
        category: "internal",
        httpStatus: 500,
        retryable: false,
        safeMessage: "Failed to toggle schedule.",
      });
    }

    if (newEnabled) {
      await this.registerScheduleJob(updated).catch(() => {});
    } else {
      await this.unregisterScheduleJob(scheduleId, existing.entityType).catch(() => {});
    }

    return updated;
  }

  // ==========================================================================
  // Validation & Conflict Detection
  // ==========================================================================

  /**
   * Validate a schedule configuration, returning cron string and next 3 run times
   */
  async validateSchedule(
    tenantId: string,
    data: { cronExpression: string; timezone?: string },
  ): Promise<ScheduleValidationOutput> {
    if (!isValidCronExpression(data.cronExpression)) {
      throw new AppFault({
        code: "VALIDATION_FAILED",
        category: "validation",
        httpStatus: 400,
        retryable: false,
        safeMessage: "Invalid cron expression.",
      });
    }

    const timezone = data.timezone ?? "UTC";
    const nextRuns = computeNextRuns(data.cronExpression, timezone, 3);

    return {
      cronExpression: data.cronExpression,
      timezone,
      nextRuns,
    };
  }

  /**
   * Check for schedule conflicts
   */
  async checkConflicts(
    tenantId: string,
    entityType: ScheduleEntityType,
    cronExpression: string,
    excludeScheduleId?: string,
  ): Promise<ScheduleConflict> {
    const result = await this.repository.findConflicts(
      tenantId,
      entityType,
      cronExpression,
      excludeScheduleId,
    );

    return {
      hasConflict: result.hasConflict,
      conflictingScheduleId: result.conflictingScheduleId,
      conflictingCronExpression: result.conflictingCronExpression,
    };
  }

  // ==========================================================================
  // Execution History & Next Run
  // ==========================================================================

  /**
   * Get execution history for a schedule
   */
  async getExecutionHistory(
    tenantId: string,
    scheduleId: string,
    options?: { page?: number; pageSize?: number },
  ): Promise<ExecutionHistoryResult> {
    return this.repository.findExecutions(tenantId, scheduleId, options);
  }

  /**
   * Compute next run time for a schedule
   */
  async computeNextRun(tenantId: string, scheduleId: string): Promise<Date | null> {
    const schedule = await this.repository.findById(tenantId, scheduleId);
    if (!schedule) {
      return null;
    }

    return computeNextRun(schedule.cronExpression, schedule.timezone);
  }

  // ==========================================================================
  // Internal Helpers
  // ==========================================================================

  private async registerScheduleJob(schedule: ScheduleDb): Promise<void> {
    switch (schedule.entityType) {
      case "report":
        await registerScheduleRepeatableJob(
          REPORT_SCHEDULE_QUEUE,
          `report-schedule:${schedule.id}`,
          schedule.cronExpression,
          {
            tenantId: schedule.tenantId,
            scheduleId: schedule.id,
            cronExpression: schedule.cronExpression,
          },
        );
        break;
      case "insight":
        await registerInsightScheduleRepeatableJob(
          schedule.id,
          schedule.entityId,
          schedule.cronExpression,
          schedule.tenantId,
        );
        break;
    }
  }

  private async unregisterScheduleJob(
    scheduleId: string,
    entityType: ScheduleEntityType,
  ): Promise<void> {
    switch (entityType) {
      case "report":
        await unregisterScheduleRepeatableJob(
          REPORT_SCHEDULE_QUEUE,
          `report-schedule:${scheduleId}`,
        );
        break;
      case "insight":
        await unregisterInsightScheduleRepeatableJob(scheduleId);
        break;
    }
  }
}
