import { createFileRoute, defaultStringifySearch, Outlet, redirect } from "@tanstack/react-router";

import { AppNotFound } from "@/components/errors/AppNotFound";
import { AppRouteError } from "@/components/errors/AppRouteError";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { Providers } from "@/components/Providers";
import { loadMessages } from "@/i18n/i18n";
import { I18nProvider } from "@/i18n/react";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import type { LocaleCode } from "@/i18n/types";

export const Route = createFileRoute("/$locale")({
  notFoundComponent: AppNotFound,
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} routeLabel="/$locale" />
  ),
  beforeLoad: ({ params, location }) => {
    if (!(routing.locales as readonly string[]).includes(params.locale)) {
      const pathAfterFirst = location.pathname.replace(/^\/[^/]+/, "") || "/";
      const search = defaultStringifySearch(location.search);
      const href = `/${routing.defaultLocale}${pathAfterFirst === "/" ? "" : pathAfterFirst}${search}`;
      throw redirect({ href });
    }
  },
  loader: async ({ params }) => {
    const locale = params.locale as LocaleCode;
    const messages = await loadMessages(locale);
    return { locale: locale as AppLocale, messages };
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale, messages } = Route.useLoaderData();

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <I18nProvider locale={locale} messages={messages}>
      <div lang={locale} dir={dir}>
        <Providers>
          <AppShellLayout>
            <Outlet />
          </AppShellLayout>
        </Providers>
      </div>
    </I18nProvider>
  );
}
