import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/onboarding")({
  component: lazyRouteComponent(() => import("./-onboarding.page")),
});
