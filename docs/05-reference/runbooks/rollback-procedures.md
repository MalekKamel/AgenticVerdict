# Rollback procedures

Use when a deployment causes regressions, elevated errors, or data-risk incidents.

## Principles

- **Revert the smallest unit** that restores stability (API only, worker only, or both).
- **Preserve data**: avoid destructive migrations when rolling back; if a migration ran forward-only, engage DBAs.
- **Communicate** per [incident-response.md](incident-response.md).

## Container / orchestration

1. Identify the last known good **image digest** or **revision** (Git SHA, Helm release).
2. Roll back the failing workload (API or worker) to that revision.
3. Scale worker to **zero** briefly only if jobs are corrupting data; otherwise keep processing with previous binary.

## Application-specific

- **API**: after rollback, confirm `/health` and a sampled authenticated route (e.g. reports list).
- **Worker**: confirm Redis connectivity, queue workers running, and metrics endpoint.
- **Config**: if rollback includes env changes, re-apply prior secret versions from vault history.

## Database

- If a migration must be reversed, use the project’s **down** migration or restore from snapshot — never edit production rows ad hoc for “rollback.”
- Validate row-level tenant scoping after any restore.

## Verification

- Metrics and logs return to baseline (see [health-checks.md](health-checks.md)).
- Open incidents closed only after **passing checks** and stakeholder acknowledgment.

## Post-mortem

Capture timeline, blast radius, root cause, and corrective actions within 5 business days for P1/P2.
