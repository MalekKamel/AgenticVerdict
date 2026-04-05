import { resolveReportTextDirection } from "@agenticverdict/i18n";

import type { ReportGenerationContext } from "./types";

export function resolveContextTextDirection(context: ReportGenerationContext): "ltr" | "rtl" {
  return resolveReportTextDirection(context.locale, context.textDirection);
}
