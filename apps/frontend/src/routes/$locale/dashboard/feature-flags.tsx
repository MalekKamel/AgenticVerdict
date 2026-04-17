import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/dashboard/feature-flags")({
  component: lazyRouteComponent(() => import("./-feature-flags.page")),
});
