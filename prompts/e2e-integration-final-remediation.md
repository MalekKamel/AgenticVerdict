# E2E Integration — Final Remediation Plan

**Date:** 2026-05-09
**Source:** Review findings from `/prompts/e2e-integration-review-findings.md`
**Total Items:** 19 (4 Critical, 4 High, 8 Medium, 3 Low)

---

## Prioritized Remediation Items

### Critical Priority (Block Production Deployment)

#### R-C01: Implement Real Credential Decryption

| Field                   | Value                                                                                                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**         | Replace mock `"decrypted-mock-token"` with real AES-256-GCM decryption                                                                                                                                                                              |
| **Location**            | `apps/worker/src/services/credential-store.ts:45-60`                                                                                                                                                                                                |
| **Severity**            | Critical                                                                                                                                                                                                                                            |
| **Root Cause**          | Deferred per design decision D5; placeholder implementation never replaced                                                                                                                                                                          |
| **Acceptance Criteria** | 1. `decryptCredential()` performs AES-256-GCM decryption using master key from environment. 2. Decryption failure throws actionable error. 3. All 5 connectors work with real encrypted credentials. 4. Unit tests cover success and failure paths. |
| **Estimated Effort**    | M (2-3 days)                                                                                                                                                                                                                                        |

**Steps:**

1. Add `CREDENTIAL_ENCRYPTION_KEY` environment variable to worker config
2. Implement `decryptCredential()` using Node.js `crypto.createDecipheriv('aes-256-gcm', ...)`
3. Add error handling for invalid key, corrupted ciphertext, authentication tag mismatch
4. Write unit tests with known plaintext/ciphertext pairs
5. Update seed data to use properly encrypted credentials

---

#### R-C02: Implement `triggerAIInsightsGeneration` or Remove Call

| Field                   | Value                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**         | Replace no-op stub with actual agent-runtime pipeline call, or remove the call entirely                                                                                                     |
| **Location**            | `apps/worker/src/queues/report-queues.ts:562-574`                                                                                                                                           |
| **Severity**            | Critical                                                                                                                                                                                    |
| **Root Cause**          | Placeholder implementation never replaced with real agent-runtime integration                                                                                                               |
| **Acceptance Criteria** | 1. If implementing: function triggers AI insights pipeline and persists results. 2. If removing: call site at line 642 is removed, no orphaned code. 3. Decision documented with rationale. |
| **Estimated Effort**    | L (3-5 days) if implementing; S (0.5 days) if removing                                                                                                                                      |

**Steps (if implementing):**

1. Import `runIntelligencePipeline` from `@agenticverdict/agent-runtime`
2. Construct pipeline input from delivered report context
3. Persist generated insights to `generated_insights` table
4. Add error handling with retry logic
5. Add observability (metrics, structured logging)

**Steps (if removing):**

1. Remove `triggerAIInsightsGeneration` function definition
2. Remove call site at `report-queues.ts:642`
3. Remove import if no longer needed
4. Update any documentation referencing this feature

---

#### R-C03: Fix `insight.run` Tenant Scoping

| Field                   | Value                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**         | Replace `db.select()` with `dbScoped()` in `insight.run` procedure                                                                                                      |
| **Location**            | `apps/api/src/trpc/routers/insights.ts:888-892`                                                                                                                         |
| **Severity**            | Critical                                                                                                                                                                |
| **Root Cause**          | Procedure was written using direct `db.select()` instead of following the `dbScoped` pattern used by all other procedures in the file                                   |
| **Acceptance Criteria** | 1. `insight.run` uses `dbScoped(db, async (tx) => tx.select(...))` pattern. 2. Tenant isolation verified via test. 3. Consistent with all other procedures in the file. |
| **Estimated Effort**    | S (0.5 days)                                                                                                                                                            |

**Steps:**

1. Wrap the `db.select().from(insights).where(...)` call in `dbScoped(db, async (tx) => tx.select(...))`
2. Verify the tenant filter is applied within the scoped transaction
3. Add unit test verifying tenant isolation

---

#### R-C04: Implement Frontend Report Download & Share

