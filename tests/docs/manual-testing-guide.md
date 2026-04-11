# Manual Testing Guide: Marketing Analytics Pipeline

**Document Version:** 1.12
**Last Updated:** 2026-04-09
**Target Audience:** Developers, QA Engineers, DevOps Engineers
**Prerequisites:** Phase 1 (Platform Integration) completion

**Changes in v1.12:**

- **§4.2 / §6.1:** Clarified that **duplicate `workflow-trigger` consumers** (host worker + Docker on the same **`REDIS_URL`**) can make **`marketing-analysis`** return the legacy **`foundation` / `workflow_trigger_acknowledged`** stub just like **`verdict-generation`** — not only the latter. Added an S4 prerequisite to stop extra host workers; retitled the §6.1 troubleshooting entry accordingly.

**Changes in v1.11:**

- **§4.1 Step 3 / API:** `GET /api/v1/workflows/status/:executionId` now applies a **short BullMQ `getJob` retry** after enqueue, so the first poll right after **202** is less likely to return **404** / a JSON body with no **`status`** (scripts using **`jq -r '.status'`** may otherwise print **`null`** once).

**Changes in v1.10:**

- **§6.1:** Documented duplicate **`workflow-trigger`** Redis consumers (host worker + Docker) causing instant **`workflow_trigger_acknowledged`** for **`verdict-generation`**; diagnosis via **`redis-cli CLIENT LIST`**.

**Changes in v1.9:**

