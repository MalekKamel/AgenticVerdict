import {
  createFileRoute,
  defaultStringifySearch,
  lazyRouteComponent,
  redirect,
} from "@tanstack/react-router";

import { fetchProtectedRouteSession } from "@/lib/auth/protected-route-session";

export const Route = createFileRoute("/$locale/dashboard")({
  beforeLoad: async ({ params, location }) => {
    const result = await fetchProtectedRouteSession();
    if (result.skipSsrGuard || result.authenticated) {
      return;
    }

    const locale = params.locale;
    const pathAfterLocale = location.pathname.replace(/^\/[^/]+/, "") || "/";
    const search = defaultStringifySearch(location.search);
    const redirectTarget = encodeURIComponent(`${pathAfterLocale}${search}`);

    throw redirect({
      href: `/${locale}/auth/login?redirect=${redirectTarget}`,
    });
  },
  component: lazyRouteComponent(() => import("./-dashboard.page")),
});
