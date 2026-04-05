/**
 * Shared i18n helpers — web uses next-intl; this package holds cross-app formatters and utilities.
 */
export const I18N_PACKAGE_VERSION = "0.3.0";

export { isolateLtrText, isolateRtlText, wrapHtmlDirAuto } from "./bidi";
export {
  APP_LOCALES,
  type AppLocale,
  createLocalizationFormatters,
  intlLocaleTag,
  type LocalizationFormatConfig,
} from "./formatters";
export type { ReportTextDirection } from "./document-direction";
export { resolveReportTextDirection } from "./document-direction";
export {
  appLocaleFromLanguageTag,
  detectPreferredAppLocale,
  normalizeToAppLocale,
} from "./language-detection";
export { I18nManager } from "./i18n-manager";
export { loadMessagesSync, resolveLocaleOrFallback, type MessageDictionary } from "./load-messages";
export { mergeMessageDictionaries } from "./message-merge";
export { isRtlLocale, textDirection } from "./rtl";
export {
  assertAllLocalesHaveSameKeys,
  messageKeysForLocale,
  missingKeysComparedTo,
} from "./translation-parity";
export { reportBodyFontStack } from "./typography";
