# Manual Testing Guide: Marketing Analytics Pipeline

**Document Version:** 1.4
**Last Updated:** 2026-04-08
**Target Audience:** Developers, QA Engineers, DevOps Engineers
**Prerequisites:** Phase 1 (Platform Integration) completion

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

| Component         | Purpose                            | Location                      |
| ----------------- | ---------------------------------- | ----------------------------- |
| Platform Adapters | Fetch/normalize marketing data     | `packages/platform-adapters/` |
| Agent Runtime     | AI-powered analysis & insights     | `packages/agent-runtime/`     |
| Report Generator  | Multi-format report creation       | `packages/report-generator/`  |
| Worker Service    | Background job processing          | `apps/worker/`                |
| API Service       | HTTP endpoints & workflow triggers | `apps/api/`                   |

### 1.4 Testing Scope

- **Mock Adapter Mode**: All platforms (Meta, GA4, GSC, GBP, TikTok)
- **AI Agent Pipeline**: Analysis → Insights → Verdict
- **Report Formats**: PDF, DOCX, XLSX
- **Languages/RTL**: English (LTR), Arabic (RTL)
- **Multi-tenancy**: Tenant isolation and context propagation

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

- Base: `docker-compose.yml` + `docker-compose.apps.yml` + [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml)
- The dev override sets `NODE_ENV=development` and `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` on `api`, `worker`, and `web` (adapter aggregate health is served by the web app).
- Use for: manual procedures in this document, mock adapter flows, and production-flow harness scenarios (R01/R02) alongside a dev-like stack.
- Commands: `docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up` (and the same three `-f` flags for `ps`, `down`, `restart`, etc., unless noted otherwise).
- More detail: [`docs/docker/getting-started.md`](../docker/getting-started.md#environment-modes-and-manual-testing).

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

With the default three-file Compose stack, `deploy/docker-compose.dev.override.yml` already enables mock adapters on `api`, `worker`, and `web`. You typically **do not** need a host `.env.local` for that baseline.

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

Compose files in this repo do not load `.env.local` into containers by default. To change mock scenario or seed **inside Docker**, add the variables to the `environment` blocks in `deploy/docker-compose.dev.override.yml` (or another override you control), then recreate or restart the affected services with the same three `-f` flags.

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
- `platforms` — array of `{ "platform", "healthScore", "adapter", "status" }` entries
- When mock adapters are enabled via env, the route also returns `mockMode` and `mockPlatforms`, and each platform includes `adapterType` (`"mock"` or `"production"`)

Example (illustrative):

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
  "platforms": [
    {
      "platform": "meta",
      "healthScore": 100,
      "adapter": {},
      "status": "unknown",
      "adapterType": "mock"
    }
  ],
  "mockMode": true,
  "mockPlatforms": ["meta", "ga4", "gsc", "gbp", "tiktok"]
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
- **Grafana**: http://localhost:3000 (admin/admin)
- **Loki**: http://localhost:3100

### 2.4 Environment Variables Reference

| Variable                           | Required | Default                                | Description                  |
| ---------------------------------- | -------- | -------------------------------------- | ---------------------------- |
| `NODE_ENV`                         | Yes      | `development`                          | Runtime environment          |
| `DATABASE_URL`                     | Yes      | -                                      | PostgreSQL connection string |
| `REDIS_URL`                        | Yes      | -                                      | Redis connection string      |
| `JWT_SECRET`                       | Yes      | -                                      | JWT signing secret           |
| `AGENTICVERDICT_USE_MOCK_ADAPTERS` | No       | `0`                                    | Master mock toggle           |
| `AGENTICVERDICT_MOCK_SEED`         | No       | `42001`                                | Deterministic data seed      |
| `AGENTICVERDICT_MOCK_SCENARIO`     | No       | `normal`                               | Test scenario                |
| `GLM_API_KEY`                      | No\*     | -                                      | GLM/ZhipuAI API key          |
| `GLM_API_BASE_URL`                 | No       | `https://open.bigmodel.cn/api/paas/v4` | GLM API base URL             |
| `GLM_MODEL`                        | No       | `glm-4.5`                              | GLM model name               |
| `GLM_TIMEOUT`                      | No       | `30000`                                | GLM request timeout (ms)     |
| `ANTHROPIC_API_KEY`                | No       | -                                      | Anthropic Claude API key     |
| `OPENAI_API_KEY`                   | No       | -                                      | OpenAI API key               |

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

Add to `deploy/docker-compose.dev.override.yml` under the `worker` service:

```yaml
worker:
  environment:
    GLM_API_KEY: "your-glm-api-key-here"
    GLM_API_BASE_URL: "https://api.z.ai/api/anthropic"
    GLM_MODEL: "glm-4.5"
```

### 2.6 Mock Adapter Notes

**Important — process `NODE_ENV` (runtime):** `createPlatformAdapter` treats **`NODE_ENV === "production"`** as a **production process**. In that case it **never** instantiates mock adapters, even if `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` is set. Use **`NODE_ENV=development`** (or **`test`**) on the API, worker, and web processes when you need mock-backed flows. The three-file Compose stack with [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) does this for you.

**Separate concern — enabling mocks via env (non-production only):** When `NODE_ENV` is **`development`** or **`test`**, mock selection still follows the master and per-platform flags in [Section 2.4](#24-environment-variables-reference). If `NODE_ENV` is **`production`** or **`staging`**, `isMockEnabledForPlatform` **throws** if a flag tries to **turn mock mode on** (defense in depth). The web adapter health route uses that helper to label platforms; with production `NODE_ENV` and no mock flags, you should see production adapters and no security error.

**Docker images:** Images are often **built** with `NODE_ENV=production` in the Dockerfile. That affects dependency installs and frontend optimization; what matters for **mock vs production adapter instances** in this guide is the **`NODE_ENV` inside the running container**. The dev override sets **`NODE_ENV=development`** on app services so manual procedures that need mocks still work without rebuilding images for a different build arg.

**For production-flow scenarios (R01/R02):**

- Mock adapters are **not required** — these scenarios use fixed HTML
- The system works correctly with production adapters
- No platform adapter configuration needed

**For marketing analysis scenarios (S4, S12):**

- Mock adapters are useful for testing without live platform credentials
- Use local `pnpm dev` with `AGENTICVERDICT_USE_MOCK_ADAPTERS=1`, **or** Docker with the dev override (`NODE_ENV=development` on services)

### 2.7 Compiler-driven adapter configuration

The repo centralizes **`NODE_ENV`-derived flags** in `@agenticverdict/config` (`BUILD_CONFIG`, `IS_PRODUCTION`, and related exports). See [migration guide: compiler-driven config](./migration-guide-compiler-driven-config.md).

**What manual testers should know:**

- **Production-shaped processes (`NODE_ENV=production` when the Node process starts):**
  - **`createPlatformAdapter` always uses real (production) adapter implementations** for fetch paths; mock env flags do not switch it to mocks.
  - **`POST /api/v1/workflows/trigger`** with `testMode: true` returns **HTTP 400** (`Workflow test triggers are not available in production builds`) so test harness jobs are not enqueued.
  - **Worker:** On startup, if `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` is set, the process **logs an error and exits** (misconfiguration guard).
  - **Do not** set `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` on production app services; if you intentionally enable mock flags while `NODE_ENV` is `production` or `staging`, `isMockEnabledForPlatform` **throws** when evaluating enablement (for example from the web health route).

- **Development / test processes (`NODE_ENV` is `development` or `test`):** Mock adapters remain available per [Section 2.4](#24-environment-variables-reference) and [Section 2.6](#26-mock-adapter-notes). CI also runs **`pnpm run verify:production-bundle`** to ensure production-oriented esbuild outputs do not retain mock adapter symbol names in the **minified adapter-factory smoke** artifact (see root `package.json`).

**Quick check (Docker dev stack):** After `up`, inspect worker logs for a line like `worker_startup` with `environment`, `isProduction`, and `mockAdaptersEnabled` so you can confirm the process matches the stack you expect.

For day-to-day manual runs, keep using the dev Compose stack (`NODE_ENV=development` on services via [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml)) so mocks and workflow test triggers behave as in this guide.

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

| ID      | Name                     | Workflow             | Language | Format | Mock Scenario | Priority |
| ------- | ------------------------ | -------------------- | -------- | ------ | ------------- | -------- |
| **S1**  | Basic Report Generation  | `report-generation`  | EN       | PDF    | `normal`      | P0       |
| **S2**  | Arabic RTL Report        | `report-generation`  | AR       | PDF    | `normal`      | P0       |
| **S3**  | Multi-Format Export      | `report-generation`  | EN       | ALL    | `normal`      | P1       |
| **S4**  | Marketing Analysis       | `marketing-analysis` | EN       | -      | `normal`      | P0       |
| **S5**  | Multi-Tenant Isolation   | `report-generation`  | EN       | PDF    | `normal`      | P0       |
| **S6**  | Tenant Config Override   | `report-generation`  | AR       | PDF    | `normal`      | P1       |
| **S7**  | Platform Adapter Failure | `report-generation`  | EN       | PDF    | `error`       | P0       |
| **S8**  | Invalid Config Schema    | `report-generation`  | EN       | PDF    | `normal`      | P1       |
| **S9**  | Circuit Breaker Trigger  | `marketing-analysis` | EN       | -      | `error`       | P1       |
| **S10** | Concurrent Report Gen    | `report-generation`  | EN       | PDF    | `normal`      | P1       |
| **S11** | Large Dataset Handling   | `marketing-analysis` | EN       | -      | `normal`      | P2       |
| **S12** | End-to-End Pipeline      | `verdict-generation` | EN       | PDF    | `normal`      | P0       |

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

#### Step 1: Trigger Marketing Analysis

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

#### Step 3: Retrieve Analysis Results

```bash
# Get analysis results
curl http://localhost:4000/api/v1/analyses/$EXECUTION_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

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
# Check that reports are segregated
curl http://localhost:4000/api/v1/reports \
  -H "Authorization: Bearer $TOKEN_T1" | jq '.reports[] | .tenantId'

# Should only show 22222222-2222-4222-8222-222222222222 reports

curl http://localhost:4000/api/v1/reports \
  -H "Authorization: Bearer $TOKEN_T2" | jq '.reports[] | .tenantId'

# Should only show 11111111-1111-4111-8111-111111111111 reports
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

# Check dead letter queue
curl http://localhost:4000/api/v1/queues/dead-letter \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

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
      "fieldErrors": {},
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

# Check queue depth
curl http://localhost:4000/api/v1/queues/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'
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

Access metrics endpoint:

```bash
curl http://localhost:4000/metrics
```

Key metrics to monitor:

```prometheus
# Workflow completion rate
test_workflow_completion_total{status="success"}

# Platform adapter performance
platform_adapter_fetch_duration_seconds{platform="meta"}

# Report generation timing
test_report_generation_duration_seconds

# LLM usage
test_workflow_llm_calls_total{model="claude-3-5-sonnet"}

# Queue depth
bullmq_queue_jobs_total{state="active"}
```

#### Grafana Dashboards

Pre-configured dashboards:

- **Workflow Overview**: `http://localhost:3000/d/workflow-overview`
- **Platform Adapters**: `http://localhost:3000/d/platform-adapters`
- **Report Generation**: `http://localhost:3000/d/report-generation`

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

# Database Connection
echo -n "Database: "
docker exec agenticverdict-db-1 pg_isready -U postgres | grep -q "accepting" && echo "OK" || echo "FAIL"

# Redis Connection
echo -n "Redis: "
docker exec agenticverdict-redis-1 redis-cli ping | grep -q "PONG" && echo "OK" || echo "FAIL"

# Worker Queue
echo -n "Worker Queue: "
curl -s http://localhost:4000/api/v1/queues/stats \
  -H "Authorization: Bearer $TOKEN" | jq -r '.status'
```

---

### 5.4 Data Verification

#### Database Queries

```bash
# Connect to PostgreSQL
docker exec -it agenticverdict-db-1 psql -U postgres -d agenticverdict

-- Check tenant isolation
SELECT tenant_id, COUNT(*) FROM reports GROUP BY tenant_id;

-- Verify provenance records
SELECT * FROM provenance_records ORDER BY created_at DESC LIMIT 10;

-- Check platform credentials
SELECT platform, COUNT(*) FROM platform_credentials GROUP BY platform;

-- Recent audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```

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

**Solutions**:

1. If the API/worker/web containers use **`NODE_ENV=production`** (production-style Compose without the dev override), **`createPlatformAdapter` will not use mocks** regardless of `AGENTICVERDICT_USE_MOCK_ADAPTERS`. Use the three-file stack including [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) or set `NODE_ENV=development` on those services.
2. With **`NODE_ENV=development`**, set `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` (and per-platform overrides if needed).
3. Restart affected services after changing environment.
4. Check logs for security guard errors if mock flags are set under `production`/`staging` `NODE_ENV`.

---

#### Issue: Workflow trigger returns HTTP 400 (production build gate)

**Symptoms**: `POST /api/v1/workflows/trigger` responds with **`validation_error`** and a message like **Workflow test triggers are not available in production builds** (HTTP **400**), even though the JSON body looks valid.

**Diagnosis**: The API process has **`NODE_ENV=production`**. The test trigger route is intentionally disabled in that mode (see [Section 2.7](#27-compiler-driven-adapter-configuration)).

**Solutions**:

1. For manual testing in this guide, run the API with **`NODE_ENV=development`** — use the Compose stack that includes [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml).
2. For production-like stacks, use other operational entry points (not the `testMode: true` workflow trigger documented here).

---

#### Issue: Workflow Not Processing

**Symptoms**: Job queued but never completes

**Diagnosis**:

```bash
# Check queue status
curl http://localhost:4000/api/v1/queues/stats \
  -H "Authorization: Bearer $TOKEN"

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

1. Configure GLM API key in `deploy/docker-compose.dev.override.yml`:
   ```yaml
   worker:
     environment:
       GLM_API_KEY: "your-glm-api-key-here"
       GLM_API_BASE_URL: "https://api.z.ai/api/anthropic"
   ```
2. Restart worker service after adding credentials
3. For custom GLM endpoints, verify `GLM_API_BASE_URL` is accessible
4. Check API key validity and rate limits
5. Fallback to Anthropic or OpenAI if GLM is unavailable

**Note**: Production-flow scenarios (R01/R02) do not require LLM configuration.

---

#### Issue: Mock Adapter Security Guard

**Symptoms**: Error text containing **`Mock adapters cannot be enabled`** (for example from `isMockEnabledForPlatform` when `NODE_ENV` is `production` or `staging` and a mock flag is set to **on**), **or** worker exits on startup with **`Mock adapters cannot be enabled in production builds`**

**Diagnosis**:

```bash
# Check container environment
docker exec agenticverdict-web-1 printenv NODE_ENV
docker exec agenticverdict-worker-1 printenv NODE_ENV
docker exec agenticverdict-worker-1 printenv AGENTICVERDICT_USE_MOCK_ADAPTERS

# Check adapter health endpoint / web logs
curl -s http://localhost:3000/api/health/adapters | jq '.mockMode, .mockPlatforms'
docker logs agenticverdict-web-1 --tail=50 | grep -i "security\|mock"
```

**Solutions**:

1. **For production-flow scenarios (R01/R02):** Mock adapters are not required; production adapters are fine. Remove mock enable flags if they are set under `production`/`staging` `NODE_ENV`.

2. **For testing with mock adapters:** Ensure **`NODE_ENV=development`** (or `test`) on api, worker, and web — e.g. use [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml). Then set `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` as in [Step 5: Configure Mock Mode](#step-5-configure-mock-mode) under [Section 2.2](#22-initial-setup).

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

### 7.2 Performance Thresholds

| Metric                      | Target | Maximum |
| --------------------------- | ------ | ------- |
| Report generation (simple)  | <10s   | 30s     |
| Report generation (complex) | <30s   | 60s     |
| Marketing analysis          | <45s   | 90s     |
| Platform adapter fetch      | <2s    | 5s      |
| LLM call                    | <10s   | 30s     |
| Queue processing            | <1s    | 5s      |

### 7.3 Quality Gates

Before marking a scenario as passed:

- [ ] All assertions validated
- [ ] No errors in logs
- [ ] Metrics within thresholds
- [ ] Database consistent
- [ ] No memory leaks
- [ ] No DLQ entries
- [ ] Circuit breakers closed

### 7.4 Sign-Off Checklist

- [ ] All P0 scenarios passed
- [ ] All P1 scenarios passed
- [ ] Documentation updated
- [ ] Known issues documented
- [ ] Performance baselines recorded

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

**Document End**

For questions or improvements to this guide, please submit an issue or PR.
