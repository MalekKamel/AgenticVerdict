# Remediation plan: manual testing findings (excludes host port binding)

**Context:** Follow-up to execution of §4.1 Basic Report Generation (S1) per `manual-testing-guide.md`.
**Scope:** Address all identified issues **except** local Docker host port conflicts (`6379` / `5432` already in use).

---

## Issue I2 — Non-idempotent database seed (`db:seed`)

### Symptom

`pnpm --filter @agenticverdict/database db:seed` fails when the schema already exists, e.g.:

`PostgresError: relation "audit_logs" already exists`.

### Impact

**Medium** for onboarding and repeat manual runs: testers cannot re-run seed safely after `db:push` or a partial migration. **Low** for S1/R01 specifically (workflow does not depend on seed).

### Root cause

The seed script (`packages/database/scripts/seed.ts`) calls `runMigrations()` which fails when tables already exist from `drizzle-kit push`. The actual seed logic (`seedCompaniesFromJsonDir`) is already idempotent via upsert, but the migration call is not.

### Remediation

1. **Immediate (documentation):** Document the existing `AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1` flag in:
   - `manual-testing-guide.md` §2.2 (Step 4)
   - `packages/database/README.md` (if exists)

   Add guidance: after `db:push`, run seed with skip flag:

   ```bash
   AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1 pnpm --filter @agenticverdict/database db:seed
   ```

2. **Code improvement:** Create `runMigrationsSafe()` in `packages/database/src/migrate.ts`:
   - Check if `drizzle_migrations` table exists before running
   - Log skip decision clearly
   - Use this in `seed.ts` instead of direct `runMigrations()`

3. **Separate concerns:** Update `package.json` scripts to clarify ownership:
   - `db:push` — schema only (no data)
   - `db:seed` — reference data only (idempotent upserts)
   - `db:reset` — destructive: drop schema, re-run migrations, re-seed

4. **Update package.json scripts:**
   ```json
   {
     "db:seed": "tsx scripts/seed.ts",
     "db:seed:unsafe": "tsx scripts/seed.ts --force-migrations"
   }
   ```

### Acceptance criteria

- Running `db:push` then `db:seed` twice in a row completes without error.
- No duplicate business rows (seed uses upsert).
- Documentation clearly explains migration vs seed responsibility.

---

## Issue I3 — Mock adapters vs Docker production stack (guide / env mismatch)

### Symptom

S1 preconditions in `manual-testing-guide.md` §3.3 state “mock adapters enabled.” The default `docker-compose.apps.yml` sets `NODE_ENV=production` for api/web/worker. `isMockEnabledForPlatform` in `packages/platform-adapters/src/adapter-factory.ts` throws if mock flags are set in production/staging, and otherwise forces mock **off**. `/api/health/adapters` shows `adapterType: “production”`.

### Impact

**Medium:** Testers following the guide literally expect `mockMode` / mock platforms in Docker; they will not see them. **Low** for R01 specifically: the production-flow PDF scenario uses fixed HTML and Playwright and does not require platform mocks.

### Root cause

Security-by-design: mock adapters are blocked in production-like containers. The manual guide blends “Docker full stack” with “mock mode” without distinguishing **dev compose** vs **production compose**. Additionally, S1 R01 bypasses platform adapters entirely via `productionFlowScenarioId: “R01”` — this is not documented.

### Remediation

1. **Add “Environment Modes” section** to `manual-testing-guide.md` (insert after §2.1 System Requirements):

   ```markdown
   ### 2.1.1 Docker vs Local Development

   **Docker Compose (production mode)**:

   - `docker-compose.apps.yml` sets `NODE_ENV=production`
   - Mock adapters are **disabled** for security (throws if enabled via env)
   - Use for: production-flow scenarios (R01/R02), integration testing
   - Commands: `docker compose -f docker-compose.yml -f docker-compose.apps.yml up`

   **Local `pnpm dev` (development mode)**:

   - Runs with `NODE_ENV=development`
   - Mock adapters available via `AGENTICVERDICT_USE_MOCK_ADAPTERS=1`
   - Use for: platform adapter testing, AI agent workflows
   - Commands: `pnpm dev` (from repo root)
   ```

2. **Update S1 prerequisites** (`manual-testing-guide.md` §3.3):

   ```markdown
   #### S1: Basic Report Generation (Happy Path)

   **Preconditions**:

   - All services running (Docker or local)
   - Valid JWT token obtained
   - **For platform adapter testing**: Use local `pnpm dev` with mock adapters enabled
   - **For production-flow R01**: Docker or local; no adapter requirements (uses fixed HTML)
   ```

