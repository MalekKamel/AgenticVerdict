# Incident response runbook

## Severity matrix

| Level | Meaning                               | Response time target | Examples                                     |
| ----- | ------------------------------------- | -------------------- | -------------------------------------------- |
| P1    | Production down or active data breach | Immediate            | API 5xx storm, tenant isolation failure      |
| P2    | Major degradation                     | < 1 h                | Queue stalled, single region high error rate |
| P3    | Partial impact                        | < 4 h                | One platform adapter unhealthy               |
| P4    | Minor / internal                      | Next business day    | Dashboard gap, non-blocking bug              |

## Roles

- **Incident commander (IC):** coordinates, assigns tasks, external comms.
- **Tech lead on-call:** code/config decisions.
- **Comms:** customer or exec updates per charter.

## Response flow

1. **Detect** — alerts (Prometheus/Grafana), logs, customer reports.
2. **Triage** — confirm severity; open war room if P1/P2.
3. **Stabilize** — scale, rollback, feature toggle, rate limit (see linked runbooks).
4. **Resolve** — root cause fix or permanent mitigation.
5. **Verify** — [health-checks.md](health-checks.md).
6. **Close** — post-mortem for P1/P2 within 5 business days.

## Communication templates

**Initial (internal):** “Investigating $symptom affecting $scope. IC: $name. Updates every 30m.”

**Customer (if P1):** “We’re investigating elevated errors impacting $feature. Next update within 1 hour.”

## Escalation

- No IC within 15m (P1): escalate to engineering director.
- Security suspicion: invoke security playbook and preserve logs per retention policy.

## References

- [deployment-playbook.md](deployment-playbook.md)
- [rollback-procedures.md](rollback-procedures.md)
- [queue-backlog.md](queue-backlog.md)
- [platform-outages.md](platform-outages.md)
