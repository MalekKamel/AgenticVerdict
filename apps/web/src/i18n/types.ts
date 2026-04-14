/**
 * i18n types
 *
 * TypeScript interfaces for internationalization
 */

/**
 * Text direction
 */
export type TextDirection = "ltr" | "rtl";

/**
 * Supported locale codes
 */
export type LocaleCode = "en" | "ar";

/**
 * Locale information
 */
export interface Locale {
  code: LocaleCode;
  name: string;
  direction: TextDirection;
  currencyFormat: {
    currency: string;
    symbol: string;
    position: "before" | "after";
  };
}

/**
 * Locale configuration map
 */
export const LOCALES: Record<LocaleCode, Locale> = {
  en: {
    code: "en",
    name: "English",
    direction: "ltr",
    currencyFormat: {
      currency: "USD",
      symbol: "$",
      position: "before",
    },
  },
  ar: {
    code: "ar",
    name: "العربية",
    direction: "rtl",
    currencyFormat: {
      currency: "SAR",
      symbol: "ر.س",
      position: "after",
    },
  },
};

/**
 * Get direction from locale code
 */
export function getDirectionFromLocale(code: LocaleCode): TextDirection {
  return LOCALES[code]?.direction ?? "ltr";
}
