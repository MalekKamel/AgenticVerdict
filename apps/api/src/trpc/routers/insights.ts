import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  dbScoped,
  insights,
  insightConnectors,
  auditTrail,
  reports,
  dataConnectors,
  tenantConnectors,
  businessDomains,
  domainConnectorAssignments,
} from "@agenticverdict/database";
import { eq, and, desc, asc, like, sql, inArray, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireTrpcDatabase } from "../database";
import { authedProcedure, authedProcedureWithPermission, rateLimitMiddleware } from "../procedures";
import { t } from "../init";
import { ProviderFactory } from "@agenticverdict/agent-runtime";
import { loadTenantConfig } from "@agenticverdict/config";
import {
  AUDIT_EVENT_TYPE_VALUES,
  AuditEventType,
  PERMISSIONS,
  insightDeliverySchema,
  insightAiConfigSchema,
  insightCreateSchema,
  insightListInputSchema,
  insightOutputSchema,
  insightListOutputSchema,
  INSIGHT_STATUSES,
  DB_RUN_STATUSES,
} from "@agenticverdict/types";
import { enqueueInsightExecution, isBullmqConfigured } from "../../services/report-bullmq";
import { createPinoLogger } from "@agenticverdict/observability";

const logger = createPinoLogger("api");

const insightUpdateSchema = insightCreateSchema.partial();

// Supported models per provider
const SUPPORTED_MODELS: Record<string, string[]> = {
  anthropic: ["claude-3.5-sonnet", "claude-3-opus", "claude-3-haiku", "claude-3-5-sonnet"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  google: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
};

/**
 * Validates provider ID against registered providers
 * Throws TRPCError if provider is not registered
 */
function validateProvider(providerId?: string) {
  if (!providerId) {
    return; // Provider is optional, use default
  }

  if (!ProviderFactory.isRegistered(providerId)) {
    const availableProviders = ProviderFactory.listProviders();
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Provider "${providerId}" is not available. Available providers: ${availableProviders.join(", ")}`,
    });
  }
}

/**
 * Validates AI model against supported models for the selected provider
 */
function validateModel(provider?: string, model?: string) {
  if (!provider || !model) return;

  const supported = SUPPORTED_MODELS[provider];
  if (supported && !supported.includes(model)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Model "${model}" is not supported for provider "${provider}". Supported models: ${supported.join(", ")}`,
    });
  }
}

/**
 * Maps database error codes to canonical TRPC error codes
 */
