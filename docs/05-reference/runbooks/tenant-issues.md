# Tenant issues runbook

## Symptoms

- Single tenant **401/403** or unexpected **404** on resources.
- Wrong branding or language for a tenant.
- Suspected **cross-tenant** data exposure (treat as **P1** security incident).

## Diagnosis

1. Confirm **JWT** claims (`tenant_id`, `sub`) match the intended tenant.
2. Validate **TenantConfig** load path for that UUID (`configs/tenants` or DB).
3. Review **AsyncLocalStorage** / `runWithTenantContext` wiring on the code path (API + worker jobs).
4. For isolation suspicion, run **tenant isolation** Vitest matrix locally with the same route pattern — never query prod without approval.

## Resolution

- Config errors: fix JSON/env merge; clear caches if applicable.
- Auth errors: re-issue tokens; verify IdP mapping.
- Security: follow [incident-response.md](incident-response.md); preserve audit logs.

## Verification

- Tenant A cannot read tenant B resources (404 or empty per design).
- Logs show consistent `tenantId` for the request lifecycle.

## Prevention

- Mandatory code review for routes touching `tenantId`.
- Periodic isolation matrix runs in CI.
- Follow dedicated alert triage for mismatch/context incidents: [tenant-security-alerts-playbook.md](tenant-security-alerts-playbook.md).
