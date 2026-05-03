import { trpc } from "@/lib/api/trpc-client";

/**
 * Fetches agency-level client overview.
 * Only relevant for agency_partner or agency_managed tenant types.
 */
export function useDashboardAgencyOverview() {
  return trpc.dashboard.agencyOverview.useQuery(undefined, {
    retry: false,
  });
}
