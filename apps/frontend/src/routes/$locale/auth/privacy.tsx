import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/features/auth/ui/build-auth-seo-head";

export const Route = createFileRoute("/$locale/auth/privacy")({
  head: ({ matches }) => buildAuthSeoHead(matches, "privacy"),
  component: lazyRouteComponent(() => import("@/features/auth/pages/PrivacyPage")),
});
