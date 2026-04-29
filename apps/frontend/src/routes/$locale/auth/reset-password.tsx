import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { buildAuthSeoHead } from "@/lib/auth/build-auth-seo-head";

export const Route = createFileRoute("/$locale/auth/reset-password")({
  head: ({ matches }) => buildAuthSeoHead(matches, "resetPassword"),
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token.trim() : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    email: typeof search.email === "string" ? search.email.trim() : undefined,
  }),
  component: lazyRouteComponent(() => import("@/features/auth/pages/ResetPasswordPage")),
});
