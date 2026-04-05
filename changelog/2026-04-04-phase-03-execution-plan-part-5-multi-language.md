# Changelog entry: Phase 03 execution plan — Part 5 multi-language (Weeks 18–23)

**Date:** 2026-04-04  
**Scope:** [Execution plan Part 5](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — **i18n-1** (five core locales, detection, translation management API), **RTL-1** (direction override, bidi helpers, report font stacks), **Week 23 QA** (parity tests, locale formatting coverage in Vitest). Full **translation admin UI**, **PostgreSQL-backed overrides** (existing `i18n_strings` table), and **native translator review** remain follow-ups.

---

## Summary

- **`@agenticverdict/i18n` (`I18N_PACKAGE_VERSION` `0.3.0`):** Expanded **`APP_LOCALES`** to **`en`**, **`ar`**, **`es`**, **`fr`**, **`zh`** with new **`src/locales/{es,fr,zh}.json`**; **`intlLocaleTag`** defaults for ES/FR/ZH; **`language-detection.ts`** — **`detectPreferredAppLocale`**, **`normalizeToAppLocale`**, **`appLocaleFromLanguageTag`**; **`document-direction.ts`** — **`resolveReportTextDirection`**; **`bidi.ts`** — **`wrapHtmlDirAuto`**, Unicode **LTR/RTL isolates**; **`typography.ts`** — **`reportBodyFontStack`** (Arabic/Hebrew/Farsi/Urdu, CJK, Latin); **`message-merge.ts`**, **`translation-parity.ts`** + Vitest **`assertAllLocalesHaveSameKeys`**; **`I18nManager.setTextDirectionOverride`**; **`isRtlLocale`** extended for **`ur`**.
- **`@agenticverdict/config`:** **`localization.language`** enum now includes **`es`** and **`zh`** (aligned with app locales).
- **`@agenticverdict/report-generator` (`REPORT_GENERATOR_PACKAGE_VERSION` `0.4.0`):** Depends on **`@agenticverdict/i18n`**; **`ReportGenerationContext.textDirection`** optional override; **`resolveContextTextDirection`**; built-in templates use it; **`document-shell`** applies locale-specific **`reportBodyFontStack`**; public **`localeToTextDirection`** re-exported from i18n (**`textDirection`** alias); removed **`templates/locale-dir.ts`**.
- **`apps/api`:** **`@agenticverdict/i18n`** dependency; tenant-scoped in-memory **`translation-store`**; **`registerTranslationRoutes`** — `GET /api/v1/translations/meta`, `GET /api/v1/translations?locale=`, `PUT /api/v1/translations`, `DELETE /api/v1/translations?locale=&key=` (RBAC: read **analyst|reports:read|admin|translations:read**, write **admin|translations:write**); **`report-templates` preview** accepts **`textDirection`** and normalizes **`locale`** with **`normalizeToAppLocale`**.
- **`apps/worker`:** **`ReportGenerationJobData`** adds optional **`locale`** and **`textDirection`**; default report processor passes them into **`DefaultReportGenerator`**.

---

## Verification (local)

```bash
pnpm --filter @agenticverdict/i18n test
pnpm --filter @agenticverdict/report-generator test
pnpm --filter @agenticverdict/api test
pnpm --filter @agenticverdict/worker test
pnpm --filter @agenticverdict/config test
```

Optional (PDF integration unchanged from Part 4):

```bash
pnpm --filter @agenticverdict/report-generator exec playwright install chromium
```

---

## Follow-ups (not in this change)

- **Durable overrides:** wire **`i18n_strings`** + Drizzle in the API behind **`DATABASE_URL`**, keeping the same REST shape as the in-memory store.
- **Admin UI** for translators (search keys, diff vs defaults, export/import).
- **Human translation review** for ES/FR/ZH strings and glossary enforcement.
- **Mixed LTR inside RTL blocks** at scale (template-level `dir="auto"` on user-generated fragments, ICU message format).
- **Web app:** adopt **`detectPreferredAppLocale`** from **`Accept-Language`** in Next.js middleware.

---

## Related documentation

- [`docs/03-development-phases/phase-03-report-generation/execution-plan.md`](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — Part 5 (Weeks 18–23)
- [`changelog/2026-04-04-phase-03-execution-plan-part-4-format-generation.md`](changelog/2026-04-04-phase-03-execution-plan-part-4-format-generation.md)
