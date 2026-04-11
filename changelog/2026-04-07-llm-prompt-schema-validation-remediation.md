# Changelog — 2026-04-07 — LLM prompt schema validation remediation

This entry records the remediation for `MarketingVerdict` schema failures where the marketing pipeline could complete all LLM stages but still degrade at verdict parsing. The root issue was prompt-spec ambiguity in `JSON_VERDICT_SUFFIX`, which allowed model outputs that were semantically good but invalid for strict Zod validation.

---

## Summary

| Theme                       | Outcome                                                                                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt constraints**      | Tightened `JSON_VERDICT_SUFFIX` in `packages/agent-runtime/src/specialized-marketing-agents.ts` with explicit enums, UUID v4 requirements, numeric-only `estimatedImpact`, confidence range clarity, and ISO-8601 example guidance. |
| **Single source of truth**  | Removed redundant verdict JSON instruction from `packages/agent-runtime/src/marketing-pipeline.ts`; prompt formatting requirements now live in one place.                                                                           |
| **Schema regression tests** | Added targeted parser/schema tests for invalid nested IDs, enum case/value mismatches, and string-typed `estimatedImpact` values in `packages/agent-runtime/src/agent-verdict-json.test.ts`.                                        |
| **Prompt compliance test**  | Added strict policy-content assertions in `packages/agent-runtime/src/specialized-marketing-agents.test.ts` to prevent prompt drift.                                                                                                |
| **Observability baseline**  | Added parse-attempt/degraded/by-field counters in `@agenticverdict/observability`, wired from the pipeline degraded path, and added field-aware parse failure diagnostics.                                                          |
| **Docs and runbooks**       | Updated remediation plan checklist, schema transformation doc, testing strategy, troubleshooting runbook, and root changelog references.                                                                                            |

---

## Added

### New changelog artifact

- `changelog/2026-04-07-llm-prompt-schema-validation-remediation.md` (this file).

### Observability metrics

In `packages/observability/src/test-metrics.ts`:

- `marketing_verdict_parse_attempts_total`
- `marketing_verdict_parse_degraded_total`
- `marketing_verdict_parse_failures_by_field_total`

Plus exports in `packages/observability/src/index.ts` and coverage in `packages/observability/src/test-metrics.test.ts`.

### Parser diagnostics helper

In `packages/agent-runtime/src/agent-verdict-json.ts`:

- `getVerdictParseFailureDetails(error)` with typed output for `kind` and failing `fields`.

---

## Changed

### Prompt hardening

- `packages/agent-runtime/src/specialized-marketing-agents.ts`
  - `sentiment` now explicitly constrained to `"positive" | "neutral" | "negative"`.
  - `keyInsights[].impact` now explicitly constrained to lowercase `"high" | "medium" | "low"`.
  - All nested entity IDs explicitly require UUID v4; prompt explicitly rejects patterns like `"insight-001"`.
  - `estimatedImpact` fields now explicitly numeric, with ROAS decimal-multiplier guidance.
  - `confidence` clarified as `0-1` numeric range (not percentage).
  - `evidence[].capturedAt` now includes concrete ISO-8601 example.
  - `platformsAnalyzed` clarified as display-name strings.

### Pipeline prompt cleanup and degraded diagnostics

- `packages/agent-runtime/src/marketing-pipeline.ts`
  - Removed duplicate `Respond with a single JSON object...` instruction in `verdictGoal`.
  - Added parse-attempt metric emission before verdict parse.
  - Added degraded parse metric emission by failure kind and field path.
  - Enriched degraded error message with failure kind and a bounded set of field paths.

### Agent-runtime exports and dependency wiring

- `packages/agent-runtime/src/index.ts`
  - Exported `getVerdictParseFailureDetails` and related types.
- `packages/agent-runtime/package.json`
  - Added runtime dependency on `@agenticverdict/observability`.

### Tests updated for new verdict prompt phrase

- `packages/agent-runtime/src/marketing-pipeline.test.ts`
- `packages/agent-runtime/src/phase8-performance-behavior.test.ts`

Mock matching strings were updated to target the retained verdict prompt marker (`Tenant context ...`) after prompt deduplication.

---

## Fixed

- Verdict outputs that used ambiguous values (e.g. `"Caution"`, `"High"`, non-UUID IDs, percentage strings) now have explicit contract guidance in the system prompt.
- Prompt/schema drift risk reduced by removing duplicated JSON-response instructions from pipeline stage goal assembly.
- Degraded verdict parse outcomes now expose field-level diagnostics and counters suitable for failure-rate and field-hotspot monitoring.

---

## Verification performed

Executed and passing:

- `pnpm --filter @agenticverdict/agent-runtime test -- agent-verdict-json.test.ts specialized-marketing-agents.test.ts marketing-pipeline.test.ts phase8-performance-behavior.test.ts`
- `pnpm --filter @agenticverdict/observability test -- test-metrics.test.ts`

---

## Related documentation

- `docs/02-planning-and-methodology/llm-prompt-schema-validation-remediation-plan.md`
- `specs/00-core/03-insights/prerequisites/schema-transformation-spec.md`
- `docs/02-planning-and-methodology/testing-strategy.md`
- `docs/06-reference/runbooks/remediation-known-issues.md`
- `CHANGELOG.md`

---

## Follow-ups

- Add production-flow E2E scenario `R13` for verdict schema compliance.
- Add alerting rule for degraded parse ratio > 5% using:
  - numerator: `marketing_verdict_parse_degraded_total`
  - denominator: `marketing_verdict_parse_attempts_total`
- Run live-LLM validation pass in a credentialed environment and capture before/after parse-success rate.
