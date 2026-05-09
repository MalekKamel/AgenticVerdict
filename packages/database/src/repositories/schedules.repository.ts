import { createDatabaseClient } from "../client";
import {
  schedules,
  scheduleExecutions,
  type ScheduleDb,
  type ScheduleExecutionDb,
} from "../schema";
import { and, eq, desc, asc, type SQL } from "drizzle-orm";

/**
 * Execution history query options
 */
export interface ExecutionHistoryOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Execution history result with pagination metadata
 */
export interface ExecutionHistoryResult {
  executions: ScheduleExecutionDb[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Conflict check result
 */
export interface ConflictResult {
  hasConflict: boolean;
  conflictingScheduleId: string | null;
  conflictingCronExpression: string | null;
}

/**
 * Schedules Repository
 *
 * Handles all data access for the unified schedules system.
 * Enforces tenant isolation — all queries are scoped by tenant_id.
 */
export class SchedulesRepository {
  private db: ReturnType<typeof createDatabaseClient>;

  constructor(databaseUrl?: string) {
    this.db = createDatabaseClient(databaseUrl || process.env.DATABASE_URL!, {
      applicationName: "agenticverdict-schedules",
    });
  }

  /**
   * Allow injecting database client for testing
   */
  static forTest(db: ReturnType<typeof createDatabaseClient>): SchedulesRepository {
    const repo = new SchedulesRepository();
    repo.db = db;
    return repo;
  }

  // ==========================================================================
  // Schedule CRUD
  // ==========================================================================

  /**
   * Find a schedule by ID, scoped to tenant
   */
  async findById(tenantId: string, scheduleId: string): Promise<ScheduleDb | null> {
    const [result] = await this.db
      .select()
      .from(schedules)
      .where(and(eq(schedules.id, scheduleId), eq(schedules.tenantId, tenantId)));
    return result ?? null;
  }

  /**
   * Find a schedule by entity type and entity ID, scoped to tenant
   */
  async findByEntity(
    tenantId: string,
    entityType: ScheduleDb["entityType"],
    entityId: string,
  ): Promise<ScheduleDb | null> {
    const [result] = await this.db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.tenantId, tenantId),
          eq(schedules.entityType, entityType),
          eq(schedules.entityId, entityId),
        ),
      );
    return result ?? null;
  }

  /**
   * Find all schedules for a tenant, optionally filtered by entity type
   */
  async findAll(tenantId: string, entityType?: ScheduleDb["entityType"]): Promise<ScheduleDb[]> {
    const conditions: SQL[] = [eq(schedules.tenantId, tenantId)];
    if (entityType) {
      conditions.push(eq(schedules.entityType, entityType));
    }
    return this.db
      .select()
      .from(schedules)
      .where(and(...conditions))
      .orderBy(asc(schedules.createdAt));
  }

  /**
   * Find schedules with conflicting cron expressions (same tenant, entity type, and enabled)
   */
  async findConflicts(
    tenantId: string,
    entityType: ScheduleDb["entityType"],
    cronExpression: string,
    excludeScheduleId?: string,
  ): Promise<ConflictResult> {
    const conditions: SQL[] = [
      eq(schedules.tenantId, tenantId),
      eq(schedules.entityType, entityType),
      eq(schedules.cronExpression, cronExpression),
      eq(schedules.enabled, true),
    ];
    if (excludeScheduleId) {
      conditions.push(eq(schedules.id, excludeScheduleId) as unknown as SQL);
      // Use ne instead
    }

    const query = this.db
      .select({ id: schedules.id, cronExpression: schedules.cronExpression })
      .from(schedules)
      .where(
        and(
          eq(schedules.tenantId, tenantId),
          eq(schedules.entityType, entityType),
          eq(schedules.cronExpression, cronExpression),
          eq(schedules.enabled, true),
        ),
      );

    const results = await query;
    const filtered = excludeScheduleId
      ? results.filter((r) => r.id !== excludeScheduleId)
      : results;

    if (filtered.length === 0) {
      return { hasConflict: false, conflictingScheduleId: null, conflictingCronExpression: null };
    }

    return {
      hasConflict: true,
      conflictingScheduleId: filtered[0].id,
      conflictingCronExpression: filtered[0].cronExpression,
    };
  }

  /**
   * Create a new schedule
   */
  async create(
    tenantId: string,
    scheduleData: Omit<ScheduleDb, "id" | "createdAt" | "updatedAt" | "tenantId">,
  ): Promise<ScheduleDb> {
    const [result] = await this.db
      .insert(schedules)
      .values({ ...scheduleData, tenantId })
      .returning();
    return result;
  }

  /**
   * Update a schedule, scoped to tenant
   */
  async update(
    tenantId: string,
    scheduleId: string,
    scheduleData: Partial<Omit<ScheduleDb, "id" | "tenantId" | "createdAt" | "updatedAt">>,
  ): Promise<ScheduleDb | null> {
    const [result] = await this.db
      .update(schedules)
      .set({ ...scheduleData, updatedAt: new Date() })
      .where(and(eq(schedules.id, scheduleId), eq(schedules.tenantId, tenantId)))
      .returning();
    return result ?? null;
  }

  /**
   * Delete a schedule, scoped to tenant
   */
  async delete(tenantId: string, scheduleId: string): Promise<boolean> {
    const [result] = await this.db
      .delete(schedules)
      .where(and(eq(schedules.id, scheduleId), eq(schedules.tenantId, tenantId)))
      .returning({ id: schedules.id });
    return result !== undefined;
  }

  // ==========================================================================
  // Execution Audit Trail
  // ==========================================================================

  /**
   * Find execution history for a schedule, scoped to tenant, with pagination
   */
  async findExecutions(
    tenantId: string,
    scheduleId: string,
    options: ExecutionHistoryOptions = {},
  ): Promise<ExecutionHistoryResult> {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const results = await this.db
      .select()
      .from(scheduleExecutions)
      .where(
        and(
          eq(scheduleExecutions.scheduleId, scheduleId),
          eq(scheduleExecutions.tenantId, tenantId),
        ),
      )
      .orderBy(desc(scheduleExecutions.scheduledAt))
      .limit(pageSize)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: scheduleExecutions.id })
      .from(scheduleExecutions)
      .where(
        and(
          eq(scheduleExecutions.scheduleId, scheduleId),
          eq(scheduleExecutions.tenantId, tenantId),
        ),
      );

    return {
      executions: results,
      total: typeof count === "number" ? count : results.length,
      page,
      pageSize,
    };
  }

  /**
   * Create a new execution audit entry
   */
  async createExecution(
    tenantId: string,
    executionData: Omit<ScheduleExecutionDb, "id" | "createdAt">,
  ): Promise<ScheduleExecutionDb> {
    const [result] = await this.db
      .insert(scheduleExecutions)
      .values({ ...executionData, tenantId })
      .returning();
    return result;
  }

  /**
   * Update an execution audit entry, scoped to tenant
   */
  async updateExecution(
    tenantId: string,
    executionId: string,
    executionData: Partial<Omit<ScheduleExecutionDb, "id" | "tenantId" | "createdAt">>,
  ): Promise<ScheduleExecutionDb | null> {
    const [result] = await this.db
      .update(scheduleExecutions)
      .set(executionData)
      .where(and(eq(scheduleExecutions.id, executionId), eq(scheduleExecutions.tenantId, tenantId)))
      .returning();
    return result ?? null;
  }

  /**
   * Find all enabled schedules for recovery (no tenant filter — recovery iterates per tenant)
   */
  async findAllEnabled(): Promise<ScheduleDb[]> {
    return this.db
      .select()
      .from(schedules)
      .where(eq(schedules.enabled, true))
      .orderBy(asc(schedules.nextRunAt));
  }
}
