# Changelog entry: Phase 2 — Execution Phase 4 (Agent tool ecosystem)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 4 — Agent tool ecosystem (platform, DB, analysis, context)](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **2.1** through **2.5**.

This entry implements the Category 2 tool surface in `@agenticverdict/agent-runtime`: five platform fetch tools backed by Phase 1 `PlatformAdapter` + normalization validation, three tenant-scoped database tools over `marketing_metrics` via `dbScoped`, report-prep and analysis utilities, and company context tools with optional TTL caching. Inputs are validated with Zod; there is no string SQL composed from LLM arguments.

---

## Summary

- Added **`AgentToolError`** and shared **Zod** argument parsers for deterministic validation failures.
- **Platform tools** (`fetch_*_metrics`): resolve adapters from injected deps, optional **`authenticateAdapter`** hook, **`fetchMetrics` → `normalizeData`**, then **`parseNormalizedPlatformSnapshot`** for output validation.
- **Database tools**: **`createDrizzleMarketingMetricsStore`** uses **`dbScoped`** and Drizzle builders only (parameterized); **`query_historical_metrics`**, **`analyze_trends`**, **`compare_periods`** with **`row_volume`** / **`payload_sum`** modes.
- **Report-prep tools**: **`generate_summary`**, **`format_report`**, **`prepare_chart_data`** (markdown / chart-ready JSON for Phase 3).
- **Analysis tools**: **`calculate_metrics`**, **`statistical_analysis`**, **`normalize_metrics`** (growth rate, Pearson, z-score outliers, min-max / z-score).
- **Context tools**: **`get_company_profile`**, **`get_business_rules`**, **`get_config`** (whitelisted slices), **`TenantScopedTtlCache`**, tenant id alignment with **`AgentInvocationContext`**.
- **`registerPhase4AgentTools`** / **`createPhase4ToolRegistry`** / **`createPhase4ToolRegistryWithDatabase`** wire all **17** tools into a **`ToolRegistry`**.
- New workspace deps: **`@agenticverdict/platform-adapters`**, **`@agenticverdict/database`**, **`@agenticverdict/types`**, **`drizzle-orm`**; bumped **`AGENT_RUNTIME_PACKAGE_VERSION`** to **0.5.0**.
- Root **`eslint.config.mjs`** ignores **`**/coverage/**`** so local coverage runs do not lint generated artifacts.

---

## Added

### Source modules (`packages/agent-runtime/src/agent-tools/`)

- **`agent-tool-error.ts`** — **`AgentToolError`**, **`AgentToolErrorCode`**.
- **`agent-tool-schemas.ts`** — Zod schemas and **`parseToolArgs`**.
- **`marketing-metrics-store.ts`** — **`MarketingMetricsStore`**, **`createDrizzleMarketingMetricsStore`**, **`analyzeTrendsFromStore`**, **`comparePeriodsFromStore`**, related result types.
- **`platform-fetch-tools.ts`** — **`createPlatformFetchTools`**, **`PlatformFetchToolDeps`**.
- **`database-query-tools.ts`** — **`createDatabaseQueryTools`**, **`DatabaseQueryToolDeps`**.
- **`report-prep-tools.ts`** — **`createReportPrepTools`**.
- **`analysis-tools.ts`** — **`createAnalysisTools`**.
- **`company-context-tools.ts`** — **`createCompanyContextTools`**, **`TenantScopedTtlCache`**, cache options types.
- **`phase4-tool-registry.ts`** — **`registerPhase4AgentTools`**, **`createPhase4ToolRegistry`**, **`createPhase4ToolRegistryWithDatabase`**, **`Phase4AgentToolingDeps`**.

### Tests

- **`src/agent-tools/agent-tools.test.ts`** — registry size, platform validation and failure paths, DB tool errors and range guards, report/analysis branches, tenant isolation and cache behavior, duplicate registration guard.

---

## Changed

- **`packages/agent-runtime/package.json`** — new dependencies (see Summary).
- **`packages/agent-runtime/src/index.ts`** — exports for Phase 4 tooling and version **0.5.0**.
- **`eslint.config.mjs`** — ignore **`coverage`** directories.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm --filter @agenticverdict/agent-runtime exec vitest run`
- `pnpm exec turbo run lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`
- `pnpm exec vitest run --coverage src/agent-tools` (agent-tools directory **~86%** statement coverage in this run)

---

## Usage notes

- **Platform adapters** that require **`authenticate`** must either be pre-authenticated or use **`authenticateAdapter`** when building **`PlatformFetchToolDeps`**.
- **`createPhase4ToolRegistry`** accepts a **`metricsStore`** so tests and workers can inject fakes; **`createPhase4ToolRegistryWithDatabase`** wraps **`createDrizzleMarketingMetricsStore(database)`** for production-style wiring.
- DB tools assume **`runAgentJob` / `runWithTenantContext`** has set tenant context for **`dbScoped`** (same pattern as Phase 0 database package).

---

## Known follow-ups (not in this change set)

- **Execution Phase 5** — prompt templates, injection, and A/B harness (**tasks.md** Category 3).
- **Execution Phase 6** — agent factory assigning this registry by default and LangChain **`StructuredTool`** bindings if desired.
- **Integration tests** — optional containerized Postgres + RLS for **`createDrizzleMarketingMetricsStore`** (current coverage uses in-memory **`MarketingMetricsStore`** fakes and Drizzle-free trend/compare logic).

---

## Related documentation

- [`docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md`](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md) — Execution Phase 4 definition and verification.
- [`docs/03-development-phases/phase-02-agent-intelligence/tasks.md`](docs/03-development-phases/phase-02-agent-intelligence/tasks.md) — tasks **2.1–2.5**.
