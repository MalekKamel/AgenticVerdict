# Report failures runbook

## Symptoms

- Missing PDF/email; BullMQ report jobs **failed**.
- Webhooks report `delivery_failed` or suppression increasing.

## Diagnosis

1. Locate job in Redis with BullMQ inspector or logs (`queue` report-generation / report-delivery).
2. Check **report blob** storage (memory vs filesystem path `REPORT_BLOB_STORAGE_DIR`).
3. Verify **email provider** quota and bounce/complaint suppression state (`REDIS_URL` sets).

## Resolution

1. Fix template or data validation error in logs; redeploy if code fix.
2. **Retry** job after fix; avoid duplicate sends — confirm idempotency keys if present.
3. **Recipient suppressed:** validate bounce events; remove suppression only after deliverability review.

## Verification

- Successful `event: job_start` → completion without error.
- Customer receives artifact or webhook shows success.

## Prevention

- E2E smoke on critical report paths before release.
- Monitor generation duration histograms in Grafana.
