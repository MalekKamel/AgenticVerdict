# Phase 03 — Template system specification (TMP-1)

**Date:** 2026-04-04  
**Status:** Implemented (code) — see `@agenticverdict/report-generator`  
**Related:** [execution-plan.md](./execution-plan.md) Part 3 (Weeks 11–15)

---

## Goals

- Provide **inheritance-style** layouts via abstract `BaseReportTemplate` subclasses (one class per canonical report type).
- Keep **tenant overrides** as full HTML documents so a future drag-and-drop editor can persist arbitrary markup without blocking server-side composition.
- Share **presentation primitives** (charts, tables, callouts, figures, dividers) as pure HTML/SVG builders for PDF/DOCX pipelines later.

---

## Architecture

| Layer         | Responsibility                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Catalog**   | `getBuiltInTemplateCatalog()` exposes Zod-validated `TemplateDefinition` metadata (id, kind, version, page-range hints). |
| **Registry**  | `createBuiltInTemplateMap()` maps `templateId` → `BaseReportTemplate` instance.                                          |
| **Engine**    | `CompositeTemplateEngine` resolves: override HTML → built-in template → `PlaceholderTemplateEngine`.                     |
| **Overrides** | `TemplateHtmlOverrideSource.getLatestHtml(tenantId, templateId)`; API stores versioned rows in memory (DB/S3 follow-up). |

---

## Built-in templates

| `templateId`         | Kind                 | Role                                                                             |
| -------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `executive-summary`  | `executive_summary`  | Cover, TOC, summary callout, findings, first chart, optional KPI table.          |
| `detailed-analysis`  | `detailed_analysis`  | Cover + running header, TOC, narrative sections, chart grid, full metrics table. |
| `technical-appendix` | `technical_appendix` | Cover, TOC, `<pre>` appendix blocks, optional reference table.                   |

Cover blocks, TOC, and document shell live under `templates/`; reusable widgets live under `components/`.

---

## View model

`coerceReportTemplateViewModel(unknown)` normalizes arbitrary JSON into a stable shape with defaults.  
`safeSectionBody` only allows `bodyHtml` when it matches the escaped `bodyText`, blocking raw HTML injection from unvalidated agents.

---

## i18n / RTL

`localeToTextDirection(locale)` sets `<html dir="rtl">` for Arabic, Hebrew, Farsi, and Urdu base languages; other locales use LTR.

---

## API surface (preview + versioning)

Mounted under `/api/v1` (JWT + report RBAC):

- `GET /report-templates` — built-in catalog.
- `POST /report-templates/:templateId/preview` — `{ model?, locale? }` → `{ html }`.
- `GET|POST .../versions` — list / append tenant HTML versions (latest wins for overrides).

---

## Deferred from Part 3 plan

- **Visual regression** (Playwright screenshots) — not wired in this package; run in `apps/web` or a dedicated visual suite.
- **Drag-and-drop template editor UI** — API hooks exist; product UI is out of scope here.
- **Database persistence** for template versions — in-memory store mirrors Part 2 report blob placeholder pattern.

---

## Verification

```bash
pnpm --filter @agenticverdict/report-generator test
pnpm --filter @agenticverdict/api test
pnpm --filter @agenticverdict/worker test
```
