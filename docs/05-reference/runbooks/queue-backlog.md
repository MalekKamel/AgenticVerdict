# Queue backlog (BullMQ) runbook

## Symptoms

- Grafana/alerts: workflow or report queues growing without drain.
- Worker CPU low while Redis memory or depth rises.
- Jobs aging beyond SLA.

## Diagnosis

1. Confirm **worker pods/processes** running and healthy (`/healthz`, logs).
2. Inspect Redis: BullMQ key patterns for stuck **delayed** or **failed** jobs.
3. Check recent **deploys** (new job types, incompatible payloads).
4. Review **Pino** worker logs for `job_start` without completion; search `event` and `queue` fields.

## Resolution

1. **Scale workers** horizontally if CPU-bound and Redis healthy.
2. **Pause producers** (API enqueue paths) only if backlog risks Redis OOM — coordinate with product.
3. **Retry failed** jobs after fixing root cause (code bug, external API).
4. **Move jobs** to dead-letter or discard only with written approval for idempotency.

## Verification

- Queue depth returns to steady state; completion rate matches enqueue rate.
- No unexplained **failed** growth.

## Prevention

- Dashboards for queue depth and job duration (see P2 queue metrics roadmap).
- Load-test enqueue paths before peak traffic.
