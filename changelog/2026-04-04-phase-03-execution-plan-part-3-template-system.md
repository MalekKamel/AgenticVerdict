# Changelog entry: Phase 03 execution plan — Part 3 template system (Weeks 11–15)

**Date:** 2026-04-04  
**Scope:** [Execution plan Part 3](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — **TMP-1** architecture, **TMP-2** base HTML templates, **TMP-3** component library, **TMP-4** preview + versioning API (in-memory), **TMP-5** automated rendering and performance tests. Drag-and-drop editor UI and Playwright visual regression remain follow-ups.

---

## Summary

- **TMP-1 (`@agenticverdict/report-generator`):** **`template-system-spec.md`** documents inheritance, override flow, and built-in IDs; **`TemplateDefinition`** / **`templateKindSchema`** (Zod) in **`src/templates/template-definition.ts`**; abstract **`BaseReportTemplate`**; **`createBuiltInTemplateMap`** / **`getBuiltInTemplateCatalog`** in **`src/templates/built-in-registry.ts`**; **`ITemplateEngine.render`** now takes **`ReportGenerationContext`** plus model (breaking change from Part 2 placeholder signature).
- **TMP-2:** Built-in layouts **`ExecutiveSummaryTemplate`**, **`DetailedAnalysisTemplate`**, **`TechnicalAppendixTemplate`** under **`src/templates/built-in/`** with shared **`document-shell`**, **`cover-and-header`**, **`table-of-contents`**, and **`localeToTextDirection`** for RTL (`ar`, `he`, `fa`, `ur`).
- **TMP-3:** HTML/SVG primitives — **`components/charts.ts`** (bar, line, pie, scatter), **`data-table.ts`**, **`callout.ts`** / **`highlight`**, **`section-divider.ts`**, **`figure.ts`**; shared **`escapeHtml`**, **`escapeAttr`**, **`sanitizeDomId`** in **`html-utils.ts`**.
- **TMP-4:** **`CompositeTemplateEngine`** + **`createDefaultCompositeTemplateEngine(overrides?)`** and **`TemplateHtmlOverrideSource`**; **`apps/api`** dependency on **`@agenticverdict/report-generator`**; **`registerReportTemplateRoutes`** — `GET /api/v1/report-templates`, `POST .../preview`, `GET|POST .../versions`; tenant-scoped in-memory **`template-customization-store`** with **`templateHtmlOverrideSource`**; OpenAPI tag **Report templates**; contract tests for catalog, preview, versioning, and RBAC.
- **TMP-5:** Vitest coverage for composite resolution, charts, view-model coercion + **`safeSectionBody`** XSS guard, built-in rendering (including Arabic RTL), and a **performance** budget test for large **`detailed-analysis`** payloads.
- **Worker:** **`defaultReportGenerationProcessor`** uses **`createDefaultCompositeTemplateEngine()`** instead of **`PlaceholderTemplateEngine`** so jobs render real HTML for known template IDs and still fall back for unknown IDs.
- **Version:** **`REPORT_GENERATOR_PACKAGE_VERSION`** **`0.2.0`**.

---

## Verification (local)

```bash
pnpm --filter @agenticverdict/report-generator test
pnpm --filter @agenticverdict/report-generator run typecheck
pnpm --filter @agenticverdict/api test
pnpm --filter @agenticverdict/worker test
```

---

## Follow-ups (not in this change)

- **Visual regression** (screenshot diff) via Playwright against preview HTML or staged PDF snapshots.
- **Template editor** web app: drag-and-drop blocks calling **`POST /report-templates/:id/versions`** and live preview.
- **Durable template storage**: PostgreSQL + object storage for version blobs; align with **`drizzle-reports`** when API has **`DATABASE_URL`**.

---

## Related documentation

- [`docs/03-development-phases/phase-03-report-generation/template-system-spec.md`](docs/03-development-phases/phase-03-report-generation/template-system-spec.md)
- [`changelog/2026-04-04-phase-03-execution-plan-part-2-infrastructure.md`](changelog/2026-04-04-phase-03-execution-plan-part-2-infrastructure.md)
