import { createDatabaseClient } from "../client";
import {
  budgetAlerts,
  alertTriggerHistory,
  budgetPeriodSummaries,
  type BudgetAlert,
  type NewBudgetAlert,
  type AlertTriggerHistory,
  type BudgetPeriodSummary,
  type AlertStatus,
  type AlertTimeWindow,
} from "../schema/budget-alerts";
import { and, eq, desc, sql } from "drizzle-orm";

/**
 * Budget Alerts Repository
 *
 * Handles all database operations for budget alert management.
 * Implements threshold monitoring and alert triggering.
 * Enforces tenant isolation at the repository level.
 */

export class BudgetAlertsRepository {
  private db: ReturnType<typeof createDatabaseClient>;

  constructor(databaseUrl?: string) {
    this.db = createDatabaseClient(databaseUrl || process.env.DATABASE_URL!, {
      applicationName: "agenticverdict-budget-alerts",
    });
  }

  /**
   * Allow injecting database client for testing
   */
  static forTest(db: ReturnType<typeof createDatabaseClient>): BudgetAlertsRepository {
    const repo = new BudgetAlertsRepository();
    repo.db = db;
    return repo;
  }

  // ==========================================================================
  // Budget Alert CRUD
  // ==========================================================================

  /**
   * Find all alerts for a tenant
   */
  async findAllByTenant(tenantId: string, status?: AlertStatus): Promise<BudgetAlert[]> {
    const conditions = [eq(budgetAlerts.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(budgetAlerts.status, status));
    }

    return this.db
      .select()
      .from(budgetAlerts)
      .where(and(...conditions))
      .orderBy(desc(budgetAlerts.createdAt));
  }

  /**
   * Find alert by ID with tenant isolation
   */
  async findById(tenantId: string, id: string): Promise<BudgetAlert | null> {
    const results = await this.db
      .select()
      .from(budgetAlerts)
      .where(and(eq(budgetAlerts.tenantId, tenantId), eq(budgetAlerts.id, id)))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Create new alert
   */
  async create(data: NewBudgetAlert): Promise<BudgetAlert> {
    const results = await this.db.insert(budgetAlerts).values(data).returning();
    return results[0];
  }

  /**
   * Update alert
   */
  async update(
    tenantId: string,
    id: string,
    data: Partial<NewBudgetAlert>,
  ): Promise<BudgetAlert | null> {
    const results = await this.db
      .update(budgetAlerts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(budgetAlerts.tenantId, tenantId), eq(budgetAlerts.id, id)))
      .returning();

    return results[0] || null;
  }

  /**
   * Delete alert
   */
  async delete(tenantId: string, id: string): Promise<boolean> {
    const results = await this.db
      .delete(budgetAlerts)
      .where(and(eq(budgetAlerts.tenantId, tenantId), eq(budgetAlerts.id, id)))
      .returning({ id: budgetAlerts.id });

    return results.length > 0;
  }

  /**
   * Toggle alert status
   */
  async toggleStatus(
    tenantId: string,
    id: string,
    status: "active" | "paused",
  ): Promise<BudgetAlert | null> {
    return this.update(tenantId, id, { status });
  }

  // ==========================================================================
  // Threshold Monitoring
  // ==========================================================================

  /**
   * Get active alerts for evaluation
   */
  async getActiveAlertsForEvaluation(tenantId: string): Promise<BudgetAlert[]> {
    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    return this.db
      .select()
      .from(budgetAlerts)
      .where(
        and(
          eq(budgetAlerts.tenantId, tenantId),
          eq(budgetAlerts.status, "active"),
          sql`${budgetAlerts.lastTriggeredAt} IS NULL OR ${budgetAlerts.lastTriggeredAt} < ${cooldownCutoff}`,
        ),
      );
  }

