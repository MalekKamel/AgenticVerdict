# Changelog entry: P0 pre-deployment remediation (audit docs, Grafana verification)

**Date:** 2026-04-08  
**Scope:** Execution of **🔴 P0 — CRITICAL (Pre-Deployment)** from `REMEDIATION_PLAN_2026-04-08.md`: align security/isolation **test-count** documentation with the codebase, refresh the phase core audit narrative where it was stale, correct the production readiness audit discrepancy table, and ship Grafana/Prometheus **verification artifacts** (runbook + alerting provisioning stub) so operators can sign off monitoring before deploy.

**Test counts:** Individual case counts refer to Vitest **`it()`** blocks. Authoritative verification:

```bash
grep -c "it(" apps/api/src/middleware/auth-security-matrix.test.ts
grep -c "it(" apps/api/src/middleware/tenant-isolation-matrix.test.ts
```

(Expected: **25** and **21** respectively at the time of this entry.)

---

## Summary

- **Auth matrix documentation:** Historical changelog and execution-plan copy cited **51** scenarios for `auth-security-matrix.test.ts`; the file contains **25** `it()` cases. All affected narrative was updated to **25** and tied to the grep verification above.
- **Tenant isolation documentation:** Changelog already stated **21** cases; added an explicit grep-based disclaimer. An earlier audit draft cited **15** isolation tests—that was a **miscount**; the remediation plan and production readiness audit were corrected so **21** is the documented actual, aligned with code.
- **Phase audit report:** `PHASE_00-03_CORE_AUDIT_REPORT.md` sections on authentication and tenant isolation were rewritten to reflect the current API matrix tests instead of the pre-matrix snapshot (“only four tests”, “single tenant-isolation file” as the sole story). The “missing tests” list now notes the isolation matrix as partial coverage with room to extend routes/stores.
- **Production readiness audit:** `PRODUCTION_READINESS_AUDIT_2026-04-08.md` file-path line, discrepancy table, and pre-deployment checklist bullet updated so only the **51 → 25** auth inflation remains a historical documentation error; tenant row shows **21 / 21**.
- **Remediation plan:** `REMEDIATION_PLAN_2026-04-08.md` P0-1 gap text and action table row 2 updated—tenant isolation is **not** reduced to 15 in documentation.
- **Grafana / Prometheus:** Confirmed compose bind-mount of `deploy/observability/grafana/provisioning` and dashboard provider path → `dashboards/json`. Added operator runbook and empty unified-alerting `contact_points.yml` (extend for Slack/email before relying on notifications). Datasource remains `deploy/observability/grafana/provisioning/datasources/datasources.yml` (Prometheus `uid: av-prometheus`).

---

## Added

### `docs/06-reference/runbooks`

- **`grafana-setup.md`** — How to start the observability stack (`docker-compose.yml` + `docker-compose.apps.yml` + `docker-compose.observability.yml`), provisioning directory layout, **Production SLA overview** dashboard (`uid: av-production-sla-overview`), Prometheus scrape targets (`api:4000`, `worker:9464`), “No data” expectations when metrics have not been emitted, alerting/contact-point next steps, and a **pre-deployment verification checklist**.

### `deploy/observability/grafana/provisioning/alerting`

- **`contact_points.yml`** — Grafana 11 unified alerting provisioning stub (`apiVersion: 1`, empty `contactPoints` list) with comments pointing to official docs. Real Slack/email/webhook receivers belong here (or equivalent UI configuration) before production alert routing.

---

## Changed

### `changelog`

- **`2026-04-08-p0-security-blocking-tenant-context-auth-coverage.md`** — **51 → 25** for auth matrix; methodology note on `it()` / grep counts; matrix file bullet uses **25** and references `grep -c "it("`.
- **`2026-04-08-p1-production-readiness-execution.md`** — Isolation count disclaimer; tenant matrix line clarifies **21** `it()` cases via grep.

### `specs/00-core`

- **`p0-phase-00-03-security-blocking-execution-plan-2026-04-08.md`** — Step 6 test count **51 → 25** with grep note.

### Audit / planning (repository root)

- **`PHASE_00-03_CORE_AUDIT_REPORT.md`** — Authentication/authorization and tenant isolation subsections updated for current `auth-security-matrix` / `tenant-isolation-matrix` coverage; missing-tests bullet for multi-tenant isolation adjusted to partial coverage + extension note.
- **`PRODUCTION_READINESS_AUDIT_2026-04-08.md`** — Isolation file line **15 → 21**; documentation discrepancy table and pre-deployment bullet corrected; tenant discrepancy row **21 / 21**.
- **`REMEDIATION_PLAN_2026-04-08.md`** — P0-1 gap narrative and action step 2 corrected (tenant count verified at **21**; no erroneous **21 → 15** doc change).

---

## Configuration / operations

| Topic                      | Detail                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Grafana UI (local compose) | http://localhost:3001 — see runbook for auth (default admin password may be rotated).                                        |
| Prometheus UI              | http://localhost:9090 — **Status → Targets** for `api:4000` / `worker:9464` when app compose is on `agenticverdict` network. |
| Dashboard JSON             | `deploy/observability/grafana/provisioning/dashboards/json/production-sla-overview.json`                                     |
| Datasource UID             | `av-prometheus` (must match panel datasource refs in dashboard JSON).                                                        |
| Alerting                   | Populate `provisioning/alerting/contact_points.yml` (or Grafana UI) before production alert delivery.                        |

---

## Verification

```bash
# Test counts (P0-1)
grep -c "it(" apps/api/src/middleware/auth-security-matrix.test.ts
grep -c "it(" apps/api/src/middleware/tenant-isolation-matrix.test.ts

# Observability stack (from repo root)
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d prometheus loki grafana
curl -sf http://localhost:3001/api/health
curl -sf http://localhost:9090/-/ready

# With apps on the same network, Prometheus should show api + worker targets UP
curl -sf "http://localhost:9090/api/v1/targets" | jq '.data.activeTargets[] | {job: .labels.job, health}'
```

---

## References

- `REMEDIATION_PLAN_2026-04-08.md` — § **P0 - CRITICAL (Pre-Deployment)** (P0-1 documentation, P0-2 Grafana).
- `PRODUCTION_READINESS_AUDIT_2026-04-08.md` — Documentation discrepancy and observability sections updated by this slice.
- `PHASE_00-03_CORE_AUDIT_REPORT.md` — Core audit test-coverage narrative.
- `docker-compose.observability.yml` — Grafana volume mount and port **3001**.
- `changelog/2026-04-08-p0-security-blocking-tenant-context-auth-coverage.md` — Original P0 security implementation entry (auth matrix counts corrected here and in that file).
- `changelog/2026-04-08-p1-production-readiness-execution.md` — Original P1 entry (isolation grep disclaimer added here and in that file).
