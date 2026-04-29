import { createFileRoute, Outlet } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";

export const Route = createFileRoute("/$locale/dashboard/agency")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: AgencyDashboardLayout,
});

function AgencyDashboardLayout() {
  return <Outlet />;
}
