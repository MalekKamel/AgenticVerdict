import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/features/auth/ui/build-auth-seo-head";
import { isTenantUuid } from "@agenticverdict/core/tenant/tenant-resolution";
import { createPublicAuthBeforeLoad } from "@/features/auth/route-guards";

export const Route = createFileRoute("/$locale/auth/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    type: search.type === "individual" || search.type === "business" ? search.type : undefined,
    plan:
      search.plan === "free" || search.plan === "pro" || search.plan === "enterprise"
        ? search.plan
        : undefined,
    invite: typeof search.invite === "string" ? search.invite : undefined,
    oauth:
      search.oauth === "google" || search.oauth === "microsoft" || search.oauth === "apple"
        ? search.oauth
        : undefined,
    tenantId:
      typeof search.tenantId === "string" && isTenantUuid(search.tenantId)
        ? search.tenantId
        : undefined,
  }),
  beforeLoad: createPublicAuthBeforeLoad(),
  head: ({ matches }) => buildAuthSeoHead(matches, "register"),
  component: lazyRouteComponent(() => import("@/features/auth/pages/RegisterPage")),
});
