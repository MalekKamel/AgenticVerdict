import { UI_COLOR_SCHEME_STORAGE_KEY } from "@agenticverdict/ui";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";

import { AppRouteError } from "@/components/errors/AppRouteError";
import { getDirection, parseLocaleFromPathname } from "@/i18n/locales";
import { getCspNonce } from "@web-csp-nonce";

import "@mantine/core/styles.css";
import "../styles/globals.css";

export const Route = createRootRoute({
  errorComponent: ({ error, reset }) => (
    <AppRouteError error={error} reset={reset} routeLabel="__root__" />
  ),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgenticVerdict" },
      { name: "description", content: "Multi-platform marketing analytics" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const locale = parseLocaleFromPathname(pathname);
  const dir = getDirection(locale);
  const cspNonce = getCspNonce();

  return (
    <html lang={locale} dir={dir} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript
          defaultColorScheme="auto"
          localStorageKey={UI_COLOR_SCHEME_STORAGE_KEY}
          {...(cspNonce ? { nonce: cspNonce } : {})}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
