import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createProtectedBeforeLoad } from "@/lib/auth/route-guards";

export const Route = createFileRoute("/$locale/onboarding")({
  beforeLoad: createProtectedBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/onboarding/pages/OnboardingPage")),
});
