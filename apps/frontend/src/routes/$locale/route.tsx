import { createFileRoute, defaultStringifySearch, redirect } from "@tanstack/react-router";

import { AppNotFound } from "@/components/errors/AppNotFound";
import { AppRouteError } from "@/components/errors/AppRouteError";
import { LocaleShellGate } from "@/components/layout/LocaleShellGate";
import { Providers } from "@/components/Providers";
import { loadMessages } from "@/i18n/i18n";
import { getDirection, isSupportedLocale } from "@/i18n/locales";
import { I18nProvider } from "@/i18n/react";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import type { LocaleCode } from "@/i18n/types";
import { fetchCurrentTenantTenantName } from "@/lib/tenant/fetch-current-tenant-name";

export const Route = createFileRoute("/$locale")({
  notFoundComponent: AppNotFound,
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} routeLabel="/$locale" />
  ),
  beforeLoad: ({ params, location }) => {
    if (!isSupportedLocale(params.locale)) {
      const pathAfterFirst = location.pathname.replace(/^\/[^/]+/, "") || "/";
      const search = defaultStringifySearch(location.search);
      const href = `/${routing.defaultLocale}${pathAfterFirst === "/" ? "" : pathAfterFirst}${search}`;
      throw redirect({ href });
    }
  },
  loader: async ({ params }) => {
    const locale = params.locale as LocaleCode;
    // Resolve locale messages and tenant brand context together to keep auth head rendering fast.
    const [messages, tenantName] = await Promise.all([
      loadMessages(locale),
      fetchCurrentTenantTenantName(),
    ]);
    return { locale: locale as AppLocale, messages, tenantName };
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale, messages } = Route.useLoaderData();

  const dir = getDirection(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <div lang={locale} dir={dir}>
        <Providers>
          <LocaleShellGate />
        </Providers>
      </div>
    </I18nProvider>
  );
}