  /**
   * Check if alert should trigger based on current value
   */
  async shouldTrigger(tenantId: string, alertId: string, currentValue: number): Promise<boolean> {
    const alert = await this.findById(tenantId, alertId);
    if (!alert || alert.status !== "active") {
      return false;
    }

    // Check cooldown period
    if (alert.lastTriggeredAt) {
      const cooldownMs = (alert.cooldownMinutes || 60) * 60 * 1000;
      const timeSinceLastTrigger = Date.now() - alert.lastTriggeredAt.getTime();
      if (timeSinceLastTrigger < cooldownMs) {
        return false;
      }
    }

    // Check threshold based on type
    switch (alert.type) {
      case "threshold":
        return currentValue >= alert.threshold;
      case "percentage":
        // Percentage requires budget limit context (handled in service layer)
        return false;
      case "rate":
        // Rate of change requires historical data (handled in service layer)
        return false;
      default:
        return false;
    }
  }

  /**
   * Record alert trigger
   */
  async recordTrigger(
    tenantId: string,
    alertId: string,
    triggeredValue: number,
    thresholdValue: number,
    notificationsSent?: Array<{
      type: string;
      target: string;
      status: "sent" | "failed" | "pending";
      errorMessage?: string;
      sentAt?: string;
    }> | null,
  ): Promise<void> {
    // Update alert
    await this.db
      .update(budgetAlerts)
      .set({
        lastTriggeredAt: new Date(),
        lastEvaluatedAt: new Date(),
        lastEvaluatedValue: triggeredValue,
        triggerCount: sql`${budgetAlerts.triggerCount} + 1`,
      })
      .where(and(eq(budgetAlerts.tenantId, tenantId), eq(budgetAlerts.id, alertId)));

    // Record trigger history
    await this.db.insert(alertTriggerHistory).values({
      alertId,
      tenantId,
      triggeredValue,
      thresholdValue,
      exceededBy: triggeredValue - thresholdValue,
      triggeredAt: new Date(),
      notificationsSent: notificationsSent ?? null,
    });
  }

  /**
   * Update alert evaluation timestamp
   */
  async updateEvaluation(tenantId: string, alertId: string, evaluatedValue: number): Promise<void> {
    await this.db
      .update(budgetAlerts)
      .set({
        lastEvaluatedAt: new Date(),
        lastEvaluatedValue: evaluatedValue,
      })
      .where(and(eq(budgetAlerts.tenantId, tenantId), eq(budgetAlerts.id, alertId)));
  }

  // ==========================================================================
  // Trigger History
  // ==========================================================================

  /**
   * Get trigger history for alert
   */
  async getTriggerHistory(
    tenantId: string,
    alertId: string,
    limit = 50,
  ): Promise<AlertTriggerHistory[]> {
    return this.db
      .select()
      .from(alertTriggerHistory)
      .where(
        and(eq(alertTriggerHistory.tenantId, tenantId), eq(alertTriggerHistory.alertId, alertId)),
      )
      .orderBy(desc(alertTriggerHistory.triggeredAt))
      .limit(limit);
  }

  /**
   * Get recent triggers across all alerts
   */
  async getRecentTriggers(tenantId: string, limit = 100): Promise<AlertTriggerHistory[]> {
    return this.db
      .select()
      .from(alertTriggerHistory)
      .where(eq(alertTriggerHistory.tenantId, tenantId))
      .orderBy(desc(alertTriggerHistory.triggeredAt))
      .limit(limit);
  }

  // ==========================================================================
  // Budget Period Summaries
  // ==========================================================================

  /**
   * Get or create period summary
   */
  async getOrCreatePeriodSummary(
    tenantId: string,
    periodType: "hourly" | "daily" | "weekly" | "monthly",
    periodStart: Date,
    periodEnd: Date,
  ): Promise<BudgetPeriodSummary> {
    // Try to find existing
    const existing = await this.db
      .select()
      .from(budgetPeriodSummaries)
      .where(
        and(
          eq(budgetPeriodSummaries.tenantId, tenantId),
          eq(budgetPeriodSummaries.periodType, periodType),
          eq(budgetPeriodSummaries.periodStart, periodStart),
        ),
      )
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    // Create new
    const results = await this.db
      .insert(budgetPeriodSummaries)
      .values({
        tenantId,
        periodType,
        periodStart,
        periodEnd,
        totalCostCents: 0,
        totalTokens: 0,
        totalRequests: 0,
        budgetUsedPercent: 0,
        alertsTriggered: 0,
      })
      .returning();

    return results[0];
  }

