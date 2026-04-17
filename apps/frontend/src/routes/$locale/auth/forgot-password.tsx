import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password" },
      { name: "description", content: "Request a password reset link for your account." },
    ],
  }),
  component: lazyRouteComponent(() => import("./-forgot-password.page")),
});
