import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/auth/register")({
  head: () => ({
    meta: [
      { title: "Create Account - AgenticVerdict" },
      { name: "description", content: "Join AgenticVerdict to start gaining business insights." },
    ],
  }),
  component: lazyRouteComponent(() => import("./-register.page")),
});