- **Compose LLM wiring:** `deploy/docker-compose.dev.override.yml` and root `docker-compose.dev.yml` pass optional `GLM_*` from the host (`.env` at repo root or `export` before `compose up`); avoids editing committed YAML for keys.
- **Provenance SQL (§4.6):** Clarified that rows appear only after **`db:seed`** (tenant must exist in `companies` for the FK) and status polling; duplicate polls no longer insert extra rows (API idempotency).
- **S12 / full pipeline:** Documented current worker behavior — `verdict-generation` runs the same **marketing agent pipeline** as `marketing-analysis` (`verdict-generation_processed`, `analysisId`, `insights`, `processingMetadata`); rebuild **`worker`** after pulling (`docker compose … up --build`) so jobs are not stuck on an older **`workflow_trigger_acknowledged`** stub. Log lines in §4.6 remain illustrative.
- **§4.6 Stage 1:** Adapter entries often use **`status: "unknown"`** on Docker **web** (production adapters); do not require **`status == "ok"`** for a non-empty check.
- **§4.6 Stage 5 / S10 metrics:** Fixed **`grep -E`** pattern for `report-delivery` queue depth (escaped `{` / `}` and closed string).
- **S8:** Documented representative **`fieldErrors`** for invalid `productionFlowScenarioId`.
- **Troubleshooting (§6.1):** Fixed broken internal link to [Section 2.7](#27-compiler-driven-and-layered-runtime-configuration).

**Changes in v1.8:**

- **Full Pipeline Testing:** Added comprehensive stage-by-stage testing procedures for all five pipeline stages (Data Collection → Delivery)
- **Report Archiving:** Added systematic `test-output/` directory structure with format-specific archiving for all report types (PDF, DOCX, XLSX, HTML, JSON)
- **Multi-Language & RTL Testing:** Added comprehensive testing procedures for English (LTR), Arabic (RTL), and French (LTR) with validation scripts
- **Success Criteria Expansion:** Updated with full pipeline validation checkpoints, archiving requirements, and comprehensive quality gates
- **New Documentation Sections:** Added references to comprehensive testing documentation (see Appendix D)
- **Archive Validation:** Added automated validation procedures for all report formats

**Changes in v1.7:**

- **S5 (`GET /api/v1/reports`):** Report list read access now includes **`admin`** (with **`analyst`** / **`reports:write`** unchanged for writes), matching the default **`scripts/generate-dev-jwt.mjs`** role set used elsewhere in this guide.
- **S4 (marketing analysis):** Replaced non-existent `GET /api/v1/analyses/:id` with **`GET /api/v1/analysis-results/:id`**; obtain **`analysisId`** from **`GET /api/v1/workflows/status/:executionId`** → **`result.analysisId`** after the job completes (same **`executionId`** as S1 polling).
- **§5.2 Grafana:** Dashboard URLs use the **observability stack** port **`http://localhost:3001`** (Grafana maps host **3001** → container **3000**), not the web app on **3000**.
- **§5.3 / §5.4:** Database container name aligned to Compose service **`postgres`** (**`agenticverdict-postgres-1`**). SQL examples use Drizzle column names **`company_id`** on **`reports`**, **`platform_credentials`**, and **`audit_logs`**; added a note that **`GET /api/v1/reports`** is backed by an **in-process store** in the current API, so Postgres **`reports`** rows may be empty unless another component writes there.
- **Worker health:** Documented that **`wget --spider`** uses **HTTP HEAD**; the worker health server supports **HEAD** on **`/healthz`** (and Compose probes use **`127.0.0.1`**).

**Changes in v1.6:**

- Aligned **queue** and **Prometheus** sections with the implemented API: there is **no** `GET /api/v1/queues/stats` or `GET /api/v1/queues/dead-letter`; use **`GET /metrics`** on the **API**, **worker metrics** (in-container `WORKER_METRICS_PORT`, refreshed with BullMQ depth), and **`GET /api/health/adapters`** (`components.deadLetter`) on **web** for adapter DLQ backlog

**Changes in v1.5:**

- Documented **layered runtime configuration** (`@agenticverdict/config/configuration`, `ConfigurationService`, centralized `isMockEnabledForConnector`) and **Docker `TARGET_STAGE`** builds for **api** / **worker**
- Corrected **web** vs **api/worker**: dev override and root **`docker-compose.dev.yml`** affect **api** and **worker** only; **web** stays **production** `NODE_ENV` in Docker (Next standalone — no mock adapters in-container)
- Clarified **`/api/health/adapters`** mock metadata reflects the **web** process env; added **`docker-compose.test.yml`** pointer
- Optional env: **`ENABLE_NEW_REPORT_GENERATOR`**, **`ENABLE_ADVANCED_ANALYTICS`** (runtime config layer)

**Changes in v1.4:**

- Aligned mock adapter and workflow sections with compiler-driven build constants (`BUILD_CONFIG`, `IS_PRODUCTION`) and current API/worker behavior
- Clarified `NODE_ENV=production` vs dev override for manual testing
- Refined troubleshooting for mock activation and production-shaped stacks

**Changes in v1.3:**

- Added GLM/LLM configuration documentation
- Clarified mock adapter behavior for production-flow scenarios
- Added troubleshooting for LLM configuration issues

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites & Setup](#2-prerequisites--setup)
3. [Test Scenarios](#3-test-scenarios)
4. [Step-by-Step Test Procedures](#4-step-by-step-test-procedures)
5. [Observability & Verification](#5-observability--verification)
6. [Troubleshooting](#6-troubleshooting)
7. [Success Criteria](#7-success-criteria)

---

## 1. Overview

### 1.1 Purpose

This guide provides comprehensive, step-by-step procedures for manually testing the complete AgenticVerdict marketing analytics pipeline. It covers testing from mock adapter data ingestion through AI agent processing to final report generation, enabling developers to validate all functionality systematically.

### 1.2 Pipeline Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client/API    │───▶│  Workflow Queue  │───▶│  Worker Service │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Report Delivery │◀───│ Report Generator │◀───│  Agent Runtime  │
└─────────────────┘    └──────────────────┘    └────────┬────────┘
                                                        │
                                                        ▼
                                                ┌───────────────┐
                                                │ Platform Data │
                                                │   (Mock/Live) │
                                                └───────────────┘
```

### 1.3 Key Components

| Component        | Purpose                            | Location                     |
| ---------------- | ---------------------------------- | ---------------------------- |
| Data connectors  | Fetch/normalize marketing data     | `packages/data-connectors/`  |
| Agent Runtime    | AI-powered analysis & insights     | `packages/agent-runtime/`    |
| Report Generator | Multi-format report creation       | `packages/report-generator/` |
| Worker Service   | Background job processing          | `apps/worker/`               |
| API Service      | HTTP endpoints & workflow triggers | `apps/api/`                  |

### 1.4 Testing Scope

- **Mock Adapter Mode**: All platforms (Meta, GA4, GSC, GBP, TikTok)
- **AI Agent Pipeline**: Analysis → Insights → Verdict
- **Report Formats**: PDF, DOCX, XLSX, HTML, JSON
- **Languages/RTL**: English (LTR), Arabic (RTL), French (LTR)
- **Multi-tenancy**: Tenant isolation and context propagation

### 1.5 Report Archiving

All test outputs are systematically archived to `test-output/` directory with:

- Complete format coverage (PDF, DOCX, XLSX, HTML, JSON)
- Multi-language support (English LTR, Arabic RTL, French LTR)
- Comprehensive validation and verification
- Metadata tracking and manifest generation

**Archive Structure:**

```
test-output/
├── archive/YYYY-MM-DD_description/
│   ├── scenarios/ (S1-S12, R01-R12)
│   ├── templates/
│   ├── localization/ (en_ltr, ar_rtl, fr_ltr)
│   └── metadata/ (manifest, summary, validation)
├── latest/ (symlink to most recent)
└── baseline/ (symlink to baseline run)
```

See [Appendix D](#appendix-d-additional-testing-documentation) for complete archiving procedures and `test-output-directory-structure.md` for detailed specifications.

---

## 2. Prerequisites & Setup

### 2.1 System Requirements

- **Node.js**: v20 LTS or higher
- **pnpm**: v8.7.0 or higher
- **Docker**: v24.0+ with Docker Compose v2.20+
- **Memory**: 8GB RAM minimum (16GB recommended)
- **Disk**: 10GB free space

### 2.1.1 Docker vs Local Development

**Docker Compose (default for this guide)**:

- Base: `docker-compose.yml` + `docker-compose.apps.yml` + **one** of:
  - [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml), or
  - [`docker-compose.dev.yml`](../../docker-compose.dev.yml) at the repo root (same **api** / **worker** intent)
- The dev override / `docker-compose.dev.yml` sets **`TARGET_STAGE=development`**, **`NODE_ENV=development`**, and **`AGENTICVERDICT_USE_MOCK_ADAPTERS=1`** on **`api`** and **`worker`** only. **`web`** remains **`NODE_ENV=production`** (Next.js standalone image; mock adapter code is not loaded in that process).
- Adapter aggregate health is still served at **`/api/health/adapters`** on the **web** app, but **mock vs production labels** there reflect the **web** container’s env (typically **production** adapters in Docker). To validate **api/worker** mock behavior, use their logs, direct API jobs, or **`pnpm dev`** for a mock-capable web process.
- Use for: manual procedures in this document, **api/worker** mock adapter flows, and production-flow harness scenarios (R01/R02) alongside a dev-like stack.
- Commands: `docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up` (and the same **three** `-f` flags for `ps`, `down`, `restart`, etc., unless noted otherwise). Shorthand: swap the last file for `-f docker-compose.dev.yml`.
- **Test-stage images:** `docker-compose.test.yml` sets **`TARGET_STAGE=test`** and **`NODE_ENV=test`** on **api** / **worker** for deterministic integration-style runs.
- More detail: [`docs/docker/getting-started.md`](../../docs/docker/getting-started.md#environment-modes-and-manual-testing).

**Docker Compose (production-style apps only)**:

- Omit `deploy/docker-compose.dev.override.yml`.
- `docker-compose.apps.yml` keeps `NODE_ENV=production` for app services; mock adapters are **disabled** for security (throws if enabled via env).
- Use for: production-like integration checks without mocks.

**Local `pnpm dev` (development mode)**:

- Runs with `NODE_ENV=development`
- Mock adapters available via `AGENTICVERDICT_USE_MOCK_ADAPTERS=1`
- Use for: platform adapter testing, AI agent workflows
- Commands: `pnpm dev` (from repo root)

### 2.2 Initial Setup

#### Step 1: Clone and Install

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd AgenticVerdict

# Install dependencies
pnpm install
```

#### Step 2: Generate Secrets

```bash
# Generate required secrets
./scripts/generate-secrets.sh
```

This creates secret files under `secrets/`, including:

- `secrets/jwt_secret.txt` for JWT signing (HS256; used by the API via `JWT_SECRET` / `JWT_SECRET_FILE`)

Copy or compose `.env.local` from `.env.example` as needed for your stack; `generate-secrets.sh` does not write `.env.local`.

#### Step 3: Start Full Application Stack (Docker Only)

```bash
# Start full stack (PostgreSQL, Redis, API, Worker, Web) with dev override (mock-friendly defaults)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up -d --build

# Verify services are healthy
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml ps
```

Expected output:

```
NAME                    STATUS                  PORTS
agenticverdict-postgres-1 running (healthy)    0.0.0.0:5432->5432/tcp
agenticverdict-redis-1    running (healthy)    0.0.0.0:6379->6379/tcp
agenticverdict-api-1      running              0.0.0.0:4000->4000/tcp
agenticverdict-worker-1   running (healthy)
agenticverdict-web-1      running              0.0.0.0:3000->3000/tcp
```

#### Step 4: Initialize Database

```bash
# Run database migrations
pnpm --filter @agenticverdict/database db:push

# Optional: Seed with test data
pnpm --filter @agenticverdict/database db:seed
```

If seed fails with errors like `relation "audit_logs" already exists` (schema already applied via `db:push`), set `AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1` so the seed script skips running migrations inside the seed path. After the database seed remediation, `db:push` followed by `db:seed` should succeed without this flag; keep the variable documented for edge cases (partial runs, mixed migration state).

```bash
AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1 pnpm --filter @agenticverdict/database db:seed
```

#### Step 5: Configure Mock Mode

With the default three-file Compose stack, `deploy/docker-compose.dev.override.yml` (or `docker-compose.dev.yml`) already enables mock adapters on **`api`** and **`worker`**. **`web`** does **not** use mocks in Docker; use **`pnpm dev`** if you need a mock-capable web server process. You typically **do not** need a host `.env.local` for the **Docker** api/worker mock baseline.

For **local `pnpm dev`**, database scripts on the host, or extra mock tuning, create or update `.env.local`:

```bash
# Enable mock adapters (redundant for Docker when using the dev override; required for many host workflows)
AGENTICVERDICT_USE_MOCK_ADAPTERS=1

# Optional: Configure per-platform
# AGENTICVERDICT_MOCK_META=1
# AGENTICVERDICT_MOCK_GA4=1
# AGENTICVERDICT_MOCK_GSC=1
# AGENTICVERDICT_MOCK_GBP=1
# AGENTICVERDICT_MOCK_TIKTOK=1

# Configure mock data generation
AGENTICVERDICT_MOCK_SEED=42001
AGENTICVERDICT_MOCK_SCENARIO=normal
```

Compose files in this repo do not load `.env.local` into containers by default. To change mock scenario or seed **inside Docker**, add the variables to the `environment` blocks in `deploy/docker-compose.dev.override.yml`, **`docker-compose.dev.yml`**, or another override you control, then recreate or restart the affected services with the same compose `-f` flags.

#### Step 6: Confirm Application Services Are Running

```bash
# Validate API, worker, and web containers are up
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml ps
```

#### Step 7: Verify Health

```bash
# Check API health
curl http://localhost:4000/health

# Adapter aggregate health is served by the Web app (Next.js route), not the API port
curl http://localhost:3000/api/health/adapters
```

Expected response shape (adapters):

- Top-level `status` of `"ok"` or `"degraded"` (HTTP 503 when not ok)
- `components` — cache, Redis, DLQ, circuit breaker / retry policy summaries
- `connectors` — array of `{ "connector", "healthScore", "adapter", "status" }` entries
- When mock adapters are enabled via env **for that Node process**, the route also returns `mockMode` and `mockConnectors`, and each row includes `adapterType` (`"mock"` or `"production"`).
- **Docker + dev stack:** the **web** container is usually **`NODE_ENV=production`**, so expect **`mockMode: false`** here even when **api** and **worker** use mocks. The example below matches **`pnpm dev`** (or any web process with `NODE_ENV=development` and mock env flags).

Example (illustrative — host `pnpm dev` with mocks, not default Docker web):

```json
{
  "status": "ok",
  "components": {
    "cache": { "status": "ok", "detail": "...", "metrics": {} },
    "redis": { "status": "ok", "detail": "..." },
    "deadLetter": { "status": "ok", "backlog": 0 },
    "circuitBreaker": { "status": "ok", "note": "..." },
    "retryPolicy": { "status": "ok", "note": "..." }
  },
  "connectors": [
    {
      "connector": "meta",
      "healthScore": 100,
      "adapter": {},
      "status": "unknown",
      "adapterType": "mock"
    }
  ],
  "mockMode": true,
  "mockConnectors": ["meta", "ga4", "gsc", "gbp", "tiktok"]
}
```

### 2.3 Optional: Observability Stack

For comprehensive monitoring, start the observability services:

```bash
# Start Prometheus, Grafana, Loki, Promtail (same app stack as the rest of this guide)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml -f docker-compose.observability.yml up -d
```

Access points:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (UI mapped from container `3000`; default login often `admin`/`admin` — see [Observability](../../docs/docker/observability.md))
- **Loki**: http://127.0.0.1:3100

### 2.4 Environment Variables Reference

| Variable                           | Required | Default                                | Description                         |
| ---------------------------------- | -------- | -------------------------------------- | ----------------------------------- |
| `NODE_ENV`                         | Yes      | `development`                          | Runtime environment                 |
| `DATABASE_URL`                     | Yes      | -                                      | PostgreSQL connection string        |
| `REDIS_URL`                        | Yes      | -                                      | Redis connection string             |
| `JWT_SECRET`                       | Yes      | -                                      | JWT signing secret                  |
| `AGENTICVERDICT_USE_MOCK_ADAPTERS` | No       | `0`                                    | Master mock toggle                  |
| `AGENTICVERDICT_MOCK_SEED`         | No       | `42001`                                | Deterministic data seed             |
| `AGENTICVERDICT_MOCK_SCENARIO`     | No       | `normal`                               | Test scenario                       |
| `ENABLE_NEW_REPORT_GENERATOR`      | No       | unset / not `true`                     | Runtime feature flag (config layer) |
| `ENABLE_ADVANCED_ANALYTICS`        | No       | unset / not `true`                     | Runtime feature flag (config layer) |
| `GLM_API_KEY`                      | No\*     | -                                      | GLM/ZhipuAI API key                 |
| `GLM_API_BASE_URL`                 | No       | `https://open.bigmodel.cn/api/paas/v4` | GLM API base URL                    |
| `GLM_MODEL`                        | No       | `glm-4.5`                              | GLM model name                      |
| `GLM_TIMEOUT`                      | No       | `30000`                                | GLM request timeout (ms)            |
| `ANTHROPIC_API_KEY`                | No       | -                                      | Anthropic Claude API key            |
| `OPENAI_API_KEY`                   | No       | -                                      | OpenAI API key                      |

\* Required for AI agent workflows (S4, S12) unless using mock LLM responses.

### 2.5 LLM Configuration

The AgenticVerdict agent runtime uses the following LLM providers with automatic fallback:

1. **GLM/ZhipuAI (Primary)** - Configured via `GLM_*` environment variables
   - Base URL: Custom endpoint supported (e.g., `https://api.z.ai/api/anthropic`)
   - Model: `glm-4.5` by default

2. **Anthropic Claude (Fallback 1)** - Configured via `ANTHROPIC_API_KEY`
   - Model: `claude-3-5-sonnet-20241022` by default

3. **OpenAI GPT (Fallback 2)** - Configured via `OPENAI_API_KEY`
   - Model: `gpt-4o` by default

**Docker Setup for GLM:**

The dev override and `docker-compose.dev.yml` already map **`GLM_*`** from the host. Create a **gitignored** `.env` at the repo root (or `export` variables in your shell), then recreate **api** and **worker**:

```bash
# Example .env (do not commit)
GLM_API_KEY="your-glm-api-key-here"
GLM_API_BASE_URL="https://api.z.ai/api/anthropic"
GLM_MODEL="glm-4.5"
```

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up -d --build api worker
```

### 2.6 Mock Adapter Notes

**Important — process `NODE_ENV` (runtime):** `createConnectorAdapter` uses **`IS_PRODUCTION`** from `@agenticverdict/config/build-constants` (from the process `NODE_ENV` at module load). In a **production** process it **never** selects mock adapters from env, even if `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` is set. Use **`NODE_ENV=development`** (or **`test`**) on the **API** and **worker** when you need mock-backed data fetches. The dev Compose stack ([`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) or [`docker-compose.dev.yml`](../../docker-compose.dev.yml)) does this for **those services** and sets **`TARGET_STAGE`** on image build.

**Web in Docker:** the **web** service keeps **`NODE_ENV=production`** in default Compose overlays; **mock adapters are not available** in that Next.js standalone runtime. Use **`pnpm dev`** for mock-capable web code paths.

**Separate concern — enabling mocks via env (non-production only):** When `NODE_ENV` is **`development`** or **`test`**, mock selection follows the master and per-connector flags in [Section 2.4](#24-environment-variables-reference). Logic lives in **`@agenticverdict/config/configuration`** (`isMockEnabledForConnector`) and is used by **`createConnectorAdapter`**. If `NODE_ENV` is **`production`** or **`staging`**, `isMockEnabledForConnector` **throws** if a flag tries to **turn mock mode on** (defense in depth). The web adapter health route uses that helper with **the web process** env.

**Docker images:** Pass **`TARGET_STAGE`** and matching **`NODE_ENV`** build args (see dev override). Runtime **`NODE_ENV`** must stay non-`production` on **api** and **worker** when mocks are required.

**For production-flow scenarios (R01/R02):**

- Mock adapters are **not required** — these scenarios use fixed HTML
- The system works correctly with production adapters
- No platform adapter configuration needed

**For marketing analysis scenarios (S4, S12):**

- Mock adapters are useful for testing without live platform credentials
- Use local **`pnpm dev`** with `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` for **web** + full stack parity, **or** Docker with the dev override / **`docker-compose.dev.yml`** for **api** and **worker** mocks (web remains production in Docker)

### 2.7 Compiler-driven and layered runtime configuration

**Layer 1 — build constants:** `@agenticverdict/config` exports **`BUILD_CONFIG`**, **`IS_PRODUCTION`**, and related symbols from **`build-constants`** (see [migration guide: compiler-driven config](../../docs/06-reference/migration-guide-compiler-driven-config.md)).

**Layer 2 — runtime config:** **`@agenticverdict/config/configuration`** (also exported from the package root) provides **`ConfigurationService`**, validated **`RuntimeConfig`**, **`canEnableMocksViaEnv`**, centralized **`isMockEnabledForConnector`**, and the **`config`** accessor object. **`createConnectorAdapter`** imports mock enablement from this layer; production **esbuild** bundles still drop mock symbols (**`pnpm run verify:production-bundle`**).

**What manual testers should know:**

- **Production-shaped processes (`NODE_ENV=production` when the Node process starts):**
  - **`createConnectorAdapter` always uses real (production) adapter implementations** for fetch paths; mock env flags do not switch it to mocks.
  - **`POST /api/v1/workflows/trigger`** with `testMode: true` returns **HTTP 400** (`Workflow test triggers are not available in production builds`) so test harness jobs are not enqueued.
  - **Worker:** On startup, if `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` is set, the process **logs an error and exits** (misconfiguration guard).
  - **Do not** set `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` on **production** **api** / **worker** services; if you intentionally enable mock flags while `NODE_ENV` is `production` or `staging`, `isMockEnabledForConnector` **throws** when evaluating enablement (for example from the web health route).

- **Development / test processes (`NODE_ENV` is `development` or `test`):** Mock adapters remain available per [Section 2.4](#24-environment-variables-reference) and [Section 2.6](#26-mock-adapter-notes). CI also runs **`pnpm run verify:production-bundle`** on production-oriented esbuild outputs and the **minified adapter-factory smoke** artifact (see root `package.json`).

**Postgres feature flags (Layer 3 groundwork):** tenant-aware flags are stored in **`feature_flags`** / **`tenant_feature_flags`** (migration **`0003_feature_flags`**). Evaluation API: **`createFeatureFlagService(db)`** in **`@agenticverdict/database`**. Config-change audit helper: **`auditConfigChange`**. Changelog: `changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`.

**Quick check (Docker dev stack):** After `up`, inspect worker logs for a line like `worker_startup` with `environment`, `isProduction`, and `mockAdaptersEnabled` so you can confirm the process matches the stack you expect.

For day-to-day manual runs, keep using the dev Compose stack (**`NODE_ENV=development`** on **api** and **worker** via [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) or [`docker-compose.dev.yml`](../../docker-compose.dev.yml)) so **api/worker** mocks and workflow test triggers behave as in this guide.

---

## 3. Test Scenarios

### 3.1 Scenario Categories

| Category           | Purpose               | Scenarios |
| ------------------ | --------------------- | --------- |
| **Happy Path**     | Normal operation flow | S1-S4     |
| **Multi-tenant**   | Tenant isolation      | S5-S6     |
| **Error Handling** | Failure scenarios     | S7-S9     |
| **Performance**    | Load and stress       | S10-S11   |
| **Integration**    | Cross-component       | S12       |

### 3.2 Scenario Matrix

| ID      | Name                     | Workflow             | Language | Format | Mock Scenario | Archive Required | Priority |
| ------- | ------------------------ | -------------------- | -------- | ------ | ------------- | ---------------- | -------- |
| **S1**  | Basic Report Generation  | `report-generation`  | EN       | PDF    | `normal`      | ✅ All formats   | P0       |
| **S2**  | Arabic RTL Report        | `report-generation`  | AR       | PDF    | `normal`      | ✅ All formats   | P0       |
| **S3**  | Multi-Format Export      | `report-generation`  | EN       | ALL    | `normal`      | ✅ All formats   | P1       |
| **S4**  | Marketing Analysis       | `marketing-analysis` | EN       | -      | `normal`      | ✅ JSON          | P0       |
| **S5**  | Multi-Tenant Isolation   | `report-generation`  | EN       | PDF    | `normal`      | ✅ All formats   | P0       |
| **S6**  | Tenant Config Override   | `report-generation`  | AR       | PDF    | `normal`      | ✅ All formats   | P1       |
| **S7**  | Platform Adapter Failure | `report-generation`  | EN       | PDF    | `error`       | ⚠️ Error logs    | P0       |
| **S8**  | Invalid Config Schema    | `report-generation`  | EN       | PDF    | `normal`      | ⚠️ Error logs    | P1       |
| **S9**  | Circuit Breaker Trigger  | `marketing-analysis` | EN       | -      | `error`       | ⚠️ Error logs    | P1       |
| **S10** | Concurrent Report Gen    | `report-generation`  | EN       | PDF    | `normal`      | ✅ All formats   | P1       |
| **S11** | Large Dataset Handling   | `marketing-analysis` | EN       | -      | `normal`      | ✅ JSON          | P2       |
| **S12** | End-to-End Pipeline      | `verdict-generation` | EN       | ALL    | `normal`      | ✅ All formats   | P0       |

**Archive Legend:**

- ✅ All formats: PDF, DOCX, XLSX, HTML, JSON
- ✅ JSON: Analysis results in JSON format
- ⚠️ Error logs: Archive error scenarios with logs

### 3.3 Detailed Scenario Specifications

#### S1: Basic Report Generation (Happy Path)

**Objective**: Verify complete report generation flow with English content and LTR rendering.

**Preconditions**:

- All services running (Docker or local)
- Valid JWT token obtained
- **For platform adapter testing**: Use local `pnpm dev` with mock adapters enabled
- **For production-flow R01**: Docker or local; no adapter requirements (uses fixed HTML)

**Steps**: See [Section 4.1](#41-basic-report-generation-s1)

**Expected Results**:

- Job queued successfully
- Workflow completes without errors
- PDF report generated (>500 bytes)
- Email delivered (if configured)

---

#### S2: Arabic RTL Report

**Objective**: Verify RTL rendering and Arabic content handling.

**Preconditions**:

- Arabic company config exists
- Font support for Arabic script

**Steps**: Similar to S1 with Arabic tenant config

**Expected Results**:

- RTL layout rendered correctly
- Arabic text displays properly
- No text overflow or alignment issues

---

#### S7: Platform Adapter Failure

**Objective**: Verify graceful degradation when platform adapter fails.

**Preconditions**:

- Set `AGENTICVERDICT_MOCK_SCENARIO=error`

**Steps**: See [Section 4.4](#44-error-handling-scenarios-s7-s9)

**Expected Results**:

- Error caught and logged
- Circuit breaker activated
- Dead letter queue populated
- No data corruption

---

## 4. Step-by-Step Test Procedures

### 4.1 Basic Report Generation (S1)

**API contract (workflows):** `POST /api/v1/workflows/trigger` requires `workflowId`, `testMode: true`, a UUID `tenantId`, and `config`. Optional `config` fields include ISO-8601 `dateRange`, `platforms`, `mockData`, and `productionFlowScenarioId` (production-flow harness). JWT auth expects claims `sub`, `tenant_id` (must match `tenantId`), and `roles` including `admin` for these routes.

Use a tenant that has a company config file at `configs/companies/<tenantId>.json`. For English / LTR PDF (scenario **R01**), the shipped demo tenant `22222222-2222-4222-8222-222222222222` is appropriate.

#### Step 1: Obtain Authentication Token

From the repository root (after `pnpm install`, which provides `jose` for the script):

```bash
# Generate JWT (HS256) — same algorithm and claims as the API middleware
export TOKEN=$(
  node scripts/generate-dev-jwt.mjs \
    --tenant 22222222-2222-4222-8222-222222222222
)

echo "Token length: ${#TOKEN}"
```

#### Step 2: Trigger Workflow

```bash
# Trigger report generation workflow (production-flow PDF smoke: R01)
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      },
      "productionFlowScenarioId": "R01"
    }
  }'
```

Expected response (HTTP **202**):

```json
{
  "executionId": "workflow-report-generation-…",
  "status": "queued",
  "startedAt": "2026-04-07T12:34:56.789Z",
  "estimatedCompletion": "2026-04-07T12:35:56.789Z"
}
```

Copy `executionId` from the response for the next steps and assign it to `EXECUTION` below.

#### Step 3: Monitor Job Status

```bash
# Poll job status (set EXECUTION from Step 2 response)
# Note: Use `jq -r '.status'` (raw output, single field) to avoid parsing errors
# when the response contains LLM-generated content with control characters.
EXECUTION="<paste-execution-id-here>"

while true; do
  STATUS=$(curl -s http://localhost:4000/api/v1/workflows/status/$EXECUTION \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')

  echo "Status: $STATUS"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi

  sleep 2
done
```

#### Step 4: Verify Results

```bash
# Get final job details
curl -s http://localhost:4000/api/v1/workflows/status/$EXECUTION \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

Expected final state (representative production-flow result):

```json
{
  "executionId": "workflow-report-generation-…",
  "status": "completed",
  "bullmqState": "completed",
  "result": {
    "workflowId": "report-generation",
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "testMode": true,
    "phase": "report-generation",
    "message": "production_flow_pdf_ok",
    "productionFlowScenarioId": "R01",
    "reportGenerationDurationMs": 1820,
    "pdfByteLength": 41616,
    "pdfValidation": {
      "minBytesOk": true,
      "shellDir": "ltr",
      "shellLang": "en",
      "mustContainPhrasesOk": true,
      "arabicScriptOk": false
    }
  }
}
```

**S1 pass criteria:** `status` is `completed`, `pdfByteLength` > 500, and `pdfValidation.minBytesOk` / `mustContainPhrasesOk` are true for EN/LTR.

---

### 4.2 Marketing Analysis Pipeline (S4)

**Before Step 1:** **`marketing-analysis`** uses the same BullMQ **`workflow-trigger`** queue as **`verdict-generation`**. If a **host** worker (for example `pnpm --filter @agenticverdict/worker start` or `pnpm dev`) is still connected to the **same Redis** as the Docker stack, it may steal jobs and return the **`foundation`** stub with **no `analysisId`**. Stop host workers or use an isolated Redis before relying on S4/S12; see [§6.1 duplicate consumers](#issue-pipeline-workflows-finish-instantly-with-foundation--workflow_trigger_acknowledged).

#### Step 1: Trigger Marketing Analysis

```bash
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      },
      "platforms": ["meta", "ga4", "gsc"]
    }
  }'
```

#### Step 2: Monitor Pipeline Stages

The marketing analysis pipeline has three stages:

```bash
# Watch logs for pipeline stages
docker logs agenticverdict-worker-1 -f --tail=50
```

Look for log sequences like:

```
[INFO] Pipeline stage: analysis started
[INFO] Platform data fetched: meta, ga4, gsc
[INFO] Pipeline stage: insights started
[INFO] Generated 12 marketing insights
[INFO] Pipeline stage: verdict started
[INFO] Verdict generated successfully
```

(Log text is illustrative; exact messages depend on logger format and pipeline version.)

#### Step 3: Poll Status and Retrieve Analysis Bundle

There is **no** `GET /api/v1/analyses/:id`. Use the **`executionId`** returned from **`POST /api/v1/workflows/trigger`** (same pattern as [§4.1 Step 3](#step-3-monitor-job-status)), then read **`result.analysisId`** from the completed status payload, and fetch the bundle from **`GET /api/v1/analysis-results/:id`**.

```bash
# Set EXECUTION from the JSON response of Step 1 (marketing-analysis trigger)
EXECUTION="<paste-execution-id-here>"

while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 2
done

ANALYSIS_ID=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.result.analysisId // empty')

if [ -z "$ANALYSIS_ID" ] || [ "$ANALYSIS_ID" = "null" ]; then
  echo "No analysisId on result (job may have failed); inspect full status JSON."
  curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
else
  curl -s "http://localhost:4000/api/v1/analysis-results/$ANALYSIS_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
fi
```

**Expected Results:**

- **Execution time**: 10-30 seconds when using production LLM models (GLM/Anthropic/OpenAI); <1 second when using mock LLM
- **Analysis bundle**: Contains `insights` array with AI-generated content
- **Pipeline status**: `degraded` is common with mock adapters due to limited platform data (this is expected behavior)
- **Insight description**: Should be detailed, structured text when production LLM is enabled; generic placeholder text when using mock

**Verification:**

```bash
# Check processing duration from workflow result
curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
  -H "Authorization: Bearer $TOKEN" | jq '.result.processingMetadata.durationMs'
```

- **> 10000ms**: Production LLM models active
- **< 100ms**: Mock/test LLM in use (check GLM_API_KEY configuration)

---

### 4.3 Multi-Tenant Testing (S5)

#### Step 1: Create Multiple Tenant Contexts

```bash
# Tenant 1: demo EN tenant (configs/companies/2222….json)
TOKEN_T1=$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222 --sub user-1)

# Tenant 2: demo AR tenant (configs/companies/1111….json)
TOKEN_T2=$(node scripts/generate-dev-jwt.mjs --tenant 11111111-1111-4111-8111-111111111111 --sub user-2)
```

#### Step 2: Concurrent Tenant Operations

```bash
# Trigger simultaneous reports for different tenants
curl -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN_T1" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": { "productionFlowScenarioId": "R01" }
  }' &

curl -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN_T2" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "11111111-1111-4111-8111-111111111111",
    "config": { "productionFlowScenarioId": "R01" }
  }' &

wait
```

#### Step 3: Verify Tenant Isolation

```bash
# Check that reports are segregated (empty list is OK until reports are created via API)
curl http://localhost:4000/api/v1/reports \
  -H "Authorization: Bearer $TOKEN_T1" | jq '[.reports[].tenantId] | unique'

# Should be [] or only 22222222-2222-4222-8222-222222222222

curl http://localhost:4000/api/v1/reports \
  -H "Authorization: Bearer $TOKEN_T2" | jq '[.reports[].tenantId] | unique'

# Should be [] or only 11111111-1111-4111-8111-111111111111
```

---

### 4.4 Error Handling Scenarios (S7-S9)

#### S7: Platform Adapter Failure

##### Step 1: Enable Error Scenario

Set `AGENTICVERDICT_MOCK_SCENARIO=error` for the worker (and any other services that need it). For **Docker**, add it under `worker.environment` in `deploy/docker-compose.dev.override.yml`, then recreate or restart the worker. For **local `pnpm dev`**, set it in `.env.local`.

Restart worker service:

```bash
# Restart worker to pick up new env (default Compose stack for this guide)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml restart worker
```

##### Step 2: Trigger Workflow and Observe

```bash
curl -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      }
    }
  }'
