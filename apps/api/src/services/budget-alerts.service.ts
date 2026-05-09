import { BudgetAlertsRepository } from "@agenticverdict/database";
import type { SyncFrequency, AlertStatus } from "@agenticverdict/types";
import { createBudgetAlertSchema, updateBudgetAlertSchema } from "@agenticverdict/types";
import type { z } from "zod";

/**
 * Budget Alerts Service
 *
 * Business logic for budget alert management.
 * Handles threshold monitoring, alert triggering, and notifications.
 */

export class BudgetAlertsService {
  private repository: BudgetAlertsRepository;

  constructor(repository?: BudgetAlertsRepository) {
    this.repository = repository || new BudgetAlertsRepository();
  }

  /**
   * Allow injecting repository for testing
   */
  static forTest(repository: BudgetAlertsRepository): BudgetAlertsService {
    return new BudgetAlertsService(repository);
  }

  // ==========================================================================
  // Alert CRUD
  // ==========================================================================

  /**
   * Get all alerts for tenant
   */
  async getAlertsForTenant(tenantId: string, status?: AlertStatus) {
    return this.repository.findAllByTenant(tenantId, status);
  }

  /**
   * Get alert by ID
   */
  async getAlertById(tenantId: string, alertId: string) {
    const alert = await this.repository.findById(tenantId, alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }
    return alert;
  }

  /**
   * Create new alert
   */
  async createAlert(
    tenantId: string,
    data: z.infer<typeof createBudgetAlertSchema>,
    createdById: string,
  ) {
    // Validate
    const validatedData = createBudgetAlertSchema.parse(data);

    // Validate notifications
    this.validateNotifications(validatedData.notifications);

    // Create alert
    return this.repository.create({
      tenantId,
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      threshold: validatedData.threshold,
      thresholdType: validatedData.thresholdType,
      timeWindow: validatedData.timeWindow,
      status: "active",
      notifications: validatedData.notifications,
      cooldownMinutes: 60,
      createdById,
    });
  }

  /**
   * Update alert
   */
  async updateAlert(
    tenantId: string,
    alertId: string,
    data: z.infer<typeof updateBudgetAlertSchema>,
  ) {
    // Validate
    const validatedData = updateBudgetAlertSchema.parse(data);

    // Check alert exists
    const existing = await this.repository.findById(tenantId, alertId);
    if (!existing) {
      throw new Error("Alert not found");
    }

    // Validate notifications if being updated
    if (validatedData.notifications) {
      this.validateNotifications(validatedData.notifications);
    }

    // Update alert
    return this.repository.update(tenantId, alertId, validatedData);
  }

