# Changelog entry: P2 enhancement (audit remediation)

**Date:** 2026-04-08  
**Scope:** Execution of **🟡 P2 — MEDIUM (Enhancement)** from `PHASE_00-03_CORE_AUDIT_REPORT.md`: configuration-driven B2B funnel KPIs, automated Arabic locale structural checks (with explicit limits vs BLEU/native review), critical-path Playwright coverage, performance baseline capture script, documentation alignment, and a small agent-factory type fix uncovered while running the baseline.

---

## Summary

- **Business KPI tracking:** Added `marketing.b2bKpiProfile` to `CompanyConfig` (`b2bKpiProfileSchema`) and `computeB2bMarketingKpis` in `@agenticverdict/agent-runtime` for CPQL, decision-maker / fleet-quality / regional rates, Arabic vs English engagement share, and a weighted composite score when `enabled: true`. Example profile is set on the Masafh fixture configs.
- **Arabic validation:** Added `analyzeArabicLocaleQuality` and `computeLexicalOverlapDiagnostic` in `@agenticverdict/i18n` for placeholder parity, Arabic script presence, and a mean token-overlap diagnostic (not a BLEU substitute).
- **E2E:** Added `apps/web/e2e/critical-path-smoke.spec.ts` (English home then Arabic RTL) alongside existing locale and a11y specs.
- **Performance baselines:** Added `scripts/performance-baseline.mjs`, root script `pnpm benchmark:performance-baseline`, and `docs/06-reference/performance-baselines.md` (instructions plus optional dated append via `PERFBASELINE_WRITE=1`).
- **Documentation:** Added `specs/00-core/p2-phase-00-03-enhancement-execution-plan-2026-04-08.md`; Phase 02/03 overviews note P2 deliverables.
- **Agent factory:** Removed invalid `fallback` key from `defaultAutoToolsByRole` (roles are only `analysis` | `insights` | `verdict`), restoring `tsc --noEmit` for `@agenticverdict/agent-runtime`.

---

## Added

### `specs/00-core`

- **`p2-phase-00-03-enhancement-execution-plan-2026-04-08.md`** — Step-by-step P2 plan, verification commands, and sign-off checklist.

### `docs/06-reference`

- **`performance-baselines.md`** — How to record timings; append-only run log when using `PERFBASELINE_WRITE=1`.

### `packages/config`

- **`src/schemas/marketing-b2b.ts`** — `b2bKpiProfileSchema` and related types.
- **`src/schemas/marketing-b2b.test.ts`** — Schema parse tests.

### `packages/agent-runtime`

- **`src/b2b-marketing-kpis.ts`** (+ **`b2b-marketing-kpis.test.ts`**) — Pure KPI computation from `B2bLeadFunnelSnapshot`.

### `packages/i18n`

- **`src/arabic-locale-quality.ts`** (+ **`arabic-locale-quality.test.ts`**) — Structural Arabic bundle QA helpers.

### `apps/web`

- **`e2e/critical-path-smoke.spec.ts`** — Critical-path navigation smoke.

### Root

- **`scripts/performance-baseline.mjs`** — Timed Vite API/worker bundles + agent-runtime typecheck; optional markdown append.
- **`package.json`** — `benchmark:performance-baseline` script.

---

## Changed

### `packages/config`

- **`src/schemas/company.ts`** — Optional `marketing.b2bKpiProfile`.
- **`src/index.ts`** — Re-exports B2B KPI schema types.

### `packages/agent-runtime`

- **`src/index.ts`** — Re-exports B2B KPI helpers.
- **`src/agent-factory.ts`** — `defaultAutoToolsByRole` aligned with `AgentFactoryConfig["role"]`.

### `packages/i18n`

- **`src/index.ts`** — Re-exports Arabic locale quality API.

### `configs/companies` & `apps/api/test-fixtures/company-configs`

- **Masafh `11111111-…` JSON** — Sample `b2bKpiProfile` with SAR CPQL target and default weights.

### `specs/00-core`

- **`02-intelligence/overview.md`** — P2 B2B KPI note.
- **`03-insights/overview.md`** — P2 Arabic automation + E2E + baselines note.

---

## Configuration / operations

| Item                      | Purpose                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `marketing.b2bKpiProfile` | Enables weighted lead-quality score, fleet threshold echo, and CPQL target evaluation for a tenant. |
| `PERFBASELINE_WRITE=1`    | Appends a dated timing table to `docs/06-reference/performance-baselines.md`.                       |

---

## References

- `PHASE_00-03_CORE_AUDIT_REPORT.md` — P2 table (B2B KPIs, Arabic validation, E2E, performance benchmarking, documentation alignment).
- `specs/00-core/p2-phase-00-03-enhancement-execution-plan-2026-04-08.md` — Detailed execution checklist for this slice.
