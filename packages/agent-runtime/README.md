# `@agenticverdict/agent-runtime`

Agent execution contracts, LangChain.js / LangGraph wiring, and multi-provider chat models.

## Phase 2 — Execution Phase 2 (runtime envelope)

- **`runAgentJob`** — single entry path: `runWithTenantContext`, optional **timeout** / **AbortSignal**, **LIFO `registerCleanup`** while ALS is active, **`AgentJobError`** boundary (no config in error payloads).
- **`checkAgentRuntimeHealth`** — process-local probe (LLM env parse + presence of at least one provider key); wire to API/worker `/health` as needed.
- **`AgentLifecycleController`** — **`beginExecution` / `endExecution`** in-flight counting and **`drain()`** for graceful shutdown; pass into `runAgentJob({ lifecycle })` to refuse work after **`stop()`**.
- **Tenant re-exports** — `getTenantContext`, `runWithTenantContext`, `bindTenantContext`, etc., from `@agenticverdict/core` via this package for tool authors.

## Phase 2 — Execution Phase 1

### Dependencies (workspace)

- `@agenticverdict/core`, `@langchain/core`, `@langchain/langgraph`, `@langchain/community`, `@langchain/anthropic`, `@langchain/openai`, `langsmith`, `zod`

### Environment variables

| Variable                                   | Purpose                                               |
| ------------------------------------------ | ----------------------------------------------------- |
| `ANTHROPIC_API_KEY`                        | Claude (Anthropic) API key                            |
| `OPENAI_API_KEY`                           | OpenAI API key (GPT-4 Turbo default)                  |
| `LANGSMITH_API_KEY` or `LANGCHAIN_API_KEY` | LangSmith API key for tracing                         |
| `LANGCHAIN_PROJECT`                        | LangSmith project name (optional)                     |
| `LANGCHAIN_TRACING_V2`                     | `true` / `false` — overrides default tracing when set |

Tracing defaults to **on** when a LangSmith key is present, unless `LANGCHAIN_TRACING_V2` is explicitly false.

**Bootstrap:** Call `applyLangSmithTracingToProcess(loadLlmEnvFromProcess())` once in API/worker startup so LangChain picks up tracing before models run.

**PII / tenancy:** Do not put tenant IDs, customer content, or credentials in LangSmith `metadata` or `tags`. Use only approved opaque correlation IDs. Prompts and completions are visible in LangSmith to anyone with project access—treat traces as sensitive.

### LangSmith retention

Retention and access are controlled in the **LangSmith / LangChain Cloud** project settings (plan-dependent). Align trace sampling, project access, and data-region choices with your security policy. This package does not configure server-side retention.

### Local development

1. Copy keys into a local env file or shell (never commit secrets).
2. Run package tests: `pnpm --filter @agenticverdict/agent-runtime test`.
3. Optional real-network smoke: `AGENT_RUNTIME_LIVE_LLM=1 pnpm --filter @agenticverdict/agent-runtime test` (requires valid provider keys).

### Public API (high level)

- **`parseAgentLlmEnv` / `loadLlmEnvFromProcess`** — Zod-validated env view (keys are never logged here).
- **`createPrimaryAndFallbackChatModels`**, **`invokeChatModelWithProviderFallback`** — Claude primary / GPT-4 Turbo secondary (per preset), with transient-error fallback.
- **`invokeMinimalMessageGraph`** — single-node LangGraph for representative traced runs.
- **`buildSafeLlmRunnableConfig`** — non-sensitive tags/metadata for LangSmith.
- **`runAgentJob`**, **`checkAgentRuntimeHealth`**, tenant helpers re-exported from **`@agenticverdict/core`**.
- **`ToolRegistry`**, **`IAgent`**, resilience helpers, in-memory memory, rule-based echo agent — shared seams for orchestration.

### Default models

- Claude: `claude-3-5-sonnet-20241022`
- OpenAI: `gpt-4-turbo`

Agent role presets (`verdict`, `insights`, `analysis`) live in `DEFAULT_AGENT_MODEL_PRESETS` in source.

## Earlier scope (Phase 0)

Foundation stubs (`IAgent`, `ITool`, `ToolRegistry`, lifecycle, retries) remain; LangChain integration extends them for Phase 2.
