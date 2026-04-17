import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password" },
      { name: "description", content: "Set a new password using your reset link." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: lazyRouteComponent(() => import("./-reset-password.page")),
});
