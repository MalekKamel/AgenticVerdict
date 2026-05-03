import type { AppRouter } from "@agenticverdict/api/trpc";
import type { TRPCClientError } from "@trpc/client";
import { trpcClient } from "@/lib/api/trpc-client";

import {
  dashboardDomainSlugSchema,
  type DashboardAgencyOverview,
  type DashboardDomainSummary,
  type DashboardHomeSummary,
} from "@/features/dashboard/model/contracts";
import {
  mapTrpcClientErrorToDashboardError,
  tenantContextDashboardError,
  type DashboardTypedError,
} from "@/features/dashboard/model/dashboard-errors";

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

/**
 * Fetches dashboard home summary with KPIs, insights, and connector health from tRPC.
 */
export async function fetchDashboardHomeSummary(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary>> {
  const missing = assertTenant(tenantId);
  if (missing) {
    return missing;
  }

  try {
    const result = await trpcClient.dashboard.homeSummary.query();
    return ok(result);
  } catch (error) {
    return err(mapTrpcClientErrorToDashboardError(error as TRPCClientError<AppRouter>));
  }
}

/**
 * Fetches only KPIs from dashboard home summary.
 */
export async function fetchDashboardKpisOnly(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary["kpis"]>> {
  const summary = await fetchDashboardHomeSummary(tenantId);
  if (!summary.ok) {
    return summary;
  }
  return ok(summary.data.kpis);
}

/**
 * Fetches only insights from dashboard home summary.
 */
export async function fetchDashboardInsightsOnly(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary["insights"]>> {
  const summary = await fetchDashboardHomeSummary(tenantId);
  if (!summary.ok) {
    return summary;
  }
  return ok(summary.data.insights);
}

/**
 * Fetches only connector health from dashboard home summary.
 */
export async function fetchDashboardConnectorsOnly(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardHomeSummary["connectors"]>> {
  const summary = await fetchDashboardHomeSummary(tenantId);
  if (!summary.ok) {
    return summary;
  }
  return ok(summary.data.connectors);
}

/**
 * Fetches domain-specific metrics for a given domain.
 */
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
    const result = await trpcClient.dashboard.domainSummary.query({ domain: slug.data });
    return ok(result);
  } catch (error) {
    return err(mapTrpcClientErrorToDashboardError(error as TRPCClientError<AppRouter>));
  }
}

/**
 * Fetches agency-level client overview.
 * Only relevant for agency_partner or agency_managed tenant types.
 */
export async function fetchDashboardAgencyOverview(
  tenantId: string | undefined,
): Promise<DashboardResult<DashboardAgencyOverview>> {
  const missing = assertTenant(tenantId);
  if (missing) {
    return missing;
  }
  try {
    const result = await trpcClient.dashboard.agencyOverview.query();
    return ok(result);
  } catch (error) {
    return err(mapTrpcClientErrorToDashboardError(error as TRPCClientError<AppRouter>));
  }
}

/**
 * Filters agency clients for rendering based on permission status.
 */
export function filterAgencyClientsForRendering(
  overview: DashboardAgencyOverview,
): DashboardAgencyOverview["clients"] {
  return overview.clients.filter((c) => c.permitted);
}

/**
 * Checks if a specific client is permitted for the current agency.
 */
export function isPermittedAgencyClient(
  overview: DashboardAgencyOverview,
  clientId: string,
): boolean {
  const row = overview.clients.find((c) => c.clientId === clientId);
  return Boolean(row?.permitted);
}

/**
 * Maps tRPC errors to dashboard-specific error types.
 */
export function mapDashboardTrpcFailure(error: TRPCClientError<AppRouter>): DashboardTypedError {
  return mapTrpcClientErrorToDashboardError(error);
}
