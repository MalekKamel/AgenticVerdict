# Implementation Plan: Template Factory, DB Localization, UI i18n, Logger Migration

**Change ID:** `refactor-template-factory-localization-logger`
**Date:** 2026-05-10
**Status:** Proposed
**Scope:** Insight Templates system refactoring across 4 dimensions

---

## Executive Summary

The Insight Templates system (Plan 01) shipped with four gaps:

1. Template definitions are hardcoded in `seed-dev.ts` instead of a reusable factory
2. UI components use hardcoded English strings with no `useTranslations()` calls
3. Database `name`/`description` columns are monolingual — no localization support
4. Seed scripts and service code use `console.log/warn` instead of the Pino logger

This plan addresses all four with a baseline-schema.sql update (including Plan 01 tables), a factory pattern for templates, full UI i18n, and logger migration. Schema changes use `make db-reset` — no ALTER or DROP statements.

---

## Dimension 1: Template Factory Pattern

### Problem

Template definitions live in `seed-dev.ts` as inline arrays. This prevents reuse in `seed-prod`, tests, or programmatic template creation.

### Solution: `InsightTemplateFactory`

Create a factory class in `packages/database/src/factories/insight-template-factory.ts` that:

1. **Defines template blueprints** as pure data (no DB calls)
2. **Accepts a DB transaction** and seeds them
3. **Returns a name-to-ID map** for downstream FK resolution
4. **Supports environment-specific overrides** (dev vs prod)

### Architecture

```
packages/database/src/factories/insight-template-factory.ts
├── TemplateBlueprint interface (pure data, no DB types)
├── DEFAULT_TEMPLATES (platform-shared blueprint array)
├── InsightTemplateFactory class
│   ├── createSingle(db, blueprint) → string (template ID)
│   ├── createBatch(db, blueprints) → Map<string, string>
│   └── validateBlueprints(blueprints, lookupContext) → ValidationResult
└── getDevTemplates() / getProdTemplates() → TemplateBlueprint[]
```

### Key Design Decisions

| Decision                                                        | Rationale                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Factory is a class with static methods                          | No instance state needed; static methods are tree-shakeable       |
| Blueprints use domain/connector **names** (not IDs)             | IDs are runtime-resolved; blueprints must be environment-agnostic |
| Factory calls `seedInsightTemplates()` internally               | Keeps the repository seed function as the single DB write path    |
| Dev templates include test fixtures; prod templates are minimal | Dev needs rich data; prod needs only essential templates          |

### Files to Create

- `packages/database/src/factories/insight-template-factory.ts`

### Files to Modify

- `packages/database/scripts/seed-dev.ts` — replace inline template array with `InsightTemplateFactory.createBatch()`
- `packages/database/scripts/seed.ts` — add production seed call
- `packages/database/src/seeds/templates.seed.ts` — refactor to accept `TemplateBlueprint[]` from factory

---

## Dimension 2: Database Localization for Entity Strings

### Problem

`insight_templates.name` and `insight_templates.description` are monolingual `varchar`/`text` columns. Platform templates need to serve users in `en`, `ar`, `fr`, `es`, `zh`.

### Industry Standards Research

| Pattern                                                   | Pros                                                    | Cons                                           | Verdict                                               |
| --------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **EAV table** (`i18n_strings`)                            | Already exists in codebase; tenant-scoped; flexible     | Slow joins; no FK integrity; hard to query     | Keep for tenant-custom strings, not for entity fields |
| **JSONB translation columns** (`name_translations jsonb`) | Single-table reads; flexible locales; PostgreSQL-native | No FK on translations; validation at app layer | **Selected** for entity localization                  |
| **Separate translation tables per entity**                | FK integrity; clean schema                              | Table explosion; complex migrations            | Overkill for this codebase                            |
| **HSTORE**                                                | PostgreSQL-native; key-value                            | Deprecated in favor of JSONB; limited tooling  | Not recommended                                       |
| **Column per locale** (`name_en`, `name_ar`)              | Simple queries; FK-friendly                             | Schema changes per new locale; wide tables     | Violates open-closed principle                        |

### Selected Pattern: JSONB Translation Columns

