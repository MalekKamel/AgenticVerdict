# Changelog entry: Phase 2 — Execution Phase 8 (Performance optimization and validation hardening)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 8 — Performance optimization and validation hardening](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **6.6** and **7.2–7.4**.

This entry adds a **tenant-scoped LRU + TTL LLM invocation cache** wired through **`ConfigurableLlmAgent`**, **`AgentFactory.createAgent` / `createTestAgent`**, specialized marketing agents, and **`runMarketingAgentPipeline`** (`invocationCache` option) so repeated identical assembled turns skip provider calls (measured in CI with **≥50% cache hit rate** on a second pipeline run). It introduces **aggregate pipeline timing hooks** (`onPipelineTiming` + **`marketingPipelineTimingToLogFields`**) for logs and LangSmith-style metadata without prompt bodies. **Parallel multi-platform fetch** is available via **`fetchNormalizedSnapshotsForPlatformsParallel`**. A **validation dataset** of **100** cases with synthetic verdict JSON drives automated **schema + heuristic quality gates** (`runVerdictQualityGate`, **`assessVerdictHeuristicQuality`**). **`AgentMockChatModel`** exposes **`getCallCount` / `resetCallCount`** for behavior and benchmark tests. **`AGENT_RUNTIME_PACKAGE_VERSION`** → **0.9.0**.

**Waiver / follow-up:** Acceptance **§2.3.1–2.3.2** p95 targets (**&lt;5s** single agent, **&lt;15s** workflow) are **asserted under mock LLM** in CI; production latency requires gated runs with real providers and environment-specific baselines (documented here as explicit carry-over).

---

## Summary

- **`llm-invocation-cache.ts`** — **`LlmInvocationCache`**, **`buildLlmInvocationCacheKey`**, **`factoryConfigCacheFingerprint`**.
- **`configurable-llm-agent.ts`** — optional **`invocationCache`**; cache hit returns prior **`AgentRunResult`** without a second **`invoke`**.
- **`agent-factory.ts`** — **`createAgent` / `createTestAgent`** optional **`invocationCache`** passthrough.
- **`specialized-marketing-agents.ts`** — **`CreateSpecializedMarketingAgentOptions.invocationCache`**.
- **`marketing-pipeline.ts`** — pipeline-level **`invocationCache`**, **`onPipelineTiming`** callback.
- **`agent-performance-metrics.ts`** — **`computePercentile`**, **`summarizeLatencyMs`**, **`marketingPipelineTimingToLogFields`**.
- **`agent-quality-validation.ts`** — **`assessVerdictHeuristicQuality`**, **`runVerdictQualityGate`**, **`verdictConsistencyScore`**, **`validationDatasetCaseSchema`**.
- **`validation-dataset.ts`** — **`VALIDATION_DATASET_CASES`** (100), **`VALIDATION_DATASET_VERDICT_FIXTURES`**, **`VALIDATION_DATASET_CASE_COUNT`**.
- **`platform-fetch-tools.ts`** — **`fetchNormalizedSnapshotsForPlatformsParallel`**, **`ParallelNormalizedPlatformFetchResult`**.
- **`mock-chat-model.ts`** — **`getCallCount`**, **`resetCallCount`**.
- **Tests** — **`llm-invocation-cache.test.ts`**, **`agent-performance-metrics.test.ts`**, **`agent-quality-validation.test.ts`**, **`phase8-performance-behavior.test.ts`**, parallel fetch case in **`agent-tools.test.ts`**.

---

## Added

### Source modules (`packages/agent-runtime/src/`)

- **`llm-invocation-cache.ts`**, **`agent-performance-metrics.ts`**, **`agent-quality-validation.ts`**, **`validation-dataset.ts`**.

### Tests

- **`llm-invocation-cache.test.ts`**, **`agent-performance-metrics.test.ts`**, **`agent-quality-validation.test.ts`**, **`phase8-performance-behavior.test.ts`**.

---

## Changed

- **`configurable-llm-agent.ts`**, **`agent-factory.ts`**, **`specialized-marketing-agents.ts`**, **`marketing-pipeline.ts`**, **`mock-chat-model.ts`**, **`agent-tools/platform-fetch-tools.ts`**, **`agent-tools/agent-tools.test.ts`**.
- **`packages/agent-runtime/src/index.ts`** — Phase 8 public exports; version **0.9.0**.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm exec turbo run lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`

---

## Usage notes

- **Shared cache for pipelines:** `const cache = new LlmInvocationCache({ ttlMs: 300_000 });` then `runMarketingAgentPipeline({ ..., invocationCache: cache })`. Inspect **`cache.getMetrics()`** for hit rate (tasks.md **6.6**).
- **Timing for observability:** `onPipelineTiming: (f) => logger.info({ event: "marketing_pipeline_timing", ...f })` — fields are **workflowId**, **status**, **totalMs**, **stageMs** only.
- **Quality gate (fixtures):** `runVerdictQualityGate(row, VALIDATION_DATASET_VERDICT_FIXTURES[row.id])` — extend dataset rows or fixtures for stricter rubrics; heuristic scores are **not** a substitute for expert review (acceptance **§2.2**).
- **Parallel platform pulls:** `fetchNormalizedSnapshotsForPlatformsParallel(["meta", "ga4", ...], range, deps)` for orchestration layers that aggregate normalized snapshots.

---

## Known follow-ups (not in this change set)

- **Production benchmarks** — record p50/p95/p99 and token usage with LangSmith + real providers; add regression thresholds to nightly CI.
- **Expert rubric automation** — wire manual **4/5** insight/verdict scores when review tooling exists.
- **Dashboard** — tasks.md **7.3** “benchmarking dashboard” remains product/ops tooling; this change supplies programmatic summaries only.

---

## Related documentation

- [`docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md`](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md) — Execution Phase 8 definition.
- [`docs/03-development-phases/phase-02-agent-intelligence/tasks.md`](docs/03-development-phases/phase-02-agent-intelligence/tasks.md) — tasks **6.6**, **7.2–7.4**.
- [`docs/03-development-phases/phase-02-agent-intelligence/acceptance-criteria.md`](docs/03-development-phases/phase-02-agent-intelligence/acceptance-criteria.md) — **§2.1–2.4**, **§2.3** performance, **§6** testing.