```

##### Step 3: Verify Error Handling

```bash
# Check for circuit breaker activation
docker logs agenticverdict-worker-1 --tail=100 | grep -i "circuit"

# Adapter-layer dead-letter backlog (in-process summary via web health — not a BullMQ HTTP API)
curl -s http://localhost:3000/api/health/adapters | jq '.components.deadLetter'
```

There is **no** `GET /api/v1/queues/dead-letter` on the API; platform adapter DLQ state is surfaced on **`/api/health/adapters`** as `components.deadLetter` (`status`, `backlog`). For BullMQ-backed workflows, use **`GET /api/v1/workflows/status/:executionId`**, worker logs, and **metrics** (see [§5.2](#52-metrics-monitoring)).

Expected behaviors:

- Circuit breaker opens after threshold
- Failed jobs sent to DLQ
- Error logged with context
- No data corruption

---

#### S8: Invalid Configuration Schema

##### Step 1: Send Invalid Config

The trigger body is validated with Zod. Unknown fields are ignored; send a value that fails an enum — for example an invalid `productionFlowScenarioId`:

```bash
curl -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": { "productionFlowScenarioId": "INVALID" }
  }'
```

##### Step 2: Verify Schema Validation

Expected response (HTTP **400**):

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid workflow trigger payload",
    "details": {
      "fieldErrors": {
        "config": ["Invalid option: expected one of \"R01\"|\"R02\"|…"]
      },
      "formErrors": []
    }
  },
  "requestId": "…"
}
```

