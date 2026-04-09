# Manual Testing Guide Rerun + Workflow Status Endpoint Hardening - 2026-04-09

**Status:** Completed (manual guide rerun executed, regression fixed, validations rerun)

## Scope

Re-executed `docs/06-reference/manual-testing-guide.md` against the rebuilt Docker dev stack and validated core scenarios:

- S1 (`report-generation`, `R01`)
- S4 (`marketing-analysis`)
- S12 (`verdict-generation`)

During the rerun, a status polling regression was reproduced and fixed in the API workflow status route.

## Environment Snapshot

- **Compose stack:** `docker-compose.yml` + `docker-compose.apps.yml` + `deploy/docker-compose.dev.override.yml`
- **Service health:** API, worker, web, postgres, redis all healthy
- **Queue consumer check:** one active `workflow-trigger` BullMQ consumer observed for Docker worker path

## Rerun Results

### 1) S1 - Basic Report Generation

- **Result:** Passed
- **Observed status:** `completed`
- **Evidence:**
  - `pdfByteLength`: `27403`
  - `pdfValidation.minBytesOk`: `true`
  - `pdfValidation.mustContainPhrasesOk`: `true`

### 2) S4 - Marketing Analysis

- **Result:** Passed
- **Observed status:** `completed`
- **Evidence:**
  - `result.message`: `marketing-analysis_processed`
  - `analysisId` returned and retrievable via `GET /api/v1/analysis-results/:id`
  - Analysis bundle response shape remained valid (`analysisId`, `insights`, `verdicts`, provenance fields, etc.)

### 3) S12 - Verdict Generation

- **Result:** Passed
- **Observed status:** `completed`
- **Evidence:**
  - `result.message`: `verdict-generation_processed`
  - `processingMetadata` present with pipeline state (`degraded` is acceptable in mock/degraded fetch conditions)

## Regression Found During Rerun

## Issue A - Early polling intermittently returned HTTP 500

**Symptom**

Guide-style early polling of:

- `GET /api/v1/workflows/status/:executionId`

intermittently returned:

- HTTP `500` with validation text equivalent to `expected object, received null`

**Impact**

- Broke manual polling loops immediately after enqueue in some runs
- Reduced reliability of scripted guide execution

**Root cause**

- Status handler assumed `snapshot.result` was always a valid object when present.
- Transitional queue states can temporarily produce `result: null` or non-final payloads.

## Issue B - Some status payloads failed `jq` parsing

**Symptom**

- On selected completed statuses, `jq` reported invalid JSON due to control characters in nested text fields.

**Impact**

- Guide commands using `jq -r '.status'` and downstream extraction could fail despite successful workflow execution.

**Root cause**

- Nested textual payloads in `result` could include low control characters not tolerated by the current shell parsing chain.

## Code Changes Applied

### API route hardening

**File:** `apps/api/src/routes/v1/workflows.ts`

Changes:

1. **Safe result validation path**
   - Replaced strict parse-only branch with safe-parse handling for `snapshot.result`
   - Skip persistence/result attachment when parsing fails instead of throwing 500
   - Added structured warning log (`workflow_status_result_validation_skipped`) for visibility

2. **Null result guard**
   - Explicitly ignore `snapshot.result` when it is `null` during transitional states

3. **Response sanitization**
   - Added recursive sanitization for low control characters in nested response payloads before emitting `body.result`

### Contract test coverage expansion

**File:** `apps/api/src/routes/v1/workflow-status-contract.test.ts`

Added/updated coverage:

1. **Transitional null-result status**
   - Ensures `GET /workflows/status/:executionId` returns `200` with status fields when `result` is temporarily `null`

2. **Control-char sanitization behavior**
   - Verifies control-character input in nested insight text is sanitized in response output

## Validation Commands Executed

```bash
# Targeted API contract validation
pnpm test -- src/routes/v1/workflow-status-contract.test.ts

# Rebuild API service with patched status route
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml up -d --build api

# Live workflow smoke checks (guide-aligned)
# S1 report-generation
# S4 marketing-analysis
# S12 verdict-generation
# with repeated status polling and jq extraction
```

All targeted tests passed. Live reruns confirmed stable status polling behavior and successful completion of S1/S4/S12 after hardening.

## Outcome

- Manual testing guide execution is now more robust for real polling behavior under transitional queue states.
- Status endpoint no longer fails hard on `result: null` transitions.
- Contract tests now guard both regression paths (null result + control-char response content).

## Follow-Up Recommendations

1. Add a dedicated integration test in API for rapid post-enqueue status polling under real BullMQ timing.
2. Consider adding explicit transitional-state examples to `manual-testing-guide.md` (e.g., expected `active/waiting` before final state).
3. Keep status route logs monitored for `workflow_status_result_validation_skipped` to detect upstream contract drift early.

## Related Files

- `docs/06-reference/manual-testing-guide.md`
- `apps/api/src/routes/v1/workflows.ts`
- `apps/api/src/routes/v1/workflow-status-contract.test.ts`
- `changelog/2026-04-09-manual-testing-execution-summary.md`
