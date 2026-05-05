import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/dashboard/insights/$id/edit")({
  component: lazyRouteComponent(() => import("@/features/insights/pages/InsightEditPage")),
});
