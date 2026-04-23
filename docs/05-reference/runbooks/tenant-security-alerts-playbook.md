# Tenant security alerts playbook

## Alert inventory

- `AgenticVerdictTenantMismatchSpike`
- `AgenticVerdictTenantContextMissingSpike`
- `AgenticVerdictTenantThrottleAnomaly`

## Signals and first checks

1. Review rates in Grafana dashboard `Tenant security and fairness`.
2. Confirm whether impact is isolated to `http` or `trpc` surface:
   - metric: `agenticverdict_tenant_security_events_total{surface=...}`
3. Inspect structured logs for matching events:
   - `event=http_tenant_security`
   - `event=trpc_tenant_security`
4. Check rate-limit fairness:
   - metric: `agenticverdict_tenant_rate_limit_hits_total{bucket_type=...}`

## Triage matrix

### `TENANT_MISMATCH` spike

- Validate client and proxy forwarding of `x-tenant-id`.
- Validate auth token claim consistency (`tenant_id`) at ingress.
- Inspect recent releases touching:
  - `apps/api/src/middleware/jwt-tenant-context.ts`
  - `apps/api/src/trpc/register-fastify.ts`
  - `apps/frontend/src/lib/tenant/*`

### `TENANT_CONTEXT_REQUIRED` spike

- Validate middleware order and tRPC pre-handlers are mounted.
- Check upstream routes for missing tenant hints in public auth calls.
- Verify default/fallback tenant resolution paths in frontend pre-session flows.

### Throttle fairness anomaly

- Compare anonymous vs tenant traffic patterns by `key_prefix`.
- Validate no recent changes unintentionally dropped tenant attribution.
- Review bot/abuse patterns at edge and adjust upstream filtering if needed.

## Immediate mitigation options

- Roll back latest change set that touched tenant propagation or auth middleware.
- Temporarily tighten pre-session validation and explicit tenant hint checks.
- Increase observability sampling (if lowered) to accelerate root-cause analysis.

## Rollback triggers

- Sustained `TENANT_MISMATCH` or `TENANT_CONTEXT_REQUIRED` warning for > 30 minutes.
- Unexplained tenant-scoped 4xx error increase paired with attribution drift.
- Cross-tenant access suspicion (treat as security incident, follow `incident-response.md`).

## Post-incident actions

- Add/adjust regression tests covering failed path.
- Update tenant traceability matrix and changelog evidence.
- Record owner, timeline, and corrective actions in incident notes.
