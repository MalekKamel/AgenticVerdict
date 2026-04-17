import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$locale/onboarding"!</div>;
}
