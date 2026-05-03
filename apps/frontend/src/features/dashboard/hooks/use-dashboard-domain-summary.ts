import { trpc } from "@/lib/api/trpc-client";

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
