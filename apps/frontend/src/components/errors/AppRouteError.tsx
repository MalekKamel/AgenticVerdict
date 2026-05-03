"use client";

/**
 * Route-level error boundary UI (works without Mantine — may render outside `Providers`).
 * Root and parent-route `errorComponent`s run outside `I18nProvider`; those paths get a
 * local provider with messages derived from the URL locale (or default on SSR).
 */

import { getTrpcSafeUserMessage } from "@/lib/api/trpc-error-message";
import { logWebClientError } from "@/lib/observability/client-log";
import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";
import frMessages from "../../../messages/fr.json";
import { defaultLocale, parseLocaleFromPathname, type AppLocale } from "@/i18n/locales";
import { I18nProvider, useI18nContextOptional, useTranslations } from "@/i18n/react";
import { useEffect, type ReactNode } from "react";

export interface AppRouteErrorProps {
  error: unknown;
  reset: () => void;
  /** Shown in logs only; keep stable per route file */
  routeLabel?: string;
}

function fallbackMessagesForLocale(locale: AppLocale): Record<string, unknown> {
  switch (locale) {
    case "ar":
      return arMessages as Record<string, unknown>;
    case "fr":
      return frMessages as Record<string, unknown>;
    default:
      return enMessages as Record<string, unknown>;
  }
}

function AppRouteErrorInner({ error, reset, routeLabel }: AppRouteErrorProps): ReactNode {
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    logWebClientError(error, { source: "route", routeLabel });
  }, [error, routeLabel]);

  const messageKey = getTrpcSafeUserMessage(error);
  const message = messageKey.startsWith("errors.")
    ? tErrors(messageKey.slice("errors.".length))
    : tErrors("common.unknownError");

  return (
    <div
      role="alert"
      style={{
        padding: "1rem",
        maxWidth: "36rem",
        margin: "2rem auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>
        {tErrors("somethingWentWrong")}
      </h1>
      <p style={{ marginBottom: "1rem", color: "#333" }}>{message}</p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          appearance: "none",
          fontSize: "0.875rem",
          border: "1px solid #333",
          padding: "0.35rem 0.75rem",
          borderRadius: "0.25rem",
          cursor: "pointer",
          background: "#fff",
        }}
      >
        {tCommon("retry")}
      </button>
    </div>
  );
}

export function AppRouteError(props: AppRouteErrorProps): ReactNode {
  const ctx = useI18nContextOptional();
  if (ctx) {
    return <AppRouteErrorInner {...props} />;
  }
  const locale =
    typeof window !== "undefined"
      ? parseLocaleFromPathname(window.location.pathname)
      : defaultLocale;
  const messages = fallbackMessagesForLocale(locale);
  return (
    <I18nProvider locale={locale} messages={messages}>
      <AppRouteErrorInner {...props} />
    </I18nProvider>
  );
}
