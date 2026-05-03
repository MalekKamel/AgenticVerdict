import { Outlet, createFileRoute } from "@tanstack/react-router";

import { createDashboardParentBeforeLoad } from "@/features/dashboard/route-guards/create-dashboard-parent-before-load";

export const Route = createFileRoute("/$locale/dashboard/connectors/$id")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: Outlet,
});
