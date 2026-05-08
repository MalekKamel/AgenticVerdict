import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";

export const Route = createFileRoute("/$locale/settings/connectors/domain-mapper")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/settings/connectors/DomainMapper")),
});
