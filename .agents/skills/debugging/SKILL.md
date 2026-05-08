---
name: debugging
description: Systematically diagnose and resolve issues across the AgenticVerdict Docker-based development stack using a structured, stage-by-stage debugging workflow. Use this whenever a task mentions debugging, troubleshooting, diagnosing errors, service failures, container issues, log analysis, health checks, connectivity problems, or when something "isn't working", "is broken", "won't start", or "is failing" — even if "debugging" is not explicitly named. Always follow the Makefile-first diagnostic order: infrastructure health → container status → logs → application → database.
---

## Purpose

Provide agents with a repeatable, non-destructive debugging workflow for the AgenticVerdict monorepo's Docker-based development environment. The skill enforces a staged diagnostic approach that starts at the infrastructure layer and escalates to application-level investigation only when needed, leveraging Makefile targets as the primary command interface.

## When to use

- Services won't start, crash on startup, or enter restart loops.
- Health checks fail (`make health` reports errors).
- Connectivity issues between services (API can't reach Postgres, worker can't reach Redis).
- Unexpected behavior in frontend, API, or worker containers.
- Log analysis needed to identify root cause of failures.
- Database migration, seeding, or schema issues.
- Port conflicts, network issues, or volume permission errors.
- User reports "something isn't working" in the local dev environment.

## Required sources of truth

1. `/Makefile` — All Makefile targets and their underlying commands.
2. `/docs/docker/getting-started.md` — Docker architecture and compose file structure.
3. `/docs/docker/quick-start.md` — Local development workflow.

## Guardrails

- Prefer `make` targets over raw `docker compose` commands. Fall back to raw commands only when no Makefile target exists.
- Non-destructive by default: never suggest `down -v`, `clean-volumes`, or `db-reset` without explicit user confirmation.
- Never log or expose credentials, tokens, JWT secrets, or PII during debugging.
- Respect multi-tenant boundaries: never hardcode tenant IDs or access tenant data without proper context.
- Stop at the first stage that reveals the root cause; do not continue escalating unnecessarily.

## Step-by-step workflow

### Stage 1: Infrastructure health

Confirm the Docker environment and compose stack are functional.

1. `make help` — verify Makefile is accessible and targets are defined.
2. `make preflight` — check Docker daemon, port availability, disk space.
3. `make validate` — confirm compose files merge correctly.
4. `make ps` — list all running containers and their status.

**Move to Stage 2 if:** All infrastructure checks pass but issues persist.
**Fix here if:** Preflight or validation fails — resolve host-level issues first.

### Stage 2: Container lifecycle and status

Identify which services are running, exited, or restarting.

1. `make ps` — check container states (running, exited, restarting).
2. `make health` — run HTTP health checks for frontend, API, and worker.
3. `make health-api` — isolate API health.
4. `make health-worker` — isolate worker health.
5. `make health-frontend` — isolate frontend health.

**Move to Stage 3 if:** Containers are running but health checks fail or behavior is incorrect.
**Fix here if:** Containers are exited or restarting — check logs (Stage 3) for the failing service.

### Stage 3: Log analysis

Examine service logs to identify error patterns, stack traces, and startup failures.

1. `make dev-logs` — follow all dev stack logs (use `--tail=100` for recent context).
2. `make infra-logs` — isolate Postgres and Redis logs.
3. `make apps-logs` — isolate production-like app logs.
4. `make pgadmin-logs` — check pgAdmin if applicable.
5. `make seaweedfs-logs` — check S3 storage if applicable.

For service-specific inspection:

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml -f docker-compose.observability.yml logs --tail=200 --timestamps <service>
```

**Move to Stage 4 if:** Logs show no obvious errors but behavior is still incorrect.
**Fix here if:** Logs reveal error messages, stack traces, or startup failures.

### Stage 4: Application-level diagnostics

Investigate application behavior within running containers.

1. `make shell-db` — access psql for direct database inspection.
2. `make health-api` and `curl -v http://127.0.0.1:4000/health` — verbose API health check.
3. `make health-frontend` and `curl -v http://127.0.0.1:3000/api/health` — verbose frontend health check.

For in-container inspection:

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml -f docker-compose.observability.yml exec <service> sh
```

Common checks inside containers:

- `env` — verify environment variables are set correctly.
- `cat /etc/hosts` — verify DNS entries.
- `ps aux` — check running processes.

**Move to Stage 5 if:** Application appears healthy but data or state is incorrect.
**Fix here if:** Application misconfiguration, missing env vars, or process issues found.

### Stage 5: Database and data layer

Diagnose database connectivity, schema, and data issues.

1. `make shell-db` — connect to PostgreSQL for direct queries.
2. `make db-migrate` — verify schema is up to date.
3. `make db-seed` or `make db-seed-dev` — verify seed data exists.
4. Check tenant-specific data with proper tenant context.

For database resets (requires explicit user confirmation):

```bash
make db-reset        # Drop/recreate + migrate + seed (destructive)
make clean-volumes   # Remove all volumes (data loss)
```

**Fix here if:** Schema drift, missing seed data, or tenant data issues found.

## Validation commands

After resolving an issue, confirm the fix:

```bash
make ps              # All expected containers running
make health          # All health checks pass
make health-api      # API responding
make health-worker   # Worker responding
make health-frontend # Frontend responding
```

For production-like verification:

```bash
make apps-up         # Start production-like stack
make ps-apps         # Verify production containers
```

## Deliverables

- Root cause identification with evidence (log excerpts, error messages, health check results).
- Resolution steps taken and verification evidence.
- Residual risk note if the fix is temporary or requires follow-up.

## Failure conditions

- Debugging skips stages without justification (e.g., jumping to database checks before verifying containers are running).
- Raw `docker compose` commands used when equivalent `make` targets exist.
- Destructive commands (`down -v`, `clean-volumes`, `db-reset`) executed without explicit user confirmation.
- Credentials, tokens, or PII exposed in logs or debugging output.
- Issue resolved but no validation commands run to confirm the fix.
