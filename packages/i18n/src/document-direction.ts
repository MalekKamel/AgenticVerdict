import { textDirection, type TextDirection } from "./rtl";

/**
 * Resolves document root direction: optional tenant/user override wins over locale rules.
 */
export function resolveReportTextDirection(
  locale: string,
  override: TextDirection | undefined,
): TextDirection {
  if (override !== undefined) {
    return override;
  }
  return textDirection(locale);
}
