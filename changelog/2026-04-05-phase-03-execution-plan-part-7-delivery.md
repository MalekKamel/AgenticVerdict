# Changelog entry: Phase 03 execution plan — Part 7 delivery (Weeks 28–33)

**Date:** 2026-04-05  
**Scope:** [Execution plan Part 7](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — **DEL-1** (email pipeline via BullMQ, delivery API, share links + unauthenticated download, completion webhooks as push-style hooks, in-memory delivery analytics), **SCH-1** (tenant schedule CRUD, five-field cron validation, enabled-schedule conflict detection, BullMQ repeatable jobs when `REDIS_URL` is set, schedule worker fan-out to `report-generation`), **Week 33 QA** (Vitest coverage for queue-unavailable paths, share flow, schedule conflicts, invalid cron). A full **Next.js download UI**, **mobile push (APNs/FCM)**, **provider delivery analytics from webhooks**, and **multi-tenant schedule UI** remain follow-ups.

---

## Summary

- **`@agenticverdict/worker` (`WORKER_PACKAGE_VERSION` `0.3.0`):** **`defaultReportDeliveryProcessor`** — link-only **`sendReportEmail`** (Resend/SendGrid unchanged), optional **`completionWebhookUrl`** JSON payload (**`report.delivery.completed`** with success / error / message id); **`createDefaultReportScheduleProcessor`** + **`registerReportWorkers`** wiring — each repeatable schedule tick **`Queue.add`s** a new **`report-generation`** job with a fresh **`reportId`**; **`ReportDeliveryJobData`** extended (**`subject?`**, **`completionWebhookUrl?`**); **`ReportScheduleJobData`** extended (**`templateId`**, **`format`**, **`locale?`**, **`textDirection?`**); **`SendReportEmailParams.format`** supports **`xlsx`**; Vitest **`src/queues/report-delivery-schedule.test.ts`**.
- **`apps/api`:** Dependencies **`@agenticverdict/worker`**, **`bullmq`**, **`ioredis`**; **`report-bullmq.ts`** — **`enqueueReportDelivery`**, **`registerScheduleRepeatableJob`** / **`unregisterScheduleRepeatableJob`** (repeat key `report-schedule:{id}`), test **`resetBullmqConnectionForTests`**; in-memory **`schedule-store`**, **`share-store`**, **`delivery-analytics-store`**; **`registerReportScheduleRoutes`** — `GET|POST /api/v1/report-schedules`, `PATCH|DELETE /api/v1/report-schedules/{id}`; **`registerReportRoutes`** additions — `GET /api/v1/reports/delivery-metrics`, `POST /api/v1/reports/{id}/delivery` (**202** + job id, **503** `queue_unavailable` without TCP Redis), `POST /api/v1/reports/{id}/share-links` (roles **`admin` \| `reports:share` \| `reports:write`**), `GET /api/v1/reports/shared/{token}/content` (**no JWT**, global rate limit bucket); OpenAPI tags for **Report schedules** and expanded **Reports** description; contract tests reset **`REDIS_URL`** for deterministic queue behavior.
- **`.env.example`:** Clarified that **`REDIS_URL`** is also required for API-side BullMQ enqueue/repeatable registration (not only the worker process).

---

## Verification (local)

```bash
pnpm --filter @agenticverdict/worker test
pnpm --filter @agenticverdict/api test
```

With Redis running and keys set, smoke the delivery enqueue (optional):

```bash
export REDIS_URL=redis://localhost:6379
# start API + worker; POST /api/v1/reports/{id}/delivery with a valid JWT
```

---

## Follow-ups (not in this change)

- **Durable stores:** PostgreSQL for schedules, share grants, and delivery events; signed JWT share tokens instead of opaque server-side map.
- **Web app:** downloads dashboard, schedule admin UI, and inline “notify me” actions wired to new APIs.
- **Worker → API callbacks** for analytics (mark email delivered/bounced) and idempotent **`jobId`** bookkeeping.
- **BullMQ integration tests** against real Redis (repeatable add/remove, end-to-end generation after tick).
- **Schedule optimization:** load-aware staggering, tenant-wide max concurrent generations, and holiday calendars.

---

## Related documentation

- [`docs/03-development-phases/phase-03-report-generation/execution-plan.md`](docs/03-development-phases/phase-03-report-generation/execution-plan.md) — Part 7 (Weeks 28–33)
- [`changelog/2026-04-04-phase-03-execution-plan-part-6-integration.md`](changelog/2026-04-04-phase-03-execution-plan-part-6-integration.md)
