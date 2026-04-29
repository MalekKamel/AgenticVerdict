import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/lib/auth/build-auth-seo-head";

export const Route = createFileRoute("/$locale/auth/help")({
  head: ({ matches }) => buildAuthSeoHead(matches, "help"),
  component: lazyRouteComponent(() => import("@/features/auth/pages/HelpPage")),
});