function mapDatabaseError(error: unknown): never {
  if (error instanceof TRPCError) throw error;

  const err = error as { code?: string; detail?: string };
  const message = err.detail ?? (error instanceof Error ? error.message : "Unknown error");

  if (
    err.code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("already exists")
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `A resource with this name already exists. Please choose a different name.`,
    });
  }

  if (err.code === "23503" || message.includes("violates foreign key")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Referenced resource not found. Please check your selections and try again.`,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `An unexpected error occurred while processing your request.`,
  });
}

/**
 * Validates that all connector IDs exist before creating/updating insight
 */
async function validateConnectors(db: unknown, connectorIds: string[]): Promise<void> {
  if (connectorIds.length === 0) return;

  const actualDb = db as Record<string, unknown>;
  const tx = actualDb as {
    select: () => {
      from: (table: unknown) => { where: (condition: unknown) => Promise<{ id: string }[]> };
    };
  };

  const existing = await tx
    .select()
    .from(dataConnectors)
    .where(inArray(dataConnectors.id, connectorIds));

  const existingIds = new Set(existing.map((c) => c.id));
  const missing = connectorIds.filter((id) => !existingIds.has(id));

  if (missing.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `The following connectors do not exist: ${missing.join(", ")}`,
    });
  }
}

const aiModelsOutputSchema = z.object({
  providers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      models: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          recommended: z.boolean(),
        }),
      ),
    }),
  ),
});

const aiDefaultsOutputSchema = z.object({
  model: z.string().nullable(),
  quality: z.string().nullable(),
  detailLevel: z.string().nullable(),
});

const connectorDomainsOutputSchema = z.object({
  domains: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      connectorCount: z.number(),
    }),
  ),
});

const tenantConfigOutputSchema = z.object({
  shareLinkExpiryHours: z.number().min(1).max(720),
  defaultAiModel: z.string().nullable(),
  defaultAiProvider: z.string().nullable(),
  defaultAiQuality: z.string().nullable(),
  defaultAiDetailLevel: z.string().nullable(),
  detailLevelOptions: z.array(
    z.object({
      value: z.string(),
      labelKey: z.string(),
      order: z.number().optional(),
    }),
  ),
  frequencyOptions: z.array(
    z.object({
      value: z.string(),
      labelKey: z.string(),
      order: z.number().optional(),
    }),
  ),
  formatOptions: z.array(
    z.object({
      value: z.string(),
      labelKey: z.string(),
      order: z.number().optional(),
    }),
  ),
});

export const insightRouter = t.router({
  ai: t.router({
    models: authedProcedure.output(aiModelsOutputSchema).query(async () => {
      const registeredProviders = ProviderFactory.listProviders();
      const providers = registeredProviders.map((providerId) => {
        const models = SUPPORTED_MODELS[providerId] ?? [];
        const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
        return {
          id: providerId,
          name: providerName,
          models: models.map((model, index) => ({
            value: model,
            label: model.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            recommended: index === 0,
          })),
        };
      });

      return { providers };
    }),

    defaults: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
      .output(aiDefaultsOutputSchema)
      .query(async ({ ctx }) => {
        const tenantId = ctx.tenant!.tenantId;

        try {
          const tenantConfig = await loadTenantConfig(tenantId);
          const aiConfig = tenantConfig.ai;

          return {
            model: aiConfig?.defaultModel?.modelId ?? null,
            quality: aiConfig?.defaultModel?.providerId ?? null,
            detailLevel: "standard",
          };
        } catch {
          return {
            model: null,
            quality: null,
            detailLevel: "standard",
          };
        }
      }),
  }),

  connector: t.router({
    domains: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
      .output(connectorDomainsOutputSchema)
      .query(async ({ ctx }) => {
        const tenantId = ctx.tenant!.tenantId;
        const db = requireTrpcDatabase();

        return dbScoped(db, async (tx) => {
          const activeConnectors = await tx
            .select({
              id: tenantConnectors.id,
              platform: tenantConnectors.platform,
            })
            .from(tenantConnectors)
            .where(
              and(
                eq(tenantConnectors.tenantId, tenantId),
                eq(tenantConnectors.status, "active"),
                eq(tenantConnectors.paused, false),
              ),
            );

          if (activeConnectors.length === 0) {
            const tenantDomains = await tx
              .select({
                id: businessDomains.id,
                name: businessDomains.name,
                connectorCount: count(domainConnectorAssignments.connectorId),
              })
              .from(businessDomains)
              .leftJoin(
                domainConnectorAssignments,
                and(
                  eq(domainConnectorAssignments.domainId, businessDomains.id),
                  eq(domainConnectorAssignments.tenantId, tenantId),
                ),
              )
              .where(eq(businessDomains.tenantId, tenantId))
              .groupBy(businessDomains.id, businessDomains.name)
              .orderBy(asc(businessDomains.order), asc(businessDomains.name));

            return {
              domains: tenantDomains.map((d) => ({
                value: d.id,
                label: d.name,
                connectorCount: Number(d.connectorCount),
              })),
            };
          }

          const connectorIds = activeConnectors.map((c) => c.id);

          // Query user-defined business domains with connector assignments
          const domainRows = await tx
            .select({
              id: businessDomains.id,
              name: businessDomains.name,
              connectorCount: count(domainConnectorAssignments.connectorId),
            })
            .from(businessDomains)
            .leftJoin(
              domainConnectorAssignments,
              and(
                eq(domainConnectorAssignments.domainId, businessDomains.id),
                eq(domainConnectorAssignments.tenantId, tenantId),
                inArray(domainConnectorAssignments.connectorId, connectorIds),
              ),
            )
            .where(eq(businessDomains.tenantId, tenantId))
            .groupBy(businessDomains.id, businessDomains.name)
            .orderBy(asc(businessDomains.order), asc(businessDomains.name));

          return {
            domains: domainRows.map((d) => ({
              value: d.id,
              label: d.name,
              connectorCount: Number(d.connectorCount),
            })),
          };
        });
      }),
  }),

  tenant: t.router({
    config: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
      .output(tenantConfigOutputSchema)
      .query(async ({ ctx }) => {
        const tenantId = ctx.tenant!.tenantId;

        try {
          const tenantConfig = await loadTenantConfig(tenantId);
          const aiConfig = tenantConfig.ai;
          const shareExpiry = 168;
          const insightsConfig = tenantConfig.business?.insights as
            | {
                detailLevelOptions?: Array<{ value: string; labelKey: string; order?: number }>;
                frequencyOptions?: Array<{ value: string; labelKey: string; order?: number }>;
                formatOptions?: Array<{ value: string; labelKey: string; order?: number }>;
              }
            | undefined;

          const cappedExpiry = Math.max(1, Math.min(720, shareExpiry));

          return {
            shareLinkExpiryHours: cappedExpiry,
            defaultAiModel: aiConfig?.defaultModel?.modelId ?? null,
            defaultAiProvider: aiConfig?.primaryProvider ?? null,
            defaultAiQuality: null,
            defaultAiDetailLevel: aiConfig?.defaultDetailLevel ?? null,
            detailLevelOptions: insightsConfig?.detailLevelOptions ?? [],
            frequencyOptions: insightsConfig?.frequencyOptions ?? [],
            formatOptions: insightsConfig?.formatOptions ?? [],
          };
        } catch {
          return {
            shareLinkExpiryHours: 168,
            defaultAiModel: null,
            defaultAiProvider: null,
            defaultAiQuality: null,
            defaultAiDetailLevel: null,
            detailLevelOptions: [],
            frequencyOptions: [],
            formatOptions: [],
          };
        }
      }),
  }),

  list: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
    .input(insightListInputSchema)
    .output(insightListOutputSchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant!.tenantId;

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

          if (input.domain) {
            whereConditions.push(eq(insights.domain, input.domain));
          }

          const orderByMap = {
            name: input.sortDirection === "asc" ? asc(insights.name) : desc(insights.name),
            createdAt:
              input.sortDirection === "asc" ? asc(insights.createdAt) : desc(insights.createdAt),
            lastRunAt:
              input.sortDirection === "asc" ? asc(insights.lastRunAt) : desc(insights.lastRunAt),
            status: input.sortDirection === "asc" ? asc(insights.status) : desc(insights.status),
          };

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
                delivery: insights.delivery,
                aiConfig: insights.aiConfig,
                createdAt: insights.createdAt,
              })
              .from(insights)
              .where(and(...whereConditions))
              .orderBy(orderByMap[input.sortField])
              .limit(input.pageSize)
              .offset((input.page - 1) * input.pageSize),

            tx
              .select({ count: sql<number>`count(*)` })
              .from(insights)
              .where(and(...whereConditions)),
          ]);

          const total = Number(countResult[0]?.count ?? 0);

          const insightIds = insightRows.map((i) => i.id);
          let connectorMappings = new Map<
            string,
            Array<{
              id: string;
              connectorId: string;
              insightId: string;
              enabled: boolean;
              selectedMetrics: string[];
              filters: Record<string, unknown>;
            }>
          >();
          const executionStats = new Map<
            string,
            { status: string; lastRunAt: Date | null; lastRunStatus: string | null }
          >();

          if (insightIds.length > 0) {
            const connectorRows = await tx
              .select()
              .from(insightConnectors)
              .where(inArray(insightConnectors.insightId, insightIds));

            connectorMappings = new Map();
            for (const row of connectorRows) {
              const existing = connectorMappings.get(row.insightId) ?? [];
              existing.push({
                ...row,
                selectedMetrics: (row.selectedMetrics ?? []) as string[],
                filters: (row.filters ?? {}) as Record<string, unknown>,
              });
              connectorMappings.set(row.insightId, existing);
            }

            const recentExecutions = await tx
              .select({
                insightId: auditTrail.insightId,
                eventType: auditTrail.eventType,
                createdAt: auditTrail.createdAt,
                eventData: auditTrail.eventData,
              })
              .from(auditTrail)
              .where(eq(auditTrail.tenantId, tenantId))
              .orderBy(desc(auditTrail.createdAt));

            for (const exec of recentExecutions) {
              if (exec.insightId && !executionStats.has(exec.insightId)) {
                const eventData = exec.eventData as Record<string, unknown> | null;
                const runStatus = (eventData?.status as string | undefined) ?? "success";
                executionStats.set(exec.insightId, {
                  status: runStatus === "success" ? "completed" : "failed",
                  lastRunAt: exec.createdAt,
                  lastRunStatus: runStatus === "success" ? "success" : "failed",
                });
              }
            }
          }

          const insightsWithConnectors = insightRows.map((insight) => {
            const execStats = executionStats.get(insight.id);
            const delivery = insightDeliverySchema.parse(insight.delivery);
            const aiConfig = insightAiConfigSchema.parse(insight.aiConfig);

            const rawStatus = execStats?.status ?? insight.status;
            const rawRunStatus = execStats?.lastRunStatus ?? insight.lastRunStatus;

            return {
              id: insight.id,
              tenantId: insight.tenantId,
              name: insight.name,
              description: insight.description,
              templateId: insight.templateId,
              enabled: insight.enabled,
              domain: insight.domain,
              domains: insight.domain ? [insight.domain] : [],
              status: (INSIGHT_STATUSES.includes(rawStatus as never)
                ? rawStatus
                : "idle") as (typeof INSIGHT_STATUSES)[number],
              lastRunAt: execStats?.lastRunAt ?? insight.lastRunAt,
              lastRunStatus: (DB_RUN_STATUSES.includes(rawRunStatus as never)
                ? rawRunStatus
                : null) as (typeof DB_RUN_STATUSES)[number] | null,
              delivery,
              aiConfig,
              createdAt: insight.createdAt,
              connectors: connectorMappings.get(insight.id) ?? [],
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

  detail: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
    .input(z.object({ id: z.string() }))
    .output(insightOutputSchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant!.tenantId;

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

          const delivery = insightDeliverySchema.parse(insight.delivery);
          const aiConfig = insightAiConfigSchema.parse(insight.aiConfig);

          return {
            id: insight.id,
            tenantId: insight.tenantId,
            name: insight.name,
            description: insight.description,
            templateId: insight.templateId,
            enabled: insight.enabled,
            domain: insight.domain,
            status: insight.status as (typeof INSIGHT_STATUSES)[number],
            lastRunAt: insight.lastRunAt,
            lastRunStatus: insight.lastRunStatus as (typeof DB_RUN_STATUSES)[number] | null,
            delivery,
            aiConfig,
            createdAt: insight.createdAt,
            connectors: connectorRows.map((c) => ({
              ...c,
              selectedMetrics: (c.selectedMetrics ?? []) as string[],
            })),
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

  create: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_WRITE)
    .use(rateLimitMiddleware(30)) // 30 req/min for create
    .input(insightCreateSchema)
    .output(insightOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant!.tenantId;

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

        // Validate provider and model before creating insight
        validateProvider(input.aiConfig.provider);
        validateModel(input.aiConfig.provider, input.aiConfig.model);

        // Validate connector existence
        const connectorIds = input.connectors.map((c) => c.connectorId);
        await validateConnectors(db, connectorIds);

        const result = await dbScoped(db, async (tx) => {
          const [insight] = await tx
            .insert(insights)
            .values({
              tenantId,
              name: input.name,
              description: input.description ?? null,
              templateId: input.templateId ?? null,
              enabled: input.enabled,
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
            id: randomUUID(),
            tenantId,
            insightId: insight.id,
            eventType: AuditEventType.CREATED,
            eventData: {
              title: input.name,
              description: input.description,
              status: "success",
              actorSub: ctx.auth.userId,
              action: "create",
            },
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

          const delivery = insightDeliverySchema.parse(insight.delivery);
          const aiConfig = insightAiConfigSchema.parse(insight.aiConfig);

          return {
            id: insight.id,
            tenantId: insight.tenantId,
            name: insight.name,
            description: insight.description,
            templateId: insight.templateId,
            enabled: insight.enabled,
            domain: insight.domain,
            status: insight.status as (typeof INSIGHT_STATUSES)[number],
            lastRunAt: insight.lastRunAt,
            lastRunStatus: insight.lastRunStatus as (typeof DB_RUN_STATUSES)[number] | null,
            delivery,
            aiConfig,
            createdAt: insight.createdAt,
            connectors: connectorRows.map((c) => ({
              ...c,
              selectedMetrics: (c.selectedMetrics ?? []) as string[],
            })),
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
        mapDatabaseError(error);
      }
    }),

  update: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_WRITE)
    .use(rateLimitMiddleware(30)) // 30 req/min for update
    .input(z.object({ id: z.string(), data: insightUpdateSchema }))
    .output(insightOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant!.tenantId;

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

        // Validate provider and model if being updated
        if (input.data.aiConfig?.provider) {
          validateProvider(input.data.aiConfig.provider);
          validateModel(input.data.aiConfig.provider, input.data.aiConfig.model);
        }

        // Validate connector existence if connectors are being updated
        if (input.data.connectors) {
          const connectorIds = input.data.connectors.map((c) => c.connectorId);
          await validateConnectors(db, connectorIds);
        }

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
            id: randomUUID(),
            tenantId,
            insightId: insight.id,
            eventType: AuditEventType.CONFIG_CHANGE,
            eventData: {
              changes: input.data,
              status: "success",
              actorSub: ctx.auth.userId,
              action: "update",
            },
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

          const delivery = insightDeliverySchema.parse(insight.delivery);
          const aiConfig = insightAiConfigSchema.parse(insight.aiConfig);

          return {
            id: insight.id,
            tenantId: insight.tenantId,
            name: insight.name,
            description: insight.description,
            templateId: insight.templateId,
            enabled: insight.enabled,
            domain: insight.domain,
            status: insight.status as (typeof INSIGHT_STATUSES)[number],
            lastRunAt: insight.lastRunAt,
            lastRunStatus: insight.lastRunStatus as (typeof DB_RUN_STATUSES)[number] | null,
            delivery,
            aiConfig,
            createdAt: insight.createdAt,
            connectors: connectorRows.map((c) => ({
              ...c,
              selectedMetrics: (c.selectedMetrics ?? []) as string[],
            })),
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
        mapDatabaseError(error);
      }
    }),

  delete: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_DELETE)
    .use(rateLimitMiddleware(30)) // 30 req/min for delete
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant!.tenantId;

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
            id: randomUUID(),
            tenantId,
            insightId: input.id,
            eventType: AuditEventType.DELETED,
            eventData: {
              deletedInsightId: input.id,
              status: "success",
              actorSub: ctx.auth.userId,
              action: "delete",
            },
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
        mapDatabaseError(error);
      }
    }),

  run: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_WRITE)
    .use(rateLimitMiddleware(10)) // 10 req/min for run
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean(), jobId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant!.tenantId;

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

        const [insight] = await dbScoped(db, async (tx) => {
          return tx
            .select()
            .from(insights)
            .where(and(eq(insights.id, input.id), eq(insights.tenantId, tenantId)))
            .limit(1);
        });

        if (!insight) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Insight not found",
          });
        }

        // Check if insight is enabled
        if (!insight.enabled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot run a disabled insight. Please enable it first.",
          });
        }

        // Idempotency check: detect existing running job
        if (insight.lastRunStatus === "running" && insight.lastRunAt) {
          const timeSinceLastRun = Date.now() - insight.lastRunAt.getTime();
          // If last run was within 30 minutes and still marked as running, return existing
          if (timeSinceLastRun < 30 * 60 * 1000) {
            logger.info(
              {
                tenantId,
                procedure: "insight.run",
                insightId: input.id,
                message: "Returning existing running job (idempotency)",
              },
              "insight.run.idempotent",
            );
            return { success: true };
          }
        }

        const jobId = randomUUID();

        // Update insight status to running
        await dbScoped(db, async (tx) => {
          await tx
            .update(insights)
            .set({
              lastRunStatus: "running",
              lastRunAt: new Date(),
            })
            .where(eq(insights.id, input.id));

          await tx.insert(auditTrail).values({
            id: randomUUID(),
            tenantId,
            insightId: insight.id,
            eventType: AuditEventType.RUN,
            eventData: {
              status: "initiated",
              jobId,
              actorSub: ctx.auth.userId,
              action: "run",
            },
          });
        });

        // Enqueue the insight execution job if queue is available
        if (isBullmqConfigured()) {
          await enqueueInsightExecution(
            {
              tenantId,
              insightId: input.id,
              requestId: `insight-run-${jobId}`,
            },
            jobId,
          );
        }

        logger.info(
          {
            tenantId,
            procedure: "insight.run",
            duration: Date.now() - start,
            jobId,
          },
          "insight.run.success",
        );

        return { success: true, jobId };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.run",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.run.error",
        );
        mapDatabaseError(error);
      }
    }),

  getAuditTrail: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
    .input(
      z.object({
        insightId: z.string(),
        eventType: z.enum(AUDIT_EVENT_TYPE_VALUES as [string, ...string[]]).optional(),
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
            metadata: z.record(z.string(), z.unknown()).optional(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant!.tenantId;

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
            whereConditions.push(sql`${auditTrail.createdAt} >= ${new Date(input.dateFrom)}`);
          }

          if (input.dateTo) {
            whereConditions.push(sql`${auditTrail.createdAt} <= ${new Date(input.dateTo)}`);
          }

          const events = await tx
            .select({
              id: auditTrail.id,
              insightId: auditTrail.insightId,
              eventType: auditTrail.eventType,
              createdAt: auditTrail.createdAt,
              eventData: auditTrail.eventData,
            })
            .from(auditTrail)
            .where(and(...whereConditions))
            .orderBy(desc(auditTrail.createdAt));

          return {
            events: events
              .filter((e): e is typeof e & { insightId: string } => e.insightId !== null)
              .map((event) => {
                const data = event.eventData as Record<string, unknown> | null;
                return {
                  id: event.id,
                  insightId: event.insightId,
                  eventType: event.eventType,
                  status: (data?.status as string) ?? "success",
                  timestamp: event.createdAt?.toISOString() ?? new Date().toISOString(),
                  duration: (data?.durationMs as number) ?? undefined,
                  metadata: data ?? undefined,
                };
              }),
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

  getAIInsights: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
    .input(z.object({ insightId: z.string(), reportId: z.string().optional() }))
    .output(
      z.object({
        performanceSummary: z.string().nullable(),
        keyFindings: z.array(z.string()),
        recommendations: z.array(z.string()),
        generatedAt: z.string().nullable(),
        jobId: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenant!.tenantId;

      try {
        const db = requireTrpcDatabase();

        // First verify the insight belongs to this tenant
        const [insight] = await dbScoped(db, async (tx) => {
          return tx
            .select()
            .from(insights)
            .where(and(eq(insights.id, input.insightId), eq(insights.tenantId, tenantId)))
            .limit(1);
        });

        if (!insight) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Insight not found",
          });
        }

        // Query DB for persisted pipeline results
        const results = await db
          .select()
          .from(reports)
          .where(
            and(
              eq(reports.tenantId, tenantId),
              eq(reports.status, "completed"),
              input.reportId ? eq(reports.id, input.reportId) : undefined,
            ),
          )
          .orderBy(reports.createdAt)
          .limit(1);

        if (results.length > 0) {
          const report = results[0];
          const metadata = report.metadata as Record<string, unknown> | undefined;
          return {
            performanceSummary: (metadata?.summary as string) ?? null,
            keyFindings: (metadata?.keyFindings as string[]) ?? [],
            recommendations: (metadata?.recommendations as string[]) ?? [],
            generatedAt: report.createdAt.toISOString(),
            jobId: metadata?.workflowId as string,
            status: "completed",
          };
        }

        // Fallback: check job status if no persisted results
        if (isBullmqConfigured()) {
          const { getInsightExecutionJobStatus } = await import("../../services/report-bullmq");
          const jobStatus = await getInsightExecutionJobStatus(input.insightId);
          if (jobStatus) {
            return {
              performanceSummary: null,
              keyFindings: [],
              recommendations: [],
              generatedAt: null,
              jobId: jobStatus.executionId,
              status: jobStatus.status,
            };
          }
        }

        return {
          performanceSummary: null,
          keyFindings: [],
          recommendations: [],
          generatedAt: null,
        };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.getAIInsights",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.getAIInsights.error",
        );
        throw error;
      }
    }),

  generateAIInsights: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_WRITE)
    .input(z.object({ insightId: z.string(), reportId: z.string().optional() }))
    .output(z.object({ success: z.boolean(), jobId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenant!.tenantId;
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

        const [insight] = await db
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

        const jobId = randomUUID();

        await dbScoped(db, async (tx) => {
          await tx
            .update(insights)
            .set({
              lastRunStatus: "running",
              lastRunAt: new Date(),
            })
            .where(eq(insights.id, input.insightId));

          await tx.insert(auditTrail).values({
            id: randomUUID(),
            tenantId,
            insightId: input.insightId,
            eventType: AuditEventType.AI_GENERATED,
            eventData: {
              trigger: "manual",
              reportId: input.reportId,
              jobId,
              insightName: insight.name,
              status: "success",
              actorSub: ctx.auth.userId,
              action: "ai_generate",
            },
          });
        });

        // Enqueue the insight execution job if queue is available
        if (isBullmqConfigured()) {
          await enqueueInsightExecution(
            {
              tenantId,
              insightId: input.insightId,
              requestId: `insight-ai-generate-${jobId}`,
            },
            jobId,
          );
        }

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

  // Task 8.9: Job status polling endpoint
  getJobStatus: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)
    .input(z.object({ jobId: z.string() }))
    .output(
      z.object({
        jobId: z.string(),
        status: z.string(),
        progress: z.number().optional(),
        queuedAt: z.string().optional(),
        startedAt: z.string().optional(),
        finishedAt: z.string().optional(),
        durationMs: z.number().optional(),
        result: z.unknown().optional(),
        error: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenant!.tenantId;

      logger.info(
        {
          tenantId,
          procedure: "insight.getJobStatus",
          jobId: input.jobId,
        },
        "insight.getJobStatus.start",
      );

      try {
        if (!isBullmqConfigured()) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Job queue is not available",
          });
        }

        const { getInsightExecutionJobStatus } = await import("../../services/report-bullmq");
        const jobStatus = await getInsightExecutionJobStatus(input.jobId);

        if (!jobStatus) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Job not found",
          });
        }

        // Task 8.10: Tenant isolation check
        if (jobStatus.tenantId && jobStatus.tenantId !== tenantId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied: job belongs to different tenant",
          });
        }

        logger.info(
          {
            tenantId,
            procedure: "insight.getJobStatus",
            jobId: input.jobId,
            status: jobStatus.status,
          },
          "insight.getJobStatus.success",
        );

        return {
          jobId: jobStatus.executionId,
          status: jobStatus.status,
          progress:
            jobStatus.status === "completed"
              ? 100
              : jobStatus.status === "active"
                ? 50
                : jobStatus.status === "paused"
                  ? 25
                  : jobStatus.status === "delayed"
                    ? 15
                    : jobStatus.status === "waiting"
                      ? 10
                      : jobStatus.status === "failed"
                        ? 0
                        : 0,
          queuedAt: jobStatus.queuedAtMs ? new Date(jobStatus.queuedAtMs).toISOString() : undefined,
          startedAt: jobStatus.startedAtMs
            ? new Date(jobStatus.startedAtMs).toISOString()
            : undefined,
          finishedAt: jobStatus.finishedAtMs
            ? new Date(jobStatus.finishedAtMs).toISOString()
            : undefined,
          durationMs: jobStatus.durationMs,
          result: jobStatus.result,
          error: jobStatus.error,
        };
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "insight.getJobStatus",
            jobId: input.jobId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "insight.getJobStatus.error",
        );
        throw error;
      }
    }),
});