| Field                   | Value                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**         | Replace placeholder file generation with actual `report.content` tRPC calls and proper share link generation                                                                                                                                                       |
| **Location**            | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx:600,646,783-815` and `apps/frontend/src/features/reports/pages/ReportListPage.tsx:363,409`                                                                                                        |
| **Severity**            | Critical                                                                                                                                                                                                                                                           |
| **Root Cause**          | Frontend download/share logic was never connected to the working backend endpoints                                                                                                                                                                                 |
| **Acceptance Criteria** | 1. `handleDownload` calls `report.content` tRPC endpoint and triggers browser download. 2. `handleBulkDownload` downloads all reports sequentially. 3. Share modal calls `report.createShareLink` mutation and displays generated URL. 4. No TODO comments remain. |
| **Estimated Effort**    | M (2-3 days)                                                                                                                                                                                                                                                       |

**Steps:**

1. Import `useReportContent` and `useCreateShareLink` from insight-api
2. Replace `handleDownload` to call `report.content` with report ID and format
3. Convert base64 response to Blob and trigger browser download
4. Replace share modal to call `report.createShareLink` mutation
5. Display generated share URL with copy-to-clipboard
6. Apply same fix to `ReportListPage.tsx`

---

### High Priority (Degrade Production Quality)

#### R-H01: Wire `platformDeps` in `runPipelineWorkflow`

| Field                   | Value                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**         | Remove dead code (`void platformDeps`) and properly wire tool dependencies in workflow trigger path                                                                                              |
| **Location**            | `apps/worker/src/queues/report-queues.ts:290-292`                                                                                                                                                |
| **Severity**            | High                                                                                                                                                                                             |
| **Root Cause**          | `platformDeps` and `tenantContextDeps` constructed but never passed to `runIntelligencePipeline`                                                                                                 |
| **Acceptance Criteria** | 1. `platformFetch` included in `specialization.platformDeps`. 2. `tenantContext` included in `specialization.tenantContextDeps`. 3. Tools are available during workflow-triggered pipeline runs. |
| **Estimated Effort**    | S (0.5 days)                                                                                                                                                                                     |

**Steps:**

1. Remove `void platformDeps; void tenantContextDeps;` lines
2. Add `platformFetch: platformDeps.platformFetch` to `specialization.platformDeps` object
3. Add `getTenantContext: tenantContextDeps.getTenantContext` to `specialization.tenantContextDeps` object

---

#### R-H02: Replace Fragile Regex JSON Extraction

| Field                   | Value                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**         | Replace regex-based JSON extraction with robust parsing in intelligence pipeline                                                                                                                                |
| **Location**            | `packages/agent-runtime/src/intelligence-pipeline.ts:230,274`                                                                                                                                                   |
| **Severity**            | High                                                                                                                                                                                                            |
| **Root Cause**          | Regex `match(/\{[\s\S]*"platformSummaries"[\s\S]*\}/)` fails on nested JSON or reordered keys                                                                                                                   |
| **Acceptance Criteria** | 1. JSON extraction works for any valid JSON block in LLM output. 2. Graceful fallback to text mode when no JSON found. 3. Unit tests cover edge cases (nested objects, multiple JSON blocks, malformed output). |
| **Estimated Effort**    | M (1-2 days)                                                                                                                                                                                                    |

**Steps:**

1. Implement JSON block extraction: find first `{` and matching `}` by brace counting
2. Try `JSON.parse()` on extracted block
3. Fall back to text mode if parsing fails
4. Add logging for extraction failures
5. Write unit tests for edge cases

---

#### R-H03: Replace `console` with Structured Logger in `insights.ts`

| Field                   | Value                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Description**         | Replace `const logger = console` with structured logger from `@agenticverdict/core`                                                                                                                                                  |
| **Location**            | `apps/api/src/trpc/routers/insights.ts:19`                                                                                                                                                                                           |
| **Severity**            | High                                                                                                                                                                                                                                 |
| **Root Cause**          | File uses raw `console` instead of Pino-based structured logger                                                                                                                                                                      |
| **Acceptance Criteria** | 1. All `logger.info/warn/error` calls use structured logger with tenant correlation IDs. 2. Log output includes `tenantId`, `requestId`, `insightId` where applicable. 3. Consistent with logging conventions in other router files. |
| **Estimated Effort**    | M (1-2 days)                                                                                                                                                                                                                         |

**Steps:**

1. Import `getLogger` from `@agenticverdict/core`
2. Replace `const logger = console` with `const logger = getLogger('insights-router')`
3. Add tenant context to all log calls
4. Verify log output in structured JSON format

---

#### R-H04: Replace `console` with Structured Logger in `reports.ts`

| Field                   | Value                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| **Description**         | Same as R-H03 for reports router                                    |
| **Location**            | `apps/api/src/trpc/routers/reports.ts:30`                           |
| **Severity**            | High                                                                |
| **Root Cause**          | Same pattern as `insights.ts`                                       |
| **Acceptance Criteria** | 1. All log calls use structured logger. 2. Tenant context included. |
| **Estimated Effort**    | M (1-2 days)                                                        |

---

### Medium Priority

#### R-M01: Add Explicit Tenant Filter to Credential Store Query

| Field                | Value                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Description**      | Add `eq(platformCredentials.tenantId, tenantId)` to `fetchPlatformCredentials` WHERE clause |
| **Location**         | `apps/worker/src/services/credential-store.ts:29`                                           |
| **Severity**         | Medium                                                                                      |
| **Estimated Effort** | S (0.5 days)                                                                                |

---

#### R-M02: Fix Hardcoded `"ga4"` in Connector Factory

| Field                | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| **Description**      | Derive platform from adapter instead of hardcoding `"ga4"` |
| **Location**         | `apps/worker/src/connector-factory.ts:124`                 |
| **Severity**         | Medium                                                     |
| **Estimated Effort** | S (0.5 days)                                               |

---

#### R-M03: Replace `console.warn` with Structured Logger in Connector Factory

| Field                | Value                                                 |
| -------------------- | ----------------------------------------------------- |
| **Description**      | Use `getWorkerRootLogger()` instead of `console.warn` |
| **Location**         | `apps/worker/src/connector-factory.ts:79,84,133`      |
| **Severity**         | Medium                                                |
| **Estimated Effort** | S (0.5 days)                                          |

---

#### R-M04: Implement or Remove Unused `dateRange` Parameter

| Field                | Value                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| **Description**      | Either implement date filtering in `getAggregateMetrics` or remove the parameter |
| **Location**         | `apps/api/src/trpc/routers/agency.ts:97-100`                                     |
| **Severity**         | Medium                                                                           |
| **Estimated Effort** | S (0.5 days)                                                                     |

---

#### R-M05: Add Upper Bound to `deleteMany`

| Field                | Value                                                               |
| -------------------- | ------------------------------------------------------------------- |
| **Description**      | Cap `input.ids.length` at 100 to prevent massive `IN (...)` queries |
| **Location**         | `apps/api/src/trpc/routers/reports.ts:587-650`                      |
| **Severity**         | Medium                                                              |
| **Estimated Effort** | S (0.5 days)                                                        |

---

#### R-M06: Fix Timeout Memory Leak in `connector.test`

| Field                | Value                                            |
| -------------------- | ------------------------------------------------ |
| **Description**      | Clear `setTimeout` on all error paths            |
| **Location**         | `apps/api/src/trpc/routers/connector.ts:306-307` |
| **Severity**         | Medium                                           |
| **Estimated Effort** | S (0.5 days)                                     |

---

#### R-M07: Fix `toSafeWorkflowFailureMessage` to Use Error Details

| Field                | Value                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **Description**      | Derive message from actual error instead of always returning `"errors.common.unknownError"` |
| **Location**         | `apps/api/src/routes/v1/workflows.ts:140`                                                   |
| **Severity**         | Medium                                                                                      |
| **Estimated Effort** | S (0.5 days)                                                                                |

---

#### R-M08: Add RBAC E2E Test

| Field                | Value                                                                                |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Description**      | Create dedicated E2E test verifying viewer cannot mutate insights/reports/connectors |
| **Location**         | `tests/` (new file)                                                                  |
| **Severity**         | Medium                                                                               |
| **Estimated Effort** | M (1-2 days)                                                                         |

---

### Low Priority

#### R-L01: Implement Proper `closeDatabase()`

| Field                | Value                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| **Description**      | Actually close the connection pool instead of just nulling the singleton |
| **Location**         | `apps/worker/src/database.ts:43-44`                                      |
| **Severity**         | Low                                                                      |
| **Estimated Effort** | S (0.5 days)                                                             |

---

#### R-L02: Add Logging for Empty Tool Array Returns

| Field                | Value                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Description**      | Log warning when `createPipelineAgentTools` returns empty array due to missing deps |
| **Location**         | `packages/agent-runtime/src/agent-kinds.ts:86-88,104-106`                           |
| **Severity**         | Low                                                                                 |
| **Estimated Effort** | S (0.5 days)                                                                        |

---

#### R-L03: Improve Progress Heuristic in `getJobStatus`

| Field                | Value                                                                             |
| -------------------- | --------------------------------------------------------------------------------- |
| **Description**      | Differentiate progress for active/waiting/delayed states instead of hardcoded 50% |
| **Location**         | `apps/api/src/trpc/routers/insights.ts:1319`                                      |
| **Severity**         | Low                                                                               |
| **Estimated Effort** | S (0.5 days)                                                                      |

---

## Dependency Graph

```
R-C01 (Credential Decryption)
  ├── Blocks: R-M01 (tenant filter on credential query)
  └── Blocks: R-M02 (hardcoded ga4 fix — needs real credentials to test)

