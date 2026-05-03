import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/dashboard/")({
  component: lazyRouteComponent(() => import("@/features/dashboard/pages/home/DashboardHomePage")),
});
