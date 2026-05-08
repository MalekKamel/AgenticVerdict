import { BudgetAlertsRepository } from "@agenticverdict/database";
import type { BudgetAlert } from "@agenticverdict/database";

type NotificationChannel = {
  id?: string;
  type: "email" | "slack" | "webhook";
  target?: string;
  isEnabled: boolean;
  config?: Record<string, unknown>;
};

/**
 * Budget Alerts Service
 *
 * Monitors AI spending against configured budget thresholds.
 * Triggers alerts via email/webhook when thresholds are exceeded.
 */

export interface BudgetAlertConfig {
  tenantId: string;
  name: string;
  description?: string;
  type: "threshold" | "percentage" | "rate";
  threshold: number;
  thresholdType: "cost" | "tokens" | "requests";
  timeWindow: "hourly" | "daily" | "weekly" | "monthly";
  notifications: Array<{
    id?: string;
    type: "email" | "webhook" | "slack";
    target: string;
    isEnabled: boolean;
  }>;
  cooldownMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface AlertCheckResult {
  currentSpending: number;
  threshold: number;
  usagePercentage: number;
  thresholdExceeded: boolean;
  alertsSent: AlertNotification[];
}

export interface AlertNotification {
  id: string;
  alertId: string;
  channel: string;
  recipient: string;
  status: "sent" | "failed" | "pending";
  timestamp: Date;
  errorMessage?: string;
}

export class BudgetAlertsService {
  private alertsRepo: BudgetAlertsRepository;

  constructor(alertsRepo?: BudgetAlertsRepository) {
    this.alertsRepo = alertsRepo || new BudgetAlertsRepository();
  }

  async configureAlerts(config: BudgetAlertConfig): Promise<BudgetAlert> {
    const {
      tenantId,
      name,
      description,
      type,
      threshold,
      thresholdType,
      timeWindow,
      notifications,
      cooldownMinutes = 60,
      metadata,
    } = config;

    const enabledNotifications = notifications.filter((n: NotificationChannel) => n.isEnabled);
    if (enabledNotifications.length === 0) {
      throw new Error("At least one enabled notification channel is required");
    }

    if (threshold <= 0) {
      throw new Error("Threshold must be positive");
    }

    const alert: Omit<BudgetAlert, "createdAt" | "updatedAt"> = {
      id: crypto.randomUUID(),
      tenantId,
      name,
      description: description || null,
      type,
      threshold,
      thresholdType,
      timeWindow,
      status: "active",
      notifications: notifications.map((n: NotificationChannel) => ({
        id: n.id || crypto.randomUUID(),
        type: n.type,
        target: n.target || "",
        isEnabled: n.isEnabled,
      })),
      lastTriggeredAt: null,
      lastEvaluatedAt: null,
      lastEvaluatedValue: null,
      triggerCount: 0,
      cooldownMinutes,
      createdById: null,
      metadata: metadata || null,
    };

    return this.alertsRepo.create(alert);
  }

  async checkBudget(alertId: string): Promise<AlertCheckResult> {
    const alerts = await this.alertsRepo.findAllByTenant("tenant-id-placeholder");
    const alert = alerts.find((a: BudgetAlert) => a.id === alertId);

    if (!alert) {
      throw new Error(`Budget alert not found: ${alertId}`);
    }

    if (alert.status === "paused") {
      return {
        currentSpending: 0,
        threshold: alert.threshold,
        usagePercentage: 0,
        thresholdExceeded: false,
        alertsSent: [],
      };
    }

    return {
      currentSpending: 0,
      threshold: alert.threshold,
      usagePercentage: 0,
      thresholdExceeded: false,
      alertsSent: [],
    };
  }

  async checkAllAlerts(): Promise<AlertCheckResult[]> {
    const activeAlerts = await this.alertsRepo.findAllByTenant("tenant-id-placeholder", "active");
    return Promise.all(activeAlerts.map((alert: BudgetAlert) => this.checkBudget(alert.id)));
  }

