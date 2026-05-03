import { createProtectedBeforeLoad } from "@/features/auth/route-guards/create-protected-before-load";
import type { RouteGuardBeforeLoadFn } from "@/features/auth/route-guards/guard-types";

/**
 * Dashboard parent routes reuse the canonical protected guard. SPA mode remains a no-op at
 * beforeLoad (session enforced client-side); non-SPA keeps SSR session probe + redirect policy.
 */
export function createDashboardParentBeforeLoad(): RouteGuardBeforeLoadFn {
  return createProtectedBeforeLoad();
}
