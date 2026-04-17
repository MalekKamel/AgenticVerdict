/**
 * Client-side i18n for TanStack Start (replaces next-intl hooks in components).
 */
import IntlMessageFormat from "intl-messageformat";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import type { AppLocale } from "./routing";

type Messages = Record<string, unknown>;

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
  values?: Record<string, string | number | boolean | Date | null | undefined>,
): string {
  const raw = getNested(messages, fullKey.split("."));
  if (typeof raw !== "string") {
    return fullKey;
  }
  try {
    const fmt = new IntlMessageFormat(raw, locale);
    return fmt.format(values ?? {}) as string;
  } catch {
    return raw.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
      values && name in values ? String(values[name]) : `{{${name}}}`,
    );
  }
}

/**
 * next-intl-compatible: `useTranslations()` or `useTranslations('namespace')`
 */
export function useTranslations(namespace?: string) {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslations must be used within I18nProvider");
  }
  const { locale, messages } = ctx;

  return useCallback(
    (key: string, values?: Record<string, string | number | boolean | Date | null | undefined>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return formatMessage(messages, locale, fullKey, values);
    },
    [locale, messages, namespace],
  );
}