**Why JSONB:**

- The codebase already uses JSONB extensively (`schedule`, `delivery`, `config`, `metadata`)
- Single-table reads (no joins needed for display)
- Adding a new locale requires zero schema changes
- PostgreSQL supports JSONB indexing and partial queries
- Consistent with the existing `i18n-manager.ts` pattern which resolves locale-specific values from dictionaries

### Schema Changes via `baseline-schema.sql`

The baseline file (`packages/database/scripts/baseline-schema.sql`) must be updated to include:

1. **Plan 01 tables** (not yet in baseline) — `insight_templates`, `insight_template_domains`, `insight_template_connectors`
2. **Localization** — use `name_translations` / `description_translations` JSONB columns instead of monolingual `name`/`description`

**SQL to append to `baseline-schema.sql`:**

```sql
CREATE TYPE "insight_template_schedule_frequency" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');
CREATE TYPE "insight_template_delivery_format" AS ENUM ('pdf', 'excel', 'both');

CREATE TABLE "insight_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"name_translations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description_translations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"icon" varchar(32),
	"ai_template_id" uuid,
	"schedule" jsonb DEFAULT '{"frequency":"weekly","time":9}'::jsonb NOT NULL,
	"delivery" jsonb DEFAULT '{"format":"pdf","emailRecipients":[],"enableWebhook":false,"webhookUrl":null}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insight_templates_name_tenant_unique" UNIQUE("name_translations"->>'en', "tenant_id")
);

CREATE TABLE "insight_template_domains" (
	"template_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	CONSTRAINT "insight_template_domains_pkey" PRIMARY KEY("template_id","domain_id")
);

CREATE TABLE "insight_template_connectors" (
	"template_id" uuid NOT NULL,
	"connector_id" varchar(64) NOT NULL,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "insight_template_connectors_pkey" PRIMARY KEY("template_id","connector_id")
);

ALTER TABLE "insight_templates" ADD CONSTRAINT "insight_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade;
ALTER TABLE "insight_templates" ADD CONSTRAINT "insight_templates_ai_template_id_ai_templates_id_fk" FOREIGN KEY ("ai_template_id") REFERENCES "public"."ai_templates"("id") ON DELETE set null;
ALTER TABLE "insight_template_domains" ADD CONSTRAINT "insight_template_domains_template_id_insight_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."insight_templates"("id") ON DELETE cascade;
ALTER TABLE "insight_template_domains" ADD CONSTRAINT "insight_template_domains_domain_id_business_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."business_domains"("id") ON DELETE cascade;
ALTER TABLE "insight_template_connectors" ADD CONSTRAINT "insight_template_connectors_template_id_insight_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."insight_templates"("id") ON DELETE cascade;
ALTER TABLE "insight_template_connectors" ADD CONSTRAINT "insight_template_connectors_connector_id_data_connectors_id_fk" FOREIGN KEY ("connector_id") REFERENCES "core"."data_connectors"("id") ON DELETE cascade;

CREATE INDEX "insight_templates_tenant_idx" ON "insight_templates" USING btree ("tenant_id");
CREATE INDEX "insight_templates_active_idx" ON "insight_templates" USING btree ("is_active");
CREATE INDEX "insight_templates_ai_template_idx" ON "insight_templates" USING btree ("ai_template_id");
CREATE INDEX "insight_template_domains_domain_idx" ON "insight_template_domains" USING btree ("domain_id");
CREATE INDEX "insight_template_connectors_connector_idx" ON "insight_template_connectors" USING btree ("connector_id");
```

**JSONB structure for translations:**

```json
{
  "en": "Marketing Performance Overview",
  "ar": "نظرة عامة على أداء التسويق",
  "fr": "Aperçu des performances marketing"
}
```

### Reusable Localization Pattern

To make this reusable across any entity, create:

1. **`packages/database/src/schema/mixins/localizable.ts`** — Drizzle column mixin that adds `*_translations jsonb` columns
2. **`packages/database/src/utils/localization.ts`** — Helper functions:
   - `resolveLocale(translations: Record<string, string>, locale: string, fallback: string): string`
   - `setTranslation(translations: Record<string, string>, locale: string, value: string): Record<string, string>`
   - `validateTranslations(translations: Record<string, string>, allowedLocales: string[]): string[]`

