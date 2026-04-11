# Phase 2: Agent Intelligence — Execution Plan

**Project:** AgenticVerdict  
**Phase:** 2 — Agent Runtime & Intelligence  
**Document type:** Execution plan (sequencing, grouping, verification)  
**Last updated:** 2026-04-09

---

## Purpose and scope

This document translates Phase 2 documentation into an **ordered, execution-ready plan**. Each **execution phase** below is a **cohesive bundle of related work** that can be brought to a **clear completion state** before heavy dependency on the next bundle.

**Authoritative sources (read in this order for detail):**

| Document                                                                                                    | Role                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [README.md](./README.md)                                                                                    | Index, objectives, platform scope, dependencies                                           |
| [tasks.md](./tasks.md)                                                                                      | Task IDs (1.x–7.x), estimates, category dependencies                                      |
| [acceptance-criteria.md](./acceptance-criteria.md)                                                          | Quality gates, performance, security, exit criteria                                       |
| [overview.md](./overview.md)                                                                                | Risks, architecture layers, week-by-week narrative                                        |
| [`mock-adapter-pipeline-remediation-plan.md`](/docs/06-reference/mock-adapter-pipeline-remediation-plan.md) | Worker/platform dependency wiring, mock data fidelity, and non-degraded pipeline criteria |

**Path note:** This folder is canonical: `docs/03-development-phases/phase-02-agent-intelligence/`. Phase duration in `overview.md` is described as **Weeks 5–6**; if the master roadmap uses different week indices, treat the **task order and exit criteria** here as authoritative for sequencing, not the calendar label.

**Prerequisites:** Phase 0 (foundation: config, tenancy, logging, DB patterns) and Phase 1 (Meta, GA4, GSC, GBP, TikTok adapters, normalization, caching) are **complete** before starting Execution Phase 1 below.

---

## Governing rules (do not skip)

1. **Tenant isolation:** Every tool, agent, and prompt path must respect **tenant context** from Phase 0. No cross-tenant reads, no co-mingled context in system messages, and **no sensitive data in LangSmith traces or logs** beyond what policy allows (see [acceptance-criteria.md](./acceptance-criteria.md) §5).

2. **Platform data boundary:** Live marketing data flows **only** through Phase 1 `ConnectorAdapter` and normalization utilities. Agent tools are **wrappers and orchestration**—they do not reimplement OAuth, rate limits, or raw vendor APIs inside agent packages.

2a. **Tool registration parity:** If platform fetch tools are implemented in the runtime, specialized marketing agents and worker-driven pipelines must receive the same dependency injection contract (for example `platformDeps` or unified `AgentSystem` config). Avoid states where tools exist globally but are omitted from production workflow execution paths.

3. **Phase boundary with Phase 3:** Phase 2 delivers **structured agent outputs** (e.g. verdict and insight schemas), prompts, and tests. **Final PDF/Excel report assembly, email delivery, and template-driven document layout** are Phase 3. Report-oriented tools in `tasks.md` (e.g. summary, format, chart prep) should output **data shapes and markdown-friendly fragments** that Phase 3 can consume without locking in a specific renderer.

4. **Determinism for CI:** Non-negotiable use of the **mock LLM** path for unit tests and most integration tests. Real-provider tests are **opt-in** (nightly or manual) unless the team explicitly wires gated secrets in CI.

5. **Coverage and critical code:** Meet **≥85%** coverage for agent runtime, tools, and specialized agents where [acceptance-criteria.md](./acceptance-criteria.md) and [tasks.md](./tasks.md) specify it; treat **orchestration, fallback, and tenant-scoped tool execution** as **critical** for review and test depth (align with [testing strategy](/docs/02-planning-and-methodology/testing-strategy.md)).

---

## Execution phases (complete work packages)

Each execution phase lists **intent**, **primary `tasks.md` mapping**, **dependencies**, **completion definition**, and **verification** aligned with [acceptance-criteria.md](./acceptance-criteria.md).

---

### Execution Phase 1 — LangChain stack, multi-provider LLM, and LangSmith

**Intent:** Install and configure LangChain.js (and LangGraph as needed per `tasks.md`), wire **Claude** and **GPT-4** providers, and enable **LangSmith** tracing for all executions that hit the LLM.

**Primary task coverage:** Category 1 — Tasks **1.1** (LangChain setup), **1.2** (multi-provider configuration), **1.3** (LangSmith).

**Depends on:** Phase 0 config and secrets patterns; Phase 1 **not** required for provider smoke tests, but required before platform tools are meaningful.

