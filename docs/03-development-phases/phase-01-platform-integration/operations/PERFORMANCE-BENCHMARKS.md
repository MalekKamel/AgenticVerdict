# Performance benchmarks — platform adapters

## Product SLAs (acceptance criteria)

Aligned with Phase 1 acceptance criteria §2:

| Scenario                          | Target                                   |
| --------------------------------- | ---------------------------------------- |
| Cached adapter read               | **p95 &lt; 200 ms**                      |
| Uncached vendor-backed fetch      | **p95 &lt; 2 s**                         |
| Auth / token validation (typical) | **p95 &lt; 5 s** (lab integration tests) |

Production results vary with vendor latency, region, and payload size. Treat these as **gates** for mock-lab CI and as **budgets** for staging tests against real APIs.

## Automated baseline (Phase 01 integration package)

The workspace package `@agenticverdict/phase01-platform-integration` asserts SLA-shaped percentiles against a **local mock HTTP gateway** (not live vendor APIs):

- **File:** `tests/phase01-platform-integration/src/performance/adapter-sla.integration.test.ts`
- **Command:** `pnpm run test:phase01-integration`

That suite establishes a **regression baseline** for adapter stack cost (cache, breaker, backoff) independent of external network jitter.

## How to extend benchmarking

1. Add staging jobs that run the same adapters against real sandbox credentials with low frequency (nightly).
2. Export `AdapterMethodMetrics` percentiles to your metrics backend (future work).
3. Compare weekly p95 to the table above; open a performance defect when regression exceeds **20%** for two consecutive runs.

## Notes

- Load figures (100+ concurrent, 1000+ req/min) are exercised in `adapter-throughput.integration.test.ts` against mocks; they do not prove vendor-side capacity.
