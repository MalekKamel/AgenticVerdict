# Changelog entry: Phase 03 execution plan — Part 8 history and versioning (Weeks 33–35)

**Date:** 2026-04-05  
**Scope:** [Execution plan Part 8](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — **HIST-1** (per-report byte **versioning** on each `PUT …/content` with SHA-256 snapshots, **version list** and **per-version download**, **compare-versions** JSON for side-by-side UIs), **archival** (`PATCH …/archive` | `unarchive`, default list hides archived; `GET /reports?includeArchived=true`), **retention** (`PATCH …/retention` with 1–3650 days, `POST /reports/retention/sweep` purges blobs past `retainUntil` while keeping snapshot metadata). **Compliance / audit** — append-only **`report-audit-store`** (create, upload, archive, retention, compare, sweep, compliance views), **`GET /reports/compliance/audit`** (`since`, `limit`), **`GET /reports/compliance/summary`** (report stats + audit count last 30 days). **QA:** Vitest contract flow + `report-store-history.test.ts`. A **Next.js history UI**, **binary/text diff** of PDFs, **WORM database audit**, and **legal-hold** workflows remain follow-ups.

---

## Summary

- **`apps/api` — `report-store`:** Each successful upload appends a **`ReportVersionSnapshot`** (`version`, `objectKey`, `contentType`, `byteLength`, `sha256`, `createdAt`); **`archivedAt`**, **`retentionDays`**, **`retainUntil`**, **`purgedAt`**, **`status`** including **`retention_expired`** after sweep; **`listReportsForTenant(tenantId, { includeArchived })`**; **`compareReportVersions`**, **`sweepReportsPastRetention`**, **`getReportHistoryStats`**; Vitest helper **`__setReportRetainUntilForTests`**.
- **`apps/api` — `report-audit-store`:** Ring-buffered **`appendReportAuditEvent`** / **`listReportAuditForTenant`** / **`countReportAuditSince`**; **`__resetReportAuditForTests`**.
- **`apps/api` — routes (`reports.ts`):** `GET /api/v1/reports/{id}/versions`, `GET /api/v1/reports/{id}/versions/{version}/content`, `POST /api/v1/reports/{id}/compare-versions`, `PATCH …/archive`, `PATCH …/unarchive`, `PATCH …/retention`, `POST /api/v1/reports/retention/sweep`, `GET /api/v1/reports/compliance/audit`, `GET /api/v1/reports/compliance/summary`; list reports query **`includeArchived`**; OpenAPI tag **Report history** and expanded **Reports** description.
- **`apps/api` — tests:** **`api.contract.test.ts`** (OpenAPI path assertions, end-to-end history + compliance scenario); **`src/services/report-store-history.test.ts`**.

---

## Verification (local)

```bash
pnpm --filter @agenticverdict/api test
pnpm --filter @agenticverdict/api exec tsc --noEmit
```

---

## Follow-ups (not in this change)

- **Durable storage:** PostgreSQL for reports, version blobs (S3 keys), audit events, and immutable compliance exports.
- **Web app:** history timeline, side-by-side preview, retention admin, and legal-hold toggles wired to these APIs.
- **Diff depth:** structured report-model or text-layer diff when formats allow; not only hash/size metadata.
- **Scheduled sweeps:** BullMQ job per tenant instead of on-demand `POST …/retention/sweep`.
- **Access control:** dedicated **`reports:audit`** / **`reports:compliance`** roles if auditors are not standard **`reports:read`** users.

---

## Related documentation

- [`docs/03-development-phases/phase-03-report-generation/execution-plan.md`](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — Part 8 (Weeks 33–35)
- [`changelog/2026-04-05-phase-03-execution-plan-part-7-delivery.md`](changelog/2026-04-05-phase-03-execution-plan-part-7-delivery.md)