  /**
   * Update period summary with new data
   */
  async updatePeriodSummary(
    tenantId: string,
    periodType: AlertTimeWindow,
    periodStart: Date,
    updates: {
      totalCostCents?: number;
      totalTokens?: number;
      totalRequests?: number;
      budgetLimitCents?: number;
      budgetUsedPercent?: number;
      projectedCostCents?: number;
      daysRemaining?: number;
      dailyAverageCostCents?: number;
      alertsTriggered?: number;
    },
  ): Promise<BudgetPeriodSummary | null> {
    const setClause: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Handle incremental updates
    if (updates.totalCostCents !== undefined) {
      setClause.totalCostCents = sql`${budgetPeriodSummaries.totalCostCents} + ${updates.totalCostCents}`;
    }
    if (updates.totalTokens !== undefined) {
      setClause.totalTokens = sql`${budgetPeriodSummaries.totalTokens} + ${updates.totalTokens}`;
    }
    if (updates.totalRequests !== undefined) {
      setClause.totalRequests = sql`${budgetPeriodSummaries.totalRequests} + ${updates.totalRequests}`;
    }
    if (updates.alertsTriggered !== undefined) {
      setClause.alertsTriggered = sql`${budgetPeriodSummaries.alertsTriggered} + ${updates.alertsTriggered}`;
    }

    // Handle absolute updates
    if (updates.budgetLimitCents !== undefined) {
      setClause.budgetLimitCents = updates.budgetLimitCents;
    }
    if (updates.budgetUsedPercent !== undefined) {
      setClause.budgetUsedPercent = updates.budgetUsedPercent;
    }
    if (updates.projectedCostCents !== undefined) {
      setClause.projectedCostCents = updates.projectedCostCents;
    }
    if (updates.daysRemaining !== undefined) {
      setClause.daysRemaining = updates.daysRemaining;
    }
    if (updates.dailyAverageCostCents !== undefined) {
      setClause.dailyAverageCostCents = updates.dailyAverageCostCents;
    }

    const results = await this.db
      .update(budgetPeriodSummaries)
      .set(setClause)
      .where(
        and(
          eq(budgetPeriodSummaries.tenantId, tenantId),
          eq(budgetPeriodSummaries.periodType, periodType),
          eq(budgetPeriodSummaries.periodStart, periodStart),
        ),
      )
      .returning();

    return results[0] || null;
  }

  /**
   * Get current period summary
   */
  async getCurrentPeriodSummary(
    tenantId: string,
    periodType: "daily" | "monthly",
  ): Promise<BudgetPeriodSummary | null> {
    const now = new Date();
    const periodStart = new Date(
      periodType === "daily"
        ? now.setHours(0, 0, 0, 0)
        : new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    );

    const results = await this.db
      .select()
      .from(budgetPeriodSummaries)
      .where(
        and(
          eq(budgetPeriodSummaries.tenantId, tenantId),
          eq(budgetPeriodSummaries.periodType, periodType),
          eq(budgetPeriodSummaries.periodStart, periodStart),
        ),
      )
      .limit(1);

    return results[0] || null;
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Get alerts by threshold type
   */
  async findByThresholdType(
    tenantId: string,
    thresholdType: "cost" | "tokens" | "requests",
  ): Promise<BudgetAlert[]> {
    return this.db
      .select()
      .from(budgetAlerts)
      .where(
        and(eq(budgetAlerts.tenantId, tenantId), eq(budgetAlerts.thresholdType, thresholdType)),
      );
  }

  /**
   * Get alerts by time window
   */
  async findByTimeWindow(
    tenantId: string,
    timeWindow: "hourly" | "daily" | "weekly" | "monthly",
  ): Promise<BudgetAlert[]> {
    return this.db
      .select()
      .from(budgetAlerts)
      .where(and(eq(budgetAlerts.tenantId, tenantId), eq(budgetAlerts.timeWindow, timeWindow)));
  }

  /**
   * Count alerts by tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(budgetAlerts)
      .where(eq(budgetAlerts.tenantId, tenantId));

    return Number(results[0]?.count || 0);
  }

  /**
   * Get total triggers count for tenant
   */
  async getTotalTriggersCount(tenantId: string): Promise<number> {
    const results = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(alertTriggerHistory)
      .where(eq(alertTriggerHistory.tenantId, tenantId));

    return Number(results[0]?.count || 0);
  }
}
