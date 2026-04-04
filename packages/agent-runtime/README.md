# `@agenticverdict/agent-runtime`

Contracts and stubs for AI agent execution.

## Phase 0 scope

- **`IAgent`**, **`ITool`**, **`IMemory`** — stable TypeScript seams for orchestration code.
- **`ToolRegistry`** + **`defineTool`** — register handlers without a graph engine.
- **`InMemoryAgentMemory`** — ephemeral transcript store for tests.
- **`AgentLifecycleController`** — minimal idle/running/stopped gate.
- **`withRetries`** / **`withPrimaryFallback`** — generic resilience helpers (future multi-provider calls).
- **`loadLlmEnvFromProcess`** — reads `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` when present (never logged here).
- **`createRuleBasedEchoAgent`** — example agent that echoes goals and can demo a `ping` tool.

## Deferred to Phase 2

- LangChain.js / LangGraph.js graphs, streaming, structured output, production memory stores, and real Claude / GPT routing.
