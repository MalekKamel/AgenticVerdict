import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";
import { parseDashboardParentSearch } from "@/features/dashboard/model/dashboard-search";

export const Route = createFileRoute("/$locale/dashboard")({
  validateSearch: (search) => parseDashboardParentSearch(search as Record<string, unknown>),
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/dashboard/pages/home/DashboardHomePage")),
});
