import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { dbScoped, insights, insightConnectors, auditTrail } from "@agenticverdict/database";
import { eq, and, desc, like, sql, gte, lte } from "drizzle-orm";
import { requireTrpcDatabase } from "../database";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import { randomUUID } from "crypto";

const logger = console;

const insightCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  templateId: z.string().optional(),
  enabled: z.boolean().default(true),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
    time: z.number().int().min(0).max(23),
  }),
  delivery: z.object({
    format: z.enum(["pdf", "excel", "both"]),
    emailRecipients: z.array(z.string().email()).optional(),
    enableWebhook: z.boolean().optional(),
    webhookUrl: z.string().url().optional().or(z.literal("")),
  }),
  aiConfig: z.object({
    model: z.string(),
    provider: z.enum(["anthropic", "openai"]).optional(),
    qualityLevel: z.enum(["standard", "premium"]).optional(),
    quality: z.number().optional(),
    detailLevel: z.enum(["executive", "standard", "comprehensive"]),
    customPrompt: z.string().optional(),
  }),
  connectors: z.array(
    z.object({
      connectorId: z.string(),
      enabled: z.boolean().default(true),
      selectedMetrics: z.array(z.string()).default([]),
      filters: z.record(z.unknown()).default({}),
    }),
  ),
});

const insightUpdateSchema = insightCreateSchema.partial();

const insightListInputSchema = z.object({
  status: z.enum(["enabled", "disabled", "all"]).optional().default("all"),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const insightOutputSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  templateId: z.string().nullable(),
  enabled: z.boolean(),
  domain: z.string().nullable(),
  status: z.enum(["idle", "running", "completed", "failed"]),
  lastRunAt: z.date().nullable(),
  lastRunStatus: z.enum(["success", "failed"]).nullable(),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
    time: z.number().int().min(0).max(23),
  }),
  delivery: z.object({
    format: z.enum(["pdf", "excel", "both"]),
    emailRecipients: z.array(z.string().email()).optional(),
    enableWebhook: z.boolean().optional(),
    webhookUrl: z.string().url().optional().or(z.literal("")),
  }),
  aiConfig: z.object({
    model: z.string(),
    provider: z.enum(["anthropic", "openai"]).optional(),
    qualityLevel: z.enum(["standard", "premium"]).optional(),
    quality: z.number().optional(),
    detailLevel: z.enum(["executive", "standard", "comprehensive"]),
    customPrompt: z.string().optional(),
  }),
  createdAt: z.date(),
  connectors: z.array(
    z.object({
      id: z.string(),
      connectorId: z.string(),
      enabled: z.boolean(),
      selectedMetrics: z.array(z.unknown()),
      filters: z.record(z.unknown()),
    }),
  ),
});

