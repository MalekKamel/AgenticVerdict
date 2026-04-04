# Changelog entry: Phase 01 — Integration testing and performance validation (Execution Phase 7)

**Date:** 2026-04-04  
**Scope:** Phase 1 (Platform Integration) — [Execution Phase 7 — Integration testing and performance validation](docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md) (`tasks.md` Work Stream 3 Task 3.3; Work Stream 4 Task 4.3).

This entry adds a dedicated workspace package that runs **mock HTTP gateways** for Meta, Google (OAuth, GA4, GSC, GBP), and TikTok, **end-to-end adapter tests** (authenticate → `fetchMetrics` → `normalizeData` → `runNormalizationPipeline`), **load-style** scenarios (100 concurrent fetches, 1000 cached reads, burst stress, iteration endurance proxies), **chaos** cases (injected Meta Graph 500s + circuit breaker open/half-open recovery with retry disabled for determinism, simulated network failure, cache `set` throwing while fetch still succeeds), and **performance regression-style** assertions (p95 cached &lt;200ms, uncached &lt;2s, auth p95 &lt;5s) against the local lab. CI runs this suite after the monorepo Vitest coverage job. It does **not** replace live credential integration tests, run multi-hour endurance in CI, provision Prometheus dashboards, or implement real external mock servers per vendor beyond this single multiplexed Node listener.

---

## Summary

- Added **`tests/phase01-platform-integration/`** workspace package **`@agenticverdict/phase01-platform-integration`** with Vitest **`*.integration.test.ts`** only, **`fileParallelism: false`** and **`sequence.concurrent: false`** so shared mock gateways stay deterministic.
- **`src/mock-servers/gateway.ts`** — `startPlatformMockGateway()` (`node:http`) routes by **`/__gw/{originalHost}{path}`** so colliding Google paths on different hosts do not clash.
- **`src/mock-servers/rewrite-fetch.ts`** — `createRewritingFetch(port)` rewrites vendor URLs into the gateway.
- **`src/mock-servers/chaos.ts`** — `MockGatewayChaosState` for injected Meta Graph 500s with optional auth-path protection.
- **Integration** — `adapters-e2e.integration.test.ts` covers **Meta, GA4, GSC, GBP, TikTok (sandbox)** plus **MemoryPlatformCache** second-hit behavior.
- **Load** — `adapter-throughput.integration.test.ts` for concurrency, throughput, stress burst, and short endurance loop.
- **Chaos** — `adapter-chaos.integration.test.ts` for breaker + network + cache degradation.
- **Performance** — `adapter-sla.integration.test.ts` for SLA-shaped p95 checks vs mock upstream.
- **Root** — `pnpm run test:phase01-integration`; **CI** — `.github/workflows/ci.yml` step after unit coverage.
- **Workspace** — `pnpm-workspace.yaml` includes **`tests/*`**.

---

## Added

### Repository

- **`tests/phase01-platform-integration/package.json`**, **`tsconfig.json`**, **`vitest.config.ts`**
- **`tests/phase01-platform-integration/src/mock-servers/`** — gateway, rewrite fetch, chaos state
- **`tests/phase01-platform-integration/src/integration/adapters-e2e.integration.test.ts`**
- **`tests/phase01-platform-integration/src/load/adapter-throughput.integration.test.ts`**
- **`tests/phase01-platform-integration/src/chaos/adapter-chaos.integration.test.ts`**
- **`tests/phase01-platform-integration/src/performance/adapter-sla.integration.test.ts`**

---

## Changed

- **`pnpm-workspace.yaml`** — `tests/*` glob.
- **`package.json` (root)** — script **`test:phase01-integration`**.
- **`.github/workflows/ci.yml`** — **Phase 01 integration** job step.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm install`
- `pnpm run test:phase01-integration`
- `pnpm exec vitest run --coverage` (monorepo unit suite; unchanged scope)

---

## Known follow-ups (not in this change set)

- **Production SLAs** — Lab p95 checks use fast local mocks; staging should still validate against real APIs and cache tiers.
- **AC-3.3.3 (24h endurance)** — Not executed in CI; only a short iteration proxy is included.
- **AC-2.2.3 / observability** — No dedicated 10k cache RPS harness or performance dashboards wired here.
- **Execution Phase 8** — API docs, runbooks, and published benchmark reports remain separate.

---

## Related documentation

- [`docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md`](docs/03-development-phases/phase-01-platform-integration/EXECUTION-PLAN.md) — Execution Phase 7 definition and verification.
- [`docs/03-development-phases/phase-01-platform-integration/tasks.md`](docs/03-development-phases/phase-01-platform-integration/tasks.md) — Tasks 3.3 and 4.3.
- [`docs/03-development-phases/phase-01-platform-integration/acceptance-criteria.md`](docs/03-development-phases/phase-01-platform-integration/acceptance-criteria.md) — §2 Performance, §3 Integration / chaos.
