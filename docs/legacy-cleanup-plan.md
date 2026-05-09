# Legacy Code Cleanup — Implementation Plan

**Date:** 2026-05-11
**Scope:** Entire AgenticVerdict monorepo (apps/, packages/)
**Approach:** Destructive cleanup — greenfield pre-production, no backward compatibility required

---

## Executive Summary

This plan catalogs all legacy, backward-compatibility, deprecated, and dead code found across the AgenticVerdict codebase. Findings are grouped into 6 categories by severity and removal risk. Previously documented items from `docs/05-reference/DEAD_CODE_INVENTORY.md` (2026-04-11) have been re-verified; several items noted there have already been cleaned up (`LlmProviderEnv` removed from exports, `InMemoryAgentMemory` removed from exports, `@agenticverdict/queueing`/`@agenticverdict/multi-tenancy`/`@agenticverdict/docker` packages deleted). The `@agenticverdict/ui` package is now actively consumed and must be retained.

**New findings since the 2026-04-11 audit:** 1 unused package, 1 deprecated type alias, 6 dead exports, 2 duplicated functions, 4 misleading "legacy" labels on active code, 7 TODO stubs.

---

## Category 1: Unused Packages (SEVERITY: HIGH — Safe to Remove)

### 1.1 `@agenticverdict/mock-platform-server`

| Attribute                  | Value                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| **Location**               | `packages/mock-platform-server/`                                                                    |
| **Reason**                 | Zero imports anywhere in the codebase. Not referenced in any app `package.json`.                    |
| **Contents**               | `src/index.ts`, `src/server.test.ts`, `src/cli.ts`, `src/mock-headers.ts`, `src/date-range-body.ts` |
| **Action**                 | Delete entire directory. Remove from workspace if listed in root `package.json` workspaces.         |
| **Dependencies to update** | None (no consumers)                                                                                 |

---

## Category 2: Deprecated Type Aliases (SEVERITY: HIGH — Safe to Remove)

### 2.1 `ProductionFlowPdfScenarioId`

| Attribute     | Value                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**      | `packages/types/src/queue-job-types.ts:33-34`                                                                                                                                         |
| **Code**      | `/** @deprecated Use {@link ProductionFlowScenarioId} — kept for older imports. */`<br>`export type ProductionFlowPdfScenarioId = Extract<ProductionFlowScenarioId, "R01" \| "R02">;` |
| **Consumers** | Only re-exported in `packages/types/src/index.ts:598`. Never imported by any other file.                                                                                              |
| **Action**    | Delete lines 33-34. Remove from `index.ts` export.                                                                                                                                    |

---

## Category 3: Dead Exports — Defined but Never Imported (SEVERITY: MEDIUM-HIGH)

These functions/types are exported but have zero import references outside their own test files.

### 3.1 `rateLimitedProcedure`

| Attribute  | Value                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| **File**   | `apps/api/src/trpc/procedures.ts:53-55`                                        |
| **Code**   | `export function rateLimitedProcedure(maxRequests: number, windowMs = 60_000)` |
| **Note**   | Already marked `@deprecated` in JSDoc (line 49).                               |
| **Action** | Delete lines 47-55 (entire JSDoc + function).                                  |

### 3.2 `useSharedReportContent`

| Attribute     | Value                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **File**      | `apps/frontend/src/features/reports/api/report-api.ts:99-107`                                       |
| **Code**      | `export function useSharedReportContent(reportId: string, token: string, format: "pdf" \| "excel")` |
| **Consumers** | None — not imported anywhere in source or test files.                                               |
| **Action**    | Delete the function definition.                                                                     |

### 3.3 `connectorApi`

| Attribute     | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| **File**      | `apps/frontend/src/features/settings/connectors/connector-api.ts:55-62` |
| **Code**      | `export const connectorApi = { ... }` (query key factory object)        |
| **Consumers** | None — not imported anywhere.                                           |
| **Action**    | Delete the export. If the entire file becomes empty, delete the file.   |

### 3.4 `isInsightConnector`

| Attribute     | Value                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------- |
| **File**      | `packages/types/src/insight.ts:174`                                                      |
| **Code**      | `export function isInsightConnector(value: unknown): value is InsightConnector`          |
| **Consumers** | Only re-exported in `packages/types/src/index.ts:176`. Never imported by any other file. |
| **Action**    | Delete the function. Remove from `index.ts` export.                                      |

### 3.5 `WORKER_PACKAGE_VERSION`