### Files to Create

- `packages/database/src/schema/mixins/localizable.ts`
- `packages/database/src/utils/localization.ts`
- `packages/database/src/utils/localization.test.ts`

### Files to Modify

- `packages/database/scripts/baseline-schema.sql` — add Plan 01 tables with localization columns (single source of truth)
- `packages/database/src/schema/insight-templates.ts` — match baseline with translation columns
- `packages/database/src/repositories/insight-templates.repository.ts` — resolve locale on read; accept locale on write
- `packages/database/src/seeds/templates.seed.ts` — seed with translation objects
- `packages/types/src/insight-templates.ts` — update Zod schemas for translation objects
- `apps/api/src/services/insight-templates.service.ts` — pass locale from request context
- `apps/api/src/trpc/routers/insight-templates.ts` — accept locale in input or derive from request

### Migration Strategy (Destructive — Greenfield Policy)

Per project constraints: **no up/down migrations**. The database uses a **baseline SQL file** + **Drizzle push** workflow:

1. `packages/database/scripts/baseline-schema.sql` — raw SQL baseline applied first
2. `make db-reset` — drops/recreates `public` schema, runs `drizzle-kit push`, then seeds

**Steps:**

1. Update `baseline-schema.sql` to include:
   - All 3 tables from Plan 01 (`insight_templates`, `insight_template_domains`, `insight_template_connectors`) with their types, constraints, indexes, and FKs
   - Use `name_translations` / `description_translations` JSONB columns (not monolingual `name`/`description`)
2. Update Drizzle schema (`insight-templates.ts`) to match the baseline
3. Run `make db-reset` — full destructive rebuild from baseline + Drizzle push + seed
4. Update seed script to populate translation JSONB
5. Update all downstream code to use translation-aware types

**No ALTER TABLE or DROP COLUMN statements** — the baseline file is the single source of truth for the full schema.

---

## Dimension 3: UI String Localization

### Problem

All insight template UI components use hardcoded English strings. No `useTranslations()` calls exist in the insights feature area.

### Current i18n Infrastructure

The codebase has a mature i18n system:

- **`@agenticverdict/i18n`** package with `I18nManager`, formatters, locale detection
- **Frontend `I18nProvider`** with `useTranslations(namespace)` and `useNamespacedTranslations<N>()`
- **Message files:** `apps/frontend/messages/{en,ar,fr}.json` (nested JSON, ICU format)
- **Supported locales:** `en`, `ar`, `fr` (shipping), `es`, `zh` (available in i18n package)
- **RTL support:** Built-in for Arabic

### Components to Localize

| Component            | File                                                                    | Hardcoded Strings                                                                   |
| -------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| TemplateBrowser      | `apps/frontend/src/features/insights/ui/TemplateBrowser.tsx`            | "Templates", "Search templates...", "All Domains", "No templates found", "Preview"  |
| TemplatePreviewModal | `apps/frontend/src/features/insights/ui/TemplatePreviewModal.tsx`       | "Template Preview", "Connectors", "Schedule", "Delivery", "Apply Template", "Close" |
| BasicInfoStep        | `apps/frontend/src/features/insights/ui/wizard/steps/BasicInfoStep.tsx` | "Use a template", "Start from scratch", "Basic Info"                                |
| InsightCreateWizard  | `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx`     | "Create Insight", "Step 1 of 4", etc.                                               |
| TemplateService      | `apps/frontend/src/features/insights/services/template-service.ts`      | Error messages, toast notifications                                                 |

### Implementation Plan

#### Step 3.1: Add translation keys to message files

Add an `insights.templates` namespace to all locale message files:

