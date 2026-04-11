# Live platform adapter validation — results log

This document supports **P1-4** (live platform sign-off) in `REMEDIATION_PLAN_2026-04-08.md`.  
Record each validation cycle here; do not place secrets or raw tokens in git.

## How to run (local / CI optional job)

```bash
export LIVE_ADAPTER_VALIDATION=1
export META_LIVE_ACCESS_TOKEN="***"
export META_LIVE_AD_ACCOUNT_ID="***"
export GA4_LIVE_ACCESS_TOKEN="***"
export GA4_LIVE_PROPERTY_ID="***"
# Add GSC, GBP, TikTok as adapters gain live smoke coverage.

pnpm test tests/phase01-platform-integration/src/integration/adapters-live-optional.integration.test.ts
```

## Acceptance checklist (per plan)

- [ ] All five platforms can **authenticate** with test credentials.
- [ ] **fetchMetrics** returns schema-valid payloads for a short date window.
- [ ] **Rate limits** observed (no sustained 429 retry storms).
- [ ] **Circuit breaker** opens and **recovers** under forced failures in a lower environment.
- [ ] Cache layer behaves as expected (hits/misses) when enabled.

## Results history

| Date         | Environment      | Operator | Adapters exercised | Outcome       | Notes            |
| ------------ | ---------------- | -------- | ------------------ | ------------- | ---------------- |
| _yyyy-mm-dd_ | _staging / prod_ | _name_   | _meta, ga4, …_     | _pass / fail_ | _link to ticket_ |

## Grafana

- Use **Circuit breaker & retry health** (`circuit-breaker-health.json`) for operational visibility after go-live.
- Per-platform latency/error panels can be cloned from the SLA dashboard as P2 hardening.

## Quotas and alerts

Configure provider-specific quota alerts in Prometheus/Grafana or vendor consoles; document notification routes in [grafana-setup.md](runbooks/grafana-setup.md) alerting section.
