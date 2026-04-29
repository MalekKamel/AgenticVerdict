import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/dashboard/agency/")({
  component: lazyRouteComponent(
    () => import("@/features/dashboard/pages/agency/AgencyDashboardPage"),
  ),
});
