# Changelog entry: Execution Phase 5 (web shell, UI foundation, i18n)

**Date:** 2026-04-04  
**Scope:** Phase 0 — [Execution Phase 5 — Web application shell, UI foundation, and i18n](docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md) (`tasks.md` §5: 0.44–0.53, §6: 0.54–0.63).

---

## Summary

- **`apps/web`**
  - Added **`/api/health`** and **`/api/ready`** JSON routes (implementation-scope health/readiness-style probes).
  - Root layout: **`ColorSchemeScript`** + **`mantineHtmlProps`** for Mantine color scheme; **`MantineProvider`** set to **`defaultColorScheme="auto"`** with header **light/dark toggle**.
  - **`AppShell`** layout with mobile **navbar**, **language switcher** (`next-intl` navigation `Link`), and RTL-aware **`DirectionProvider`**.
  - Base UI primitives: **`AppButton`**, **`AppCard`**, **`AppTextInput`**; **responsive** **`SimpleGrid`** and shared **breakpoint constants** (`src/lib/responsive.ts`).
  - **Demo lead form** with **`@mantine/form`** + **Zod** (`zodResolver`) and **Zustand** store for submit state.
  - **`next-intl`**: locale cookie **`AV_LOCALE`**, **`src/i18n/navigation.ts`**, expanded **`messages/en.json`** and **`messages/ar.json`** (Common, Errors, Validation, Layout, Home + ICU plural example).
  - Scripts: **`pnpm i18n:validate`** (en/ar leaf key parity), **`pnpm i18n:extract`** (lists message keys from `en.json` for catalogs/CI).
- **`@agenticverdict/i18n`**
  - **`createLocalizationFormatters`**, **`intlLocaleTag`**, **`AppLocale`** — date/currency/number/plural helpers driven by UI locale + tenant **`LocalizationConfig`** (timezone, currency, region).
  - Unit tests in **`formatters.test.ts`**; dependency on **`@agenticverdict/config`** for types.

---

## Verification (local)

- `pnpm --filter @agenticverdict/web run i18n:validate`
- `pnpm exec turbo run build lint test typecheck`
- `pnpm run check:cycles`

---

## Follow-ups

- **Playwright** locale/RTL smoke tests — Execution Phase 6.
- **Tenant-aware locale default** from `CompanyConfig` vs URL (wire when Next middleware integrates `resolveTenantContextFromHttp`).
- **French (`fr`)** in routing when product requires a third App Router locale.
- **Storybook** remains optional per acceptance criteria.

---

## Related documentation

- [`docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md`](docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md) — Execution Phase 5 definition.
- [`docs/03-development-phases/phase-00-foundation/tasks.md`](docs/03-development-phases/phase-00-foundation/tasks.md) — tasks 0.44–0.63.
- [`docs/03-development-phases/phase-00-foundation/acceptance-criteria.md`](docs/03-development-phases/phase-00-foundation/acceptance-criteria.md) — §5 UI Foundation, §6 i18n System.
