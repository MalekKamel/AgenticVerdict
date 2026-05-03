/**
 * Locale-aware navigation (replaces next-intl createNavigation).
 * Now uses router SSOT for centralized router access.
 */
import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import { forwardRef, useMemo, type ComponentProps } from "react";

import { useLocaleParam as useRouterLocaleParam } from "@/router/hooks/useLocaleParam";
import { useNavigate as useSsrNavigate } from "@/router/hooks/useNavigate";
import { useRouter as useSsrRouter } from "@/router/hooks/useRouter";
import { withLocalePrefix, stripLocalePrefix } from "@/router/utils/navigation";

export { useRouterLocaleParam as useLocaleParam };

export function usePathname(): string {
  const locale = useRouterLocaleParam();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return stripLocalePrefix(pathname, locale);
}

export function useLocaleAwareCurrentPath(): string {
  const locale = useRouterLocaleParam();
  const location = useRouterState({ select: (s) => s.location });
  const path = stripLocalePrefix(location.pathname, locale);
  return `${path}${location.searchStr}${location.hash}`;
}

export type LocaleLinkProps = Omit<ComponentProps<typeof RouterLink>, "to"> & {
  href?: string;
  to?: string;
  locale?: import("./locales").AppLocale;
};

export const Link = forwardRef<HTMLAnchorElement, LocaleLinkProps>(function Link(
  { href, to, locale: localeProp, ...rest },
  ref,
) {
  const defaultLocale = useRouterLocaleParam();
  const locale = localeProp ?? defaultLocale;
  const target = href ?? to ?? "/";
  const fullTo = withLocalePrefix(locale, target);

  return <RouterLink ref={ref} to={fullTo} {...rest} />;
});

export function useRouter() {
  const ssrNavigate = useSsrNavigate();
  const router = useSsrRouter();
  const locale = useRouterLocaleParam();

  return useMemo(
    () => ({
      push: (path: string) => {
        ssrNavigate.push(path);
      },
      replace: (path: string) => {
        ssrNavigate.replace(path);
      },
      prefetch: (path: string) => {
        void router.preloadRoute({
          to: withLocalePrefix(locale, path.startsWith("/") ? path : `/${path}`),
        });
      },
      back: () => window.history.back(),
    }),
    [ssrNavigate, locale, router],
  );
}

export { withLocalePrefix, stripLocalePrefix } from "@/router/utils/navigation";