Exact `details` contents may vary; confirm `code` is `validation_error` and the payload is rejected before enqueue.

---

### 4.5 Performance Testing (S10-S11)

#### S10: Concurrent Report Generation

```bash
# Generate multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/v1/workflows/trigger \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"workflowId\": \"report-generation\",
      \"testMode\": true,
      \"tenantId\": \"22222222-2222-4222-8222-222222222222\",
      \"config\": { \"productionFlowScenarioId\": \"R01\" }
    }" &
done

wait

# Queue depth: no REST queue stats route — use Prometheus (worker refreshes BullMQ gauges on scrape)
# From the repo root, with the same compose files you used for `up` (worker must have WORKER_METRICS_PORT set, e.g. docker-compose.apps.yml):
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml exec -T worker \
  wget -qO- http://127.0.0.1:9464/metrics | grep -E '^agenticverdict_queue_depth'

# Workflow trigger counters (API process — no auth on /metrics)
curl -s http://localhost:4000/metrics | grep -E '^test_workflow_trigger_(enqueued|completed)_total' | head
```

#### S11: Large Dataset Handling

```bash
# Trigger analysis with extended date range
curl -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2023-01-01T00:00:00.000Z",
        "end": "2024-01-31T00:00:00.000Z"
      }
    }
  }'

# Monitor memory usage
docker stats agenticverdict-worker-1 --no-stream
```

---

### 4.6 Full Pipeline Testing (S12)

For comprehensive end-to-end pipeline testing, including all five stages (data collection through delivery), see [`full-pipeline-testing-procedures.md`](./full-pipeline-testing-procedures.md).

#### Pipeline Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MARKETING ANALYTICS PIPELINE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STAGE 1: DATA COLLECTION                                               │
│  ├─ Platform Adapters (Meta, GA4, GSC, GBP, TikTok)                    │
│  ├─ OAuth Authentication                                                │
│  ├─ Rate Limiting & Circuit Breakers                                   │
│  └─ L1 + L2 Caching Strategy                                           │
│                              ↓                                          │
│  STAGE 2: DATA NORMALIZATION                                            │
│  ├─ Unified Schema Conversion                                          │
│  ├─ Date Range Processing                                               │
│  ├─ Tenant Context Application                                          │
│  └─ Data Validation & Error Handling                                    │
│                              ↓                                          │
│  STAGE 3: AI AGENT PIPELINE                                             │
│  ├─ Cross-Platform Analysis Agent                                      │
│  ├─ Marketing Insights Generation Agent                                │
│  ├─ Media Verdict Agent                                                │
│  └─ LangChain.js + LangGraph.js Orchestration                          │
│                              ↓                                          │
│  STAGE 4: REPORT GENERATION                                             │
│  ├─ Template-Based Rendering                                            │
│  ├─ Multi-Format Output (PDF, DOCX, XLSX, HTML, JSON)                   │
│  ├─ Multi-Language Support (EN/AR/FR with RTL/LTR)                     │
│  └─ Variable Injection & Branding                                       │
│                              ↓                                          │
│  STAGE 5: DELIVERY                                                      │
│  ├─ Email Delivery (Resend/SendGrid)                                    │
│  ├─ Webhook Notifications                                               │
│  ├─ Report Storage & Metadata Tracking                                  │
│  └─ Scheduled Generation (BullMQ)                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Quick Start: Full Pipeline Test

````bash
# Initialize test run directory
TEST_RUN_DIR="test-output/archive/$(date +%Y-%m-%d)_full-pipeline-test"
mkdir -p "$TEST_RUN_DIR"/{scenarios,metadata,templates,localization}

# Trigger verdict-generation (worker: marketing agent pipeline — same processor shape as marketing-analysis)
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "verdict-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      }
    }
  }' | jq -r '.executionId'

