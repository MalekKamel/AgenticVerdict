# Changelog: Tenant requirements — Phase 5 (frontend propagation) + Phase 6 (workers and jobs)

**Date:** 2026-04-25  
**Scope:** Execution of **Phase 5 — Frontend propagation and bridge retirement** and **Phase 6 — Workers and jobs** from [`docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md), after **Phases 1–2** ([`2026-04-25-tenant-requirements-phase-1-2-implementation.md`](2026-04-25-tenant-requirements-phase-1-2-implementation.md)) and **Phases 3–4** ([`2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md`](2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md)). Delivers **pre-session `tenantId` in JSON** for all public auth mutations (aligned with the same source as `x-tenant-id`), **SSR `x-tenant-id` default forwarding** for protected-route session probe, **Vitest** coverage for header merge order and tRPC **tenant id resolution order** (`C-FE-2`, `C-FE-3`, `C-FE-4` / NFR-T7, NFR-T4), a production-named **`buildTenantContextForJob`** in `@agenticverdict/core`, **uniform `runWorkerJobWithTenantContext`** for every **BullMQ** processor entry in the report workers (generation, delivery, schedule, workflow trigger), **replacement of `createTestTenantContext`** in worker code paths, shared **`loadTenantConfigForJob`** for job tenant loading, a **Fastify** `FastifyRequest#tenantContext` augmentation in a **single** module so **tRPC `context.ts`** typechecks, and a **direct** `@agenticverdict/core` **workspace dependency** on the worker. Aligns with the SSOT [`docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`](../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md) (**C-JOB-1**, **C-JOB-2**, **NFR-T2**, **C-FE-1**–**4**).

**Verification run:** `pnpm --filter @agenticverdict/core exec vitest run src/tenant-context.test.ts`, `pnpm --filter @agenticverdict/api exec tsc --noEmit`, `pnpm --filter @agenticverdict/api exec vitest run`, `pnpm --filter @agenticverdict/frontend exec vitest run src/lib/tenant/merge-pre-session-tenant-input.test.ts src/lib/tenant/trpc-tenant-bridge.test.ts src/lib/api/trpc-client.test.ts`, `pnpm --filter @agenticverdict/frontend exec tsc --noEmit`, `pnpm --filter @agenticverdict/frontend run i18n:validate`, `pnpm --filter @agenticverdict/worker exec vitest run src/tenant/worker-tenant-als.test.ts`.

---

## Summary

### Phase 5 — Frontend propagation and header alignment

- **Procedure body `tenantId`** — [`mergePreSessionTenantInput`](../apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.ts) copies the effective tenant UUID (same priority as `getTenantIdForTrpcRequest` / `x-tenant-id`: auth store → provider → env; dev-only fallback in [`trpc-tenant-bridge`](../apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts)) into pre-session auth inputs when not already set. [`auth-api`](../apps/frontend/src/lib/api/auth-api.ts) applies it to **login**, **register**, **verifyEmail**, **resendEmailVerification**, **requestPasswordReset**, and **confirmPasswordReset** (mock login uses merged tenant for the session user). **C-FE-2**; public flows no longer depend on headers alone.
- **Headers** — `buildTrpcHeaders` / `x-tenant-id` unchanged; [`publishTenantIdForTrpcHeaders`](../apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts) and documentation clarify that the module is **tRPC header sync** for the batch link, not the sole tenant carrier for auth (**C-HTTP-4**).
- **NFR-T4** — Dev-only default UUID in `trpc-tenant-bridge` remains under `import.meta.env.DEV` only; comment ties to NFR-T4.
- **SSR** — [`fetchProtectedRouteSession`](../apps/frontend/src/lib/auth/protected-route-session.ts) forwards `VITE_PUBLIC_DEFAULT_TENANT_ID` as `x-tenant-id` when the incoming request has no tenant header, matching the client’s `getEffectiveTenantId` default; JSDoc explains alignment vs optional future pre-session tRPC on SSR (**C-FE-3**).
- **Tests** — [`merge-pre-session-tenant-input.test.ts`](../apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.test.ts) (explicit tenant, fill from store, **auth over provider**), [`trpc-tenant-bridge.test.ts`](../apps/frontend/src/lib/tenant/trpc-tenant-bridge.test.ts) (auth first, then provider) (**NFR-T7**).

### Phase 6 — Workers and jobs

- **Core** — [`buildTenantContextForJob`](../packages/core/src/tenant-context.ts) builds a `TenantContext` from `tenantId`, `requestId`, and loaded `TenantConfig` (no `createTestTenantContext` naming on production paths). Unit test in [`tenant-context.test.ts`](../packages/core/src/tenant-context.test.ts). Exported from [`@agenticverdict/core`](../packages/core/src/index.ts).
- **Worker ALS** — [`loadTenantConfigForJob`](../apps/worker/src/tenant/worker-tenant-als.ts) and [`runWorkerJobWithTenantContext`](../apps/worker/src/tenant/worker-tenant-als.ts) (ConfigManager + fallback to `createTestTenantConfig` on load failure, same as prior inline helper). **Every** `Worker` in [`registerReportWorkers`](../apps/worker/src/queues/report-queues.ts) wraps the processor in `runWorkerJobWithTenantContext` with a per-job `requestId` (workflow jobs prefer payload `requestId` when present). **C-JOB-1**; `getTenantContext()` is set before any job body.
- **Pipeline** — `runPipelineWorkflow` uses `buildTenantContextForJob` and `loadTenantConfigForJob` instead of `createTestTenantContext` and the removed `loadTenantConfigForWorkflowTenant` (logic consolidated in `worker-tenant-als`) (**C-JOB-2**, **NFR-T2**).
- **Production-flow R07** — [`production-flow-scenarios-extended`](../apps/worker/src/queues/production-flow-scenarios-extended.ts) uses `buildTenantContextForJob` + `createTestTenantConfig` for A/B context checks.
- **Dependency** — [`apps/worker/package.json`](../apps/worker/package.json) adds `@agenticverdict/core`.
- **Test** — [`worker-tenant-als.test.ts`](../apps/worker/src/tenant/worker-tenant-als.test.ts) asserts `getTenantContext()` inside a wrapped job.

### API / TypeScript (supporting tRPC context build)

- **Fastify augmented request** — [`fastify-augmentation.ts`](../apps/api/src/types/fastify-augmentation.ts) centralizes `FastifyRequest#tenantContext`; [`context.ts`](../apps/api/src/trpc/context.ts) imports it so `opts.req.tenantContext` is typed without relying on transitively loaded middleware. Duplicate `declare module` removed from [`jwt-tenant-context.ts`](../apps/api/src/middleware/jwt-tenant-context.ts).

---

## Added

| Location                                                                                                                                        | What                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.ts`](../apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.ts)           | Merges effective `tenantId` into pre-session auth inputs  |
| [`apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.test.ts`](../apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.test.ts) | Store vs explicit vs provider priority                    |
| [`apps/frontend/src/lib/tenant/trpc-tenant-bridge.test.ts`](../apps/frontend/src/lib/tenant/trpc-tenant-bridge.test.ts)                         | `getTenantIdForTrpcRequest` ordering                      |
| [`apps/api/src/types/fastify-augmentation.ts`](../apps/api/src/types/fastify-augmentation.ts)                                                   | Global `FastifyRequest#tenantContext` for the API package |
| [`apps/worker/src/tenant/worker-tenant-als.ts`](../apps/worker/src/tenant/worker-tenant-als.ts)                                                 | `loadTenantConfigForJob`, `runWorkerJobWithTenantContext` |
| [`apps/worker/src/tenant/worker-tenant-als.test.ts`](../apps/worker/src/tenant/worker-tenant-als.test.ts)                                       | ALS visible inside job callback                           |

| `packages/core` | [`buildTenantContextForJob`](../packages/core/src/tenant-context.ts) + test |

---

## Changed

| Location                                                                                                                          | What                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/frontend/src/lib/api/auth-api.ts`](../apps/frontend/src/lib/api/auth-api.ts)                                               | `mergePreSessionTenantInput` on all pre-session mutations; mock login tenant from merge                                                                                     |
| [`apps/frontend/src/lib/auth/protected-route-session.ts`](../apps/frontend/src/lib/auth/protected-route-session.ts)               | Default `x-tenant-id` from `VITE_PUBLIC_DEFAULT_TENANT_ID` when header absent; JSDoc                                                                                        |
| [`apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts`](../apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts)                     | Header-sync / Phase 5 + NFR-T4 documentation                                                                                                                                |
| [`apps/api/src/trpc/context.ts`](../apps/api/src/trpc/context.ts)                                                                 | Import `fastify-augmentation`                                                                                                                                               |
| [`apps/api/src/middleware/jwt-tenant-context.ts`](../apps/api/src/middleware/jwt-tenant-context.ts)                               | Augmentation moved to `fastify-augmentation`                                                                                                                                |
| [`apps/worker/src/queues/report-queues.ts`](../apps/worker/src/queues/report-queues.ts)                                           | `registerReportWorkers` wraps all four workers; `buildTenantContextForJob` + `loadTenantConfigForJob` in pipeline; remove inline config manager + `createTestTenantContext` |
| [`apps/worker/src/queues/production-flow-scenarios-extended.ts`](../apps/worker/src/queues/production-flow-scenarios-extended.ts) | R07: `buildTenantContextForJob`                                                                                                                                             |
| [`packages/core/src/tenant-context.ts`](../packages/core/src/tenant-context.ts), [`index.ts`](../packages/core/src/index.ts)      | `buildTenantContextForJob` export                                                                                                                                           |
| [`packages/core/src/tenant-context.test.ts`](../packages/core/src/tenant-context.test.ts)                                         | `buildTenantContextForJob` unit test                                                                                                                                        |
| [`apps/worker/package.json`](../apps/worker/package.json)                                                                         | `@agenticverdict/core` dependency                                                                                                                                           |

---

## Plan mapping (Phases 5–6)

| Plan action                                                       | Delivered                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **P5** Pass `tenantId` in JSON for all pre-session auth mutations | `mergePreSessionTenantInput` + `authApi`                                               |
| **P5** Keep `x-tenant-id` when known                              | Unchanged `buildTrpcHeaders`; bridge docs                                              |
| **P5** SSR default / forward when no header                       | `protected-route-session` + `VITE_PUBLIC_DEFAULT_TENANT_ID`                            |
| **P5** Bridge tests; stable API on inputs                         | Bridge tests + merge tests; bridge retained for batch-link headers with clarified role |
| **P5** Dev UUID not in production                                 | Documented; existing `import.meta.env.DEV` guard                                       |
| **P6** Wrap every BullMQ processor in tenant ALS                  | `registerReportWorkers` + `runWorkerJobWithTenantContext`                              |
| **P6** Payloads carry config load path                            | `loadTenantConfigForJob` + `requestId` in wrapper                                      |
| **P6** Replace `createTestTenantContext` in production paths      | `buildTenantContextForJob` in report queues + R07 scenario                             |

---

## Deferred / follow-ups (Phase 7+)

- **Phase 7** — Observability (`NFR-T5`) and rate limits keyed by tenant: not in this change.
- **E2E** — Optional Playwright updates to assert pre-session flows with body `tenantId` (plan exit criteria “E2E for verify-email / reset / login”); can follow if CI budget allows.
- **Desktop Electron** — Same C-FE patterns when the desktop workstream is active (§9 Q-4 in SSOT).

---

## References

- [`docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md)
- [`docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`](../docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md)
- [`docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md`](../docs/architecture/ui/04-pages/tenant-context-trpc-remediation-plan-2026-04-25.md)
- [`changelog/2026-04-25-tenant-requirements-phase-1-2-implementation.md`](2026-04-25-tenant-requirements-phase-1-2-implementation.md)
- [`changelog/2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md`](2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md) — changelog style reference
