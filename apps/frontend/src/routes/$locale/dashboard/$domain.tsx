import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDomainDashboardBeforeLoad } from "@/features/dashboard/route-guards/create-domain-dashboard-before-load";

export const Route = createFileRoute("/$locale/dashboard/$domain")({
  beforeLoad: createDomainDashboardBeforeLoad(),
  component: lazyRouteComponent(
    () => import("@/features/dashboard/pages/domain/DomainDashboardPage"),
  ),
});
