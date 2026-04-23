import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/lib/auth/build-auth-seo-head";

export const Route = createFileRoute("/$locale/auth/privacy")({
  head: ({ matches }) => buildAuthSeoHead(matches, "privacy"),
  component: lazyRouteComponent(() => import("./-privacy.page")),
});
