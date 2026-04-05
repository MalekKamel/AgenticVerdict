/**
 * CSS `font-family` stacks tuned for report HTML/PDF shells. System fonts are listed first for offline rendering.
 */
export function reportBodyFontStack(locale: string): string {
  const base = locale.split("-")[0]?.toLowerCase() ?? "en";
  if (base === "ar" || base === "he" || base === "fa" || base === "ur") {
    return `"Noto Naskh Arabic", "Noto Sans Arabic", "Segoe UI Historic", Tahoma, sans-serif`;
  }
  if (base === "zh") {
    return `"Noto Sans SC", "Noto Sans TC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
  }
  return `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
}