```json
{
  "insights": {
    "templates": {
      "title": "Templates",
      "searchPlaceholder": "Search templates...",
      "allDomains": "All Domains",
      "noTemplatesFound": "No templates found",
      "preview": "Preview",
      "previewTitle": "Template Preview",
      "connectors": "Connectors",
      "schedule": "Schedule",
      "delivery": "Delivery",
      "applyTemplate": "Apply Template",
      "close": "Close",
      "useTemplate": "Use a template",
      "startFromScratch": "Start from scratch",
      "appliedTemplate": "Applied template: {name}",
      "frequency": {
        "daily": "Daily",
        "weekly": "Weekly",
        "monthly": "Monthly",
        "quarterly": "Quarterly"
      },
      "format": {
        "pdf": "PDF",
        "excel": "Excel",
        "both": "PDF + Excel"
      }
    }
  }
}
```

#### Step 3.2: Update components to use `useTranslations()`

Each component:

1. Import `useTranslations` from `@/i18n/react`
2. Call `const t = useTranslations("insights.templates")`
3. Replace all hardcoded strings with `t("key")` or `t("key", { name: value })`

#### Step 3.3: Resolve DB template names at runtime

When displaying a template name from the DB:

1. The API returns `nameTranslations` JSONB
2. The frontend resolves the current locale: `nameTranslations[currentLocale] || nameTranslations["en"] || fallback`
3. This resolution happens in the `TemplateService` layer, not in UI components

### Files to Create

- None (add keys to existing message files)

### Files to Modify

- `apps/frontend/messages/en.json` — add `insights.templates` namespace
- `apps/frontend/messages/ar.json` — add Arabic translations
- `apps/frontend/messages/fr.json` — add French translations
- `apps/frontend/src/features/insights/ui/TemplateBrowser.tsx` — use `useTranslations()`
- `apps/frontend/src/features/insights/ui/TemplatePreviewModal.tsx` — use `useTranslations()`
- `apps/frontend/src/features/insights/ui/wizard/steps/BasicInfoStep.tsx` — use `useTranslations()`
- `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx` — use `useTranslations()`
- `apps/frontend/src/features/insights/services/template-service.ts` — resolve locale for DB strings

---

## Dimension 4: Logger Migration

### Problem

Code uses `console.log`, `console.warn`, `console.error` instead of the structured Pino logger from `@agenticverdict/observability`.

### Current Logger Pattern

```typescript
import { createPinoLogger } from "@agenticverdict/observability";
const logger = createPinoLogger("api"); // or "worker" or "agent-runtime"
logger.info("message", { context: "data" });
logger.error("message", { error: err });
```

**Note:** The database package does NOT currently depend on `@agenticverdict/observability`. Seed scripts run as standalone scripts, not as services.

### Logger Strategy for Database Package

For **seed scripts** (standalone, not service-scoped):

- Create a lightweight logger wrapper in `packages/database/src/logger.ts`
- Uses Pino directly (not `createPinoLogger` which requires a service name)
- Falls back to `console` in test environments

```typescript
// packages/database/src/logger.ts
import pino from "pino";

const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

export const dbLogger = isTest
  ? { info: () => {}, warn: console.warn, error: console.error }
  : pino({ level: process.env.LOG_LEVEL || "info" });
```

For **API/Worker services** (already have logger):

- Use existing `createPinoLogger("api")` or `createPinoLogger("worker")`

### Files to Create

- `packages/database/src/logger.ts`

### Files to Modify

- `packages/database/src/seeds/templates.seed.ts` — replace all `console.log/warn` with `dbLogger`
- `packages/database/scripts/seed-dev.ts` — replace any `console.log` with logger
- `packages/database/src/seeds/*.ts` — audit and replace all `console.*` calls
- `apps/api/src/services/insight-templates.service.ts` — ensure logger is used (not console)
- `apps/api/src/trpc/routers/insight-templates.ts` — ensure logger is used (not console)

---

## Task Breakdown

### Phase 1: Foundation (Database + Factory)

