# pgAdmin Docker integration implementation plan

## Status

Implemented in repository with:

- `docker-compose.pgadmin.yml`
- Makefile targets: `pgadmin-up`, `pgadmin-down`, `pgadmin-logs`
- Validation coverage in `scripts/docker-validate.sh`
- Docker documentation updates across `docs/docker/`

## 1) Purpose and outcome

Introduce `pgAdmin` as an **optional Docker Compose overlay** for local database inspection without changing default stack behavior (`make dev`, `make apps-up`, `make infra-up`).

Expected outcome:

- Developers can start or stop `pgAdmin` on demand.
- Integration follows current multi-file Compose layering conventions.
- Validation and documentation remain aligned with Makefile-first workflows.

## 2) Current-state baseline

The repository already uses layered Compose files:

- Base infra: `docker-compose.yml` (+ included `docker-compose.networks.yml`)
- App overlay: `docker-compose.apps.yml`
- Environment overlays: `docker-compose.dev.yml`, `docker-compose.test.yml`
- Optional overlays: `docker-compose.observability.yml`, `deploy/docker-compose.backup.yml`
- Primary entry point: root `Makefile`
- Validation gate: `scripts/docker-validate.sh` + `.github/workflows/docker-compose-validate.yml`

This plan preserves that structure by adding `pgAdmin` as another opt-in overlay.

## 3) Target architecture

### 3.1 New compose file

Create `docker-compose.pgadmin.yml` at repository root with a single service:

- Service name: `pgadmin`
- Network: `agenticverdict`
- Dependency: `postgres` (`condition: service_healthy`)
- Host binding: local-only (`127.0.0.1`) on a dedicated port
- Persistent volume: pgAdmin state/session storage
- Environment-driven bootstrap credentials sourced from `.env.docker`

### 3.2 Overlay behavior

`pgAdmin` remains disabled unless explicitly composed:

- Infra + pgAdmin: `docker compose -f docker-compose.yml -f docker-compose.pgadmin.yml up -d`
- Apps + pgAdmin: `docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.pgadmin.yml up -d`
- Dev stack + pgAdmin (optional): append `-f docker-compose.pgadmin.yml` to the existing dev stack file list

### 3.3 Security posture

- Bind UI port to localhost, not `0.0.0.0`, for default safety.
- Keep credentials out of git-tracked secrets and use `.env.docker`.
- Add clear documentation that pgAdmin is a local operator convenience, not a production requirement.

## 4) Implementation steps (systematic sequence)

### Step 1 — Compose overlay creation

1. Add `docker-compose.pgadmin.yml`.
2. Configure service/network/volume/health dependency.
3. Ensure naming and structure match existing compose conventions.

### Step 2 — Makefile ergonomics (optional but recommended)

Add explicit helper targets if maintainers want Makefile parity:

- `pgadmin-up`
- `pgadmin-down`
- `pgadmin-logs`

These targets should reuse existing variable conventions and preserve default stack targets.

### Step 3 — Environment template updates

Update `.env.docker.example` with optional pgAdmin settings:

- `PGADMIN_PORT` (default local dev port)
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD` (placeholder value only)

Document that real credentials should be set in local `.env.docker`.

### Step 4 — Validation updates

Extend `scripts/docker-validate.sh` to check:

- `docker-compose.pgadmin.yml` standalone config validity
- merged validity with base stack (`docker-compose.yml`)
- optional merged validity with apps stack

No CI workflow restructuring is required if it already executes `scripts/docker-validate.sh`.

### Step 5 — Docker docs updates

Update these docs:

- `docs/docker/README.md` (index entry and quick verification note)
- `docs/docker/compose-files.md` (new file reference section + quick table row)
- `docs/docker/getting-started.md` (optional pgAdmin startup flow)
- `docs/docker/quick-start.md` (short optional pgAdmin step)
- `docs/docker/common-operations.md` (manual compose commands and Make targets if added)
- `docs/docker/troubleshooting.md` (pgAdmin port/auth/connectivity scenarios)

### Step 6 — Verification checklist

1. `make validate` succeeds.
2. `docker compose -f docker-compose.yml -f docker-compose.pgadmin.yml up -d` succeeds.
3. pgAdmin UI loads from localhost port.
4. pgAdmin can connect to host `postgres` service (`postgres` on `agenticverdict` network).
5. Existing workflows (`make dev`, `make apps-up`) remain unchanged when pgAdmin overlay is not used.

## 5) Acceptance criteria

- Optional pgAdmin overlay exists and is not part of default startup.
- Documentation includes clear startup, shutdown, and troubleshooting instructions.
- Validation scripts cover the new compose file and merge combinations.
- No regression to existing compose stacks or CI compose validation.

## 6) Risks and mitigations

- Port conflict on pgAdmin host port  
  Mitigation: configurable `PGADMIN_PORT` and troubleshooting guidance.

- Credentials mishandling in shared environments  
  Mitigation: local `.env.docker` guidance, no hardcoded sensitive values in committed files.

- Drift between docs and Makefile/compose usage  
  Mitigation: keep Makefile-first examples primary and raw Compose examples secondary.

## 7) Rollout strategy

- Phase A: overlay file + validation + minimum docs.
- Phase B: optional Makefile targets and expanded troubleshooting guidance.
- Phase C: optional operational enhancements (for example, saved server bootstrap JSON) if local workflow needs it.

This phased approach keeps the change low risk while enabling immediate developer value.
