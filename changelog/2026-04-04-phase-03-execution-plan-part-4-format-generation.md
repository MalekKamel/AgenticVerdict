# Changelog entry: Phase 03 execution plan — Part 4 format generation (Weeks 15–19)

**Date:** 2026-04-04  
**Scope:** [Execution plan Part 4](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — **PDF-1** (Playwright/Chromium HTML → PDF) and **DOCX-1** (HTML → DOCX via `docx` + `node-html-parser`). **PDF/A** archival, aggressive PDF byte-size tuning, and cross-suite visual/editability QA remain follow-ups.

---

## Summary

- **PDF-1 (`@agenticverdict/report-generator`):** **`PlaywrightPdfFormatGenerator`** in **`src/pdf-playwright-generator.ts`** — shared Chromium via **`getSharedChromiumBrowser()`**, **`closeSharedChromiumBrowser()`** for worker shutdown; **`ensureHtmlDocument()`** wraps template fragments; **`DEFAULT_REPORT_PRINT_CSS`** in **`src/pdf-print-styles.ts`** for multi-column (`.report-two-column`, `.report-columns-2|3`), **`break-inside: avoid`** helpers, and table header repetition; **`page.pdf()`** with **`tagged: true`** (PDF/UA-oriented tagged PDF), dynamic header/footer (template + report id, page numbers), **`preferCSSPageSize`**, A4 defaults.
- **DOCX-1:** **`HtmlDocxFormatGenerator`** + **`packDocxFromHtml`** / **`buildReportDocumentFromHtml`** in **`src/html-to-docx.ts`** — headings, paragraphs, **lists**, **tables** with **colspan/rowspan**, **data-URI** images (png/jpg/gif/bmp), inline **bold/italic**, **external hyperlinks**; **section header/footer** with page fields; optional **Word TOC field** when HTML contains **`#report-docx-toc`** or **`[data-report-docx-toc]`** and **`updateFields`** for refresh-on-open.
- **Registry:** **`createStubFormatRegistry()`** for fast unit tests; **`createDefaultFormatRegistry()`** registers Playwright PDF + HTML DOCX + **XLSX stub**; **`AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS=1`** switches defaults to stubs (worker unit test uses this).
- **Worker:** **`registerReportWorkers().close`** awaits **`closeSharedChromiumBrowser()`** after BullMQ workers close.
- **Dependencies:** **`playwright`**, **`docx`**, **`node-html-parser`** on **`@agenticverdict/report-generator`**.
- **Version:** **`REPORT_GENERATOR_PACKAGE_VERSION`** **`0.3.0`**.

---

## Verification (local)

```bash
pnpm --filter @agenticverdict/report-generator exec playwright install chromium
pnpm --filter @agenticverdict/report-generator test
pnpm --filter @agenticverdict/report-generator run typecheck
pnpm --filter @agenticverdict/worker test
```

To skip the optional Playwright PDF integration test:

```bash
SKIP_PLAYWRIGHT_PDF_TESTS=1 pnpm --filter @agenticverdict/report-generator test
```

---

## Follow-ups (not in this change)

- **PDF/A** conformance and **ghostscript**/**qpdf** post-processing for long-term archival profiles.
- **PDF byte-size** tuning (image downscaling pipeline, font subsetting, `scale` presets per tenant).
- **DOCX** vertical merge refinement for complex **rowspan** grids in malformed HTML; remote **`http(s)`** images (fetch + size probe) behind allowlists.
- **XLSX** real generator replacing **`StubFormatGenerator("xlsx")`**.
- **Editability QA** matrix (Word, LibreOffice, Google Docs) as manual or scripted checklist.
- **CI:** ensure **`playwright install chromium`** runs in pipelines that execute PDF tests, or set **`SKIP_PLAYWRIGHT_PDF_TESTS=1`**.

---

## Related documentation

- [`docs/03-development-phases/phase-03-report-generation/execution-plan.md`](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — Part 4 (Weeks 15–19)
- [`changelog/2026-04-04-phase-03-execution-plan-part-3-template-system.md`](changelog/2026-04-04-phase-03-execution-plan-part-3-template-system.md)
