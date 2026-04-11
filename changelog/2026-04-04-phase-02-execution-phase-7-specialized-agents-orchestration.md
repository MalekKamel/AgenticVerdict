# Changelog entry: Phase 2 — Execution Phase 7 (Specialized agents, communication protocol, orchestration)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 7 — Specialized agents, communication protocol, and orchestration](specs/00-core/02-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **6.1** through **6.5**.

This entry delivers the **three marketing-specialized agents** (cross-platform analysis, insight generation, media verdict) on top of the Phase 6 factory and Phase 5 prompt catalog, a **Zod-validated agent-to-agent message envelope** with **correlation IDs aligned to Phase 0 `requestId`**, and a **sequential orchestration pipeline** (analysis → insights → verdict) with **handoff notifications**, **progress callbacks**, **JSON snapshot helper** for persistence, and **verdict schema validation** matching `tasks.md` **6.3**. The pipeline merges **tenant `localization.currency`** into prompt variables when rendering `analysis.cross_platform_overview@1.1.0`. **`AGENT_RUNTIME_PACKAGE_VERSION`** → **0.8.0**.

---

## Summary

- **`verdict-schema.ts`** — historically **`verdictSchema`** and **`parseVerdictFromAgentText`** / **`safeParseVerdictFromAgentText`** with **`extractJsonObjectText`**. _(Superseded 2026-04-04: **`verdict-schema.ts`** exports **`VerdictParseError`** only; parsing lives in **`agent-verdict-json.ts`** — **`parseMarketingVerdictFromAgentText`**, **`extractJsonObjectText`**, **`safeParseMarketingVerdictFromAgentText`**.)_
- **`agent-protocol.ts`** — **`agentMessageSchema`**, **`agentExecutionContextSchema`**, **`createAgentMessage`**, **`agentMessageToLogFields`** (payload size only, no raw dump), **`AgentMessageLogger`** ring buffer, **`AgentProtocolError`**.
- **`specialized-marketing-agents.ts`** — **`SpecializedMarketingAgentKind`**, template-backed **`buildSpecializedMarketingFactoryConfig`**, **`createSpecializedMarketingTestAgent`**, **`createSpecializedMarketingProductionAgent`** (roles **analysis** / **insights** / **verdict** + specialization copy + JSON instructions for verdict).
- **`marketing-pipeline.ts`** — **`runMarketingAgentPipeline`** (sequential workflow, optional **`mockModels`**, **`onProgress`**, **`onMessage`**, **`tolerateVerdictParseFailure`**), **`marketingPipelineStateToJson`**.
- **`interfaces.ts`** — typed **`AgentRunContext`** with optional **`toolContext`** (already consumed by **`ConfigurableLlmAgent`**).
- **Tests** — **`verdict-schema.test.ts`**, **`agent-protocol.test.ts`**, **`specialized-marketing-agents.test.ts`**, **`marketing-pipeline.test.ts`** (mock LLM end-to-end, failure, degraded verdict, **`AgentJobError`** + **`VerdictParseError`** cause).

---

## Added

### Source modules (`packages/agent-runtime/src/`)

- **`verdict-schema.ts`** — media verdict contract for Phase 3 consumers.
- **`agent-protocol.ts`** — tasks.md **6.4** message shape and logging helpers.
- **`specialized-marketing-agents.ts`** — tasks.md **6.1–6.3** agent constructors.
- **`marketing-pipeline.ts`** — tasks.md **6.5** orchestration.

### Tests

- **`verdict-schema.test.ts`**, **`agent-protocol.test.ts`**, **`specialized-marketing-agents.test.ts`**, **`marketing-pipeline.test.ts`**.

---

## Changed

- **`packages/agent-runtime/src/index.ts`** — Phase 7 public exports; version **0.8.0**.
- **`packages/agent-runtime/src/interfaces.ts`** — **`AgentRunContext`** for structured run context.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm exec turbo run lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`

---

## Usage notes

- **Pipeline (inside `runAgentJob`):** `runMarketingAgentPipeline({ factory, ctx: scope.invocation, goal, specialization: { companyName: tenant.config.companyName } })` — currency defaults from **`requireTenantContext().config.localization.currency`** unless **`specialization.promptVars.currency`** is set.
- **Handoffs / tracing:** subscribe with **`onMessage`**; each notification uses **`correlationId === ctx.requestId`** for LangSmith/log correlation.
- **Strict verdict parsing:** omit **`tolerateVerdictParseFailure`** (default false) so bad JSON surfaces as **`VerdictParseError`** wrapped in **`AgentJobError`** from **`runAgentJob`**.

---

## Known follow-ups (not in this change set)

- **Execution Phase 8** — latency/token benchmarks and broader quality gates (**tasks.md** **6.6**, **7.2–7.4**).
- **Tool binding in LLM turns** — specialized agents still use **`ConfigurableLlmAgent`** without LangChain tool-calling; wire **`ToolRegistry`** when Phase 2/3 needs live tool loops.
- **Persistence** — **`marketingPipelineStateToJson`** is a snapshot helper; durable checkpoints remain product/DB work.

---

## Related documentation

- [`specs/00-core/02-intelligence/EXECUTION-PLAN.md`](specs/00-core/02-intelligence/EXECUTION-PLAN.md) — Execution Phase 7 definition (**§1.6**).
- [`specs/00-core/02-intelligence/tasks.md`](specs/00-core/02-intelligence/tasks.md) — tasks **6.1–6.5**.