**Completion definition (done when):**

- Workspace package(s) build with strict TypeScript; LangChain-related env vars documented and validated (Zod or equivalent).
- Claude 3.5 Sonnet and GPT-4 Turbo (or agreed equivalents) callable from shared factory/module.
- LangSmith receives traces for a representative agent or chain run; retention and PII policy documented.

**Verification:**

- [acceptance-criteria.md](./acceptance-criteria.md) **§1.1** items **1.1.1–1.1.5** (through LangSmith and provider switching at the level required by tasks).
- Integration test: minimal chain or agent invocation with test API keys (or recorded mock server if used).

**Parallelism:** **1.1** leads; **1.2** follows; **1.3** can overlap **1.2** once base chain executes. Avoid long-lived branches diverging on shared package manifests.

---

### Execution Phase 2 — Agent runtime: context, errors, lifecycle

**Intent:** Implement the **agent runtime envelope**: execution context initialization, **tenant propagation into tools**, timeouts, cleanup, health checks, and error boundaries so failures do not leak context or hang workers.

**Primary task coverage:** Category 1 — Task **1.4** (agent runtime environment).

**Depends on:** Execution Phase **1** (LangChain + providers); Phase 0 tenant context and logging.

**Completion definition (done when):**

- Single execution path is defined (e.g. `runAgentJob` or equivalent) that sets scope, runs tools, and clears state.
- Tenant identity and `CompanyConfig` slices needed for agents are available inside tool execution without global singletons violating isolation.
- Runtime health signal(s) usable from API/worker (per architecture).

**Verification:**

- **§1.1.6–1.1.8** (runtime, tenant propagation, cleanup).
- **§3.2** (Phase 0 integration) for tenant isolation and logging.

**Parallelism:** Mostly sequential after Phase 1; small docs and types can parallelize.

---

### Execution Phase 3 — Resilience spine and mock LLM

**Intent:** Make production and **CI** safe: **retries, backoff, jitter**, multi-provider **fallback** (including rule-based degradation), and a **deterministic mock LLM** so agents and tools are testable without live APIs.

**Primary task coverage:** Category 5 — **5.1**, **5.2**; Category 7 — **7.1** (mock LLM).

**Depends on:** Task **1.2** minimum for retry/fallback around real clients; **7.1** depends on **1.2** per `tasks.md`. Prefer completing **5.1–5.2** before heavy Category 6 work, or accept explicit technical debt with a tracked exception.

**Completion definition (done when):**

- Retry classifies transient vs non-transient errors; caps, logging, and metrics hooks exist.
- Fallback order documented and tested (e.g. Claude → GPT-4 → rule-based path).
- Mock LLM implements the project’s chosen LangChain abstractions; **≥50** canned responses or templates per **7.1** acceptance.

**Verification:**

- **§1.5** (retry & fallback) and **§2.1.7** / **§6.1.3** (mock usage).
- Failure-injection tests for 429/5xx paths.

**Parallelism:** **7.1** can start immediately after **1.2**; **5.x** can run parallel to early **Category 2** tool work if provider clients are stable.

---

### Execution Phase 4 — Agent tool ecosystem (platform, DB, analysis, context)

**Intent:** Deliver the full **tool surface**: five **platform fetch** tools (Meta, GA4, GSC, GBP, TikTok), **database** tools (historical, trends, compare), **report-prep** tools (summary, format, chart data), **calculation/statistics** tools, and **company context** tools—each with Zod (or equivalent) schemas, errors, and **≥85%** unit coverage target.

**Primary task coverage:** Category 2 — **2.1** through **2.5**.

**Depends on:** Execution Phase **2** (runtime + tenant propagation); Phase 1 adapters for **2.1**; Phase 0 DB access patterns for **2.2**.

**Completion definition (done when):**

- All tools listed in `tasks.md` Category 2 are registered and callable from a dev agent with validated inputs/outputs.
- Platform tools use normalization and caching from Phase 1 where applicable; DB tools enforce tenant scope and meet **<500ms p95** where acceptance criteria require it.
- Specialized marketing agents include platform fetch tools when platform dependencies are provided, and integration tests verify that worker/pipeline execution paths actually invoke adapter-backed fetch tools.
- No raw string SQL from LLM input; parameterized queries or repository APIs only.

**Verification:**

- **§1.2** (tools functional and performance targets).
- Integration tests against adapters (mocked or sandbox) per **§3.1**.

