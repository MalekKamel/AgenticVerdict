# Changelog entry: Phase 2 — Execution Phase 2 (Agent runtime: context, errors, lifecycle)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 2 — Agent runtime: context, errors, lifecycle](specs/00-core/02-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **1.4**.

This entry implements the agent runtime envelope: a single execution path with Phase 0 tenant scope, tool-visible correlation fields, timeouts and abort, cleanup, lifecycle/drain semantics for workers, structured job errors, and a lightweight health probe. It supports acceptance criteria **§1.1.6–1.1.8** (runtime, tenant propagation, cleanup) and aligns with **§3.2** (tenant isolation for agent executions; logging/telemetry hooks remain at the app layer when wiring `runAgentJob`).

---

## Summary

- Added **`runAgentJob`** as the canonical entry: **`runWithTenantContext`**, optional **`timeoutMs`** / **`AbortSignal`**, **LIFO `registerCleanup`**, and **`AgentJobError`** (`timeout` | `aborted` | `execution_failed`) without embedding **`TenantConfig`** in errors.
- Extended **`AgentInvocationContext`** with **`tenantId`** and **`requestId`** (plus **`runId`**) for tool and agent correlation; full config remains on Phase 0 ALS via **`getTenantContext()`**.
- Re-exported tenant propagation helpers from **`@agenticverdict/core`** through **`tenant-runtime.ts`** for consumers that already depend on **`@agenticverdict/agent-runtime`**.
- Upgraded **`AgentLifecycleController`** with **`beginExecution` / `endExecution`**, in-flight tracking, and **`drain()`** that resolves when in-flight work reaches zero; **`stop()`** rejects new **`beginExecution`** calls.
- Added **`checkAgentRuntimeHealth`** for API/worker readiness (LLM env parse + at least one provider key).
- Bumped package constant **`AGENT_RUNTIME_PACKAGE_VERSION`** to **0.3.0**.

---

## Added

### Dependencies

- **`@agenticverdict/core`** (runtime dependency for tenant ALS).
- **`@agenticverdict/testing`** (dev-only) for **`createTestTenantContext`** in job tests.

### Source modules

- **`src/agent-job.ts`** — **`runAgentJob`**, **`AgentJobError`**, **`AgentJobScope`**, **`createAgentInvocationContext`**, **`RunAgentJobOptions`**.
- **`src/agent-runtime-health.ts`** — **`checkAgentRuntimeHealth`**, report types.
- **`src/tenant-runtime.ts`** — re-exports **`bindTenantContext`**, **`continueWithTenantContext`**, **`getTenantContext`**, **`requireTenantContext`**, **`runWithCapturedTenantContext`**, **`runWithTenantContext`**, **`TenantContext`**.

### Tests

- **`src/agent-job.test.ts`** — tenant ALS, cleanups, timeout, abort, lifecycle + drain, stopped lifecycle, tool + **`IAgent`** path, sequential tenant isolation.
- **`src/agent-runtime-health.test.ts`** — healthy vs degraded provider configuration.
- **`src/lifecycle.test.ts`** — in-flight / drain / stop behavior.

---

## Changed

- **`src/interfaces.ts`** — **`AgentInvocationContext`** now includes **`tenantId`** and **`requestId`**.
- **`src/lifecycle.ts`** — real in-flight semantics and **`drain()`**; **`AgentLifecycle`** interface extended with **`beginExecution`** / **`endExecution`**.
- **`src/index.ts`** — exports for job runtime, health, tenant bridge, and version **0.3.0**.
- **`src/rule-based-agent.test.ts`** — invocation fixtures include tenant and request ids.
- **`packages/agent-runtime/README.md`** — Execution Phase 2 overview and public API bullets.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm --filter @agenticverdict/agent-runtime exec vitest run`
- `pnpm exec turbo run build lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`

---

## Known follow-ups (not in this change set)

- **Execution Phase 3** — expanded retry/backoff, jitter, and deterministic mock LLM scale (**tasks.md 5.x / 7.1**).
- **App-layer telemetry** — structured logs/metrics for job start/finish/duration keyed by **`runId`** (and policy-approved fields only); not hard-wired inside **`runAgentJob`** to avoid opinionated logging dependencies.
- **API/worker `/health`** — call **`checkAgentRuntimeHealth`** from HTTP handlers or readiness probes where appropriate.

---

## Related documentation

- [`specs/00-core/02-intelligence/EXECUTION-PLAN.md`](specs/00-core/02-intelligence/EXECUTION-PLAN.md) — Execution Phase 2 definition and verification.
- [`specs/00-core/02-intelligence/tasks.md`](specs/00-core/02-intelligence/tasks.md) — task **1.4**.
- [`specs/00-core/02-intelligence/acceptance-criteria.md`](specs/00-core/02-intelligence/acceptance-criteria.md) — **§1.1.6–1.1.8**, **§3.2** (partially addressed at runtime-package level).
