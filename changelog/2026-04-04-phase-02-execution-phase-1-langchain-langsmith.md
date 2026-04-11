# Changelog entry: Phase 2 — Execution Phase 1 (LangChain, multi-provider LLM, LangSmith)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 1 — LangChain stack, multi-provider LLM, and LangSmith](specs/00-core/02-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **1.1**, **1.2**, and **1.3**.

This entry records the first executable LangChain.js / LangGraph wiring in `@agenticverdict/agent-runtime`, aligned with acceptance criteria **§1.1.1–1.1.5** (through provider switching and LangSmith enablement at the factory/graph level).

---

## Summary

- Added LangChain.js, LangGraph, Anthropic/OpenAI integrations, LangSmith SDK, and Zod to **`@agenticverdict/agent-runtime`**.
- Introduced **validated LLM + LangSmith environment** parsing and an explicit **process-env sync** helper for LangChain tracing.
- Implemented **Claude 3.5 Sonnet** and **GPT-4 Turbo** chat model factories, **per–agent-role presets**, **automatic preference fallback when a provider key is missing**, and **invoke-time provider fallback** on transient HTTP-style errors.
- Added a **minimal LangGraph** (single chat node) used in integration tests as a representative traced execution path.
- Documented **local env setup**, **PII boundaries for traces**, and **LangSmith retention** expectations in the package README.

---

## Added

### `packages/agent-runtime` dependencies

- `@langchain/core`, `@langchain/langgraph`, `@langchain/community`, `@langchain/anthropic`, `@langchain/openai`, `langsmith`, `zod`

### Source modules

- **`src/llm-env.ts`** — `parseAgentLlmEnv`, `loadLlmEnvFromProcess`, Zod schema for provider and LangSmith-related fields; extends the former key-only shape with tracing flags (see Changed).
- **`src/langsmith-tracing.ts`** — `applyLangSmithTracingToProcess`, `buildSafeLlmRunnableConfig` (non-sensitive tags/metadata only).
- **`src/chat-models.ts`** — `createAnthropicChatModel`, `createOpenAiChatModel`, `createPrimaryAndFallbackChatModels`, `invokeChatModelWithProviderFallback`, `isTransientLlmError`, `LlmConfigurationError`, default model IDs and `DEFAULT_AGENT_MODEL_PRESETS`.
- **`src/minimal-agent-graph.ts`** — `invokeMinimalMessageGraph` using `StateGraph` + `MessagesAnnotation`.

### Tests

- Extended **`src/llm-env.test.ts`** for LangSmith parsing and tracing env application.
- **`src/chat-models.test.ts`** — provider resolution, factory behavior, fallback invoke, transient error heuristic.
- **`src/langchain-integration.test.ts`** — FakeListChatModel + minimal graph; optional gated live call behind **`AGENT_RUNTIME_LIVE_LLM=1`**.

### Documentation

- **`packages/agent-runtime/README.md`** — env table, bootstrap tracing, PII policy, retention note, default models, dev commands.

---

## Changed

- **`src/index.ts`** — exports the new LLM, LangSmith, and graph helpers; package constant **`AGENT_RUNTIME_PACKAGE_VERSION`** set to **0.2.0**.
- **`LlmProviderEnv`** — still exported for compatibility; marked deprecated in JSDoc in favor of **`AgentLlmEnv`** (adds LangSmith fields and `langsmithTracingEnabled`).

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm --filter @agenticverdict/agent-runtime exec vitest run`
- `pnpm exec turbo run build lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`

---

## Known follow-ups (not in this change set)

- **Execution Phase 2** — full runtime envelope, tenant propagation into tools, and health signals (**tasks.md 1.4**, acceptance **§1.1.6–1.1.8**).
- **Execution Phase 3** — richer retry/backoff around vendors and deterministic mock LLM scale-out (**tasks.md 5.x / 7.1**).
- **LangSmith dashboard** — project creation, access control, and sampling policies are organization operations; not automated in-repo.
- **`@langchain/community`** pulls a large transitive graph (including unrelated optional peers); consider narrowing imports or dependency policy if install size becomes an issue.

---

## Related documentation

- [`specs/00-core/02-intelligence/EXECUTION-PLAN.md`](specs/00-core/02-intelligence/EXECUTION-PLAN.md) — Execution Phase 1 definition and verification.
- [`specs/00-core/02-intelligence/tasks.md`](specs/00-core/02-intelligence/tasks.md) — tasks **1.1–1.3**.
- [`specs/00-core/02-intelligence/acceptance-criteria.md`](specs/00-core/02-intelligence/acceptance-criteria.md) — **§1.1** (partially addressed through **1.1.5**).
