import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createAgencyClientDashboardBeforeLoad } from "@/features/dashboard/route-guards/create-agency-client-dashboard-before-load";

export const Route = createFileRoute("/$locale/dashboard/agency/$clientId")({
  beforeLoad: createAgencyClientDashboardBeforeLoad(),
  component: lazyRouteComponent(
    () => import("@/features/dashboard/pages/agency-client/AgencyClientDashboardPage"),
  ),
});
