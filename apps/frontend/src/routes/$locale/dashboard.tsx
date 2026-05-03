import { Outlet, createFileRoute } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";
import { parseDashboardParentSearch } from "@/features/dashboard/model/dashboard-search";

export const Route = createFileRoute("/$locale/dashboard")({
  validateSearch: (search) => parseDashboardParentSearch(search as Record<string, unknown>),
  beforeLoad: createDashboardParentBeforeLoad(),
  component: DashboardLayoutRouteComponent,
});

function DashboardLayoutRouteComponent() {
  return <Outlet />;
}