**Parallelism:** After **2.1**’s patterns exist, **2.2–2.5** can split across owners; **2.5** (context) should stay coordinated with prompt work in Phase 5.

---

### Execution Phase 5 — Prompt templates, company injection, and A/B framework

**Intent:** **Versioned** prompt library (≥10 production templates per acceptance doc), **company context injection** with token budgeting, and an **A/B testing** workflow with metrics and documentation.

**Primary task coverage:** Category 3 — **3.1**, **3.2**, **3.3**.

**Depends on:** **1.2** for model-facing templates; **2.5** strongly informs **3.2**.

**Completion definition (done when):**

- Templates are typed, versioned, and testable (golden tests or snapshot + schema).
- Injection pipeline enforces max token / truncation policy and documents precedence (system vs user vs tool context).
- A/B harness can run two prompt variants against the same fixture set and record comparison metrics.

**Verification:**

- **§1.3** (prompt system) and **§4.1–4.2** documentation items that relate to prompts.
- Template tests and token budget checks.

**Parallelism:** **3.1** first; **3.2** and **3.3** can parallel after base library exists.

---

### Execution Phase 6 — Agent factory, context integration, and memory

**Intent:** One **factory** pattern for creating agents (prod vs test), **company context integration** on creation and per turn, and **memory/state** (buffer, summaries, optional vector/entity memory per `tasks.md`) with limits and cleanup.

**Primary task coverage:** Category 4 — **4.1**, **4.2**, **4.3**.

**Depends on:** Category **2** complete enough for **4.1** (factory assigns tools); **3.2** for context integration alignment.

**Completion definition (done when):**

- Factory produces agents with explicit config (model, temperature, tools, memory mode).
- Factory/pipeline contracts expose explicit dependency injection for platform and company context data (`platformDeps` / `companyContextDeps`, or equivalent unified `AgentSystem` configuration).
- Multi-tenant tests prove agents cannot retrieve sibling-tenant context via tools or memory.
- Memory eviction / size limits enforced and tested.

**Verification:**

- **§1.4** (agent creation patterns and memory).

**Parallelism:** **4.1** then **4.2**; **4.3** can overlap **4.2** once factory API is stable.

---

### Execution Phase 7 — Specialized agents, communication protocol, and orchestration

**Intent:** Ship the three marketing agents — **cross-platform analysis**, **insight generation**, **media verdict** — plus **agent-to-agent messaging**, and the **sequential orchestration** workflow (analysis → insights → verdict) with state, errors, and progress semantics.

**Primary task coverage:** Category 6 — **6.1** through **6.5**.

**Depends on:** Category **4** (factory + context); Category **2** (tools); **3.x** for prompts; **5.2** recommended before production-like runs.

**Completion definition (done when):**

- Each agent meets its `tasks.md` acceptance bullets and **≥85%** unit coverage target where specified.
- **Verdict** output conforms to agreed schema (see `tasks.md` **6.3** interface) and is validated in tests.
- Orchestration runs end-to-end with mock LLM in CI; optional gated run with real providers.
- Workflow orchestrators (for example worker queue handlers) construct tenant-scoped platform adapters and pass platform/company dependency contracts into marketing pipeline execution so runs are not LLM-only.
- **6.4** protocol supports correlation IDs aligned with Phase 0 request IDs.

**Verification:**

- **§1.6** (specialized agents and orchestration).
- **§2.2** structural gates (schema validation); expert review for rubric scores as required.
- **§8.3** Phase 3 readiness items tied to agent outputs.

**Parallelism:** **6.1** and **6.2** can parallel after tools + factory; **6.3** follows; **6.4–6.5** finalize the workflow.

---

### Execution Phase 8 — Performance optimization and validation hardening

**Intent:** Meet **latency**, **cache hit-rate**, and **token** targets; complete **behavior tests**, **benchmarks**, and **output quality** validation (dataset + gates).

**Primary task coverage:** Category 6 — **6.6**; Category 7 — **7.2**, **7.3**, **7.4**.

**Depends on:** **6.5** (orchestration) for realistic benchmarks; **7.1** for **7.2**.

**Completion definition (done when):**

- **6.6** targets achieved or deviations documented with waivers: e.g. **<5s p95** single agent, **<15s p95** full workflow, **≥50%** redundant LLM call reduction via caching where measured.
- **7.2** suite green in CI with coverage thresholds; **7.3** baselines recorded; **7.4** quality gates run on validation dataset (≥100 cases per acceptance appendix).

**Verification:**

