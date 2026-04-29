import { z } from "zod";

import { sanitizeAuthRedirectTarget } from "@/lib/auth/safe-auth-redirect";

/**
 * Restricts post-navigation return targets to dashboard subtree to avoid open redirects
 * and reduce redirect-loop risk when chaining dashboard-internal links.
 */
export function sanitizeDashboardReturnTarget(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) {
    return undefined;
  }
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//")) {
    return undefined;
  }
  if (v.startsWith("/auth")) {
    return undefined;
  }
  const sanitized = sanitizeAuthRedirectTarget(v);
  if (!sanitized.startsWith("/dashboard")) {
    return undefined;
  }
  return sanitized;
}

export const dashboardParentSearchSchema = z.object({
  returnTo: z.string().optional(),
});

export type DashboardParentSearch = z.infer<typeof dashboardParentSearchSchema>;

export function parseDashboardParentSearch(search: Record<string, unknown>): DashboardParentSearch {
  const parsed = dashboardParentSearchSchema.safeParse(search);
  if (!parsed.success) {
    return { returnTo: undefined };
  }
  const returnTo = sanitizeDashboardReturnTarget(parsed.data.returnTo);
  return { returnTo };
}