| Attribute     | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| **File**      | `apps/worker/src/index.ts:4`                                 |
| **Code**      | `export const WORKER_PACKAGE_VERSION = "0.4.3";`             |
| **Consumers** | None — exported from package entry point but never imported. |
| **Action**    | Delete the line.                                             |

### 3.6 `API_VERSION` (apps/api)

| Attribute     | Value                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**      | `apps/api/src/index.ts:4`                                                                                                                                                        |
| **Code**      | `export const API_VERSION = "0.1.0";`                                                                                                                                            |
| **Consumers** | None — exported from package entry point but never imported. (Note: `packages/config/src/build-constants.ts` has a separate `API_VERSION` that IS used — do not touch that one.) |
| **Action**    | Delete the line.                                                                                                                                                                 |

---

## Category 4: Duplicated Code (SEVERITY: MEDIUM)

### 4.1 `mapInsightType` — Duplicated Twice in Same File

| Attribute      | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**       | `apps/worker/src/queues/report-queues.ts`                                                                                                                                              |
| **Instance 1** | Lines 178-191 (inside `toGeneratedInsights` function) — comment: "Map legacy insight types to canonical enum values"                                                                   |
| **Instance 2** | Lines 849-862 (inside `defaultInsightExecutionProcessor` function) — comment: "Map insight_type to canonical enum values"                                                              |
| **Issue**      | Identical implementation duplicated. The first instance's comment references "legacy" but the mapping is actively used for both structured insights and pipeline fallback.             |
| **Action**     | Extract to a module-level private function (or shared utility). Delete both inline copies. Remove "legacy" comment — this is canonical type normalization, not backward compatibility. |

### 4.2 `BudgetAlertsService` — Two Separate Implementations

| Attribute            | Value                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Implementation A** | `apps/api/src/services/budget-alerts.service.ts` (493 lines) — Full service with CRUD, evaluation, notifications, repository integration                                                                                                                                                   |
| **Implementation B** | `packages/agent-runtime/src/services/budget-alerts.ts` (282 lines) — Simpler agent-facing service with hardcoded `"tenant-id-placeholder"` values                                                                                                                                          |
| **Issue**            | Two distinct implementations of the same domain concept. The agent-runtime version uses placeholder tenant IDs and simulated notifications.                                                                                                                                                |
| **Action**           | Evaluate whether the agent-runtime version is needed. If agent-runtime consumers only need evaluation logic, extract shared evaluation into `packages/core` and delete the agent-runtime duplicate. If not needed, delete `packages/agent-runtime/src/services/budget-alerts.ts` entirely. |

---

## Category 5: Misleading "Legacy" Labels on Active Code (SEVERITY: LOW — Rename Only)

These code blocks contain "legacy" or "backward compatibility" in comments but are actively used. The labels are misleading and should be corrected.

### 5.1 `toLegacyRestAuthCode`

| Attribute  | Value                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| **File**   | `apps/api/src/middleware/auth.ts:19-27`                                                                       |
| **Usage**  | Called 5 times (lines 113, 135, 160, 196, 221) to translate internal error codes to REST API response format. |
| **Issue**  | Name implies "legacy" but this is the active REST error code translation layer.                               |
| **Action** | Rename to `toRestAuthCode` (remove "Legacy"). Update all 5 call sites.                                        |

### 5.2 `simpleTenantAIConfigSchema`

| Attribute   | Value                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `packages/types/src/tenant.ts:113-120`                                                                                                                                                                                                                                                   |
| **Comment** | `// Legacy simple AI configuration (deprecated, kept for backward compat with tenantSchema)`                                                                                                                                                                                             |
| **Usage**   | Actively used in `tenantSchema` at line 133: `aiConfig: simpleTenantAIConfigSchema`                                                                                                                                                                                                      |
| **Issue**   | Comment says "legacy/deprecated" but the schema is the active AI config for tenants.                                                                                                                                                                                                     |
| **Action**  | Remove the misleading comment. Rename to `tenantAIConfigSchema` if it is the canonical schema (note: `TenantAIConfig` type already exists at line 111 pointing to `tenantAIConfigSchema` — verify if `simpleTenantAIConfigSchema` and `tenantAIConfigSchema` are the same or different). |

### 5.3 `tenantBrandTokensSchema`

| Attribute   | Value                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **File**    | `packages/config/src/schemas/tenant-ui.ts:8-9`                                                                                                                           |
| **Comment** | `/** Re-exported under legacy name for config package consumers. */`                                                                                                     |
| **Usage**   | Actively imported by `apps/api/src/trpc/routers/tenant.ts` and exported from `packages/config/src/index.ts`                                                              |
| **Issue**   | "Legacy name" label is misleading — it's a convenience alias for `brandTokensSchema`.                                                                                    |
| **Action**  | Update the JSDoc to describe it as a convenience alias, not a legacy re-export. Consider migrating consumers to use `brandTokensSchema` directly, then remove the alias. |

