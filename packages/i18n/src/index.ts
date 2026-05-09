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
  LANGUAGE_NATIVE_NAMES,
  LOCALE_DISPLAY_METADATA,
  getLocaleDisplayName,
  type LocaleDisplayMetadata,
} from "./formatters";
import type { AppLocale } from "./formatters";
export const DEFAULT_APP_LOCALE: AppLocale = "en";
export type { TextDirection } from "./rtl";
export { resolveReportTextDirection } from "./document-direction";
export {
  appLocaleFromLanguageTag,
  detectPreferredAppLocale,
  detectPreferredBrowserLocale,
  normalizeToAppLocale,
} from "./language-detection";
export { I18nManager } from "./i18n-manager";
export {
  flattenMessages,
  loadMessagesSync,
  resolveLocaleOrFallback,
  type MessageDictionary,
} from "./load-messages";
export { mergeMessageDictionaries } from "./message-merge";
export { isRtlLocale, textDirection } from "./rtl";
export {
  assertAllLocalesHaveSameKeys,
  messageKeysForLocale,
  missingKeysComparedTo,
} from "./translation-parity";
export {
  analyzeLocaleQuality,
  assertStructuralLocaleQuality,
  computeLexicalOverlapDiagnostic,
  targetLocales,
  type LocaleQualityIssue,
  type LocaleQualityReport,
} from "./locale-quality";
export {
  computeSentenceBleu,
  meanSentenceBleu,
  tokenizeBleu,
  type ParallelStringPair,
} from "./bleu-score";
export { reportBodyFontStack } from "./typography";
