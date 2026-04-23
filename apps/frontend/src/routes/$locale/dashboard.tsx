import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createProtectedBeforeLoad } from "@/lib/auth/route-guards";

export const Route = createFileRoute("/$locale/dashboard")({
  beforeLoad: createProtectedBeforeLoad(),
  component: lazyRouteComponent(() => import("./-dashboard.page")),
});
