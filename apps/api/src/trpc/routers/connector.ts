import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  connectorCreateInputSchema,
  connectorCreateOutputSchema,
  connectorDeleteInputSchema,
  connectorDeleteOutputSchema,
  connectorDetailOutputSchema,
  connectorListInputSchema,
  connectorListOutputSchema,
  connectorSyncInputSchema,
  connectorSyncOutputSchema,
  connectorTestInputSchema,
  connectorTestOutputSchema,
  connectorUpdateInputSchema,
  connectorUpdateOutputSchema,
  connectorRemovalPreviewSchema,
} from "@agenticverdict/types";
import { dbScoped, tenantConnectors, connectorSyncHistory } from "@agenticverdict/database";
import { and, desc, eq, ilike, sql } from "drizzle-orm";

import { t } from "../init";
import { authedProcedure } from "../procedures";
import { requireTrpcDatabase } from "../database";

function toIsoDateString(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function toIsoDateStringOrNull(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return toIsoDateString(value);
}

export const connectorRouter = t.router({
  list: authedProcedure
    .input(connectorListInputSchema)
    .output(connectorListOutputSchema)
    .query(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const conditions = [eq(tenantConnectors.tenantId, tenantId)];
        if (input.status) {
          conditions.push(eq(tenantConnectors.status, input.status));
        }
        if (input.domain) {
          conditions.push(eq(tenantConnectors.domain, input.domain));
        }
        if (input.search) {
          conditions.push(ilike(tenantConnectors.name, `%${input.search}%`));
        }

        const where = and(...conditions);

        const countResult = await tx
          .select({ count: sql<number>`count(*)` })
          .from(tenantConnectors)
          .where(where);
        const rawTotal = countResult[0]?.count;
        const total =
          typeof rawTotal === "number"
            ? rawTotal
            : Number.isFinite(Number(rawTotal))
              ? Number(rawTotal)
              : 0;

        const rows = await tx
          .select()
          .from(tenantConnectors)
          .where(where)
          .orderBy(desc(tenantConnectors.updatedAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize);

        const items = rows.map((row) => ({
          id: row.id,
          platform: row.platform as "meta" | "ga4" | "gsc" | "gbp" | "tiktok",
          name: row.name,
          status: row.status as "healthy" | "warning" | "error" | "inactive" | "syncing",
          domain: row.domain ?? null,
          lastSyncAt: toIsoDateStringOrNull(row.lastSyncAt),
          lastSyncStatus: row.lastSyncStatus as "success" | "warning" | "error" | null,
          metricsCount: Array.isArray(row.metrics) ? row.metrics.length : 0,
        }));

        return {
          items,
          total,
          page: input.page,
          pageSize: input.pageSize,
        };
      });
    }),

  detail: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(connectorDetailOutputSchema)
    .query(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const rows = await tx
          .select()
          .from(tenantConnectors)
          .where(and(eq(tenantConnectors.id, input.id), eq(tenantConnectors.tenantId, tenantId)))
          .limit(1);
        const row = rows[0];
        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Connector not found" });
        }

        const historyRows = await tx
          .select()
          .from(connectorSyncHistory)
          .where(eq(connectorSyncHistory.connectorId, row.id))
          .orderBy(desc(connectorSyncHistory.startedAt))
          .limit(30);

        return {
          id: row.id,
          platform: row.platform as "meta" | "ga4" | "gsc" | "gbp" | "tiktok",
          name: row.name,
          status: row.status as "healthy" | "warning" | "error" | "inactive" | "syncing",
          domain: row.domain ?? null,
          config: (row.config as Record<string, unknown>) ?? {},
          metrics: Array.isArray(row.metrics) ? row.metrics : [],
          syncFrequency: row.syncFrequency ?? null,
          retentionDays: row.retentionDays ?? null,
          notifications: (row.notifications as Record<string, boolean>) ?? {},
          advancedOptions: (row.advancedOptions as Record<string, unknown>) ?? {},
          lastSyncAt: toIsoDateStringOrNull(row.lastSyncAt),
          nextSyncAt: toIsoDateStringOrNull(row.nextSyncAt),
          lastSyncStatus: row.lastSyncStatus as "success" | "warning" | "error" | null,
          lastSyncRecords: row.lastSyncRecords ?? null,
          paused: row.paused,
          createdAt: toIsoDateString(row.createdAt),
          updatedAt: toIsoDateString(row.updatedAt),
          syncHistory: historyRows.map((h) => ({
            id: h.id,
            status: h.status as "success" | "warning" | "error",
            records: h.records ?? null,
            message: h.message ?? null,
            startedAt: toIsoDateString(h.startedAt),
            completedAt: toIsoDateStringOrNull(h.completedAt),
          })),
          recentData: [],
          activeMetrics: Array.isArray(row.metrics) ? row.metrics : [],
          issues: [],
        };
      });
    }),

  create: authedProcedure
    .input(connectorCreateInputSchema)
    .output(connectorCreateOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const inserted = await tx
          .insert(tenantConnectors)
          .values({
            tenantId,
            platform: input.platform,
            name: input.name,
            domain: input.domain ?? null,
            config: input.config,
            metrics: input.metrics,
            syncFrequency: input.syncFrequency ?? "daily",
            retentionDays: input.retentionDays ?? 90,
            notifications: input.notifications,
            advancedOptions: input.advancedOptions,
            status: "inactive",
          })
          .returning({ id: tenantConnectors.id });

        const id = inserted[0]?.id;
        if (!id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create connector",
          });
        }
        return { id, success: true };
      });
    }),

  update: authedProcedure
    .input(connectorUpdateInputSchema)
    .output(connectorUpdateOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const setValues: Record<string, unknown> = { updatedAt: new Date() };
        if (input.name !== undefined) setValues.name = input.name;
        if (input.domain !== undefined) setValues.domain = input.domain ?? null;
        if (input.config !== undefined) setValues.config = input.config;
        if (input.metrics !== undefined) setValues.metrics = input.metrics;
        if (input.syncFrequency !== undefined) setValues.syncFrequency = input.syncFrequency;
        if (input.retentionDays !== undefined) setValues.retentionDays = input.retentionDays;
        if (input.notifications !== undefined) setValues.notifications = input.notifications;
        if (input.advancedOptions !== undefined) setValues.advancedOptions = input.advancedOptions;

        await tx
          .update(tenantConnectors)
          .set(setValues)
          .where(and(eq(tenantConnectors.id, input.id), eq(tenantConnectors.tenantId, tenantId)));

        return { success: true };
      });
    }),

  delete: authedProcedure
    .input(connectorDeleteInputSchema)
    .output(connectorDeleteOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        if (input.pause) {
          await tx
            .update(tenantConnectors)
            .set({ paused: true, status: "inactive", updatedAt: new Date() })
            .where(and(eq(tenantConnectors.id, input.id), eq(tenantConnectors.tenantId, tenantId)));
        } else {
          await tx
            .delete(tenantConnectors)
            .where(and(eq(tenantConnectors.id, input.id), eq(tenantConnectors.tenantId, tenantId)));
        }
        return { success: true };
      });
    }),

  sync: authedProcedure
    .input(connectorSyncInputSchema)
    .output(connectorSyncOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const rows = await tx
          .select()
          .from(tenantConnectors)
          .where(and(eq(tenantConnectors.id, input.id), eq(tenantConnectors.tenantId, tenantId)))
          .limit(1);
        const row = rows[0];
        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Connector not found" });
        }

        await tx
          .update(tenantConnectors)
          .set({ status: "syncing", updatedAt: new Date() })
          .where(eq(tenantConnectors.id, input.id));

        const syncId = crypto.randomUUID();
        await tx.insert(connectorSyncHistory).values({
          connectorId: input.id,
          tenantId,
          status: "success",
          startedAt: new Date(),
        });

        return { success: true, syncId };
      });
    }),

  test: authedProcedure
    .input(connectorTestInputSchema)
    .output(connectorTestOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const rows = await tx
          .select()
          .from(tenantConnectors)
          .where(and(eq(tenantConnectors.id, input.id), eq(tenantConnectors.tenantId, tenantId)))
          .limit(1);
        const row = rows[0];
        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Connector not found" });
        }

        // Stub: always returns success for MVP
        return { success: true, message: "Connection successful", severity: "success" };
      });
    }),

  removalPreview: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(connectorRemovalPreviewSchema)
    .query(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const rows = await tx
          .select()
          .from(tenantConnectors)
          .where(and(eq(tenantConnectors.id, input.id), eq(tenantConnectors.tenantId, tenantId)))
          .limit(1);
        const row = rows[0];
        if (!row) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Connector not found" });
        }

        return {
          connector: {
            id: row.id,
            name: row.name,
            platform: row.platform as "meta" | "ga4" | "gsc" | "gbp" | "tiktok",
          },
          impacts: [
            "Data collection will stop",
            "Existing insights will show historical data only",
            "No new reports will include this connector",
            "Historical data will be retained for 90 days",
            "The connector can be reconnected anytime",
          ],
          affectedInsights: [],
          dataRetentionDays: 90,
        };
      });
    }),

  metrics: authedProcedure
    .input(z.object({ connectorIds: z.array(z.string().uuid()) }))
    .output(
      z.array(
        z.object({
          connectorId: z.string().uuid(),
          connectorName: z.string(),
          metrics: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string(),
            }),
          ),
        }),
      ),
    )
    .query(async ({ input, ctx }) => {
      const db = requireTrpcDatabase();
      const tenantId = ctx.tenant.tenantId;

      return dbScoped(db, async (tx) => {
        const rows = await tx
          .select()
          .from(tenantConnectors)
          .where(
            and(
              eq(tenantConnectors.tenantId, tenantId),
              eq(tenantConnectors.id, input.connectorIds[0]!),
            ),
          )
          .limit(1);

        if (!rows.length || !rows[0]) {
          return [];
        }

        const row = rows[0];
        const metricIds = Array.isArray(row.metrics) ? row.metrics : [];

        const metricDefinitions: Record<string, { name: string; description: string }> = {
          sessions: { name: "Sessions", description: "Total number of sessions" },
          users: { name: "Users", description: "Total number of users" },
          pageviews: { name: "Pageviews", description: "Total page views" },
          "bounce-rate": { name: "Bounce Rate", description: "Percentage of single-page sessions" },
          "conversion-rate": {
            name: "Conversion Rate",
            description: "Percentage of sessions that converted",
          },
          impressions: { name: "Impressions", description: "Total number of ad impressions" },
          clicks: { name: "Clicks", description: "Total number of clicks" },
          ctr: { name: "CTR", description: "Click-through rate" },
          cpc: { name: "CPC", description: "Cost per click" },
          roas: { name: "ROAS", description: "Return on ad spend" },
        };

        const metrics = metricIds
          .map((id) => {
            const def = metricDefinitions[id];
            if (!def) return null;
            return { id, name: def.name, description: def.description };
          })
          .filter((m): m is { id: string; name: string; description: string } => m !== null);

        return [
          {
            connectorId: row.id,
            connectorName: row.name,
            metrics,
          },
        ];
      });
    }),
});
