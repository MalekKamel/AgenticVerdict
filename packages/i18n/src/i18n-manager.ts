import type { AppLocale } from "./formatters";
import type { TextDirection } from "./rtl";
import { loadMessagesSync, resolveLocaleOrFallback, type MessageDictionary } from "./load-messages";
import { textDirection } from "./rtl";

export class I18nManager {
  private locale: AppLocale;
  private messages: MessageDictionary;
  private directionOverride: TextDirection | undefined;

  constructor(initialLocale: AppLocale) {
    this.locale = initialLocale;
    this.messages = loadMessagesSync(initialLocale);
  }

  getLocale(): AppLocale {
    return this.locale;
  }

  getMessages(): MessageDictionary {
    return this.messages;
  }

  /** Logical text direction for document / UI roots. */
  direction(): "rtl" | "ltr" {
    if (this.directionOverride !== undefined) {
      return this.directionOverride;
    }
    return textDirection(this.locale);
  }

  /** Force LTR/RTL regardless of locale (e.g. user preference). Pass undefined to clear. */
  setTextDirectionOverride(override: TextDirection | undefined): void {
    this.directionOverride = override;
  }

  /**
   * Switch active locale and reload dictionary from disk (sync; suitable for worker/CLI).
   * For `next-intl`, prefer framework switching on the web app.
   */
  setLocaleFromTag(requested: string | undefined, fallback: AppLocale): void {
    const next = resolveLocaleOrFallback(requested, fallback);
    this.locale = next;
    this.messages = loadMessagesSync(next);
  }

  /** ICU-style key with optional fallback when the key is missing. */
  t(key: string, fallback?: string): string {
    const v = this.messages[key];
    if (v !== undefined) {
      return v;
    }
    return fallback ?? key;
  }
}
