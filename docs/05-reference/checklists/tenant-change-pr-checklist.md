# Tenant change PR checklist

Use this checklist for any PR that changes tenant resolution, tenant propagation, tenant security errors, tenant scoping, or tenant observability behavior.

## Required

- [ ] Traceability mapping updated (`requirement -> code path -> tests -> owner`).
- [ ] Missing-tenant, mismatch, and propagation test coverage added or updated.
- [ ] HTTP and tRPC tenant security events remain consistent (`event`, `surface`, `code`, `requestId`, `tenantId` when present).
- [ ] Rate-limit fairness impact assessed (`tenant` vs `anonymous` bucket behavior).
- [ ] Tenant boundary gate passes (`pnpm run check:tenant-boundaries`).
- [ ] Type checks pass for touched packages/apps.
- [ ] Rollback conditions documented for tenant mismatch/context spikes.

## Required reviewers

- [ ] Platform/API owner
- [ ] Database owner
- [ ] Security owner
- [ ] Observability owner
