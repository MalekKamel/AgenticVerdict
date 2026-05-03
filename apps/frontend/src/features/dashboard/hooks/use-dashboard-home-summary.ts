import { trpc } from "@/lib/api/trpc-client";

/**
 * Fetches the dashboard home summary with KPIs, insights, and connector health.
 * Returns data only when tenantId is available.
 */
export function useDashboardHomeSummary() {
  return trpc.dashboard.homeSummary.useQuery(undefined, {
    retry: false,
  });
}

/**
 * Fetches domain-specific metrics for a given domain.
 */
export function useDashboardDomainSummary(domain: string) {
  return trpc.dashboard.domainSummary.useQuery(
    { domain: domain as "marketing" | "finance" | "operations" | "seo" | "social" | "local" },
    {
      retry: false,
    },
  );
}

/**
 * Fetches agency-level client overview.
 * Only relevant for agency_partner or agency_managed tenant types.
 */
export function useDashboardAgencyOverview() {
  return trpc.dashboard.agencyOverview.useQuery(undefined, {
    retry: false,
  });
}
