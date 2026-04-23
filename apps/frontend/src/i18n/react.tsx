/**
 * Client-side i18n for TanStack Start (replaces next-intl hooks in components).
 */
import IntlMessageFormat from "intl-messageformat";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import enMessages from "../../messages/en.json";
import type { AppLocale } from "./routing";

type Messages = Record<string, unknown>;
type TranslationValues = Record<string, string | number | boolean | Date | null | undefined>;
type MessageSchema = typeof enMessages;

export type TranslationNamespace = keyof MessageSchema & string;

const I18nContext = createContext<{
  locale: AppLocale;
  messages: Messages;
} | null>(null);

function getNested(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || cur === undefined || typeof cur !== "object") {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): AppLocale {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useLocale must be used within I18nProvider");
  }
  return ctx.locale;
}

function formatMessage(
  messages: Messages,
  locale: AppLocale,
  fullKey: string,
  values?: TranslationValues,
): string {
  const raw = getNested(messages, fullKey.split("."));
  if (typeof raw !== "string") {
    return fullKey;
  }
  try {
    const fmt = new IntlMessageFormat(raw, locale);
    return fmt.format(values ?? {}) as string;
  } catch {
    if (import.meta.env.DEV) {
      console.warn("[i18n] Message formatting failed", { locale, fullKey, raw });
    }
    return fullKey;
  }
}

/**
 * Namespace-first translation hook.
 * Callers must provide a top-level namespace from the message schema.
 */
export function useTranslations(namespace: TranslationNamespace) {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslations must be used within I18nProvider");
  }
  const { locale, messages } = ctx;

  return useCallback(
    (key: string, values?: TranslationValues) => {
      const fullKey = `${namespace}.${key}`;
      return formatMessage(messages, locale, fullKey, values);
    },
    [locale, messages, namespace],
  );
}

/**
 * Namespace-typed translation hook for incremental call-site hardening.
 * Keeps current runtime behavior while enabling compile-time namespace checks.
 */
export function useNamespacedTranslations<N extends TranslationNamespace>(namespace: N) {
  return useTranslations(namespace);
}
