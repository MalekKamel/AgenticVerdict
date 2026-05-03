import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";

export const Route = createFileRoute("/$locale/dashboard/connectors/$id/configure")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/connectors/pages/ConnectorConfigurePage")),
});
