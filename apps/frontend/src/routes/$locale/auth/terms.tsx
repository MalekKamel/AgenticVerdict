import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/lib/auth/build-auth-seo-head";

export const Route = createFileRoute("/$locale/auth/terms")({
  head: ({ matches }) => buildAuthSeoHead(matches, "terms"),
  component: lazyRouteComponent(() => import("@/features/auth/pages/TermsPage")),
});