### 5.4 RBAC Guard "backward compatibility" Comment

| Attribute   | Value                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| **File**    | `apps/api/src/trpc/middleware/rbac-guard.ts:139`                                                            |
| **Comment** | `// Use database roles, fallback to JWT roles if needed for backward compatibility`                         |
| **Usage**   | Active fallback pattern — DB roles preferred, JWT roles used when DB has no roles.                          |
| **Issue**   | "Backward compatibility" implies this is temporary. It's a legitimate multi-source role resolution pattern. |
| **Action**  | Update comment to: `// Use database roles; fall back to JWT-embedded roles when DB has none assigned`.      |

### 5.5 `getTrpcSafeUserMessage` "Backward-compatible" Label

| Attribute   | Value                                                                                |
| ----------- | ------------------------------------------------------------------------------------ |
| **File**    | `apps/frontend/src/lib/api/trpc-error-message.ts:16-20`                              |
| **Comment** | `/** Backward-compatible helper returning a translation key string. */`              |
| **Usage**   | Actively used in `AppRouteError.tsx:44`                                              |
| **Issue**   | "Backward-compatible" is misleading — it's just a convenience wrapper.               |
| **Action**  | Update JSDoc to: `/** Convenience wrapper that returns a translation key string. */` |

### 5.6 `resolveWorkflowAnalysisUuid` "legacy pipeline behavior" Comment

| Attribute   | Value                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| **File**    | `packages/agent-runtime/src/agent-verdict-json.ts:24`                                                       |
| **Comment** | `/** When \`workflowId\` is not a UUID, derive a deterministic analysis id (legacy pipeline behavior). \*/` |
| **Usage**   | Actively used in `intelligence-pipeline.ts:403`                                                             |
| **Issue**   | "Legacy pipeline behavior" implies deprecated. The function handles non-UUID workflowIds deterministically. |
| **Action**  | Update JSDoc to: `/** Derives a deterministic analysis UUID when \`workflowId\` is not already a UUID. \*/` |

### 5.7 `InMemoryAgentMemory` "legacy" Label

| Attribute   | Value                                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**    | `packages/agent-runtime/src/memory.ts:6`                                                                                                                                                                                     |
| **Comment** | `/** Unbounded buffer (legacy); prefer {@link BoundedBufferMemory} for production agents. */`                                                                                                                                |
| **Usage**   | Only used in its own test file (`memory.test.ts`). Already removed from public `index.ts` exports (per 2026-04-11 cleanup).                                                                                                  |
| **Issue**   | Class remains in source but is not publicly exported. Tests still reference it.                                                                                                                                              |
| **Action**  | Either (a) delete the class and its tests, or (b) keep for internal testing but rename to `UnboundedBufferMemory` to remove "legacy" stigma. Recommendation: (a) delete — `BoundedBufferMemory` covers all production needs. |

---

## Category 6: TODO Stubs — Incomplete Implementations (SEVERITY: MEDIUM)

These are placeholder implementations that should be completed or removed.

### 6.1 Credential Store — AES-256 Decryption Stub

| Attribute  | Value                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**   | `apps/worker/src/services/credential-store.ts:9, 41, 48`                                                                                                                        |
| **Code**   | `TODO: Implement AES-256 decryption (deferred per design decision D5)`                                                                                                          |
| **Action** | Either implement AES-256-GCM decryption using a master key from environment, or if credentials are stored plaintext for development, remove the TODO and document the decision. |

### 6.2 InsightDetailPage — Download Stub

| Attribute  | Value                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| **File**   | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx:600, 646`                                   |
| **Code**   | `// TODO: Implement actual download logic with tRPC endpoint`<br>`// TODO: Implement actual report fetching` |
| **Action** | Implement the tRPC endpoint and download logic, or remove the UI elements if not needed.                     |

### 6.3 ReportListPage — Fetching Stub

| Attribute  | Value                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| **File**   | `apps/frontend/src/features/reports/pages/ReportListPage.tsx:363, 409`                                       |
| **Code**   | `// TODO: Implement actual report fetching`<br>`// TODO: Implement actual download logic with tRPC endpoint` |
| **Action** | Implement the tRPC endpoint and fetching logic, or remove the UI elements.                                   |

### 6.4 ThemeProvider — API Stub

