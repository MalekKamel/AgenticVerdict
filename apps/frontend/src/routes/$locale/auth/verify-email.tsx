import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/features/auth/ui/build-auth-seo-head";
import { isTenantUuid } from "@agenticverdict/core/tenant/tenant-resolution";

export const Route = createFileRoute("/$locale/auth/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    tenantId:
      typeof search.tenantId === "string" && isTenantUuid(search.tenantId)
        ? search.tenantId
        : undefined,
  }),
  head: ({ matches }) => buildAuthSeoHead(matches, "verifyEmail"),
  component: lazyRouteComponent(() => import("@/features/auth/pages/VerifyEmailPage")),
});