3. **Create dev compose override** (`deploy/docker-compose.dev.override.yml`):

   ```yaml
   # Development override for mock adapter testing
   # Usage: docker compose -f docker-compose.yml -f docker-compose.apps.yml \
   #        -f deploy/docker-compose.dev.override.yml up

   services:
     api:
       environment:
         NODE_ENV: development
         AGENTICVERDICT_USE_MOCK_ADAPTERS: “1”

     worker:
       environment:
         NODE_ENV: development
         AGENTICVERDICT_USE_MOCK_ADAPTERS: “1”
   ```

4. **Cross-link documentation**: In `docs/docker/getting-started.md`, add section linking to manual testing guide for environment mode expectations.

### Acceptance criteria

- A reader can predict adapter mode from the **exact** commands they run (Docker vs local vs dev override).
- No suggestion to set mock flags on production/staging images without a clear “dev-only” path.
- S1 R01 explicitly documented as not requiring platform adapters.

---

## Issue I4 — Worker service has no Docker healthcheck in `docker compose ps`

### Symptom

`docker compose ps` shows `api`, `web`, `postgres`, and `redis` as **healthy** where configured, but **worker** appears as **Up** without a health state—unlike the illustrative table in `manual-testing-guide.md` §2.2.

### Impact

**Low:** Operational clarity and symmetry with other services; harder to automate “stack ready” without probing worker logs or metrics. No functional impact on workflows.

### Root cause

`worker` service in `docker-compose.apps.yml` has no `healthcheck` block. The API has a wget healthcheck on `/health` (apps/api/Dockerfile:43-44), and postgres/redis have built-in healthchecks. Worker is a background process with no HTTP endpoint.

### Remediation

1. **Create health server module** (`apps/worker/src/health.ts`):

   ```typescript
   import { createServer } from “node:http”;
   import type { Redis } from “ioredis”;

   interface HealthServerOptions {
     redis: Redis;
     port?: string | number;
   }

   export async function startHealthServer({
     redis,
     port = process.env.WORKER_HEALTH_PORT || “9465”,
   }: HealthServerOptions): Promise<void> {
     const server = createServer(async (req, res) => {
       if (req.url === “/healthz” && req.method === “GET”) {
         try {
           // Check Redis connection
           await redis.ping();
           res.writeHead(200, { “Content-Type”: “text/plain” });
           res.end(“OK”);
         } catch (err) {
           res.writeHead(503, { “Content-Type”: “text/plain” });
           res.end(“Unhealthy”);
         }
       } else if (req.url === “/ready” && req.method === “GET”) {
         // Readiness probe: checks if worker is processing jobs
         res.writeHead(200, { “Content-Type”: “text/plain” });
         res.end(“Ready”);
       } else {
         res.writeHead(404);
         res.end(“Not Found”);
       }
     });

     server.listen(port, () => {
       console.info(`Worker health server listening on port ${port}`);
     });
   }
   ```

2. **Update worker entry point** (`apps/worker/src/cli.ts`):

   Import and start health server before worker initialization:

   ```typescript
   import { startHealthServer } from “./health”;
   import { redis } from “./queues/queue-names”;

   async function main() {
     await startHealthServer({ redis });
     // ... existing worker logic ...
   }
   ```

3. **Add healthcheck to `docker-compose.apps.yml`**:

   ```yaml
   worker:
     # ... existing config ...
     healthcheck:
       test: [“CMD-SHELL”, “wget --spider -q http://localhost:9465/healthz || exit 1”]
       interval: 30s
       timeout: 10s
       start_period: 60s
       retries: 3
     environment:
       WORKER_HEALTH_PORT: “9465”
       # ... existing env vars ...
   ```

4. **Update `manual-testing-guide.md`** §2.2 example output:

   ```diff
   - agenticverdict-worker-1   running
   + agenticverdict-worker-1   running (healthy)
   ```

5. **Update worker Dockerfile** to include wget (if not present):

   The base image already includes wget (see apps/worker/Dockerfile:6-9), no change needed.

### Acceptance criteria

- `docker compose ps` reports worker health consistent with compose file.
- Failed worker (crash loop) transitions to **unhealthy** within the configured window (60s start + 3 retries).
- `/healthz` endpoint returns 503 when Redis is unavailable.
- Health server runs on separate port from metrics (9465 vs 9464) to avoid conflicts.

---

## Tracking

| ID  | Title                      | Owner        | Priority | Rationale                                                                       |
| --- | -------------------------- | ------------ | -------- | ------------------------------------------------------------------------------- |
| I2  | Idempotent `db:seed`       | Backend / DB | P1       | Blocks repeatable manual testing; existing mitigation just needs documentation  |
| I3  | Guide + env documentation  | Docs / Plat  | P1       | Confuses testers following guide; clear documentation prevents misconfiguration |
| I4  | Worker compose healthcheck | DevOps       | P3       | Nice-to-have for operational clarity; no functional impact                      |

---

**Excluded from this document:** host port binding conflicts when `5432`/`6379` are already allocated (operator/environment responsibility).
