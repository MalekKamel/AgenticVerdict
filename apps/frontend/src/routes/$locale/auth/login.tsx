import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/auth/login")({
  head: () => ({
    meta: [
      { title: "Sign In - Masafh" },
      {
        name: "description",
        content: "Sign in to your Masafh account to access your dashboard and reports.",
      },
      { name: "keywords", content: "login, sign in, authentication" },
    ],
  }),
  component: lazyRouteComponent(() => import("./-login.page")),
});
