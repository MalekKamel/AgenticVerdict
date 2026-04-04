# Changelog entry: Phase 2 — Execution Phase 6 (Agent factory, context integration, memory)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 6 — Agent factory, context integration, and memory](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **4.1**, **4.2**, and **4.3**.

This entry adds a **Zod-validated** agent factory configuration, a **production vs test** creation path, **per-turn company context** assembly from Phase 0 tenant ALS (aligned with Phase 5 `assemblePromptLayers` / `buildCompanyPromptContext`), a **LangChain-backed** `IAgent` with optional provider **fallback**, and **memory modes** with **buffer limits**, **rolling long-term summary**, lightweight **snippet retrieval** (keyword overlap, no embeddings), and **ENTITY:** line capture for structured notes. Multi-tenant safety is enforced by matching **invocation** `tenantId` to **active** tenant context; separate memory instances prevent cross-tenant buffer sharing. **`AGENT_RUNTIME_PACKAGE_VERSION`** → **0.7.0**.

---

## Summary

- **`agent-config.ts`** — **`agentFactoryConfigSchema`**, **`parseAgentFactoryConfig`**, **`safeParseAgentFactoryConfig`**, **`agentMemoryModeSchema`** (`none` | `buffer` | `buffer_summary` | `full`), nested **`agentFactoryMemoryLimitsSchema`** (buffer / long-term / snippet / entity caps).
- **`agent-context-integration.ts`** — **`assertInvocationMatchesActiveTenant`**, **`buildFactoryTurnPromptLayers`**, **`AgentTenantContextError`**.
- **`agent-factory.ts`** — **`AgentFactory`**: **`createAgent`**, **`createTestAgent`**, **`createAgentWithTools`** (test mode wires **`AgentMockChatModel`**; production wires primary/fallback chat models), **`createMemory`**, **`createToolRegistry`**, **`normalizeConfig`**.
- **`configurable-llm-agent.ts`** — **`ConfigurableLlmAgent`**: builds messages from assembled layers + memory snapshot, invokes **`invokeChatModelWithProviderFallback`**, appends turn to memory.
- **`memory.ts`** — **`NullAgentMemory`**, **`BoundedBufferMemory`**, **`CompositeAgentMemory`** (summary + optional snippets/entities), **`createAgentMemory`** / **`createMemoryForMode`**; legacy **`InMemoryAgentMemory`** unchanged.
- **Tests** — **`memory.test.ts`**, **`agent-factory.test.ts`** (Zod, tenant mismatch via **`AgentJobError.cause`**, isolated memories, test **`createAgentWithTools`**).

---

## Added

### Source modules (`packages/agent-runtime/src/`)

- **`agent-config.ts`** — factory config schema and parsers.
- **`agent-context-integration.ts`** — tenant alignment + per-turn prompt layers.
- **`agent-factory.ts`** — **`AgentFactory`** class and tool registry helper.
- **`configurable-llm-agent.ts`** — **`ConfigurableLlmAgent`** implementing **`IAgent`**.

### Tests

- **`memory.test.ts`** — eviction, summary roll-up, ENTITY/snippet behavior, **`createAgentMemory`** modes.
- **`agent-factory.test.ts`** — factory paths, **`runAgentJob`** integration with mock LLM, tenant guardrail.

---

## Changed

- **`packages/agent-runtime/src/memory.ts`** — expanded implementations; **`NullAgentMemory.append`** matches **`IMemory`** signature.
- **`packages/agent-runtime/src/index.ts`** — Phase 6 public exports; version **0.7.0**.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm exec turbo run lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`

---

## Usage notes

- **Production agent:** `new AgentFactory({ llmEnv: parseAgentLlmEnv(process.env) }).createAgent({ runtimeMode: "production", role: "insights", memoryMode: "buffer_summary" })`, then run inside **`runAgentJob`** so ALS tenant matches **`AgentInvocationContext.tenantId`**.
- **CI / unit tests:** **`createTestAgent({ role, memoryMode }, mockModel?)`** or **`createAgentWithTools({ runtimeMode: "test", ... }, tools)`** for a registry plus mock-backed agent.
- **Optional tool blob per turn:** pass **`input.context.toolContext`** on **`AgentRunInput`** (trimmed first under assembled token budget).
- **Long-term / “vector” / entity:** use **`memoryMode: "full"`**; entities use lines like **`ENTITY:key=value`**; snippets are indexed from assistant text for **`findSemanticSnippets`** (tests / lightweight RAG stand-in until real embeddings).

---

## Known follow-ups (not in this change set)

- **Execution Phase 7** — bind **`ToolRegistry`** to LangChain tool calling and specialized marketing agents (**tasks.md** Category 6).
- **Real vector memory** — replace keyword snippet retrieval when embedding stack and store are chosen.
- **createAgentWithTools** — today returns tools for orchestrators; Phase 7 should pass bound tools into the graph.

---

## Related documentation

- [`docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md`](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md) — Execution Phase 6 definition and verification (**§1.4** agent patterns / memory).
- [`docs/03-development-phases/phase-02-agent-intelligence/tasks.md`](docs/03-development-phases/phase-02-agent-intelligence/tasks.md) — tasks **4.1–4.3**.