# After pulling new worker code, rebuild/recreate the worker image so this workflow is not served from an old stub:
# docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up -d --build worker

# Poll status (same as S1/S4); expect result.message like verdict-generation_processed, phase verdict-generation,
# plus analysisId / insights / processingMetadata when the pipeline ran.

# Monitor worker logs (exact strings vary by logger)
docker logs agenticverdict-worker-1 -f --tail=50 | grep -E "job_start|workflowId|error|pipeline"

# Target architecture (§1.2 / below) spans five stages; current worker implementation covers the agent pipeline
# portion for this workflow id — not yet literal multi-format report generation + delivery in one job.

**Expected Results for S12:**

- **Execution time**: 10-30 seconds when using production LLM models (similar to S4)
- **Result message**: `verdict-generation_processed`
- **Pipeline status**: `degraded` is common with mock adapters (expected behavior)
- **Insights**: AI-generated content describing the analysis

**Quick verification:**
```bash
# Check if production LLM was used (duration > 10s indicates real LLM calls)
EXECUTION="<execution-id-from-trigger>"
curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
  -H "Authorization: Bearer $TOKEN" | jq '.result.processingMetadata.durationMs'
````

````

#### Stage-by-Stage Validation

**Stage 1: Data Collection**
```bash
# Verify platform adapter health (Docker web often reports status "unknown" with production adapters — still useful)
curl -s http://localhost:3000/api/health/adapters | jq '.platforms'

# Check circuit breaker state
curl -s http://localhost:3000/api/health/adapters | jq '.components.circuitBreaker'
````

**Stage 2: Data Normalization**

```bash
# Provenance rows are inserted when GET /api/v1/workflows/status/:executionId runs on a completed analysis-like
# result, and only if the tenant exists in companies (run db:seed per §2.2 — use AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1 if migrations already applied).
docker exec -it agenticverdict-postgres-1 psql -U postgres -d agenticverdict -c \
  "SELECT COUNT(*) FROM provenance_records WHERE tenant_id = '22222222-2222-4222-8222-222222222222';"
```

**Stage 3: AI Agent Pipeline**

```bash
# Monitor agent execution
docker logs agenticverdict-worker-1 --tail=100 | grep -E "agent|Agent|LLM|llm"

# Verify LLM configuration (if applicable)
docker exec agenticverdict-worker-1 printenv | grep -E "GLM_API|ANTHROPIC_API|OPENAI_API"
```

**Stage 4: Report Generation**

```bash
# Verify reports generated in all formats
# Check worker logs for format generation
docker logs agenticverdict-worker-1 --tail=50 | grep -E "report|Report|PDF|DOCX|XLSX|HTML|JSON"
```

**Stage 5: Delivery**

```bash
# Check delivery queue depth gauge (escape { } for grep -E)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml exec -T worker \
  wget -qO- http://127.0.0.1:9464/metrics | grep -E 'agenticverdict_queue_depth\{queue="report-delivery"\}'
```

#### Full Pipeline Checklist

- [ ] Stage 1: All platform adapters return data successfully
- [ ] Stage 1: No circuit breaker activation
- [ ] Stage 2: Data normalized to unified schema
- [ ] Stage 2: Provenance records created
- [ ] Stage 3: All 3 AI agents complete successfully
- [ ] Stage 3: Insights generated with evidence
- [ ] Stage 3: Verdict score calculated (0-100)
- [ ] Stage 4: Reports generated in all 5 formats
- [ ] Stage 4: Multi-language rendering correct
- [ ] Stage 5: Delivery mechanisms functional
- [ ] All stages: Performance within thresholds
- [ ] All stages: Tenant context preserved

For detailed stage-by-stage testing procedures, validation scripts, and troubleshooting, see [`full-pipeline-testing-procedures.md`](./full-pipeline-testing-procedures.md).

---

## 5. Observability & Verification

### 5.1 Log Analysis

#### Application Logs

```bash
# Follow worker logs
docker logs agenticverdict-worker-1 -f --tail=100

# Search for specific events
docker logs agenticverdict-worker-1 --tail=1000 | grep "workflow_completed"

# Extract errors
docker logs agenticverdict-worker-1 --tail=1000 | grep "ERROR"
```

#### Log Patterns to Monitor

| Pattern                    | Severity | Action Required       |
| -------------------------- | -------- | --------------------- |
| `Circuit breaker opened`   | Warning  | Investigate platform  |
| `Tenant context not found` | Error    | Verify tenant config  |
| `LLM rate limit exceeded`  | Warning  | Check API quota       |
| `Report generation failed` | Error    | Check template/config |
| `Dead letter queue`        | Warning  | Review failed jobs    |

---

### 5.2 Metrics Monitoring

#### Prometheus Metrics

The API exposes a single registry at **`GET /metrics`** (no authentication). The worker optionally serves the **same metric names** on an in-container HTTP server when **`WORKER_METRICS_PORT`** is set (for example in [`docker-compose.apps.yml`](../../docker-compose.apps.yml)); the worker handler refreshes **`agenticverdict_queue_depth`** from BullMQ before each scrape. There are **no** `GET /api/v1/queues/*` routes.

```bash
# API (workflow triggers, scenario telemetry, config access, etc.)
curl -s http://localhost:4000/metrics | head -40

# Worker queue depth (from host: exec into worker — port 9464 is not published by default)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml exec -T worker \
  wget -qO- http://127.0.0.1:9464/metrics | grep -E '^agenticverdict_queue_depth'
```

Representative metric names (see `@agenticverdict/observability` and worker queue wiring):

```prometheus
# Workflow trigger accepted by API (labels: workflow_id, tenant_id)
test_workflow_trigger_enqueued_total

# Workflow trigger job finished on worker (labels: workflow_id, tenant_id, status)
test_workflow_trigger_completed_total

# BullMQ handler duration / wait time (labels: queue, …)
test_workflow_trigger_job_duration_seconds_bucket
agenticverdict_queue_job_duration_seconds_bucket
agenticverdict_queue_job_age_seconds_bucket

# Queue depth by BullMQ queue name (worker scrape refreshes gauges)
agenticverdict_queue_depth{queue="workflow-trigger"}
agenticverdict_queue_depth{queue="report-generation"}

# Report generation duration during test workflows (histogram)
test_report_generation_duration_seconds_bucket

# Platform fetch / LLM counters when wired in the pipeline (labels vary)
test_workflow_platform_fetches_total
test_workflow_llm_calls_total

# Runtime config + resilience (when exercised)
agenticverdict_config_access_total
agenticverdict_circuit_breaker_state
agenticverdict_circuit_breaker_transitions_total
```

#### Grafana Dashboards

