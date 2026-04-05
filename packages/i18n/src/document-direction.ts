import { textDirection } from "./rtl";

export type ReportTextDirection = "ltr" | "rtl";

/**
 * Resolves document root direction: optional tenant/user override wins over locale rules.
 */
export function resolveReportTextDirection(
  locale: string,
  override: ReportTextDirection | undefined,
): ReportTextDirection {
  if (override !== undefined) {
    return override;
  }
  return textDirection(locale);
}
