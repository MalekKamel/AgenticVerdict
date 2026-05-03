import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import { createProtectedBeforeLoad } from "@/features/auth/route-guards";

export const Route = createFileRoute("/$locale/onboarding")({
  beforeLoad: createProtectedBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/onboarding/pages/OnboardingPage")),
});