R-C02 (AI Insights Generation)
  ├── Depends on: R-H01 (wire platformDeps in workflow)
  └── Blocks: R-L02 (empty tool array logging)

R-C03 (insight.run dbScoped)
  └── Independent

R-C04 (Frontend Download/Share)
  └── Independent

R-H01 (Wire platformDeps)
  ├── Depends on: R-C01 (credential decryption — tools need real credentials)
  └── Blocks: R-C02 (AI insights generation)

R-H02 (JSON Extraction)
  └── Independent

R-H03 (insights.ts logger)
  └── Independent

R-H04 (reports.ts logger)
  └── Independent

R-M01 through R-M08
  ├── R-M01 depends on: R-C01
  ├── R-M02 depends on: R-C01
  └── All others: Independent

R-L01 through R-L03
  └── All independent
```

---

## Phase Grouping

### Phase A: Security & Tenant Isolation (Critical)

**Entry Criteria:** Current codebase state
**Exit Criteria:** All critical items resolved, typecheck + lint + tests pass

| Item                           | Effort | Blocks       |
| ------------------------------ | ------ | ------------ |
| R-C01: Credential decryption   | M      | R-M01, R-M02 |
| R-C03: insight.run dbScoped    | S      | None         |
| R-C04: Frontend download/share | M      | None         |

**Estimated:** 3-5 days

---

### Phase B: Pipeline Completeness (Critical + High)

**Entry Criteria:** Phase A complete
**Exit Criteria:** AI insights generation functional, tools wired in all paths

| Item                                 | Effort | Blocks |
| ------------------------------------ | ------ | ------ |
| R-H01: Wire platformDeps in workflow | S      | R-C02  |
| R-C02: AI insights generation        | L      | None   |
| R-H02: JSON extraction               | M      | None   |

**Estimated:** 4-7 days

---

### Phase C: Observability & Logging (High + Medium)

**Entry Criteria:** Phase A complete (can run in parallel with Phase B)
**Exit Criteria:** All loggers structured, no console usage in routers

| Item                                  | Effort | Blocks |
| ------------------------------------- | ------ | ------ |
| R-H03: insights.ts logger             | M      | None   |
| R-H04: reports.ts logger              | M      | None   |
| R-M03: connector-factory logger       | S      | None   |
| R-M01: Credential store tenant filter | S      | R-C01  |
| R-M02: Connector factory ga4 fix      | S      | R-C01  |

**Estimated:** 2-3 days

---

### Phase D: Bug Fixes & Quality (Medium + Low)

**Entry Criteria:** None (can run in parallel with all phases)
**Exit Criteria:** All medium/low items resolved

| Item                          | Effort | Blocks |
| ----------------------------- | ------ | ------ |
| R-M04: dateRange unused       | S      | None   |
| R-M05: deleteMany upper bound | S      | None   |
| R-M06: Timeout memory leak    | S      | None   |
| R-M07: Failure message        | S      | None   |
| R-M08: RBAC E2E test          | M      | None   |
| R-L01: closeDatabase          | S      | None   |
| R-L02: Empty tool logging     | S      | None   |
| R-L03: Progress heuristic     | S      | None   |

**Estimated:** 3-4 days

---

## Verification Steps

### Per-Item Verification

| Item        | Verification                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-C01       | 1. Set `CREDENTIAL_ENCRYPTION_KEY` env var. 2. Run worker with real encrypted credentials. 3. Verify all 5 connectors authenticate successfully. 4. Run unit tests for decryption. |
| R-C02       | 1. Trigger report delivery. 2. Verify AI insights generated and persisted. 3. Check `generated_insights` table for new rows.                                                       |
| R-C03       | 1. Run `insight.run` as tenant A. 2. Verify query uses `dbScoped()`. 3. Run cross-tenant test to confirm isolation.                                                                |
| R-C04       | 1. Click download on insight detail page. 2. Verify actual report file downloaded (not placeholder `.txt`). 3. Create share link. 4. Verify token-based URL generated.             |
| R-H01       | 1. Trigger workflow-based pipeline run. 2. Verify tools are available (check logs). 3. Verify structured results produced.                                                         |
| R-H02       | 1. Run pipeline with LLM output containing nested JSON. 2. Verify structured results extracted correctly. 3. Test with malformed output — verify graceful fallback.                |
| R-H03/R-H04 | 1. Run API with structured logging enabled. 2. Verify JSON log output includes `tenantId`, `requestId`.                                                                            |
| R-M04       | 1. Call `getAggregateMetrics` with `dateRange`. 2. Verify results filtered by date. OR remove parameter from schema.                                                               |
| R-M05       | 1. Send `deleteMany` with 101 IDs. 2. Verify error returned.                                                                                                                       |
| R-M06       | 1. Run `connector.test` with timeout. 2. Verify no leaked timers.                                                                                                                  |
| R-M07       | 1. Trigger workflow failure with specific error. 2. Verify error message reflects actual failure.                                                                                  |
| R-M08       | 1. Run E2E test as viewer role. 2. Verify all mutations return 403.                                                                                                                |

### Global Verification

After all phases complete:

```bash
# 1. Type safety
pnpm run typecheck

# 2. Linting
pnpm run lint

# 3. Unit tests
pnpm run test:unit

# 4. Verify zero TODOs in touched files
grep -rn "TODO\|FIXME\|HACK" apps/api/src/trpc/routers/insights.ts apps/api/src/trpc/routers/reports.ts apps/worker/src/services/credential-store.ts apps/worker/src/queues/report-queues.ts apps/frontend/src/features/insights/pages/InsightDetailPage.tsx apps/frontend/src/features/reports/pages/ReportListPage.tsx

# 5. Service health
make health
```

---

## Total Estimated Effort

| Phase                                | Items  | Effort Range   |
| ------------------------------------ | ------ | -------------- |
| Phase A: Security & Tenant Isolation | 3      | 3-5 days       |
| Phase B: Pipeline Completeness       | 3      | 4-7 days       |
| Phase C: Observability & Logging     | 5      | 2-3 days       |
| Phase D: Bug Fixes & Quality         | 8      | 3-4 days       |
| **Total**                            | **19** | **12-19 days** |

**Critical path:** Phase A → Phase B (sequential), Phase C and D can run in parallel with A and B.
**Minimum timeline:** 7 days (all parallelizable work done concurrently)
**Maximum timeline:** 19 days (fully sequential)
