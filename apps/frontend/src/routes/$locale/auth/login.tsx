import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/lib/auth/build-auth-seo-head";
import { createPublicAuthBeforeLoad } from "@/lib/auth/route-guards";

const OAUTH_PROVIDERS = new Set(["google", "microsoft", "apple"]);

export const Route = createFileRoute("/$locale/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    session: search.session === "expired" ? "expired" : undefined,
    oauth:
      typeof search.oauth === "string" && OAUTH_PROVIDERS.has(search.oauth)
        ? (search.oauth as "google" | "microsoft" | "apple")
        : undefined,
  }),
  beforeLoad: createPublicAuthBeforeLoad(),
  head: ({ matches }) => buildAuthSeoHead(matches, "login"),
  component: lazyRouteComponent(() => import("@/features/auth/pages/LoginPage")),
});
