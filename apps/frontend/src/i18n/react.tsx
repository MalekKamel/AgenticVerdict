/**
 * Client-side i18n for TanStack Start (replaces next-intl hooks in components).
 */
import IntlMessageFormat from "intl-messageformat";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { initializeNotificationTranslations } from "@/lib/notifications-i18n";
import type { AppLocale } from "./routing";
import type { NamespaceKeys, NamespaceType } from "@agenticverdict/i18n/types";

type Messages = Record<string, unknown>;
type TranslationValues = Record<string, string | number | boolean | Date | null | undefined>;

export type TranslationNamespace = NamespaceType;

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
  const value = useMemo(() => {
    // Initialize notification translations when locale or messages change
    initializeNotificationTranslations(locale, messages);
    return { locale, messages };
  }, [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Returns null when rendered outside `I18nProvider` (e.g. root or parent route `errorComponent`). */
export function useI18nContextOptional() {
  return useContext(I18nContext);
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
  options?: { returnNull?: boolean },
): string | null {
  const raw = getNested(messages, fullKey.split("."));
  if (typeof raw !== "string") {
    if (options?.returnNull) {
      return null;
    }
    return fullKey;
  }
  try {
    const fmt = new IntlMessageFormat(raw, locale);
    return fmt.format(values ?? {}) as string;
  } catch {
    if (import.meta.env.DEV) {
      console.warn("[i18n] Message formatting failed", { locale, fullKey, raw });
    }
    if (options?.returnNull) {
      return null;
    }
    return fullKey;
  }
}

interface TranslationOptions {
  returnNull?: boolean;
  defaultValue?: string;
  [key: string]: unknown;
}

type TranslateFunction<N extends TranslationNamespace> = {
  (key: NamespaceKeys<N>, values?: TranslationValues): string;
  (key: string, values?: TranslationValues): string;
  (key: NamespaceKeys<N>, options: { returnNull: true } & TranslationOptions): string | null;
  (key: string, options: { returnNull: true } & TranslationOptions): string | null;
  (key: NamespaceKeys<N>, options: TranslationOptions): string;
  (key: string, options: TranslationOptions): string;
};

/**
 * Namespace-first translation hook.
 * Callers must provide a top-level namespace from the message schema.
 */
export function useTranslations<N extends TranslationNamespace>(
  namespace: N,
): TranslateFunction<N> {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslations must be used within I18nProvider");
  }
  const { locale, messages } = ctx;

  return useCallback(
    (key: string, values?: TranslationValues | TranslationOptions): string | null => {
      const fullKey = `${namespace}.${key}`;
      const options =
        typeof values === "object" && values !== null && "returnNull" in values
          ? values
          : undefined;
      const translationValues = options ? undefined : values;

      return formatMessage(
        messages,
        locale,
        fullKey,
        translationValues as TranslationValues | undefined,
        options,
      );
    },
    [locale, messages, namespace],
  ) as TranslateFunction<N>;
}

/**
 * Namespace-typed translation hook for incremental call-site hardening.
 * Keeps current runtime behavior while enabling compile-time namespace checks.
 */
export function useNamespacedTranslations<N extends TranslationNamespace>(namespace: N) {
  return useTranslations(namespace);
}
