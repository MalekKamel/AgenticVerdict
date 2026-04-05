/**
 * Default print stylesheet for HTML → PDF (Chromium). Templates can use these
 * class names for multi-column sections and pagination hints (Part 4 / PDF-1).
 */
export const DEFAULT_REPORT_PRINT_CSS = `
@page {
  size: A4;
  margin: 14mm 12mm 16mm 12mm;
}
@media print {
  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .report-two-column,
  .report-columns-2 {
    column-count: 2;
    column-gap: 10mm;
    column-fill: balance;
  }
  .report-three-column,
  .report-columns-3 {
    column-count: 3;
    column-gap: 8mm;
  }
  section.report-avoid-break,
  .report-avoid-break,
  table.report-avoid-break,
  .report-callout {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  h1, h2, h3 {
    break-after: avoid;
    page-break-after: avoid;
  }
  thead {
    display: table-header-group;
  }
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`;