const insightListOutputSchema = z.object({
  insights: z.array(insightOutputSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const insightRouter = t.router({
  list: authedProcedure
    .input(insightListInputSchema)
    .output(insightListOutputSchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.list",
          input,
        },
        "insight.list.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const whereConditions = [eq(insights.tenantId, tenantId)];

          if (input.status !== "all") {
            whereConditions.push(eq(insights.enabled, input.status === "enabled"));
          }

          if (input.search) {
            whereConditions.push(like(insights.name, `%${input.search}%`));
          }

          const [insightRows, countResult] = await Promise.all([
            tx
              .select({
                id: insights.id,
                tenantId: insights.tenantId,
                name: insights.name,
                description: insights.description,
                templateId: insights.templateId,
                enabled: insights.enabled,
                domain: insights.domain,
                status: insights.status,
                lastRunAt: insights.lastRunAt,
                lastRunStatus: insights.lastRunStatus,
                schedule: insights.schedule,
                delivery: insights.delivery,
                aiConfig: insights.aiConfig,
                createdAt: insights.createdAt,
              })
              .from(insights)
              .where(and(...whereConditions))
              .orderBy(desc(insights.createdAt))
              .limit(input.pageSize)
              .offset((input.page - 1) * input.pageSize),

            tx
              .select({ count: sql<number>`count(*)` })
              .from(insights)
              .where(and(...whereConditions)),
          ]);

          const total = Number(countResult[0]?.count ?? 0);

          const insightIds = insightRows.map((i) => i.id);
          let connectorMappings = new Map<string, (typeof insightConnectors.$inferSelect)[]>();
          const executionStats = new Map<
            string,
            { status: string; lastRunAt: Date | null; lastRunStatus: string | null }
          >();

          if (insightIds.length > 0) {
            const connectorRows = await tx
              .select()
              .from(insightConnectors)
              .where(and(eq(insightConnectors.insightId, insightIds[0]!)));

            connectorMappings = new Map();
            for (const row of connectorRows) {
              const existing = connectorMappings.get(row.insightId) ?? [];
              existing.push(row);
              connectorMappings.set(row.insightId, existing);
            }

            const recentExecutions = await tx
              .select({
                insightId: auditTrail.insightId,
                status: auditTrail.status,
                timestamp: auditTrail.timestamp,
                eventType: auditTrail.eventType,
              })
              .from(auditTrail)
              .where(and(eq(auditTrail.tenantId, tenantId), eq(auditTrail.eventType, "run")))
              .orderBy(desc(auditTrail.timestamp));

            for (const exec of recentExecutions) {
              if (exec.insightId && !executionStats.has(exec.insightId)) {
                executionStats.set(exec.insightId, {
                  status: exec.status === "success" ? "completed" : "failed",
                  lastRunAt: exec.timestamp,
                  lastRunStatus: exec.status === "success" ? "success" : "failed",
                });
              }
            }
          }

          const insightsWithConnectors = insightRows.map((insight) => {
            const execStats = executionStats.get(insight.id);
            return {
              ...insight,
              status: (execStats?.status ?? insight.status) as
                | "idle"
                | "running"
                | "completed"
                | "failed",
              lastRunAt: execStats?.lastRunAt ?? insight.lastRunAt,
              lastRunStatus: (execStats?.lastRunStatus ?? insight.lastRunStatus) as
                | "success"
                | "failed"
                | null,
              connectors: connectorMappings.get(insight.id) ?? [],
              schedule: insight.schedule as {
                frequency: "daily" | "weekly" | "monthly" | "quarterly";
                time: number;
              },
              delivery: insight.delivery as {
                format: "pdf" | "excel" | "both";
                emailRecipients?: string[];
                enableWebhook?: boolean;
                webhookUrl?: string;
              },
              aiConfig: insight.aiConfig as {
                model: string;
                provider?: "anthropic" | "openai";
                qualityLevel?: "standard" | "premium";
                quality?: number;
                detailLevel: "executive" | "standard" | "comprehensive";
                customPrompt?: string;
              },
            };
          });

          return {
            insights: insightsWithConnectors,
            total,
            page: input.page,
            pageSize: input.pageSize,
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.list",
            duration: Date.now() - start,
            total: result.total,
          },
          "insight.list.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.list",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.list.error",
        );
        throw error;
      }
    }),

  detail: authedProcedure
    .input(z.object({ id: z.string() }))
    .output(insightOutputSchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.detail",
          insightId: input.id,
        },
        "insight.detail.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const insightRows = await tx
            .select()
            .from(insights)
            .where(and(eq(insights.id, input.id), eq(insights.tenantId, tenantId)))
            .limit(1);

          const insight = insightRows[0];
          if (!insight) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Insight not found",
            });
          }

          const connectorRows = await tx
            .select()
            .from(insightConnectors)
            .where(eq(insightConnectors.insightId, input.id));

          return {
            ...insight,
            status: insight.status as "idle" | "running" | "completed" | "failed",
            lastRunStatus: insight.lastRunStatus as "success" | "failed" | null,
            connectors: connectorRows,
            schedule: insight.schedule as {
              frequency: "daily" | "weekly" | "monthly" | "quarterly";
              time: number;
            },
            delivery: insight.delivery as {
              format: "pdf" | "excel" | "both";
              emailRecipients?: string[];
              enableWebhook?: boolean;
              webhookUrl?: string;
            },
            aiConfig: insight.aiConfig as {
              model: string;
              provider?: "anthropic" | "openai";
              qualityLevel?: "standard" | "premium";
              quality?: number;
              detailLevel: "executive" | "standard" | "comprehensive";
              customPrompt?: string;
            },
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.detail",
            duration: Date.now() - start,
          },
          "insight.detail.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.detail",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.detail.error",
        );
        throw error;
      }
    }),

  getById: authedProcedure
    .input(z.object({ id: z.string() }))
    .output(insightOutputSchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.getById",
          insightId: input.id,
        },
        "insight.getById.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const insightRows = await tx
            .select()
            .from(insights)
            .where(and(eq(insights.id, input.id), eq(insights.tenantId, tenantId)))
            .limit(1);

          const insight = insightRows[0];
          if (!insight) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Insight not found",
            });
          }

          const connectorRows = await tx
            .select()
            .from(insightConnectors)
            .where(eq(insightConnectors.insightId, input.id));

          return {
            ...insight,
            status: insight.status as "idle" | "running" | "completed" | "failed",
            lastRunStatus: insight.lastRunStatus as "success" | "failed" | null,
            connectors: connectorRows,
            schedule: insight.schedule as {
              frequency: "daily" | "weekly" | "monthly" | "quarterly";
              time: number;
            },
            delivery: insight.delivery as {
              format: "pdf" | "excel" | "both";
              emailRecipients?: string[];
              enableWebhook?: boolean;
              webhookUrl?: string;
            },
            aiConfig: insight.aiConfig as {
              model: string;
              provider?: "anthropic" | "openai";
              qualityLevel?: "standard" | "premium";
              quality?: number;
              detailLevel: "executive" | "standard" | "comprehensive";
              customPrompt?: string;
            },
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.getById",
            duration: Date.now() - start,
          },
          "insight.getById.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.getById",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.getById.error",
        );
        throw error;
      }
    }),

  create: authedProcedure
    .input(insightCreateSchema)
    .output(insightOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.create",
          input: { name: input.name },
        },
        "insight.create.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const [insight] = await tx
            .insert(insights)
            .values({
              tenantId,
              name: input.name,
              description: input.description ?? null,
              templateId: input.templateId ?? null,
              enabled: input.enabled,
              schedule: input.schedule,
              delivery: input.delivery,
              aiConfig: input.aiConfig,
            })
            .returning();

          if (!insight) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create insight",
            });
          }

          await tx.insert(auditTrail).values({
            tenantId,
            insightId: insight.id,
            actorSub: ctx.auth.userId,
            action: "create",
            eventType: "created",
            status: "success",
            metadata: { title: input.name, description: input.description },
            requestId: randomUUID(),
          });

          if (input.connectors.length > 0) {
            await tx.insert(insightConnectors).values(
              input.connectors.map((c) => ({
                insightId: insight.id,
                connectorId: c.connectorId,
                enabled: c.enabled,
                selectedMetrics: c.selectedMetrics,
                filters: c.filters,
              })),
            );
          }

          const connectorRows = await tx
            .select()
            .from(insightConnectors)
            .where(eq(insightConnectors.insightId, insight.id));

          return {
            ...insight,
            status: insight.status as "idle" | "running" | "completed" | "failed",
            lastRunStatus: insight.lastRunStatus as "success" | "failed" | null,
            connectors: connectorRows,
            schedule: insight.schedule as {
              frequency: "daily" | "weekly" | "monthly" | "quarterly";
              time: number;
            },
            delivery: insight.delivery as {
              format: "pdf" | "excel" | "both";
              emailRecipients?: string[];
              enableWebhook?: boolean;
              webhookUrl?: string;
            },
            aiConfig: insight.aiConfig as {
              model: string;
              provider?: "anthropic" | "openai";
              qualityLevel?: "standard" | "premium";
              quality?: number;
              detailLevel: "executive" | "standard" | "comprehensive";
              customPrompt?: string;
            },
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.create",
            duration: Date.now() - start,
            insightId: result.id,
          },
          "insight.create.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.create",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.create.error",
        );
        throw error;
      }
    }),

  update: authedProcedure
    .input(z.object({ id: z.string(), data: insightUpdateSchema }))
    .output(insightOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.update",
          insightId: input.id,
        },
        "insight.update.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const [insight] = await tx
            .update(insights)
            .set({
              ...input.data,
            })
            .where(and(eq(insights.id, input.id), eq(insights.tenantId, tenantId)))
            .returning();

          if (!insight) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Insight not found",
            });
          }

          await tx.insert(auditTrail).values({
            tenantId,
            insightId: insight.id,
            actorSub: ctx.auth.userId,
            action: "update",
            eventType: "updated",
            status: "success",
            metadata: { changes: input.data },
            requestId: randomUUID(),
          });

          if (input.data.connectors) {
            await tx.delete(insightConnectors).where(eq(insightConnectors.insightId, input.id));

            if (input.data.connectors.length > 0) {
              await tx.insert(insightConnectors).values(
                input.data.connectors.map((c) => ({
                  insightId: insight.id,
                  connectorId: c.connectorId,
                  enabled: c.enabled,
                  selectedMetrics: c.selectedMetrics,
                  filters: c.filters,
                })),
              );
            }
          }

          const connectorRows = await tx
            .select()
            .from(insightConnectors)
            .where(eq(insightConnectors.insightId, insight.id));

          return {
            ...insight,
            status: insight.status as "idle" | "running" | "completed" | "failed",
            lastRunStatus: insight.lastRunStatus as "success" | "failed" | null,
            connectors: connectorRows,
            schedule: insight.schedule as {
              frequency: "daily" | "weekly" | "monthly" | "quarterly";
              time: number;
            },
            delivery: insight.delivery as {
              format: "pdf" | "excel" | "both";
              emailRecipients?: string[];
              enableWebhook?: boolean;
              webhookUrl?: string;
            },
            aiConfig: insight.aiConfig as {
              model: string;
              provider?: "anthropic" | "openai";
              qualityLevel?: "standard" | "premium";
              quality?: number;
              detailLevel: "executive" | "standard" | "comprehensive";
              customPrompt?: string;
            },
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.update",
            duration: Date.now() - start,
            insightId: result.id,
          },
          "insight.update.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.update",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.update.error",
        );
        throw error;
      }
    }),

  delete: authedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.delete",
          insightId: input.id,
        },
        "insight.delete.start",
      );

      try {
        const db = requireTrpcDatabase();

        await dbScoped(db, async (tx) => {
          const [deleted] = await tx
            .delete(insights)
            .where(and(eq(insights.id, input.id), eq(insights.tenantId, tenantId)))
            .returning();

          if (!deleted) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Insight not found",
            });
          }

          await tx.insert(auditTrail).values({
            tenantId,
            insightId: input.id,
            actorSub: ctx.auth.userId,
            action: "delete",
            eventType: "deleted",
            status: "success",
            metadata: { deletedInsightId: input.id },
            requestId: randomUUID(),
          });
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.delete",
            duration: Date.now() - start,
          },
          "insight.delete.success",
        );

        return { success: true };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.delete",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.delete.error",
        );
        throw error;
      }
    }),

  run: authedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean(), jobId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.run",
          insightId: input.id,
        },
        "insight.run.start",
      );

      try {
        const db = requireTrpcDatabase();

        await dbScoped(db, async (tx) => {
          const [insight] = await tx
            .select()
            .from(insights)
            .where(and(eq(insights.id, input.id), eq(insights.tenantId, tenantId)))
            .limit(1);

          if (!insight) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Insight not found",
            });
          }
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.run",
            duration: Date.now() - start,
          },
          "insight.run.success",
        );

        return { success: true };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.run",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.run.error",
        );
        throw error;
      }
    }),

  getAuditTrail: authedProcedure
    .input(
      z.object({
        tenantId: z.string(),
        insightId: z.string(),
        eventType: z.enum(["run", "config_change", "delivery", "error"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .output(
      z.object({
        events: z.array(
          z.object({
            id: z.string(),
            insightId: z.string(),
            eventType: z.string(),
            status: z.string(),
            timestamp: z.string(),
            duration: z.number().optional(),
            metadata: z.record(z.unknown()).optional(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.getAuditTrail",
          insightId: input.insightId,
        },
        "insight.getAuditTrail.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const whereConditions = [
            eq(auditTrail.tenantId, tenantId),
            eq(auditTrail.insightId, input.insightId),
          ];

          if (input.eventType) {
            whereConditions.push(eq(auditTrail.eventType, input.eventType));
          }

          if (input.dateFrom) {
            whereConditions.push(gte(auditTrail.timestamp, new Date(input.dateFrom)));
          }

          if (input.dateTo) {
            whereConditions.push(lte(auditTrail.timestamp, new Date(input.dateTo)));
          }

          const events = await tx
            .select({
              id: auditTrail.id,
              insightId: auditTrail.insightId,
              eventType: auditTrail.eventType,
              status: auditTrail.status,
              timestamp: auditTrail.timestamp,
              duration: auditTrail.durationMs,
              metadata: auditTrail.metadata,
            })
            .from(auditTrail)
            .where(and(...whereConditions))
            .orderBy(desc(auditTrail.timestamp));

          return {
            events: events
              .filter((e): e is typeof e & { insightId: string } => e.insightId !== null)
              .map((event) => ({
                id: event.id,
                insightId: event.insightId,
                eventType: event.eventType,
                status: event.status,
                timestamp: event.timestamp?.toISOString() ?? new Date().toISOString(),
                duration: event.duration ?? undefined,
                metadata: event.metadata ?? undefined,
              })),
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "insight.getAuditTrail",
            duration: Date.now() - start,
            count: result.events.length,
          },
          "insight.getAuditTrail.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.getAuditTrail",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.getAuditTrail.error",
        );
        throw error;
      }
    }),

  getAIInsights: authedProcedure
    .input(z.object({ insightId: z.string(), reportId: z.string().optional() }))
    .output(
      z.object({
        performanceSummary: z.string().nullable(),
        keyFindings: z.array(z.string()),
        recommendations: z.array(z.string()),
        generatedAt: z.string().nullable(),
      }),
    )
    .query(async () => {
      return {
        performanceSummary: null,
        keyFindings: [],
        recommendations: [],
        generatedAt: null,
      };
    }),

  generateAIInsights: authedProcedure
    .input(z.object({ insightId: z.string(), reportId: z.string() }))
    .output(z.object({ success: z.boolean(), jobId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenant.tenantId;
      logger.info(
        {
          tenantId,
          procedure: "insight.generateAIInsights",
          insightId: input.insightId,
          reportId: input.reportId,
        },
        "insight.generateAIInsights.start",
      );

      try {
        const db = requireTrpcDatabase();

        await dbScoped(db, async (tx) => {
          const [insight] = await tx
            .select()
            .from(insights)
            .where(and(eq(insights.id, input.insightId), eq(insights.tenantId, tenantId)))
            .limit(1);

          if (!insight) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Insight not found",
            });
          }

          await tx.insert(auditTrail).values({
            tenantId,
            insightId: input.insightId,
            actorSub: ctx.auth.userId,
            action: "ai_generate",
            eventType: "ai_generated",
            status: "success",
            metadata: {
              trigger: "manual",
              reportId: input.reportId || "manual",
              insightName: insight.name,
            },
            requestId: randomUUID(),
          });
        });

        const jobId = randomUUID();

        logger.info(
          {
            tenantId,
            procedure: "insight.generateAIInsights",
            insightId: input.insightId,
            reportId: input.reportId,
            jobId,
          },
          "insight.generateAIInsights.success",
        );

        return { success: true, jobId };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.generateAIInsights",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.generateAIInsights.error",
        );
        throw error;
      }
    }),
});
