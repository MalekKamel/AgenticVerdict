# [Title] Runbook

## Severity

- **P1:** Critical (production down or data loss risk)
- **P2:** High (degraded service, major feature impaired)
- **P3:** Medium (limited customer impact)
- **P4:** Low (cosmetic or internal-only)

## Symptoms

What operators or customers observe (errors, latency, missing data).

## Preconditions

- Access to production Kubernetes/Compose, Grafana, logs, and database read credentials as required by your role.

## Diagnosis

Ordered steps to narrow root cause (metrics, logs, recent deploys, dependencies).

## Resolution

Step-by-step remediation. Prefer reversible changes; note exact commands in your environment where safe.

## Verification

How to confirm the system is healthy again (SLOs, probes, synthetic checks).

## Prevention

Runbooks or tooling updates to avoid recurrence; link to tickets or changelogs.

## References

Links to dashboards, architecture notes, and escalation paths.
