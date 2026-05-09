/**
 * Schedule Service Unit Tests
 *
 * Tests for ScheduleService business logic with mocked repository.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ScheduleService } from "./schedule.service";
import { SchedulesRepository } from "@agenticverdict/database";
import type { ScheduleRecord, ScheduleCreateInput } from "@agenticverdict/types";

vi.mock("./schedule-bullmq", () => ({
  isValidCronExpression: vi.fn((expr: string) => expr.split(" ").length === 5),
  computeNextRun: vi.fn(() => new Date(Date.now() + 3600000)),
  computeNextRuns: vi.fn(() => [
    new Date(Date.now() + 3600000),
    new Date(Date.now() + 86400000),
    new Date(Date.now() + 172800000),
  ]),
  registerScheduleRepeatableJob: vi.fn(),
  unregisterScheduleRepeatableJob: vi.fn(),
  registerInsightScheduleRepeatableJob: vi.fn(),
  unregisterInsightScheduleRepeatableJob: vi.fn(),
}));

const mockRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEntity: vi.fn(),
  findConflicts: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findExecutions: vi.fn(),
  createExecution: vi.fn(),
  updateExecution: vi.fn(),
} as unknown as SchedulesRepository;

describe("ScheduleService", () => {
  let service: ScheduleService;
  const mockTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
    service = ScheduleService.forTest(mockRepository);
  });

  describe("listSchedules", () => {
    it("should return all schedules for tenant", async () => {
      const mockSchedules: ScheduleRecord[] = [
        {
          id: "sched-1",
          tenantId: mockTenantId,
          entityType: "insight",
          entityId: "entity-1",
          cronExpression: "0 9 * * *",
          timezone: "UTC",
          enabled: true,
          metadata: {},
          nextRunAt: new Date(),
          lastRunAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sched-2",
          tenantId: mockTenantId,
          entityType: "report",
          entityId: "entity-2",
          cronExpression: "0 10 * * 1",
          timezone: "UTC",
          enabled: false,
          metadata: {},
          nextRunAt: null,
          lastRunAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.spyOn(mockRepository, "findAll").mockResolvedValue(mockSchedules);

      const result = await service.listSchedules(mockTenantId);
      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith(mockTenantId, undefined);
    });

    it("should filter by entity type", async () => {
      vi.spyOn(mockRepository, "findAll").mockResolvedValue([]);

      await service.listSchedules(mockTenantId, "insight");
      expect(mockRepository.findAll).toHaveBeenCalledWith(mockTenantId, "insight");
    });
  });

  describe("getSchedule", () => {
    it("should return schedule by ID", async () => {
      const mockSchedule: ScheduleRecord = {
        id: "sched-1",
        tenantId: mockTenantId,
        entityType: "insight",
        entityId: "entity-1",
        cronExpression: "0 9 * * *",
        timezone: "UTC",
        enabled: true,
        metadata: {},
        nextRunAt: new Date(),
        lastRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(mockRepository, "findById").mockResolvedValue(mockSchedule);

      const result = await service.getSchedule(mockTenantId, "sched-1");
      expect(result.id).toBe("sched-1");
    });

    it("should throw if schedule not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.getSchedule(mockTenantId, "nonexistent")).rejects.toThrow();
    });
  });

  describe("createSchedule", () => {
    it("should create schedule with valid cron", async () => {
      const mockSchedule: ScheduleRecord = {
        id: "sched-1",
        tenantId: mockTenantId,
        entityType: "insight",
        entityId: "entity-1",
        cronExpression: "0 9 * * *",
        timezone: "UTC",
        enabled: true,
        metadata: {},
        nextRunAt: new Date(),
        lastRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(mockRepository, "create").mockResolvedValue(mockSchedule);

      const input: ScheduleCreateInput = {
        entityType: "insight",
        entityId: "entity-1",
        cronExpression: "0 9 * * *",
        timezone: "UTC",
        enabled: true,
      };

      const result = await service.createSchedule(mockTenantId, input);
      expect(result.id).toBe("sched-1");
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it("should throw for invalid cron expression", async () => {
      const input: ScheduleCreateInput = {
        entityType: "insight",
        entityId: "entity-1",
        cronExpression: "invalid",
        timezone: "UTC",
        enabled: true,
      };

      await expect(service.createSchedule(mockTenantId, input)).rejects.toThrow();
    });
  });

  describe("toggleSchedule", () => {
    it("should toggle enabled to disabled", async () => {
      const existing: ScheduleRecord = {
        id: "sched-1",
        tenantId: mockTenantId,
        entityType: "insight",
        entityId: "entity-1",
        cronExpression: "0 9 * * *",
        timezone: "UTC",
        enabled: true,
        metadata: {},
        nextRunAt: new Date(),
        lastRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const toggled: ScheduleRecord = { ...existing, enabled: false };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(existing);
      vi.spyOn(mockRepository, "update").mockResolvedValue(toggled);

      const result = await service.toggleSchedule(mockTenantId, "sched-1");
      expect(result.enabled).toBe(false);
    });

    it("should toggle disabled to enabled", async () => {
      const existing: ScheduleRecord = {
        id: "sched-1",
        tenantId: mockTenantId,
        entityType: "insight",
        entityId: "entity-1",
        cronExpression: "0 9 * * *",
        timezone: "UTC",
        enabled: false,
        metadata: {},
        nextRunAt: new Date(),
        lastRunAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const toggled: ScheduleRecord = { ...existing, enabled: true };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(existing);
      vi.spyOn(mockRepository, "update").mockResolvedValue(toggled);

      const result = await service.toggleSchedule(mockTenantId, "sched-1");
      expect(result.enabled).toBe(true);
    });
  });

  describe("checkConflicts", () => {
    it("should return conflict when found", async () => {
      vi.spyOn(mockRepository, "findConflicts").mockResolvedValue({
        hasConflict: true,
        conflictingScheduleId: "sched-2",
        conflictingCronExpression: "0 9 * * *",
      });

      const result = await service.checkConflicts(mockTenantId, "insight", "0 9 * * *");
      expect(result.hasConflict).toBe(true);
      expect(result.conflictingScheduleId).toBe("sched-2");
    });

    it("should return no conflict when none found", async () => {
      vi.spyOn(mockRepository, "findConflicts").mockResolvedValue({
        hasConflict: false,
        conflictingScheduleId: null,
        conflictingCronExpression: null,
      });

      const result = await service.checkConflicts(mockTenantId, "insight", "0 9 * * *");
      expect(result.hasConflict).toBe(false);
    });
  });

  describe("validateSchedule", () => {
    it("should return cron and next runs for valid expression", async () => {
      const result = await service.validateSchedule(mockTenantId, {
        cronExpression: "0 9 * * *",
        timezone: "UTC",
      });
      expect(result.cronExpression).toBe("0 9 * * *");
      expect(result.nextRuns).toHaveLength(3);
    });

    it("should throw for invalid cron expression", async () => {
      await expect(
        service.validateSchedule(mockTenantId, { cronExpression: "invalid" }),
      ).rejects.toThrow();
    });
  });
});
