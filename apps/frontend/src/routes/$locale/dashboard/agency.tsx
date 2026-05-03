import { createFileRoute, Outlet } from "@tanstack/react-router";

import { createAgencyDashboardBeforeLoad } from "@/features/dashboard/route-guards/create-agency-dashboard-before-load";

export const Route = createFileRoute("/$locale/dashboard/agency")({
  beforeLoad: createAgencyDashboardBeforeLoad(),
  component: AgencyDashboardLayout,
});

function AgencyDashboardLayout() {
  return <Outlet />;
}
