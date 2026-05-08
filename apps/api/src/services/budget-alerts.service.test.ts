/**
 * Budget Alerts Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { BudgetAlertsService } from "./budget-alerts.service";
import { BudgetAlertsRepository } from "@agenticverdict/database";

const mockRepository = {
  findAllByTenant: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  toggleStatus: vi.fn(),
  getActiveAlertsForEvaluation: vi.fn(),
  shouldTrigger: vi.fn(),
  recordTrigger: vi.fn(),
  updateEvaluation: vi.fn(),
  getTriggerHistory: vi.fn(),
  getRecentTriggers: vi.fn(),
  getOrCreatePeriodSummary: vi.fn(),
  updatePeriodSummary: vi.fn(),
  getCurrentPeriodSummary: vi.fn(),
  findByThresholdType: vi.fn(),
  findByTimeWindow: vi.fn(),
  countByTenant: vi.fn(),
  getTotalTriggersCount: vi.fn(),
} as unknown as BudgetAlertsRepository;

describe("BudgetAlertsService", () => {
  let service: BudgetAlertsService;
  const mockTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
    service = BudgetAlertsService.forTest(mockRepository);
  });

  describe("getAlertsForTenant", () => {
    it("should return all alerts for tenant", async () => {
      const mockAlerts = [
        {
          id: "alert-1",
          tenantId: mockTenantId,
          name: "Budget Alert 1",
          type: "threshold" as const,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          threshold: 1000,
          thresholdType: "cost",
          timeWindow: "monthly" as const,
          notifications: [],
          cooldownMinutes: 60,
          description: null,
          lastTriggeredAt: null,
          lastEvaluatedAt: null,
          evaluationCount: 0,
          triggerCount: 0,
          createdById: "user-1",
        },
        {
          id: "alert-2",
          tenantId: mockTenantId,
          name: "Budget Alert 2",
          type: "threshold" as const,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          threshold: 2000,
          thresholdType: "cost",
          timeWindow: "monthly" as const,
          notifications: [],
          cooldownMinutes: 60,
          description: null,
          lastTriggeredAt: null,
          lastEvaluatedAt: null,
          evaluationCount: 0,
          triggerCount: 0,
          createdById: "user-1",
        },
      ];

      vi.spyOn(mockRepository, "findAllByTenant").mockResolvedValue(mockAlerts as unknown);

      const result = await service.getAlertsForTenant(mockTenantId);

      expect(result).toEqual(mockAlerts);
    });

    it("should filter by status when provided", async () => {
      vi.spyOn(mockRepository, "findAllByTenant").mockResolvedValue([]);

      await service.getAlertsForTenant(mockTenantId, "active");

      expect(mockRepository.findAllByTenant).toHaveBeenCalledWith(mockTenantId, "active");
    });
  });

  describe("getAlertById", () => {
    it("should return alert by ID", async () => {
      const mockAlert = { id: "alert-123", tenantId: mockTenantId, name: "Test Alert" };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(mockAlert as unknown);

      const result = await service.getAlertById(mockTenantId, "alert-123");

      expect(result).toEqual(mockAlert);
    });

    it("should throw error when not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.getAlertById(mockTenantId, "non-existent")).rejects.toThrow(
        "Alert not found",
      );
    });
  });

  describe("createAlert", () => {
    it("should create new budget alert", async () => {
      const alertData = {
        name: "Monthly Budget",
        type: "threshold" as const,
        thresholdType: "cost" as const,
        threshold: 100000,
        timeWindow: "monthly" as const,
        notifications: [{ type: "email" as const, target: "test@example.com", isEnabled: true }],
      };

      const created = { id: "alert-new", tenantId: mockTenantId, ...alertData };

      vi.spyOn(mockRepository, "create").mockResolvedValue(created as unknown);

      const result = await service.createAlert(mockTenantId, alertData, "user-1");

      expect(result).toEqual(created);
    });
  });

  describe("updateAlert", () => {
    it("should update existing alert", async () => {
      const existing = { id: "alert-123", tenantId: mockTenantId, name: "Old Name" };
      const updateData = { name: "New Name" };
      const updated = { ...existing, ...updateData };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(existing as unknown);
      vi.spyOn(mockRepository, "update").mockResolvedValue(updated as unknown);

      const result = await service.updateAlert(mockTenantId, "alert-123", updateData);

      expect(result).toEqual(updated);
    });

    it("should throw error when alert not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(
        service.updateAlert(mockTenantId, "non-existent", { name: "Updated" }),
      ).rejects.toThrow("Alert not found");
    });
  });

  describe("deleteAlert", () => {
    it("should delete alert", async () => {
      const existing = { id: "alert-123", tenantId: mockTenantId, name: "Test Alert" };
      vi.spyOn(mockRepository, "findById").mockResolvedValue(existing as unknown);
      vi.spyOn(mockRepository, "delete").mockResolvedValue(true);

      const result = await service.deleteAlert(mockTenantId, "alert-123");

      expect(result).toBe(true);
    });
  });

  describe("toggleAlertStatus", () => {
    it("should toggle alert status", async () => {
      const alert = { id: "alert-123", status: "active" };
      const toggled = { ...alert, status: "paused" };

      vi.spyOn(mockRepository, "findById").mockResolvedValue(alert as unknown);
      vi.spyOn(mockRepository, "toggleStatus").mockResolvedValue(toggled as unknown);

      const result = await service.toggleAlert(mockTenantId, "alert-123", "paused");

      expect(result).toEqual(toggled);
      expect(result.status).toBe("paused");
    });

    it("should throw error when alert not found", async () => {
      vi.spyOn(mockRepository, "findById").mockResolvedValue(null);

      await expect(service.toggleAlert(mockTenantId, "non-existent", "paused")).rejects.toThrow(
        "Alert not found",
      );
    });
  });

  describe("evaluateAlerts", () => {
    it("should evaluate active alerts", async () => {
      const activeAlerts = [
        { id: "alert-1", threshold: 100000, thresholdType: "cost" },
        { id: "alert-2", threshold: 50000, thresholdType: "cost" },
      ];

      vi.spyOn(mockRepository, "getActiveAlertsForEvaluation").mockResolvedValue(
        activeAlerts as unknown,
      );
      vi.spyOn(mockRepository, "shouldTrigger").mockResolvedValue(false);
      vi.spyOn(mockRepository, "updateEvaluation").mockResolvedValue(undefined);

      const result = await service.evaluateAlerts(mockTenantId, {
        costCents: 75000,
        tokens: 0,
        requests: 0,
      });

      expect(result).toHaveLength(2);
      expect(result.every((r) => !r.triggered)).toBe(true);
    });

    it("should trigger alerts when threshold exceeded", async () => {
      const activeAlerts = [{ id: "alert-1", threshold: 50000, thresholdType: "cost" }];

      vi.spyOn(mockRepository, "getActiveAlertsForEvaluation").mockResolvedValue(
        activeAlerts as unknown,
      );
      vi.spyOn(mockRepository, "shouldTrigger").mockResolvedValue(true);
      vi.spyOn(mockRepository, "recordTrigger").mockResolvedValue();

      const result = await service.evaluateAlerts(mockTenantId, {
        costCents: 75000,
        tokens: 0,
        requests: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].triggered).toBe(true);
      expect(mockRepository.recordTrigger).toHaveBeenCalled();
    });
  });

  describe("getAlertTriggerHistory", () => {
    it("should return trigger history for alert", async () => {
      const history = [{ id: "trigger-1", triggeredValue: 150000, thresholdValue: 100000 }];

      vi.spyOn(mockRepository, "getTriggerHistory").mockResolvedValue(history as unknown);

      const result = await service.getAlertTriggerHistory(mockTenantId, "alert-123");

      expect(result).toEqual(history);
    });
  });

  describe("getCurrentPeriodSummary", () => {
    it("should return current period summary", async () => {
      const summary = {
        totalCostCents: 75000,
        budgetLimitCents: 100000,
        budgetUsedPercent: 75,
      };

      vi.spyOn(mockRepository, "getCurrentPeriodSummary").mockResolvedValue(summary as unknown);

      const result = await service.getCurrentPeriodSummary(mockTenantId, "monthly");

      expect(result).toEqual(summary);
    });
  });

  describe("Tenant isolation", () => {
    it("should always include tenantId in queries", async () => {
      const mockAlert = { id: "alert-123", tenantId: mockTenantId, name: "Test Alert" };
      vi.spyOn(mockRepository, "findById").mockResolvedValue(mockAlert as unknown);

      await service.getAlertById(mockTenantId, "alert-123");

      expect(mockRepository.findById).toHaveBeenCalledWith(mockTenantId, "alert-123");
    });
  });
});
