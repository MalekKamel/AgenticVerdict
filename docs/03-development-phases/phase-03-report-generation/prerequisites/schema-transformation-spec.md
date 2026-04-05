# Schema alignment and transformation (Weeks 3–4)

**Execution plan reference:** Part 1, Week 3–4 (PR-2, PR-3, PR-5).

## Unified verdict model

Cross-phase reporting consumes **`MarketingVerdict`** from **`@agenticverdict/types`** (`packages/types/src/verdict.ts`), validated with Zod (`marketingVerdictSchema`). Downstream systems (API, reports, validation) must not introduce a parallel verdict shape.

## LLM verdict → unified verdict (completed remediation R-LEGACY-001)

The **`media_verdict`** specialized agent is instructed to emit **`MarketingVerdict`** JSON (see `JSON_VERDICT_SUFFIX` in `packages/agent-runtime/src/specialized-marketing-agents.ts`). Runtime parsing and tenant-safe correlation live in **`@agenticverdict/agent-runtime`**:

- **`parseMarketingVerdictFromAgentText(text)`** — extracts JSON (fenced or raw object span) and validates with **`marketingVerdictSchema`** (`packages/agent-runtime/src/agent-verdict-json.ts`).
- **`applyMarketingVerdictPipelineContext(verdict, { tenantId, analysisId })`** — reapplies server-side tenant and analysis UUIDs after parse.
- **`resolveWorkflowAnalysisUuid(tenantId, workflowId)`** — stable UUID for non-UUID workflow correlation ids (same behavior as the former legacy normalizer).
- **`safeParseMarketingVerdictFromAgentText`** — non-throwing variant for diagnostics.
- **`VerdictParseError`** — shared parse error type (`packages/agent-runtime/src/verdict-schema.ts`).

Legacy **`legacyVerdictSchema`** / **`legacyVerdictToMarketingVerdict`** have been removed.

## Insights and analysis bundles

- **`GeneratedInsight`** — `packages/types/src/insight.ts` (`generatedInsightSchema`).
- **`AnalysisResultResponse`** — `packages/types/src/analysis.ts` (`analysisResultResponseSchema`): bundles insights, verdicts, period, platforms, quality score, and **provenance**.

## Provenance

- **`ProvenanceInfo`** — `provenanceInfoSchema` in `packages/types/src/analysis.ts` (agent version, model, data sources, transformations).
- **Runtime collection** — `ProvenanceTracker` in `packages/agent-runtime/src/provenance/tracker.ts`; the marketing pipeline attaches **`provenance`** to `MarketingPipelineState` after each stage and normalization.
- **Persistence** — Drizzle schema `packages/database/src/schema/provenance.ts` and migration `0002_provenance_records.sql` (store full bundles from worker/API in later phases).

## Template and design configuration

- **`TemplateConfig`** — `templateConfigSchema` in `packages/config/src/schemas/template.ts` (sections, variables, branding, validation rules).
- **`DesignTokens`** — `designTokensSchema` in `packages/config/src/schemas/branding.ts`, with helpers for Mantine-shaped themes and CSS variables.

## Configuration testing

Zod schemas above are covered by package unit tests (`*.test.ts` next to schemas). API contract tests assert OpenAPI path registration and happy-path **200** responses with demo data.