| Attribute  | Value                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| **File**   | `packages/ui/src/providers/ThemeProvider.tsx:113`                      |
| **Code**   | `// TODO: Implement actual API call`                                   |
| **Action** | Implement the API call or remove the TODO if the provider is complete. |

---

## Category 7: Intentionally Retained (NO ACTION)

The following contain "legacy" terminology but are legitimate features that should NOT be removed:

| Item                                 | Location                                                       | Reason                                                                                 |
| ------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `TrafficManager` ("legacy" target)   | `packages/agent-runtime/src/deployment/trafficManager.ts`      | Canary deployment feature — "legacy" = current system vs. "new" system for A/B testing |
| `ParallelRunner` ("legacy" response) | `packages/agent-runtime/src/deployment/parallelRunner.ts`      | Parallel execution comparison feature for model/provider evaluation                    |
| `TrafficManager` tests               | `packages/agent-runtime/src/deployment/trafficManager.test.ts` | Tests for the above — references "legacy" as a traffic target                          |
| `ParallelRunner` tests               | `packages/agent-runtime/src/deployment/parallelRunner.test.ts` | Tests for the above — references "legacy" as an execution target                       |
| `InsightSchedule` deprecation note   | `packages/types/src/schedule.ts:5`                             | Documentation comment explaining history — not code                                    |

---

## Implementation Order (Dependency-Safe)

### Batch 1: Zero-Risk Deletions (no downstream dependencies)

1. Delete `packages/mock-platform-server/` directory
2. Delete `ProductionFlowPdfScenarioId` type + export
3. Delete `rateLimitedProcedure` function
4. Delete `useSharedReportContent` function
5. Delete `connectorApi` export (and file if empty)
6. Delete `isInsightConnector` function + export
7. Delete `WORKER_PACKAGE_VERSION` export
8. Delete `API_VERSION` export from `apps/api/src/index.ts`

**Verification after Batch 1:**

```bash
pnpm install && pnpm run typecheck && pnpm run test:unit
```

### Batch 2: Deduplication

9. Extract `mapInsightType` to module-level function in `report-queues.ts`, delete both inline copies
10. Evaluate and resolve `BudgetAlertsService` duplication (see §4.2)

**Verification after Batch 2:**

```bash
pnpm run typecheck && pnpm run test:unit
```

### Batch 3: Comment/Label Corrections

11. Rename `toLegacyRestAuthCode` → `toRestAuthCode` (auth.ts + 5 call sites)
12. Fix `simpleTenantAIConfigSchema` comment (tenant.ts)
13. Fix `tenantBrandTokensSchema` JSDoc (tenant-ui.ts)
14. Fix RBAC guard comment (rbac-guard.ts)
15. Fix `getTrpcSafeUserMessage` JSDoc (trpc-error-message.ts)
16. Fix `resolveWorkflowAnalysisUuid` JSDoc (agent-verdict-json.ts)
17. Delete `InMemoryAgentMemory` class + tests (memory.ts + memory.test.ts)

**Verification after Batch 3:**

```bash
pnpm run typecheck && pnpm run test:unit
```

### Batch 4: TODO Resolution (Optional — Requires Feature Work)

18-21. Address TODO stubs in §6 (each requires separate implementation decisions)

---

## Verification Steps (Per Batch)

After each batch, run:

```bash
# 1. Reinstall dependencies (catches removed package references)
pnpm install

# 2. Type-check all packages
pnpm run typecheck

# 3. Run unit tests
pnpm run test:unit

# 4. Lint
pnpm run lint

# 5. Build all packages
pnpm run build
```

---

## Rollback Strategy

All changes should be committed in separate commits per batch. Rollback is a simple `git revert <commit>` for any batch that introduces regressions.

---

## Summary Table

| Category                | Items  | Lines Affected          | Risk         | Effort      |
| ----------------------- | ------ | ----------------------- | ------------ | ----------- |
| 1. Unused packages      | 1      | ~5 files                | None         | 5 min       |
| 2. Deprecated types     | 1      | 2 lines + 1 export      | None         | 2 min       |
| 3. Dead exports         | 6      | ~30 lines + 6 exports   | None         | 15 min      |
| 4. Duplicated code      | 2      | ~30 lines               | Low          | 30 min      |
| 5. Misleading labels    | 7      | ~10 comments + 1 rename | None         | 20 min      |
| 6. TODO stubs           | 4      | ~8 lines                | Medium       | Variable    |
| 7. Retained (no action) | 5      | —                       | —            | —           |
| **Total (excl. TODOs)** | **18** | **~77 lines**           | **None-Low** | **~72 min** |
