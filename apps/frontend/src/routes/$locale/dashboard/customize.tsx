import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";

export const Route = createFileRoute("/$locale/dashboard/customize")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(
    () => import("@/features/dashboard/pages/customize/CustomizeDashboardPage"),
  ),
});