| #   | Task                                                                                                                     | Dependencies | Est. Effort |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------ | ----------- |
| 1.1 | Create `packages/database/src/logger.ts` — lightweight Pino wrapper for DB package                                       | None         | 15 min      |
| 1.2 | Create `packages/database/src/schema/mixins/localizable.ts` — Drizzle column mixin for `*_translations jsonb`            | None         | 20 min      |
| 1.3 | Create `packages/database/src/utils/localization.ts` + tests — `resolveLocale`, `setTranslation`, `validateTranslations` | 1.2          | 30 min      |
| 1.4 | Update `packages/database/scripts/baseline-schema.sql` — add Plan 01 tables with localization columns                    | None         | 20 min      |
| 1.5 | Refactor `packages/database/src/schema/insight-templates.ts` — match baseline with translation columns                   | 1.2, 1.4     | 20 min      |
| 1.6 | Update `packages/types/src/insight-templates.ts` — Zod schemas for translation objects                                   | 1.5          | 20 min      |
| 1.7 | Create `packages/database/src/factories/insight-template-factory.ts` — factory class with blueprints                     | 1.3, 1.6     | 45 min      |
| 1.8 | Refactor `packages/database/src/seeds/templates.seed.ts` — accept blueprints from factory, use logger                    | 1.1, 1.7     | 30 min      |

### Phase 2: Data Access + Service Layer

| #   | Task                                                                                                         | Dependencies | Est. Effort |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------ | ----------- |
| 2.1 | Update `packages/database/src/repositories/insight-templates.repository.ts` — locale-aware reads, use logger | 1.5, 1.8     | 30 min      |
| 2.2 | Update `apps/api/src/services/insight-templates.service.ts` — pass locale from request, use logger           | 2.1          | 20 min      |
| 2.3 | Update `apps/api/src/trpc/routers/insight-templates.ts` — derive locale from request headers, use logger     | 2.2          | 20 min      |

### Phase 3: UI Localization

| #   | Task                                                                                         | Dependencies | Est. Effort |
| --- | -------------------------------------------------------------------------------------------- | ------------ | ----------- |
| 3.1 | Add `insights.templates` namespace to `messages/en.json`                                     | None         | 15 min      |
| 3.2 | Add `insights.templates` namespace to `messages/ar.json`                                     | 3.1          | 15 min      |
| 3.3 | Add `insights.templates` namespace to `messages/fr.json`                                     | 3.1          | 15 min      |
| 3.4 | Localize `TemplateBrowser.tsx` — use `useTranslations()`, resolve DB names by locale         | 3.1, 2.3     | 30 min      |
| 3.5 | Localize `TemplatePreviewModal.tsx` — use `useTranslations()`, resolve DB names by locale    | 3.1, 2.3     | 30 min      |
| 3.6 | Localize `BasicInfoStep.tsx` — use `useTranslations()`                                       | 3.1          | 20 min      |
| 3.7 | Localize `InsightCreateWizard.tsx` — use `useTranslations()`                                 | 3.1          | 20 min      |
| 3.8 | Update `template-service.ts` — resolve locale for DB template names, localize error messages | 2.3, 3.1     | 20 min      |

### Phase 4: Logger Migration (Remaining)

| #   | Task                                                                                     | Dependencies | Est. Effort |
| --- | ---------------------------------------------------------------------------------------- | ------------ | ----------- |
| 4.1 | Audit all `packages/database/src/seeds/*.ts` files — replace `console.*` with `dbLogger` | 1.1          | 30 min      |
| 4.2 | Audit `packages/database/scripts/seed-dev.ts` — replace `console.*` with logger          | 1.1          | 15 min      |
| 4.3 | Verify `apps/api/src/services/insight-templates.service.ts` uses logger (not console)    | 2.2          | 10 min      |

### Phase 5: Integration + Validation

| #   | Task                                                                           | Dependencies  | Est. Effort |
| --- | ------------------------------------------------------------------------------ | ------------- | ----------- |
| 5.1 | Run `make db-reset` — drop/recreate schema from baseline + Drizzle push + seed | All Phase 1-2 | 10 min      |
| 5.2 | Run seed script — verify templates seed with translations                      | 5.1, 1.8      | 10 min      |
| 5.3 | Run `pnpm run typecheck` — verify all packages                                 | All           | 5 min       |
| 5.4 | Run `pnpm run lint` — verify linting                                           | All           | 5 min       |
| 5.5 | Manual test: Create insight from template in UI, verify locale switching       | All Phase 3   | 15 min      |

---

## Risk Assessment

