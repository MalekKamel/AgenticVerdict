import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";

export const Route = createFileRoute("/$locale/settings/usage")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/settings/usage/UsageDashboard")),
});
