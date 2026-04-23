import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/lib/auth/build-auth-seo-head";
import { createPublicAuthBeforeLoad } from "@/lib/auth/route-guards";

export const Route = createFileRoute("/$locale/auth/forgot-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    email: typeof search.email === "string" ? search.email.trim() : undefined,
  }),
  beforeLoad: createPublicAuthBeforeLoad(),
  head: ({ matches }) => buildAuthSeoHead(matches, "forgotPassword"),
  component: lazyRouteComponent(() => import("./-forgot-password.page")),
});
