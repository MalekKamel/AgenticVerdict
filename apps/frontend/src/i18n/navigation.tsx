/**
 * Locale-aware navigation (replaces next-intl createNavigation).
 */
import { Link as RouterLink, useNavigate, useRouterState, useParams } from "@tanstack/react-router";
import { forwardRef, useMemo, type ComponentProps } from "react";

import type { AppLocale } from "./routing";
import { routing } from "./routing";

function useLocaleParam(): AppLocale {
  const params = useParams({ strict: false }) as { locale?: string };
  const locale = params.locale;
  if (locale && (routing.locales as readonly string[]).includes(locale)) {
    return locale as AppLocale;
  }
  return routing.defaultLocale;
}

function withLocalePrefix(locale: AppLocale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

function stripLocalePrefix(pathname: string, locale: AppLocale): string {
  const prefix = `/${locale}`;
  if (pathname === prefix || pathname === `${prefix}/`) {
    return "/";
  }
  if (pathname.startsWith(`${prefix}/`)) {
    const rest = pathname.slice(prefix.length);
    return rest || "/";
  }
  return pathname;
}

export function usePathname(): string {
  const locale = useLocaleParam();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return stripLocalePrefix(pathname, locale);
}

export type LocaleLinkProps = Omit<ComponentProps<typeof RouterLink>, "to"> & {
  href?: string;
  to?: string;
  locale?: AppLocale;
};

export const Link = forwardRef<HTMLAnchorElement, LocaleLinkProps>(function Link(
  { href, to, locale: localeProp, ...rest },
  ref,
) {
  const defaultLocale = useLocaleParam();
  const locale = localeProp ?? defaultLocale;
  const target = href ?? to ?? "/";
  const fullTo = withLocalePrefix(locale, target);

  return <RouterLink ref={ref} to={fullTo} {...rest} />;
});

export function useRouter() {
  const navigate = useNavigate();
  const locale = useLocaleParam();

  return useMemo(
    () => ({
      push: (path: string) => {
        navigate({ to: withLocalePrefix(locale, path.startsWith("/") ? path : `/${path}`) });
      },
      replace: (path: string) => {
        navigate({
          to: withLocalePrefix(locale, path.startsWith("/") ? path : `/${path}`),
          replace: true,
        });
      },
      prefetch: () => {
        /* noop: TanStack Router handles preloading */
      },
      back: () => window.history.back(),
    }),
    [navigate, locale],
  );
}
