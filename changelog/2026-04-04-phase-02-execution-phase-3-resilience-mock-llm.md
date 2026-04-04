# Changelog entry: Phase 2 — Execution Phase 3 (Resilience spine and mock LLM)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 3 — Resilience spine and mock LLM](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **5.1**, **5.2**, and **7.1**.

This entry adds exponential backoff with jitter and observability hooks around LLM calls, documents and tests the Claude → GPT-4 → rule-based degradation path, and ships a LangChain-native mock chat model plus a large canned-response library for deterministic CI.

---

## Summary

- Extended **`withRetries`** with optional **exponential backoff**, **capped delay**, **jitter**, and **`onRetry`** callbacks; exported **`computeRetryDelayMs`** for unit tests.
- Extended **`withPrimaryFallback`** with an optional **`onFallback`** callback for provider-switch telemetry.
- **`invokeChatModelWithProviderFallback`** now accepts **`InvokeChatModelResilienceOptions`**: merged **`retry`** options, **`onProviderFallback`**, optional **`useRuleBasedDegradation`** with **`buildRuleBasedDegradedAiMessage`**, and **`onRuleBasedFallback`**.
- Added **`DEFAULT_PRODUCTION_LLM_RETRY_OPTIONS`** (four attempts, 1s base, ×2 growth, 16s cap, jitter, **`isTransientLlmError`**).
- Introduced **`MOCK_LLM_LIBRARY`** (**55** substring-matched canned replies) and **`AgentMockChatModel`** (**`SimpleChatModel`**) supporting custom entries, artificial delay range, transient HTTP simulation, and timeout simulation.
- Bumped **`AGENT_RUNTIME_PACKAGE_VERSION`** to **0.4.0**.

---

## Added

### Source modules

- **`src/mock-llm-library.ts`** — **`MOCK_LLM_LIBRARY`**, **`MOCK_LLM_LIBRARY_ENTRY_COUNT`**, **`MockLlmLibraryEntry`**.
- **`src/mock-chat-model.ts`** — **`AgentMockChatModel`**, **`AgentMockChatModelFields`**, **`AgentMockChatModelFailureKind`**.

### Tests

- **`src/mock-chat-model.test.ts`** — library size gate, matching, custom entries, failure modes, fake-timer delay.
- Extended **`src/resilience.test.ts`** — **`computeRetryDelayMs`**, **`onRetry`**, **`onFallback`**.
- Extended **`src/chat-models.test.ts`** — production-style retries on primary, triple-path degradation, provider fallback hook, **`buildRuleBasedDegradedAiMessage`**.
- Extended **`src/langchain-integration.test.ts`** — minimal LangGraph run using **`AgentMockChatModel`**.

---

## Changed

- **`src/resilience.ts`** — richer **`RetryOptions`**, **`RetryAttemptInfo`**, **`computeRetryDelayMs`**, optional **`onFallback`** on **`withPrimaryFallback`**.
- **`src/chat-models.ts`** — resilient invoke path, **`DEFAULT_PRODUCTION_LLM_RETRY_OPTIONS`**, **`buildRuleBasedDegradedAiMessage`**, related types.
- **`src/index.ts`** — public exports for resilience helpers, mock library/model, chat-model resilience API; version **0.4.0**.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm --filter @agenticverdict/agent-runtime exec vitest run`
- `pnpm exec turbo run build lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`

---

## Usage notes

- **Default invoke behavior** remains a **single attempt** per provider unless callers pass **`resilience.retry`** (for example **`DEFAULT_PRODUCTION_LLM_RETRY_OPTIONS`** with **`initialDelayMs: 0`**, **`maxDelayMs: 0`**, **`jitter: false`** in fast tests).
- **Rule-based degradation** is **opt-in** via **`useRuleBasedDegradation: true`** so existing callers do not silently mask secondary failures.
- **Live LLM** smoke tests stay behind **`AGENT_RUNTIME_LIVE_LLM=1`** (unchanged).

---

## Known follow-ups (not in this change set)

- **Execution Phase 4** — platform/DB/analysis tools and broader integration tests (**tasks.md** Category 2).
- **App-level metrics** — wire **`onRetry`**, **`onProviderFallback`**, and **`onRuleBasedFallback`** to Prometheus/OpenTelemetry in API/worker layers.
- **Provider health windows** — tasks.md 5.2 mentions downtime thresholds and cost-based routing; not implemented here (explicitly narrower scope: retry, fallback, mock).

---

## Related documentation

- [`docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md`](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md) — Execution Phase 3 definition and verification.
- [`docs/03-development-phases/phase-02-agent-intelligence/tasks.md`](docs/03-development-phases/phase-02-agent-intelligence/tasks.md) — tasks **5.1**, **5.2**, **7.1**.
- [`docs/03-development-phases/phase-02-agent-intelligence/acceptance-criteria.md`](docs/03-development-phases/phase-02-agent-intelligence/acceptance-criteria.md) — **§1.5**, **§2.1.7**, **§6.1.3** (addressed at the agent-runtime package level where applicable).
