# Changelog entry: P2 enhancement follow-through (complete remaining work)

**Date:** 2026-04-08  
**Scope:** Completes the **remaining / extra** items after the initial P2 slice: normalized-snapshot → B2B funnel wiring, agent tool registration, richer mock metrics, same-language BLEU utilities, CI structural Arabic gate, native-review playbook, and expanded Playwright coverage.

---

## Summary

- **Funnel wiring:** `marketing.b2bKpiProfile.funnelMetricMapping` maps normalized metric key suffixes to funnel counters. `buildB2bFunnelSnapshotFromNormalizedSnapshots` and `computeB2bMarketingKpisFromNormalizedSnapshots` live in `@agenticverdict/agent-runtime` and are exported from the package root.
- **Mock data:** `buildScenarioRecords` now emits qualified leads, decision-maker / fleet / regional (SA-dimension) lead rows, and language-tagged sessions for engagement splits.
- **Agent tool:** `compute_b2b_kpis_from_snapshots` validates JSON snapshots with `parseNormalizedPlatformSnapshot`, reads `requireTenantContext().config`, and returns `{ funnel, kpis }`. Registered in Phase 4 tooling (**18** tools). Included in **analysis** `defaultAutoToolsByRole` for tighter default-path coverage.
- **Arabic / MT hygiene:** `computeSentenceBleu` / `meanSentenceBleu` (same-language BLEU-style score), `assertArabicStructuralLocaleQuality` enforced by `arabic-structural-ci.test.ts`. Playbook documents native sign-off and external sacreBLEU/COMET usage.
- **E2E:** `home-journey.spec.ts` (EN + AR form tab submission) and `api-health.optional.spec.ts` (skipped unless `E2E_API_BASE_URL`).

---

## Added

### `packages/agent-runtime`

- **`src/b2b-funnel-from-snapshots.ts`** (+ **`b2b-funnel-from-snapshots.test.ts`**) — Snapshot aggregation + config-aware KPI helper.
- **`src/agent-tools/b2b-kpi-tools.ts`** — `compute_b2b_kpis_from_snapshots` tool.
- **`computeB2bKpisFromSnapshotsInputSchema`** in `agent-tool-schemas.ts`.

### `packages/i18n`

- **`src/bleu-score.ts`** (+ **`bleu-score.test.ts`**) — Sentence-level BLEU-style scoring for same-language pairs.
- **`src/arabic-structural-ci.test.ts`** — CI gate calling `assertArabicStructuralLocaleQuality`.

### `apps/web`

- **`e2e/home-journey.spec.ts`** — Localized home + demo form path.
- **`e2e/api-health.optional.spec.ts`** — Optional API `/health` check.

### `docs/03-development-phases/phase-03-report-generation`

- **`arabic-native-review-playbook.md`** — Native review checklist + external MT metrics guidance.

---

## Changed

### `packages/config`

- **`schemas/marketing-b2b.ts`** — `b2bFunnelMetricMappingSchema` nested under `b2bKpiProfile`; exports `B2bFunnelMetricMapping`.

### `packages/platform-adapters`

- **`mock-static-data.ts`** — Additional B2B-oriented mock metrics; **`mock-static-data.test.ts`** row-count expectations updated (**9** metrics × rows).

### `packages/agent-runtime`

- **`agent-tools/phase4-tool-registry.ts`** — Registers B2B KPI tool (registry size **18**).
- **`agent-tools/agent-tools.test.ts`** — Tenant fixture includes `b2bKpiProfile`; new tool test; count assertion updated.
- **`agent-factory.ts`** — Analysis role auto-tools include `compute_b2b_kpis_from_snapshots`.
- **`index.ts`** — Re-exports funnel helpers.

### `packages/i18n`

- **`arabic-locale-quality.ts`** — `assertArabicStructuralLocaleQuality`.
- **`index.ts`** — Re-exports BLEU API.

### `configs/companies` & `apps/api/test-fixtures/company-configs`

- Masafh fixture **`funnelMetricMapping`** aligned with mock metric suffixes.

### Docs

- **`p2-phase-00-03-enhancement-execution-plan-2026-04-08.md`** — Section 6 follow-through table.
- **`phase-03-report-generation/overview.md`** — Links playbook, E2E files, and new i18n APIs.

---

## Configuration / operations

| Variable / config                             | Purpose                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `marketing.b2bKpiProfile.funnelMetricMapping` | Suffix rules for aggregating normalized records into `B2bLeadFunnelSnapshot`. |
| `E2E_API_BASE_URL`                            | Enables optional Playwright API health spec (e.g. `http://127.0.0.1:4000`).   |

---

## References

- `changelog/2026-04-08-p2-enhancement-b2b-kpis-i18n-e2e-perf-docs.md` — Initial P2 execution.
- `docs/03-development-phases/p2-phase-00-03-enhancement-execution-plan-2026-04-08.md` — Full checklist including §6.
