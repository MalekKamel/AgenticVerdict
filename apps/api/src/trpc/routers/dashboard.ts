import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  dbScoped,
  tenantConnectors,
  insights,
  reports,
  tenants,
  connectorTagMappings,
  connectorTags,
} from "@agenticverdict/database";
import { eq, inArray } from "drizzle-orm";
import { requireTrpcDatabase } from "../database";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import {
  dashboardHomeSummarySchema,
  dashboardDomainSummarySchema,
  dashboardAgencyOverviewSchema,
  type InsightDTO,
} from "@agenticverdict/types";
import { mapInsightToDto } from "../../lib/insight-extraction";

const logger = console;

export const dashboardRouter = t.router({
  homeSummary: authedProcedure.output(dashboardHomeSummarySchema).query(async ({ ctx }) => {
    const start = Date.now();
    const tenantId = ctx.tenant.tenantId;

    logger.info(
      {
        tenantId,
        procedure: "homeSummary",
      },
      "dashboard.homeSummary.start",
    );

    try {
      const db = requireTrpcDatabase();

      const result = await dbScoped(db, async (tx) => {
        const [connectorRows, insightRows, reportRows, tenantRows] = await Promise.all([
          tx
            .select({
              id: tenantConnectors.id,
              platform: tenantConnectors.platform,
              name: tenantConnectors.name,
              status: tenantConnectors.status,
              lastSyncStatus: tenantConnectors.lastSyncStatus,
              metrics: tenantConnectors.metrics,
            })
            .from(tenantConnectors)
            .where(eq(tenantConnectors.tenantId, tenantId)),

          tx
            .select({
              id: insights.id,
              name: insights.name,
              enabled: insights.enabled,
              createdAt: insights.createdAt,
            })
            .from(insights)
            .where(eq(insights.tenantId, tenantId))
            .limit(10),

          tx
            .select({
              id: reports.id,
              title: reports.title,
              status: reports.status,
              createdAt: reports.createdAt,
            })
            .from(reports)
            .where(eq(reports.tenantId, tenantId))
            .limit(10),

          tx
            .select({
              type: tenants.type,
              status: tenants.status,
            })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1),
        ]);

        const tenantData = tenantRows[0];
        if (!tenantData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tenant not found",
          });
        }

        const connectorIds = connectorRows.map((c) => c.id);
        let connectorDomainMap = new Map<string, string[]>();

        if (connectorIds.length > 0) {
          const tagRows = await tx
            .select({
              connectorId: connectorTagMappings.connectorId,
              tagLabel: connectorTags.label,
            })
            .from(connectorTagMappings)
            .innerJoin(connectorTags, eq(connectorTagMappings.connectorTagId, connectorTags.id))
            .where(inArray(connectorTagMappings.connectorId, connectorIds));

          connectorDomainMap = new Map<string, string[]>();
          for (const row of tagRows) {
            const existing = connectorDomainMap.get(row.connectorId) ?? [];
            existing.push(row.tagLabel);
            connectorDomainMap.set(row.connectorId, existing);
          }
        }

        const enrichedInsights = insightRows.map((insight) => ({
          ...insight,
          connectors: connectorRows.map((c) => ({
            id: c.id,
            domainTags: connectorDomainMap.get(c.id),
            metadata: {
              primaryMetricClass: c.metrics && c.metrics.length > 0 ? c.metrics[0] : undefined,
            },
          })),
        }));

        const insightsData: InsightDTO[] = enrichedInsights.map(mapInsightToDto);

        const kpis = [
          {
            id: "insights",
            labelKey: "home.kpi.totalInsights",
            value: insightRows.length,
            deltaLabelKey: "home.kpi.deltaUp",
            href: "/dashboard/insights",
          },
          {
            id: "connectors",
            labelKey: "home.kpi.activeConnectors",
            value: connectorRows.filter((c) => c.status === "active").length,
            deltaLabelKey: "home.kpi.connectorsHealthy",
          },
          {
            id: "reports",
            labelKey: "home.kpi.reportsThisMonth",
            value: reportRows.length,
            deltaLabelKey: "home.kpi.deltaPercent",
          },
        ];

        const connectors = connectorRows.map((connector) => {
          let status: "healthy" | "degraded" | "disconnected" = "disconnected";
          if (connector.status === "active" && connector.lastSyncStatus === "success") {
            status = "healthy";
          } else if (connector.status === "active" || connector.status === "syncing") {
            status = "degraded";
          }

          return {
            id: connector.platform,
            nameKey: `home.connectors.${connector.platform}`,
            status,
          };
        });

        return {
          kpis,
          insights: insightsData,
          connectors,
          generatedAt: new Date().toISOString(),
        };
      });

      logger.info(
        {
          tenantId,
          procedure: "homeSummary",
          duration: Date.now() - start,
        },
        "dashboard.homeSummary.success",
      );

      return result;
    } catch (error) {
      logger.error(
        {
          tenantId,
          procedure: "homeSummary",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "dashboard.homeSummary.error",
      );
      throw error;
    }
  }),

  domainSummary: authedProcedure
    .input(
      z.object({
        domain: z.enum(["marketing", "finance", "operations", "seo", "social", "local"]),
      }),
    )
    .output(dashboardDomainSummarySchema)
    .query(async ({ ctx, input }) => {
      const start = Date.now();
      const tenantId = ctx.tenant.tenantId;
      const { domain } = input;

      logger.info(
        {
          tenantId,
          procedure: "domainSummary",
          domain,
        },
        "dashboard.domainSummary.start",
      );

      try {
        const db = requireTrpcDatabase();

        const result = await dbScoped(db, async (tx) => {
          const connectorRows = await tx
            .select({
              platform: tenantConnectors.platform,
              status: tenantConnectors.status,
            })
            .from(tenantConnectors)
            .where(eq(tenantConnectors.tenantId, tenantId));

          const activeConnectors = connectorRows.filter((c) => c.status === "active").length;

          const kpis = [
            {
              id: "primary",
              labelKey: `domain.${domain}.primaryKpi`,
              value: activeConnectors * 10,
              deltaLabelKey: "home.kpi.deltaUp",
            },
          ];

          return {
            domain,
            kpis,
            generatedAt: new Date().toISOString(),
          };
        });

        logger.info(
          {
            tenantId,
            procedure: "domainSummary",
            domain,
            duration: Date.now() - start,
          },
          "dashboard.domainSummary.success",
        );

        return result;
      } catch (error) {
        logger.error(
          {
            tenantId,
            procedure: "domainSummary",
            domain,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "dashboard.domainSummary.error",
        );
        throw error;
      }
    }),

  agencyOverview: authedProcedure.output(dashboardAgencyOverviewSchema).query(async ({ ctx }) => {
    const start = Date.now();
    const tenantId = ctx.tenant.tenantId;

    logger.info(
      {
        tenantId,
        procedure: "agencyOverview",
      },
      "dashboard.agencyOverview.start",
    );

    try {
      const db = requireTrpcDatabase();

      const result = await dbScoped(db, async (tx) => {
        const tenantRows = await tx
          .select({
            type: tenants.type,
            parentTenantId: tenants.parentTenantId,
          })
          .from(tenants)
          .where(eq(tenants.id, tenantId))
          .limit(1);

        const tenantData = tenantRows[0];
        if (!tenantData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tenant not found",
          });
        }

        let childTenants: Array<{
          id: string;
          name: string;
          status: string;
        }> = [];

        if (tenantData.type === "agency_partner" || tenantData.parentTenantId) {
          const query = tx
            .select({
              id: tenants.id,
              name: tenants.name,
              status: tenants.status,
            })
            .from(tenants);

          if (tenantData.type === "agency_partner") {
            childTenants = await query.where(eq(tenants.parentTenantId, tenantId));
          } else if (tenantData.parentTenantId) {
            childTenants = await query.where(eq(tenants.id, tenantId));
          }
        }

        const clients = await Promise.all(
          childTenants.map(async (child) => {
            const [connectorCount, insightCount] = await Promise.all([
              tx
                .select({
                  status: tenantConnectors.status,
                })
                .from(tenantConnectors)
                .where(eq(tenantConnectors.tenantId, child.id)),

              tx
                .select({
                  id: insights.id,
                })
                .from(insights)
                .where(eq(insights.tenantId, child.id)),
            ]);

            const activeConnectors = connectorCount.filter((c) => c.status === "active").length;
            let connectorStatusKey: "healthy" | "degraded" | "disconnected" = "disconnected";
            if (activeConnectors > 0) {
              connectorStatusKey =
                activeConnectors === connectorCount.length ? "healthy" : "degraded";
            }

            return {
              clientId: child.id,
              name: child.name,
              permitted: true,
              insightCount: insightCount.length,
              connectorStatusKey,
            };
          }),
        );

        const aggregateKpis = [
          {
            id: "clients",
            labelKey: "agency.kpi.clients",
            value: clients.length,
          },
          {
            id: "insights",
            labelKey: "agency.kpi.insights",
            value: clients.reduce((acc, c) => acc + c.insightCount, 0),
          },
        ];

        return {
          clients,
          aggregateKpis,
          generatedAt: new Date().toISOString(),
        };
      });

      logger.info(
        {
          tenantId,
          procedure: "agencyOverview",
          duration: Date.now() - start,
        },
        "dashboard.agencyOverview.success",
      );

      return result;
    } catch (error) {
      logger.error(
        {
          tenantId,
          procedure: "agencyOverview",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "dashboard.agencyOverview.error",
      );
      throw error;
    }
  }),
});