| Risk                                                 | Impact | Mitigation                                                                          |
| ---------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Baseline SQL drifts from Drizzle schema              | High   | Run `make db-reset` after every schema change; baseline is the authoritative source |
| JSONB translations not validated at DB level         | Medium | Zod validation at API layer; `validateTranslations()` utility                       |
| Locale resolution fails for missing translations     | Low    | Fallback chain: `currentLocale → "en" → first available → template key`             |
| Database package dependency on Pino increases bundle | Low    | Pino is already a transitive dependency via observability package                   |
| Seed factory blueprints drift from production needs  | Medium | Factory exports `getDevTemplates()` and `getProdTemplates()` separately             |
| `make db-reset` destroys all local data              | Low    | Acceptable per greenfield policy; seed script repopulates everything                |

---

## Acceptance Criteria

1. **Baseline SQL:** `baseline-schema.sql` includes all Plan 01 tables (`insight_templates`, `insight_template_domains`, `insight_template_connectors`) with localization columns (`name_translations`, `description_translations`)
2. **Factory:** `InsightTemplateFactory.createBatch()` seeds templates from pure-data blueprints; callable from any seed script
3. **DB Localization:** `insight_templates` table has `name_translations` and `description_translations` JSONB columns; no monolingual `name`/`description` columns
4. **Reusable Pattern:** `localizable.ts` mixin and `localization.ts` utilities are importable and usable by any future entity
5. **UI Localization:** All insight template UI components use `useTranslations()`; zero hardcoded English strings in component JSX
6. **Locale Resolution:** Template names display in the user's current locale; fallback to English if missing
7. **Logger:** Zero `console.log/warn/error` calls in seed scripts, repositories, services, or tRPC routers for the insight template system
8. **DB Reset:** `make db-reset` succeeds — baseline applied, Drizzle push clean, seed completes with translations
9. **Typecheck:** `pnpm run typecheck` passes across all 16 packages
10. **Lint:** `pnpm run lint` passes with zero warnings

---

## File Change Summary

| Action     | File                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------- |
| **CREATE** | `packages/database/src/logger.ts`                                                              |
| **CREATE** | `packages/database/src/schema/mixins/localizable.ts`                                           |
| **CREATE** | `packages/database/src/utils/localization.ts`                                                  |
| **CREATE** | `packages/database/src/utils/localization.test.ts`                                             |
| **CREATE** | `packages/database/src/factories/insight-template-factory.ts`                                  |
| **MODIFY** | `packages/database/scripts/baseline-schema.sql` — add Plan 01 tables with localization columns |
| **MODIFY** | `packages/database/src/schema/insight-templates.ts`                                            |
| **MODIFY** | `packages/types/src/insight-templates.ts`                                                      |
| **MODIFY** | `packages/database/src/repositories/insight-templates.repository.ts`                           |
| **MODIFY** | `packages/database/src/seeds/templates.seed.ts`                                                |
| **MODIFY** | `packages/database/scripts/seed-dev.ts`                                                        |
| **MODIFY** | `packages/database/scripts/seed.ts`                                                            |
| **MODIFY** | `apps/api/src/services/insight-templates.service.ts`                                           |
| **MODIFY** | `apps/api/src/trpc/routers/insight-templates.ts`                                               |
| **MODIFY** | `apps/frontend/messages/en.json`                                                               |
| **MODIFY** | `apps/frontend/messages/ar.json`                                                               |
| **MODIFY** | `apps/frontend/messages/fr.json`                                                               |
| **MODIFY** | `apps/frontend/src/features/insights/ui/TemplateBrowser.tsx`                                   |
| **MODIFY** | `apps/frontend/src/features/insights/ui/TemplatePreviewModal.tsx`                              |
| **MODIFY** | `apps/frontend/src/features/insights/ui/wizard/steps/BasicInfoStep.tsx`                        |
| **MODIFY** | `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx`                            |
| **MODIFY** | `apps/frontend/src/features/insights/services/template-service.ts`                             |
| **AUDIT**  | `packages/database/src/seeds/*.ts` (all seed files for console usage)                          |

**Total:** 5 new files, 17 modified files, 1 audit pass