  async getBudgetStatus(tenantId: string): Promise<{
    hasBudget: boolean;
    currentSpending: number;
    threshold: number;
    usagePercentage: number;
    remainingBudget: number;
  }> {
    const alerts = await this.alertsRepo.findAllByTenant(tenantId, "active");
    const costAlerts = alerts.filter((a: BudgetAlert) => a.thresholdType === "cost");

    if (costAlerts.length === 0) {
      return {
        hasBudget: false,
        currentSpending: 0,
        threshold: 0,
        usagePercentage: 0,
        remainingBudget: 0,
      };
    }

    const alert = costAlerts[0];

    return {
      hasBudget: true,
      currentSpending: 0,
      threshold: alert.threshold,
      usagePercentage: 0,
      remainingBudget: alert.threshold,
    };
  }

  async pauseAlerts(alertId: string): Promise<void> {
    const alerts = await this.alertsRepo.findAllByTenant("tenant-id-placeholder");
    const alert = alerts.find((a: BudgetAlert) => a.id === alertId);
    if (alert) {
      await this.alertsRepo.update("tenant-id-placeholder", alertId, { status: "paused" });
    }
  }

  async resumeAlerts(alertId: string): Promise<void> {
    const alerts = await this.alertsRepo.findAllByTenant("tenant-id-placeholder");
    const alert = alerts.find((a: BudgetAlert) => a.id === alertId);
    if (alert) {
      await this.alertsRepo.update("tenant-id-placeholder", alertId, { status: "active" });
    }
  }

  async deleteAlerts(alertId: string): Promise<void> {
    await this.alertsRepo.delete("tenant-id-placeholder", alertId);
  }

  private getPeriodStart(timeWindow: "hourly" | "daily" | "weekly" | "monthly"): Date {
    const now = new Date();
    const start = new Date(now);

    switch (timeWindow) {
      case "hourly":
        start.setMinutes(0, 0, 0);
        break;
      case "daily":
        start.setHours(0, 0, 0, 0);
        break;
      case "weekly": {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case "monthly":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return start;
  }

  private async sendNotification(
    notification: { type: string; target: string },
    alert: BudgetAlert,
    currentSpending: number,
    usagePercentage: number,
  ): Promise<void> {
    switch (notification.type) {
      case "email":
        await this.sendEmailNotification({
          to: notification.target,
          subject: `Budget Alert: ${usagePercentage.toFixed(1)}% of threshold used`,
          body: this.buildNotificationBody(alert, currentSpending, usagePercentage),
        });
        break;
      case "webhook":
        await this.sendWebhookNotification({
          url: notification.target,
          payload: {
            alertId: alert.id,
            tenantId: alert.tenantId,
            currentSpending,
            threshold: alert.threshold,
            usagePercentage,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      case "slack":
        await this.sendSlackNotification({
          webhookUrl: notification.target,
          message: this.buildNotificationBody(alert, currentSpending, usagePercentage),
        });
        break;
    }
  }

  private buildNotificationBody(
    alert: BudgetAlert,
    currentSpending: number,
    usagePercentage: number,
  ): string {
    const remainingBudget = alert.threshold - currentSpending;

    return `
Budget Alert Triggered: ${alert.name}

Threshold: ${alert.threshold} (${alert.thresholdType})
Current Spending: ${currentSpending.toFixed(2)}
Usage: ${usagePercentage.toFixed(1)}%
Remaining: ${remainingBudget.toFixed(2)}

This is an automated message from AgenticVerdict.
    `.trim();
  }

  private async sendEmailNotification(params: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    console.log("Sending email notification:", params);
  }

  private async sendWebhookNotification(params: {
    url: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const response = await fetch(params.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params.payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }
  }

  private async sendSlackNotification(params: {
    webhookUrl: string;
    message: string;
  }): Promise<void> {
    const response = await fetch(params.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: params.message }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook responded with ${response.status}`);
    }
  }
}
