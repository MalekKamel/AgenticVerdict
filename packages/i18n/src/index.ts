/**
 * Shared i18n helpers — web uses next-intl; this package holds cross-app formatters and utilities.
 */
export const I18N_PACKAGE_VERSION = "0.1.0";

export {
  APP_LOCALES,
  type AppLocale,
  createLocalizationFormatters,
  intlLocaleTag,
  type LocalizationFormatConfig,
} from "./formatters";