  /**
   * Delete alert
   */
  async deleteAlert(tenantId: string, alertId: string): Promise<boolean> {
    const alert = await this.repository.findById(tenantId, alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    return this.repository.delete(tenantId, alertId);
  }

  /**
   * Toggle alert status
   */
  async toggleAlert(tenantId: string, alertId: string, status: "active" | "paused") {
    const alert = await this.repository.findById(tenantId, alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    return this.repository.toggleStatus(tenantId, alertId, status);
  }

  // ==========================================================================
  // Threshold Monitoring
  // ==========================================================================

  /**
   * Evaluate all active alerts for tenant
   */
  async evaluateAlerts(
    tenantId: string,
    currentUsage: {
      costCents: number;
      tokens: number;
      requests: number;
    },
  ): Promise<
    Array<{
      alertId: string;
      triggered: boolean;
      currentValue: number;
      thresholdValue: number;
    }>
  > {
    const activeAlerts = await this.repository.getActiveAlertsForEvaluation(tenantId);
    const results = [];

    for (const alert of activeAlerts) {
      let currentValue: number;
      let thresholdValue: number;

      // Get current value based on threshold type
      switch (alert.thresholdType) {
        case "cost":
          currentValue = currentUsage.costCents;
          thresholdValue = alert.threshold;
          break;
        case "tokens":
          currentValue = currentUsage.tokens;
          thresholdValue = alert.threshold;
          break;
        case "requests":
          currentValue = currentUsage.requests;
          thresholdValue = alert.threshold;
          break;
        default:
          continue;
      }

      // Check if should trigger
      const shouldTrigger = await this.repository.shouldTrigger(tenantId, alert.id, currentValue);

      if (shouldTrigger) {
        results.push({
          alertId: alert.id,
          triggered: true,
          currentValue,
          thresholdValue,
        });

        // Record trigger
        await this.repository.recordTrigger(tenantId, alert.id, currentValue, thresholdValue);
      } else {
        // Update evaluation timestamp
        await this.repository.updateEvaluation(tenantId, alert.id, currentValue);

        results.push({
          alertId: alert.id,
          triggered: false,
          currentValue,
          thresholdValue,
        });
      }
    }

    return results;
  }

  /**
   * Check specific alert
   */
  async checkAlert(
    tenantId: string,
    alertId: string,
    currentValue: number,
  ): Promise<{
    triggered: boolean;
    currentValue: number;
    thresholdValue: number;
  }> {
    const alert = await this.repository.findById(tenantId, alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    const shouldTrigger = await this.repository.shouldTrigger(tenantId, alertId, currentValue);

    if (shouldTrigger) {
      await this.repository.recordTrigger(tenantId, alertId, currentValue, alert.threshold);
    } else {
      await this.repository.updateEvaluation(tenantId, alertId, currentValue);
    }

    return {
      triggered: shouldTrigger,
      currentValue,
      thresholdValue: alert.threshold,
    };
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  /**
   * Send alert notifications
   * Note: Actual notification sending should integrate with email/webhook services
   */
  async sendNotifications(
    _alertId: string,
    notifications: Array<{
      type: string;
      target: string;
      isEnabled: boolean;
    }>,
  ): Promise<Array<{ type: string; target: string; success: boolean }>> {
    // Simulate notification send
    const results: Array<{ type: string; target: string; success: boolean }> = [];

    for (const notification of notifications) {
      try {
        await this.simulateNotificationSend();
        results.push({ type: notification.type, target: notification.target, success: true });
      } catch {
        results.push({ type: notification.type, target: notification.target, success: false });
      }
    }

    return results;
  }

  /**
   * Send notification for an alert trigger
   */
  private async sendNotification(
    notifications: Array<{
      type: string;
      target: string;
      isEnabled: boolean;
    }>,
  ): Promise<
    Array<{
      type: string;
      target: string;
      status: "sent" | "failed" | "pending";
      errorMessage?: string;
    }>
  > {
    const results = [];

    for (const notification of notifications) {
      if (!notification.isEnabled) {
        results.push({
          type: notification.type,
          target: notification.target,
          status: "pending" as const,
        });
        continue;
      }

      try {
        // In production, this would send actual notifications
        // For now, simulate success
        await this.simulateNotificationSend();

        results.push({
          type: notification.type,
          target: notification.target,
          status: "sent" as const,
        });
      } catch (error) {
        results.push({
          type: notification.type,
          target: notification.target,
          status: "failed" as const,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Simulate notification send (replace with actual implementation)
   */
  private async simulateNotificationSend(): Promise<void> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error("Simulated notification failure");
    }
  }

  // ==========================================================================
  // Budget Period Summaries
  // ==========================================================================

  /**
   * Get current period summary
   */
  async getCurrentPeriodSummary(tenantId: string, periodType: "daily" | "monthly") {
    return this.repository.getCurrentPeriodSummary(tenantId, periodType);
  }

  /**
   * Update period summary
   */
  async updatePeriodSummary(
    tenantId: string,
    periodType: SyncFrequency,
    periodStart: Date,
    updates: {
      totalCostCents?: number;
      totalTokens?: number;
      totalRequests?: number;
      _budgetLimitCents?: number;
      budgetUsedPercent?: number;
      projectedCostCents?: number;
      daysRemaining?: number;
      dailyAverageCostCents?: number;
      alertsTriggered?: number;
    },
  ) {
    return this.repository.updatePeriodSummary(tenantId, periodType, periodStart, updates);
  }

  /**
   * Calculate budget usage percentage
   */
  calculateBudgetUsage(currentCostCents: number, budgetLimitCents: number): number {
    if (budgetLimitCents <= 0) {
      return 0;
    }

    return Math.round((currentCostCents / budgetLimitCents) * 10000); // Basis points
  }

  /**
   * Project end-of-period cost
   */
  projectEndOfPeriodCost(currentCostCents: number, daysElapsed: number, totalDays: number): number {
    if (daysElapsed <= 0) {
      return currentCostCents;
    }

    const dailyAverage = currentCostCents / daysElapsed;
    return Math.round(dailyAverage * totalDays);
  }

  // ==========================================================================
  // Alert History
  // ==========================================================================

  /**
   * Get trigger history for alert
   */
  async getAlertTriggerHistory(tenantId: string, alertId: string, limit = 50) {
    return this.repository.getTriggerHistory(tenantId, alertId, limit);
  }

  /**
   * Get recent triggers across all alerts
   */
  async getRecentTriggers(tenantId: string, limit = 100) {
    return this.repository.getRecentTriggers(tenantId, limit);
  }

  // ==========================================================================
  // Validation Helpers
  // ==========================================================================

  /**
   * Validate notification channels
   */
  private validateNotifications(
    notifications: Array<{
      id?: string;
      type: string;
      target: string;
      isEnabled: boolean;
    }>,
  ): void {
    if (notifications.length === 0) {
      throw new Error("At least one notification channel is required");
    }

    for (const notification of notifications) {
      // Validate type
      const validTypes = ["email", "webhook", "slack"];
      if (!validTypes.includes(notification.type)) {
        throw new Error(`Invalid notification type: ${notification.type}`);
      }

      // Validate target
      if (!notification.target || notification.target.trim() === "") {
        throw new Error("Notification target is required");
      }

      // Validate target format based on type
      switch (notification.type) {
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notification.target)) {
            throw new Error(`Invalid email address: ${notification.target}`);
          }
          break;
        case "webhook":
          if (!notification.target.startsWith("http")) {
            throw new Error(`Invalid webhook URL: ${notification.target}`);
          }
          break;
        case "slack":
          if (!notification.target.startsWith("#") && !notification.target.startsWith("@")) {
            throw new Error("Slack target must start with # (channel) or @ (user)");
          }
          break;
      }
    }
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Count alerts for tenant
   */
  async countAlerts(tenantId: string): Promise<number> {
    return this.repository.countByTenant(tenantId);
  }

  /**
   * Get total triggers count
   */
  async getTotalTriggersCount(tenantId: string): Promise<number> {
    return this.repository.getTotalTriggersCount(tenantId);
  }

  /**
   * Get alerts by threshold type
   */
  async getAlertsByThresholdType(tenantId: string, thresholdType: "cost" | "tokens" | "requests") {
    return this.repository.findByThresholdType(tenantId, thresholdType);
  }

  /**
   * Get alerts by time window
   */
  async getAlertsByTimeWindow(
    tenantId: string,
    timeWindow: "hourly" | "daily" | "weekly" | "monthly",
  ) {
    return this.repository.findByTimeWindow(tenantId, timeWindow);
  }
}
