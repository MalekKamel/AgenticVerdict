import type { AppRouter } from "@agenticverdict/api/trpc";
import type { TRPCClientError } from "@trpc/client";

import {
  dashboardAgencyOverviewSchema,
  dashboardDomainSlugSchema,
  dashboardDomainSummarySchema,
  dashboardHomeSummarySchema,
  type DashboardAgencyOverview,
  type DashboardDomainSummary,
  type DashboardHomeSummary,
} from "@/features/dashboard/model/contracts";
import {
  mapTrpcClientErrorToDashboardError,
  mapUnknownToDashboardError,
  tenantContextDashboardError,
  type DashboardTypedError,
} from "@/features/dashboard/model/dashboard-errors";
import { DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS } from "@/features/dashboard/model/dashboard-agency-constants";

export type DashboardResult<T> = { ok: true; data: T } | { ok: false; error: DashboardTypedError };

function ok<T>(data: T): DashboardResult<T> {
  return { ok: true, data };
}

function err(error: DashboardTypedError): DashboardResult<never> {
  return { ok: false, error };
}

function assertTenant(tenantId: string | undefined): DashboardResult<never> | null {
  if (!tenantId) {
    return err(tenantContextDashboardError("TENANT_CONTEXT_MISSING"));
  }
  return null;
}

/** Placeholder bundle until dedicated tRPC procedures ship; validates with contracts. */
export async function fetchDashboardHomeSummary(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary>> {
  const missing = assertTenant(tenantId);
  if (missing) {
    return missing;
  }

  try {
    const raw = {
      kpis: [
        {
          id: "insights",
          labelKey: "home.kpi.totalInsights",
          value: 12,
          deltaLabelKey: "home.kpi.deltaUp",
          href: "/dashboard/marketing",
        },
        {
          id: "connectors",
          labelKey: "home.kpi.activeConnectors",
          value: 5,
          deltaLabelKey: "home.kpi.connectorsHealthy",
        },
        {
          id: "reports",
          labelKey: "home.kpi.reportsThisMonth",
          value: 48,
          deltaLabelKey: "home.kpi.deltaPercent",
        },
      ],
      insights: [
        {
          id: "1",
          titleKey: "home.insights.sampleTitle",
          bodyKey: "home.insights.sampleBody",
          relativeTimeKey: "home.insights.sampleTime",
          domain: "marketing",
        },
      ],
      connectors: [
        {
          id: "ga4",
          nameKey: "home.connectors.ga4",
          status: "healthy",
        },
        {
          id: "meta",
          nameKey: "home.connectors.meta",
          status: "healthy",
        },
        {
          id: "gsc",
          nameKey: "home.connectors.gsc",
          status: "degraded",
        },
      ],
      generatedAt: new Date().toISOString(),
    };
    const parsed = dashboardHomeSummarySchema.safeParse(raw);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_FAILED",
        category: "validation",
        surface: "frontend",
        messageKey: "dashboard.errors.validation",
        cause: parsed.error.message,
        retryable: false,
        severity: "info",
      });
    }
    return ok(parsed.data);
  } catch (e) {
    return err(mapUnknownToDashboardError(e));
  }
}

export async function fetchDashboardKpisOnly(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary["kpis"]>> {
  const summary = await fetchDashboardHomeSummary(tenantId);
  if (!summary.ok) {
    return summary;
  }
  return ok(summary.data.kpis);
}

export async function fetchDashboardInsightsOnly(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary["insights"]>> {
  const summary = await fetchDashboardHomeSummary(tenantId);
  if (!summary.ok) {
    return summary;
  }
  return ok(summary.data.insights);
}

export async function fetchDashboardConnectorsOnly(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary["connectors"]>> {
  const summary = await fetchDashboardHomeSummary(tenantId);
  if (!summary.ok) {
    return summary;
  }
  return ok(summary.data.connectors);
}

export async function fetchDashboardDomainSummary(
  tenantId: string | undefined,
  domain: string,
): Promise<DashboardResult<DashboardDomainSummary>> {
  const missing = assertTenant(tenantId);
  if (missing) {
    return missing;
  }
  const slug = dashboardDomainSlugSchema.safeParse(domain);
  if (!slug.success) {
    return err({
      code: "VALIDATION_FAILED",
      category: "validation",
      surface: "frontend",
      messageKey: "dashboard.errors.invalidDomain",
      cause: slug.error.message,
      retryable: false,
      severity: "info",
    });
  }
  try {
    const raw = {
      domain: slug.data,
      kpis: [
        {
          id: "primary",
          labelKey: "domain.primaryKpi",
          value: 128,
          deltaLabelKey: "home.kpi.deltaUp",
        },
      ],
      generatedAt: new Date().toISOString(),
    };
    const parsed = dashboardDomainSummarySchema.safeParse(raw);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_FAILED",
        category: "validation",
        surface: "frontend",
        messageKey: "dashboard.errors.validation",
        cause: parsed.error.message,
        retryable: false,
        severity: "info",
      });
    }
    return ok(parsed.data);
  } catch (e) {
    return err(mapUnknownToDashboardError(e));
  }
}

const MOCK_AGENCY_CLIENTS: DashboardAgencyOverview["clients"] = [
  {
    clientId: "client-a",
    name: "Acme Co",
    permitted: DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS.has("client-a"),
    insightCount: 12,
    connectorStatusKey: "healthy",
  },
  {
    clientId: "client-b",
    name: "Contoso",
    permitted: DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS.has("client-b"),
    insightCount: 8,
    connectorStatusKey: "degraded",
  },
  {
    clientId: "client-unscoped",
    name: "Blocked Org",
    permitted: false,
    insightCount: 0,
    connectorStatusKey: "disconnected",
  },
];

export async function fetchDashboardAgencyOverview(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardAgencyOverview>> {
  const missing = assertTenant(tenantId);
  if (missing) {
    return missing;
  }
  try {
    const permittedClients = MOCK_AGENCY_CLIENTS.filter((c) => c.permitted);
    const raw = {
      clients: MOCK_AGENCY_CLIENTS,
      aggregateKpis: [
        {
          id: "clients",
          labelKey: "agency.kpi.clients",
          value: permittedClients.length,
        },
        {
          id: "insights",
          labelKey: "agency.kpi.insights",
          value: permittedClients.reduce((acc, c) => acc + c.insightCount, 0),
        },
      ],
      generatedAt: new Date().toISOString(),
    };
    const parsed = dashboardAgencyOverviewSchema.safeParse(raw);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_FAILED",
        category: "validation",
        surface: "frontend",
        messageKey: "dashboard.errors.validation",
        cause: parsed.error.message,
        retryable: false,
        severity: "info",
      });
    }
    return ok(parsed.data);
  } catch (e) {
    return err(mapUnknownToDashboardError(e));
  }
}

export function filterAgencyClientsForRendering(
  overview: DashboardAgencyOverview,
): DashboardAgencyOverview["clients"] {
  return overview.clients.filter((c) => c.permitted);
}

export function isPermittedAgencyClient(
  overview: DashboardAgencyOverview,
  clientId: string,
): boolean {
  const row = overview.clients.find((c) => c.clientId === clientId);
  return Boolean(row?.permitted);
}

export function mapDashboardTrpcFailure(error: TRPCClientError<AppRouter>): DashboardTypedError {
  return mapTrpcClientErrorToDashboardError(error);
}