When [`docker-compose.observability.yml`](../../docker-compose.observability.yml) is up, Grafana is on **host port 3001** (see [§2.3](#23-optional-observability-stack)). Pre-configured dashboards (paths are unchanged; only the origin port differs from the web app):

- **Workflow Overview**: `http://localhost:3001/d/workflow-overview`
- **Data connectors** (Grafana dashboard UID may still be `platform-adapters`): `http://localhost:3001/d/platform-adapters`
- **Report Generation**: `http://localhost:3001/d/report-generation`

---

### 5.3 Health Checks

#### Comprehensive Health Verification

```bash
#!/bin/bash
# health-verify.sh

echo "=== Service Health ==="

# API Health
echo -n "API: "
curl -s http://localhost:4000/health | jq -r 'if .ok then "ok" else "fail" end'

# Adapter Health (Next.js web)
echo -n "Adapters: "
curl -s http://localhost:3000/api/health/adapters | jq -r '.status'

# Database Connection (Compose service name: postgres → container agenticverdict-postgres-1)
echo -n "Database: "
docker exec agenticverdict-postgres-1 pg_isready -U postgres | grep -q "accepting" && echo "OK" || echo "FAIL"

# Redis Connection
echo -n "Redis: "
docker exec agenticverdict-redis-1 redis-cli ping | grep -q "PONG" && echo "OK" || echo "FAIL"

# Worker metrics (BullMQ queue depth gauges; replace compose -f flags with your stack)
echo -n "Worker metrics / queue depth: "
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml exec -T worker \
  wget -qO- http://127.0.0.1:9464/metrics 2>/dev/null | grep -q 'agenticverdict_queue_depth' && echo "ok (gauges present)" || echo "skip or FAIL (worker metrics off or unreachable)"
```

---

### 5.4 Data Verification

#### Database Queries

```bash
# Connect to PostgreSQL (container name follows project + service "postgres")
docker exec -it agenticverdict-postgres-1 psql -U postgres -d agenticverdict
```

Example SQL (column names match Drizzle schema in `@agenticverdict/database`):

```sql
-- Reports table (company_id references companies.id — same UUID as API tenantId for seeded companies)
SELECT company_id, COUNT(*) FROM reports GROUP BY company_id;

-- Provenance bundles (tenant_id is the company/tenant UUID)
SELECT * FROM provenance_records ORDER BY captured_at DESC LIMIT 10;

-- Platform credentials
SELECT platform, COUNT(*) FROM platform_credentials GROUP BY platform;

-- Recent audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```

**Note:** In the current API implementation, **`GET /api/v1/reports`** is served from an **in-memory** report store, so the **`reports`** Postgres table may be **empty** after workflow-only testing until other code paths persist rows there. Prefer the reports API (or workflow status) for report metadata during manual runs.

#### Report File Verification

```bash
# If reports are stored locally
ls -lh /path/to/reports/

# Verify PDF validity
file report_abc123.pdf

# Check PDF content
pdftotext report_abc123.pdf - | head -20
```

---

### 5.5 Verification Checklist

After each test scenario, verify:

- [ ] Job completed without errors
- [ ] Expected logs present
- [ ] Metrics recorded correctly
- [ ] Database entries created
- [ ] Report files generated (if applicable)
- [ ] Email delivered (if configured)
- [ ] No dead letter queue entries
- [ ] Circuit breakers closed
- [ ] Tenant context preserved
- [ ] Performance within thresholds

---

### 5.6 Report Archiving Verification

#### Initialize Test Archive

```bash
# Create test run directory structure
TEST_RUN_DIR="test-output/archive/$(date +%Y-%m-%d)_manual-test"
mkdir -p "$TEST_RUN_DIR"/{scenarios,metadata,templates,localization}

# Create scenario subdirectories
for scenario in S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 S11 S12; do
  mkdir -p "$TEST_RUN_DIR/scenarios/${scenario}"/{pdf,docx,xlsx,html,json}
done

# Create localization directories
mkdir -p "$TEST_RUN_DIR/localization"/{en_ltr,ar_rtl,fr_ltr}/{pdf,docx,xlsx,html,json}

# Create template directories
for template in executive-summary detailed-analysis technical-appendix; do
  mkdir -p "$TEST_RUN_DIR/templates/${template}"/{pdf,docx,xlsx,html,json}
done

# Initialize manifest
cat > "$TEST_RUN_DIR/metadata/test-manifest.json" << EOF
{
  "testRunId": "$(basename $TEST_RUN_DIR)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "environment": {
    "NODE_ENV": "$NODE_ENV",
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)"
  },
  "scenarios": []
}
EOF

echo "Archive structure created: $TEST_RUN_DIR"
```

#### Verify Archive Structure

```bash
# Check directory structure
tree test-output/archive/$(date +%Y-%m-%d)_*/

# Or with find
find test-output/archive/$(date +%Y-%m-%d)_* -type d | sort
```

Expected structure:

```
test-output/archive/YYYY-MM-DD_*/
├── scenarios/
│   ├── S1_basic-report-generation/
│   │   ├── pdf/
│   │   ├── docx/
│   │   ├── xlsx/
│   │   ├── html/
│   │   └── json/
│   ├── S2_arabic-rtl-report/
│   └── ...
├── templates/
├── localization/
│   ├── en_ltr/
│   ├── ar_rtl/
│   └── fr_ltr/
└── metadata/
    ├── test-manifest.json
    ├── test-summary.md
    └── validation-results.json
```

#### Validate Format Integrity

**PDF Validation:**

```bash
# Check all PDF files
find test-output/archive/$(date +%Y-%m-%d)_* -name "*.pdf" -type f | while read -r pdf; do
  echo "Validating: $pdf"
  file "$pdf"
  pdftotext "$pdf" - | head -5
  # Verify minimum size
  SIZE=$(stat -f%z "$pdf" 2>/dev/null || stat -c%s "$pdf" 2>/dev/null)
  if [ $SIZE -lt 500 ]; then
    echo "WARNING: PDF too small ($SIZE bytes)"
  fi
done
```

**DOCX Validation:**

```bash
# Validate DOCX files
find test-output/archive/$(date +%Y-%m-%d)_* -name "*.docx" -type f | while read -r docx; do
  echo "Validating: $docx"
  unzip -t "$docx" | head -5
  # Check for required components
  unzip -l "$docx" | grep -E "document.xml|workbook.xml"
done
```

**XLSX Validation:**

```bash
# Validate XLSX files
find test-output/archive/$(date +%Y-%m-%d)_* -name "*.xlsx" -type f | while read -r xlsx; do
  echo "Validating: $xlsx"
  unzip -t "$xlsx" | head -5
  # Check for required components
  unzip -l "$xlsx" | grep -E "workbook.xml|sheet"
done
```

**HTML Validation:**

```bash
# Validate HTML files
find test-output/archive/$(date +%Y-%m-%d)_* -name "*.html" -type f | while read -r html; do
  echo "Validating: $html"
  # Check for required HTML elements
  grep -qi "<!DOCTYPE html" "$html" && echo "✓ DOCTYPE present"
  grep -qi "<html" "$html" && echo "✓ HTML tag present"
  grep -qi "charset" "$html" && echo "✓ Charset declared"
done
```

**JSON Validation:**

```bash
# Validate JSON files
find test-output/archive/$(date +%Y-%m-%d)_* -name "*.json" -type f | while read -r json; do
  echo "Validating: $json"
  jq empty "$json" 2>&1
  if [ $? -eq 0 ]; then
    echo "✓ Valid JSON"
  else
    echo "✗ Invalid JSON"
  fi
done
```

#### Validate Multi-Language Reports

**English (LTR) Validation:**

```bash
# Find English reports
ls test-output/archive/$(date +%Y-%m-%d)_*/localization/en_ltr/

# Extract and verify English content
pdftotext test-output/archive/$(date +%Y-%m-%d)_*/localization/en_ltr/pdf/*.pdf - | grep -i "agenticverdict"
```

**Arabic (RTL) Validation:**

```bash
# Find Arabic reports
ls test-output/archive/$(date +%Y-%m-%d)_*/localization/ar_rtl/

# Extract and verify Arabic content
pdftotext test-output/archive/$(date +%Y-%m-%d)_*/localization/ar_rtl/pdf/*.pdf - | grep -P "\p{Arabic}"

# Check for RTL direction in HTML
grep -r 'dir="rtl"' test-output/archive/$(date +%Y-%m-%d)_*/localization/ar_rtl/html/
```

**French (LTR) Validation:**

```bash
# Find French reports
ls test-output/archive/$(date +%Y-%m-%d)_*/localization/fr_ltr/

# Extract and verify French content
pdftotext test-output/archive/$(date +%Y-%m-%d)_*/localization/fr_ltr/pdf/*.pdf - | grep -E "[éèêëàâäùûüôöîïçœ]"
```

#### Generate Archive Summary

```bash
# Count files by format
TEST_RUN_DIR="test-output/archive/$(date +%Y-%m-%d)_manual-test"

echo "Archive Summary for $(basename $TEST_RUN_DIR)"
echo "=========================================="
echo ""
echo "PDF files: $(find "$TEST_RUN_DIR" -name "*.pdf" | wc -l)"
echo "DOCX files: $(find "$TEST_RUN_DIR" -name "*.docx" | wc -l)"
echo "XLSX files: $(find "$TEST_RUN_DIR" -name "*.xlsx" | wc -l)"
echo "HTML files: $(find "$TEST_RUN_DIR" -name "*.html" | wc -l)"
echo "JSON files: $(find "$TEST_RUN_DIR" -name "*.json" | wc -l)"
echo ""
echo "Total files: $(find "$TEST_RUN_DIR" -type f | wc -l)"
```

#### Update Latest Symlink

```bash
# Update latest symlink to most recent test run
ln -sfn test-output/archive/$(date +%Y-%m-%d)_manual-test test-output/latest

# Verify symlink
ls -la test-output/latest
```

For comprehensive archiving procedures, validation scripts, and automation, see [`report-archiving-procedures.md`](./report-archiving-procedures.md).

---

## 6. Troubleshooting

### 6.1 Common Issues

#### Issue: Mock Adapter Not Activating

**Symptoms**: Real adapters being used despite mock configuration

**Diagnosis**:

```bash
echo $NODE_ENV  # Should be "development" or "test"
echo $AGENTICVERDICT_USE_MOCK_ADAPTERS  # Should be "1"

curl http://localhost:3000/api/health/adapters | jq '.mockMode'
```

**Note:** `mockMode` on **`/api/health/adapters`** reflects the **web** process. In Docker, **web** is usually **`NODE_ENV=production`**, so **`mockMode` may be `false`** even when **api** and **worker** use mocks. Confirm **api** / **worker** with `docker exec … printenv NODE_ENV` or pipeline behavior.

**Solutions**:

1. If **api** or **worker** containers use **`NODE_ENV=production`** (production-style Compose without the dev override), those processes **will not use mocks** regardless of `AGENTICVERDICT_USE_MOCK_ADAPTERS`. Use the stack that includes [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) or [`docker-compose.dev.yml`](../../docker-compose.dev.yml), or set **`NODE_ENV=development`** (and matching **`TARGET_STAGE`**) on **api** and **worker**.
2. With **`NODE_ENV=development`** on **api** / **worker**, set `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` (and per-platform overrides if needed).
3. For **web**-side mock labeling or UI paths that need mocks, run **`pnpm dev`** on the host (Docker **web** does not load mock adapters).
4. Restart affected services after changing environment.
5. Check logs for security guard errors if mock flags are set under `production`/`staging` `NODE_ENV`.

---

#### Issue: `jq` parse error with control characters

**Symptoms**: `jq` reports "Invalid string: control characters from U+0000 through U+001F must be escaped" when polling workflow status for `marketing-analysis` or `verdict-generation`.

**Diagnosis**: LLM-generated insights in the response contain newlines, tabs, or other control characters that `jq` cannot parse in its default mode.

**Solutions**:

1. Use `jq -r '.field'` (raw output mode) when extracting individual fields like `status` or `message`.
2. For full JSON display, pipe to `jq '.'` only after confirming the job is complete, or use `cat` without jq.
3. Example polling pattern that avoids the issue:
   ```bash
   STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
     -H "Authorization: Bearer $TOKEN" | jq -r '.status')
   ```

---

#### Issue: Workflow trigger returns HTTP 400 (production build gate)

**Symptoms**: `POST /api/v1/workflows/trigger` responds with **`validation_error`** and a message like **Workflow test triggers are not available in production builds** (HTTP **400**), even though the JSON body looks valid.

**Diagnosis**: The API process has **`NODE_ENV=production`**. The test trigger route is intentionally disabled in that mode (see [Section 2.7](#27-compiler-driven-and-layered-runtime-configuration)).

**Solutions**:

1. For manual testing in this guide, run the API with **`NODE_ENV=development`** — use the Compose stack that includes [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml).
2. For production-like stacks, use other operational entry points (not the `testMode: true` workflow trigger documented here).

---

#### Issue: Workflow Not Processing

**Symptoms**: Job queued but never completes

**Diagnosis**:

```bash
# BullMQ depth + workflow counters (no /api/v1/queues/stats)
curl -s http://localhost:4000/metrics | grep -E 'test_workflow_trigger_|agenticverdict_queue_'

docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml exec -T worker \
  wget -qO- http://127.0.0.1:9464/metrics 2>/dev/null | grep -E 'agenticverdict_queue_depth' || true

# Check worker logs
docker logs agenticverdict-worker-1 --tail=100

# Verify Redis connection
docker exec agenticverdict-redis-1 redis-cli CLIENT LIST
```

**Solutions**:

1. Verify worker service is running
2. Check Redis connectivity
3. Ensure job type is registered
4. Look for uncaught exceptions

---

<a id="issue-pipeline-workflows-finish-instantly-with-foundation--workflow_trigger_acknowledged"></a>

#### Issue: Pipeline workflows finish instantly with `phase: "foundation"` / `workflow_trigger_acknowledged`

**Symptoms**: For **`marketing-analysis`** or **`verdict-generation`**, `GET /api/v1/workflows/status/:executionId` shows **`completed`** very quickly, **`result.phase`** is **`foundation`**, **`result.message`** is **`workflow_trigger_acknowledged`**, and there is **no `analysisId`** (and no real insights metadata). **`report-generation`** with **`productionFlowScenarioId`** can still look healthy because a different code path handles it.

**Diagnosis**: More than one process is consuming the **`workflow-trigger`** BullMQ queue (for example a **host** `pnpm --filter @agenticverdict/worker start` / **`pnpm dev`** worker **and** the **Docker** worker on the **same `REDIS_URL`**). An **older** or mismatched consumer without the **`marketing-analysis` / `verdict-generation` → `runPipelineWorkflow`** routing can “win” the job and return the legacy foundation stub.

```bash
# Expect at most one BullMQ worker blocking on this queue; duplicate matching lines ⇒ competing consumers
# Queue name in Redis client `name` is base64 (`workflow-trigger` → d29ya2Zsb3ctdHJpZ2dlcg==)
docker exec agenticverdict-redis-1 redis-cli CLIENT LIST | grep 'bull:d29ya2Zsb3ctdHJpZ2dlcg=='
```

**Solutions**:

1. Stop extra worker processes on the host (or point them at a different **`REDIS_URL`** / isolated stack). Verify **`docker exec agenticverdict-redis-1 redis-cli CLIENT LIST | grep 'bull:d29ya2Zsb3ctdHJpZ2dlcg=='`** shows **at most one** blocking consumer while you expect only Docker to run workers.
2. Recreate the **Docker** worker after code changes, then re-trigger **`marketing-analysis`** or **`verdict-generation`** (see S12 notes on rebuilding **`worker`**).
3. Confirm **`docker logs agenticverdict-worker-1`** shows **`job_start`** with **`workflowId":"marketing-analysis"`** or **`workflowId":"verdict-generation"`** for the **`executionId`** you care about. If Docker never logs that line, another consumer processed the job.

---

#### Issue: HTTP 403 `tenant_config_not_found` on workflow trigger

**Symptoms**: `POST /api/v1/workflows/trigger` responds with HTTP **403** and **`tenant_config_not_found`** even when the JSON body contains a valid UUID.

**Diagnosis**: The JWT's `tenant_id` claim must match the `tenantId` in the JSON body, AND that tenant must have a valid company configuration file (e.g., `configs/companies/22222222-2222-4222-8222-222222222222.json` for the demo EN tenant).

```bash
# Verify JWT includes correct tenant_id claim
# The --tenant argument to generate-dev-jwt.mjs sets both sub and tenant_id
node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222

# Check if company config exists for the tenant
ls configs/companies/*.json
```

**Solutions**:

1. Ensure the JWT `tenant_id` claim matches the `tenantId` in the workflow trigger JSON body.
2. Verify the tenant has a company configuration file in `configs/companies/`.
3. Use the demo tenants included in the repo (e.g., `22222222-2222-4222-8222-222222222222` for EN, `11111111-1111-4111-8111-111111111111` for AR).

---

#### Issue: Tenant Context Not Propagating

**Symptoms**: Operations fail with "tenant not found"

**Diagnosis**:

```bash
# Check tenant context in logs
docker logs agenticverdict-worker-1 --tail=100 | grep "tenantId"

# Verify company config exists
ls configs/companies/
```

**Solutions**:

1. Ensure `tenantId` matches company config filename
2. Check JWT token contains valid `tenant_id` claim (must match request `tenantId`)
3. Verify `COMPANY_CONFIG_DIR` is set correctly
4. Restart service after adding new config

---

#### Issue: Report Generation Fails

**Symptoms**: PDF/DOCX generation errors

**Diagnosis**:

```bash
# Check for format generator issues
docker logs agenticverdict-worker-1 --tail=100 | grep -i "report\|pdf\|docx"

# Verify stub mode not enabled
echo $AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS
```

**Solutions**:

1. Disable stub mode: `unset AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS`
2. Ensure Chromium is installed for PDF generation
3. Check template syntax in database
4. Verify i18n strings exist for language

---

#### Issue: LLM/Agent Not Responding

**Symptoms**: AI agent workflows fail or timeout

**Diagnosis**:

```bash
# Check LLM configuration
docker exec agenticverdict-worker-1 printenv | grep -E "GLM_API|ANTHROPIC_API|OPENAI_API"

# Check worker logs for LLM errors
docker logs agenticverdict-worker-1 --tail=100 | grep -i "llm\|anthropic\|glm\|openai"

# Verify API key is set (should not be empty)
docker exec agenticverdict-worker-1 printenv GLM_API_KEY
```

**Solutions**:

1. Set `GLM_API_KEY` (and optional `GLM_API_BASE_URL`, `GLM_MODEL`) in a **gitignored** repo-root `.env` or export them before `docker compose up` — the dev override maps these into **api** and **worker** containers.
2. Recreate **api** and **worker** after changing credentials (`docker compose … up -d --build api worker`).
3. For custom GLM endpoints, verify `GLM_API_BASE_URL` is accessible
4. Check API key validity and rate limits
5. Fallback to Anthropic or OpenAI if GLM is unavailable

**Note**: Production-flow scenarios (R01/R02) do not require LLM configuration.

---

#### Issue: Mock Adapter Security Guard

**Symptoms**: Error text containing **`Mock adapters cannot be enabled`** (for example from `isMockEnabledForConnector` when `NODE_ENV` is `production` or `staging` and a mock flag is set to **on**), **or** worker exits on startup with **`Mock adapters cannot be enabled in production builds`**

**Diagnosis**:

```bash
# Check container environment
docker exec agenticverdict-web-1 printenv NODE_ENV
docker exec agenticverdict-worker-1 printenv NODE_ENV
docker exec agenticverdict-worker-1 printenv AGENTICVERDICT_USE_MOCK_ADAPTERS

# Check adapter health endpoint / web logs
curl -s http://localhost:3000/api/health/adapters | jq '.mockMode, .mockConnectors'
docker logs agenticverdict-web-1 --tail=50 | grep -i "security\|mock"
```

**Solutions**:

1. **For production-flow scenarios (R01/R02):** Mock adapters are not required; production adapters are fine. Remove mock enable flags if they are set under `production`/`staging` `NODE_ENV`.

2. **For testing with mock adapters on api/worker:** Ensure **`NODE_ENV=development`** (or `test`) on **api** and **worker** — e.g. use [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) or [`docker-compose.dev.yml`](../../docker-compose.dev.yml). Then set `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` as in [Step 5: Configure Mock Mode](#step-5-configure-mock-mode) under [Section 2.2](#22-initial-setup). For **web** mocks, use **`pnpm dev`**, not Docker web.

3. **Worker exits immediately in production:** Unset `AGENTICVERDICT_USE_MOCK_ADAPTERS` or set it to `0`, **or** run the worker with **`NODE_ENV=development`** if you intentionally need mock mode in a non-production test stack (not for real production deployments).

---

#### Issue: Circuit Breaker Not Resetting

**Symptoms**: Adapters remain in open state

**Diagnosis**:

```bash
# Check circuit breaker state
curl http://localhost:3000/api/health/adapters | jq '.platforms'
```

**Solutions**:

1. Wait for reset timeout (default 60s)
2. Manually reset by restarting worker
3. Verify underlying issue is resolved
4. Check `circuitBreakerOptions` configuration

---

### 6.2 Debug Mode

Enable verbose logging:

```bash
# .env.local
LOG_LEVEL=debug
DEBUG=@agenticverdict:*

# Restart services
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml restart api worker web
```

---

### 6.3 Reset Procedures

#### Reset All State

```bash
# Stop all services
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml down

# Remove volumes (WARNING: deletes all data)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml down -v

# Restart
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up -d --build
pnpm --filter @agenticverdict/database db:push
```

#### Clear Queues Only

```bash
# Flush Redis queues
docker exec agenticverdict-redis-1 redis-cli FLUSHDB

# Restart worker
docker restart agenticverdict-worker-1
```

---

## 7. Success Criteria

### 7.1 Functional Requirements

Each test scenario must meet:

- **Workflow Completion**: Job reaches `completed` status
- **Data Integrity**: All data transformations preserve accuracy
- **Tenant Isolation**: No cross-tenant data leakage
- **Error Handling**: Graceful degradation on failures
- **Report Quality**: Generated reports match specifications
- **Archive Completeness**: All reports saved in all formats to `test-output/`

### 7.2 Performance Thresholds

| Metric                      | Target | Maximum |
| --------------------------- | ------ | ------- |
| Report generation (simple)  | <10s   | 30s     |
| Report generation (complex) | <30s   | 60s     |
| Marketing analysis          | <45s   | 90s     |
| Platform adapter fetch      | <2s    | 5s      |
| LLM call                    | <10s   | 30s     |
| Queue processing            | <1s    | 5s      |
| Full pipeline (S12)         | <90s   | 180s    |

### 7.3 Full Pipeline Validation Checkpoints

#### Stage 1: Data Collection

- [ ] All platform adapters return data
- [ ] No circuit breaker activation
- [ ] Caching strategy works (second fetch faster)
- [ ] Rate limiting respects platform quotas
- [ ] Authentication succeeds for all platforms
- [ ] Error handling works for platform failures

#### Stage 2: Data Normalization

- [ ] Platform-specific data converted to unified schema
- [ ] Date ranges properly applied
- [ ] Tenant context correctly injected
- [ ] Metric values within expected ranges
- [ ] No data loss during transformation
- [ ] Provenance records created in database

#### Stage 3: AI Agent Pipeline

- [ ] Cross-Platform Analysis Agent completes
- [ ] Marketing Insights Generation Agent completes
- [ ] Media Verdict Agent completes
- [ ] All agents use tenant-specific prompts
- [ ] Insights are data-driven with evidence
- [ ] Verdict score within 0-100 range
- [ ] Confidence score calculated (0-1)
- [ ] LLM calls complete within thresholds

#### Stage 4: Report Generation

- [ ] Reports generated in all 5 formats (PDF, DOCX, XLSX, HTML, JSON)
- [ ] Template variables properly substituted
- [ ] Multi-language rendering works (EN/AR/FR)
- [ ] RTL layout correct for Arabic
- [ ] Branding elements preserved
- [ ] Charts and graphics render correctly
- [ ] No template syntax errors
- [ ] File sizes within expected ranges

#### Stage 5: Delivery

- [ ] Email delivery queued successfully
- [ ] Webhook notifications sent (if configured)
- [ ] Report metadata stored in database
- [ ] Download links generated (if applicable)
- [ ] Delivery status tracked
- [ ] Retry mechanism functional

### 7.4 Report Archiving Requirements

#### Archive Structure

- [ ] Directory structure follows `test-output/` specification
- [ ] Each scenario has subdirectories for all formats
- [ ] Production flow scenarios (R01-R12) organized separately
- [ ] Template-specific reports organized
- [ ] Localization directories created (en_ltr, ar_rtl, fr_ltr)
- [ ] Metadata directory present with required files

#### Format-Specific Validation

**PDF Files:**

- [ ] File size > 500 bytes
- [ ] Valid PDF format (magic number check)
- [ ] Contains expected content
- [ ] Text extraction works
- [ ] No corruption errors
- [ ] Metadata preserved

**DOCX Files:**

- [ ] Valid ZIP/DOCX format
- [ ] Contains required OOXML components
- [ ] Valid document.xml structure
- [ ] Styles preserved
- [ ] No corruption errors

**XLSX Files:**

- [ ] Valid ZIP/XLSX format
- [ ] Contains required spreadsheet components
- [ ] Valid workbook structure
- [ ] Worksheets present
- [ ] Data integrity preserved

**HTML Files:**

- [ ] Valid HTML structure
- [ ] Required tags present (html, head, body)
- [ ] Charset declaration present
- [ ] CSS styles preserved
- [ ] Responsive layout maintained

**JSON Files:**

- [ ] Valid JSON syntax
- [ ] Required keys present
- [ ] Data types correct
- [ ] No null values in required fields
- [ ] Timestamps in ISO 8601 format

#### Multi-Language & RTL Validation

**English (LTR):**

- [ ] Text flows left to right
- [ ] Numbers formatted: 1,234.56
- [ ] Dates in expected format
- [ ] No character encoding issues
- [ ] Font rendering is proper

**Arabic (RTL):**

- [ ] Text flows right to left
- [ ] Arabic characters render correctly
- [ ] No character clipping or overflow
- [ ] Proper ligature formation
- [ ] Diacritical marks display correctly
- [ ] Layout mirrored correctly
- [ ] `dir="rtl"` attribute present (HTML)
- [ ] Arabic font specified

**French (LTR):**

- [ ] Accented characters render correctly
- [ ] Numbers use French formatting: 1 234,56
- [ ] Dates in DD/MM/YYYY format
- [ ] No encoding issues with special characters

#### Metadata Files

- [ ] `test-manifest.json` created and valid
- [ ] `test-summary.md` created with run information
- [ ] `performance-metrics.json` includes generation times
- [ ] `validation-results.json` includes all format checks

### 7.5 Quality Gates

Before marking a scenario as passed:

- [ ] All assertions validated
- [ ] No errors in logs
- [ ] Metrics within thresholds
- [ ] Database consistent
- [ ] No memory leaks
- [ ] No DLQ entries
- [ ] Circuit breakers closed
- [ ] Reports archived in all formats
- [ ] Format validation passed
- [ ] Language/RTL validation passed
- [ ] Metadata files generated

### 7.6 Sign-Off Checklist

**Functional Testing:**

- [ ] All P0 scenarios passed
- [ ] All P1 scenarios passed
- [ ] All P2 scenarios passed (if applicable)

**Archive Validation:**

- [ ] All reports archived in all formats
- [ ] All formats validated
- [ ] Multi-language testing complete
- [ ] RTL testing complete
- [ ] Metadata files generated

**Documentation:**

- [ ] Test manifest complete
- [ ] Test summary updated
- [ ] Performance baselines recorded
- [ ] Known issues documented
- [ ] Validation results saved

**Quality Assurance:**

- [ ] No critical bugs
- [ ] No data corruption
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Tenant isolation verified

**Release Readiness:**

- [ ] All quality gates passed
- [ ] Stakeholder sign-off obtained
- [ ] Rollback plan documented
- [ ] Monitoring configured

### 7.7 Test Completion Criteria

A test run is considered complete when:

1. **All Scenarios Executed**: All planned scenarios (S1-S12) have been executed
2. **All Reports Archived**: Every scenario has reports in all 5 formats archived
3. **All Validations Passed**: Format, language, and RTL validations complete
4. **Documentation Complete**: Manifest, summary, and validation files generated
5. **Issues Documented**: All failures and anomalies documented
6. **Metrics Recorded**: Performance metrics and baselines captured

---

## Appendix A: Quick Reference Commands

```bash
# Service Management (includes deploy/docker-compose.dev.override.yml by default in this guide)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml down
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml ps

# Health Checks
curl http://localhost:4000/health
curl http://localhost:3000/api/health/adapters
./scripts/health-check.sh

# Testing
pnpm run test                    # All tests
pnpm run test:production-flow    # Production scenarios
pnpm run test:phase01-integration # Integration tests

# Logs
docker logs agenticverdict-worker-1 -f --tail=100
docker logs agenticverdict-api-1 -f --tail=100

# Database
pnpm --filter @agenticverdict/database db:push
pnpm --filter @agenticverdict/database db:studio

# Tokens (claims: sub, tenant_id, roles)
export TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)
```

---

## Appendix B: Test Data Reference

### Mock Scenarios

| Scenario           | Description              | Use Case            |
| ------------------ | ------------------------ | ------------------- |
| `normal`           | Standard data generation | Happy path testing  |
| `error`            | Simulated failures       | Error handling      |
| `high-volume`      | Large dataset            | Performance testing |
| `zero-conversions` | Edge case data           | Boundary testing    |

### Platform Data Patterns

Mock data includes:

- Impressions, clicks, conversions
- Cost metrics (CPC, CPM, CAC)
- Engagement metrics (CTR, CVR, ROAS)
- Temporal data (daily, weekly aggregates)
- Platform-specific dimensions

---

## Appendix C: Contact & Support

| Issue Type     | Contact          |
| -------------- | ---------------- |
| Bug reports    | GitHub Issues    |
| Test failures  | `#testing` Slack |
| Infrastructure | `#devops` Slack  |
| Documentation  | `#docs` Slack    |

---

## Appendix D: Additional Testing Documentation

This guide is supplemented by comprehensive testing documentation that provides detailed procedures for full pipeline testing, report archiving, and multi-language validation.

### Comprehensive Testing Documents

| Document                                       | Purpose                           | Key Content                                                                                    |
| ---------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| **`test-output-directory-structure.md`**       | Directory structure & conventions | Archive layout, naming conventions, manifest schema, retention policy                          |
| **`full-pipeline-testing-procedures.md`**      | Stage-by-stage pipeline testing   | Complete procedures for all 5 pipeline stages with validation                                  |
| **`report-archiving-procedures.md`**           | Format-specific archiving         | PDF/DOCX/XLSX/HTML/JSON archiving with validation scripts and automation                       |
| **`multi-language-rtl-testing-procedures.md`** | Localization & RTL testing        | English (LTR), Arabic (RTL), French (LTR) with comprehensive validation                        |
| **`updated-success-criteria.md`**              | Comprehensive success criteria    | Full pipeline checkpoints, archiving requirements, quality gates                               |
| **`manual-testing-guide-integration.md`**      | Integration guide                 | How to integrate new docs with existing manual testing guide                                   |
| **`test-report-generation-guide.md`**          | Test report generation            | Comprehensive guide for generating test execution reports with all commands, logs, and results |

### Quick Reference Links

**Full Pipeline Testing:**

- See [`full-pipeline-testing-procedures.md`](./full-pipeline-testing-procedures.md) for stage-by-stage testing procedures
- Section 4.6 in this guide provides quick start for full pipeline testing

**Report Archiving:**

- See [`test-output-directory-structure.md`](./test-output-directory-structure.md) for directory structure specifications
- See [`report-archiving-procedures.md`](./report-archiving-procedures.md) for format-specific archiving procedures
- Section 5.6 in this guide provides archiving verification commands

**Multi-Language & RTL Testing:**

- See [`multi-language-rtl-testing-procedures.md`](./multi-language-rtl-testing-procedures.md) for comprehensive localization testing
- Includes validation scripts for Arabic RTL, English LTR, and French LTR

**Success Criteria:**

- Section 7 in this guide contains updated success criteria with full pipeline validation
- See [`updated-success-criteria.md`](./updated-success-criteria.md) for detailed breakdown

**Test Report Generation:**

- See [`test-report-generation-guide.md`](./test-report-generation-guide.md) for comprehensive test report generation instructions
- Includes step-by-step procedures, automated scripts, and CI/CD integration examples
- Reports are generated in `test-output/` directory with all commands, logs, and results

### Test Scripts Repository

The following scripts should be created in `scripts/test-archive/` for automated archiving and validation:

| Script                            | Purpose                                 |
| --------------------------------- | --------------------------------------- |
| `archive_complete_test_run.sh`    | Initialize test run directory structure |
| `archive_scenario_all_formats.sh` | Archive all formats for a scenario      |
| `validate_archive.sh`             | Validate entire archive                 |
| `validate_pdf.sh`                 | Validate PDF format                     |
| `validate_rtl.sh`                 | Validate RTL rendering                  |
| `generate_manifest.sh`            | Generate test manifest                  |

### Documentation Cross-Reference

| Question                                    | Reference Document                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| How to structure test reports directory?    | [`test-output-directory-structure.md`](./test-output-directory-structure.md)             |
| How to test full pipeline stage by stage?   | [`full-pipeline-testing-procedures.md`](./full-pipeline-testing-procedures.md)           |
| How to archive reports in all formats?      | [`report-archiving-procedures.md`](./report-archiving-procedures.md)                     |
| How to test multi-language and RTL?         | [`multi-language-rtl-testing-procedures.md`](./multi-language-rtl-testing-procedures.md) |
| What are the complete success criteria?     | [`updated-success-criteria.md`](./updated-success-criteria.md)                           |
| How to integrate with existing guide?       | [`manual-testing-guide-integration.md`](./manual-testing-guide-integration.md)           |
| How to generate comprehensive test reports? | [`test-report-generation-guide.md`](./test-report-generation-guide.md)                   |

### Best Practices

1. **Always Archive**: Every test run should archive all generated reports in all formats
2. **Validate Everything**: Use automated validation for all formats and languages
3. **Track Metadata**: Maintain comprehensive manifests and summaries
4. **Test All Languages**: Include Arabic RTL testing in every test run
5. **Monitor Performance**: Record generation times for all formats
6. **Version Control**: Commit validation results and manifests to git
7. **Baseline Comparison**: Compare outputs against previous runs for regression detection
8. **Clean Up**: Archive old test runs per retention policy (3-6 months)

### Support & Troubleshooting

For issues specific to:

- **Report archiving**: See [`report-archiving-procedures.md`](./report-archiving-procedures.md) troubleshooting section
- **RTL rendering**: See [`multi-language-rtl-testing-procedures.md`](./multi-language-rtl-testing-procedures.md) troubleshooting section
- **Full pipeline**: See [`full-pipeline-testing-procedures.md`](./full-pipeline-testing-procedures.md) troubleshooting section

---

**Document End**

For questions or improvements to this guide, please submit an issue or PR.