- **§2.1–2.4**, **§6** testing requirements, and **§8.1–8.2** exit criteria as applicable.
- LangSmith + logs show timing breakdowns for bottleneck triage (**§3.3**).

**Parallelism:** Benchmarking (**7.3**) and quality framework (**7.4**) can split; optimization (**6.6**) should follow first stable orchestration.

---

### Phase 2 hardening: mock adapters, dynamic platforms, and workflow validation

**Intent:** Ensure local/CI workflow behavior mirrors production data-flow semantics and avoids silent degraded analysis.

- **Mock data fidelity:** Mock adapters should provide realistic, non-empty normalized metric records for enabled platforms so analysis logic is exercised end-to-end.
- **Dynamic platform discovery:** Analysis prompt inputs should reflect enabled tenant channels from `CompanyConfig.marketing.channels` rather than static defaults.
- **Platform availability checks:** Workflow execution should validate requested platforms against enabled tenant channels and surface explicit workflow errors when misconfigured.

**Verification:** Align with `/docs/06-reference/mock-adapter-pipeline-remediation-plan.md` success criteria and test strategy for non-degraded marketing-analysis behavior.

---

## Recommended sequence (critical path)

```text
Phase 1 (LangChain + providers + LangSmith)
    → Phase 2 (Runtime + tenant propagation)
        → Phase 3 (Retry/fallback + mock LLM)  ← overlap start possible after 1.2
            → Phase 4 (All agent tools)
                → Phase 5 (Prompt library + injection + A/B)
                    → Phase 6 (Factory + context + memory)
                        → Phase 7 (Three agents + protocol + orchestration)
                            → Phase 8 (Perf + full test/benchmark/quality gates)
```

**Note:** **Phase 3** can begin **mock LLM** work as soon as **1.2** is done. **Phase 5** can start **3.1** in parallel with late **Phase 4** if template work does not block tool completion.

---

## Mapping to `tasks.md` categories

| `tasks.md` category    | Execution phases primarily covered |
| ---------------------- | ---------------------------------- |
| 1 — LangChain setup    | Phases 1–2                         |
| 5 — Retry & fallback   | Phase 3 (with 7.1)                 |
| 7 — Testing (mock)     | Phase 3 (7.1); Phase 8 (7.2–7.4)   |
| 2 — Agent tools        | Phase 4                            |
| 3 — Prompts            | Phase 5                            |
| 4 — Agent patterns     | Phase 6                            |
| 6 — Specialized agents | Phases 7–8 (6.6)                   |

---

## Multi-person execution (parallel tracks)

After **Phase 2** merges:

| Track           | Focus                                     | Typical owner skill    |
| --------------- | ----------------------------------------- | ---------------------- |
| **A — Tools**   | Phase 4 platform + DB + calc + context    | Backend / integrations |
| **B — Prompts** | Phase 5 templates, injection, A/B         | AI / full-stack        |
| **C — Agents**  | Phases 6–7 factory, agents, orchestration | AI / backend           |
| **D — Quality** | Phases 3 & 8 mock LLM, tests, benchmarks  | QA / platform          |

**Merge discipline:** Serialize changes to shared agent config schemas, tool registries, and global prompt registries; prefer small PRs with contract-first types.

---

## Phase 2 exit checklist (consolidated)

Before Phase 3 kickoff, confirm:

1. [acceptance-criteria.md](./acceptance-criteria.md) **§1–§8** satisfied for Phase 2 must-haves, or waivers filed per **§9**.
2. [tasks.md](./tasks.md) statuses updated; critical path tasks (**1.1 → 1.2 → 1.4 → Category 2 → 4.1 → 4.2 → 6.1 → 6.2 → 6.3 → 6.5 → 7.2**) reviewed for completion or explicit carry-over.
3. Tenant isolation and prompt-injection mitigations tested (**§5**); no open critical security findings.
4. LangSmith (or agreed alternative) demonstrates **full execution visibility** for standard workflows (**§3.3.1**).
5. Verdict and insight **schemas** documented and consumed in a stub Phase 3 consumer or contract test (**§8.3**).
6. Documentation items in **§4** delivered or consciously deferred with signed product/engineering note.

---

## Related links

- [Phase 1 README](../phase-01-platform-integration/README.md) (prerequisite)
- [Phase 3 README](../phase-03-report-generation/README.md) (next phase; confirm path if renamed)
- [Testing strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [CLAUDE.md](/CLAUDE.md) (stack and patterns)

---

**Document maintenance:** Update this plan when `tasks.md` or Phase 2 acceptance criteria change. Increment **Last updated** when edited.
