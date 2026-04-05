# Phase 03 — Testing, hardening, and production readiness

This runbook aligns with execution plan **Part 9** (Weeks 35–38) in [`docs/03-development-phases/phase-03-report-generation/execution-plan.md`](../../03-development-phases/phase-03-report-generation/execution-plan.md): automated verification before and after deploy, monitoring hooks, and smoke checks. Paths below are relative to the repository root.

---

## 1. Automated testing (pre-release)

| Layer                         | Command                                                                                              | Notes                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Monorepo unit + coverage      | `pnpm exec vitest run --coverage`                                                                    | CI quality gate                                                  |
| API contract + Phase 03 flows | `pnpm --filter @agenticverdict/api test`                                                             | Includes RBAC, rate limits, reports, i18n, history               |
| Report generator              | `pnpm --filter @agenticverdict/report-generator test`                                                | Includes template perf smoke (`template-rendering-perf.test.ts`) |
| Web E2E (Chromium)            | `pnpm --filter @agenticverdict/web test:e2e`                                                         | Locale + axe WCAG smoke on `/en` and `/ar`                       |
| Web E2E (Firefox + WebKit)    | `E2E_ALL_BROWSERS=1 pnpm --filter @agenticverdict/web test:e2e` after `pnpm exec playwright install` | Matches CI when all browsers are installed                       |

---

## 2. Load and performance (follow-up tooling)

Per-tenant rate limits are covered in Vitest (`api.contract.test.ts`). For HTTP load against a running API (k6, Artillery, or `autocannon`), target:

- `GET /api/v1/reports` (read bucket)
- `POST /api/v1/insights/validate` (validate bucket)
- `POST /api/v1/report-templates/{id}/preview` (CPU-heavy)

Run against staging with realistic JWTs and **do not** point load tests at production without approval.

---

## 3. Security (automated slice)

Existing API tests cover:

- JWT required / invalid token (`401`)
- RBAC on reports and translations (`403`)
- Tenant isolation on analysis and report content (`404`)
- Fixed-window rate limiting with `429` and `Retry-After`
- Share-token invalid / expired responses (`404`)
- OpenAPI param validation (e.g. UUID report ids → `400`)

Formal penetration testing and threat modeling remain out-of-band for this repository.

---

## 4. Deployment planning (Week 38)

- **Config:** `JWT_SECRET`, optional `REDIS_URL` (BullMQ / rate limiting in multi-instance deployments), object storage keys for report blobs when wired off the in-memory store, email provider keys (Resend / SendGrid).
- **Migrations:** Apply database migrations before rolling out API + worker when PostgreSQL replaces in-memory stores.
- **Rollout:** Deploy API and worker together when queue-backed report delivery is enabled; verify `GET /health` on the API service.

---

## 5. Staging and production verification

After deploy:

1. `GET /health` → `200`, `ok: true`.
2. Authenticated smoke: `GET /api/v1/reports` with a tenant JWT that includes `reports:read` (or `analyst`).
3. Optional: create a report, upload bytes, `GET …/content` round-trip (see API contract test scenario).

---

## 6. Monitoring and alerts

- **Liveness:** orchestrator health check → `/health`.
- **Errors:** alert on elevated `5xx` rate and on worker job failure rate when BullMQ is enabled.
- **Queue:** alert when `queue_unavailable` spikes (Redis down or misconfigured).
- **Audit:** use `GET /api/v1/reports/compliance/summary` and `…/compliance/audit` for operational review (in-memory until backed by durable storage).

---

## Related

- [`docs/03-development-phases/phase-03-report-generation/execution-plan.md`](../../03-development-phases/phase-03-report-generation/execution-plan.md) — Part 9
- [`changelog/2026-04-05-phase-03-execution-plan-part-9-testing-and-hardening.md`](../../../changelog/2026-04-05-phase-03-execution-plan-part-9-testing-and-hardening.md)
