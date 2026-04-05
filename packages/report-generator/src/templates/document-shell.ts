import { reportBodyFontStack } from "@agenticverdict/i18n";

import { escapeHtml } from "../html-utils";

function baseStylesForLocale(locale: string): string {
  const font = reportBodyFontStack(locale);
  return `
  :root { color-scheme: light; }
  body { font-family: ${font}; margin: 0; padding: 0; color: #111827; background: #fff; }
  .page { max-width: 900px; margin: 0 auto; padding: 24px 32px 48px; }
  h1, h2, h3 { font-weight: 650; line-height: 1.25; }
  p { line-height: 1.55; }
  a { color: inherit; }
`;
}

export interface ReportDocumentShellOptions {
  locale: string;
  dir: "ltr" | "rtl";
  title: string;
  accentColor: string;
  body: string;
}

export function wrapReportDocument(opts: ReportDocumentShellOptions): string {
  const { locale, dir, title, accentColor, body } = opts;
  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}" dir="${dir}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
${baseStylesForLocale(locale)}
    .brand-accent { color: ${escapeHtml(accentColor)}; }
  </style>
</head>
<body>
  <div class="page">
${body}
  </div>
</body>
</html>`;
}
