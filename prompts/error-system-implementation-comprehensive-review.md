# Error System Implementation Review

## Review Context

- Implementation baseline: `/openspec/changes/error-system/tasks.md`
- Design intent baseline: `/prompts/error-handling-single-source-of-truth-comprehensive-implementation-plan.md`
- Review method: parallel deep-dive across backend boundaries, frontend normalization, shared core/translators, governance/docs

## Executive Assessment

The implementation has made meaningful progress toward a single-source-of-truth error architecture, especially in shared core contracts and foundational translators. However, production readiness is currently limited by critical boundary inconsistencies and governance enforcement gaps.

Overall maturity estimate (vs industry best practices): **3.0 / 5 (Developing)**.

## Spec-to-Implementation Compliance Matrix

| Area                          | Status              | Assessment                                                                                                                     |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Core foundation               | Mostly compliant    | Canonical primitives (`ErrorCode`, `ErrorCategory`, `ErrorSurface`, `AppFault`, normalizer, translators) exist and are tested. |
| Backend boundary migration    | Partially compliant | Global translation exists, but many route-level ad hoc error payloads still bypass canonical contract.                         |
| Frontend consolidation        | Partially compliant | Normalized adapter exists and is used in key paths, but legacy auth/route-message paths still fragment behavior.               |
| Observability standardization | Partially compliant | Central logging paths exist, but canonical dimensions and correlation propagation are inconsistent across boundaries.          |
| Governance and quality gates  | Partially compliant | Governance scripts and coverage checks exist, but detection logic misses real violations and CI guard depth is insufficient.   |

## Findings (Ordered by Severity)

### Critical

1. **Tenant spoofing risk in workflow trigger path**
   - Evidence: `apps/api/src/routes/v1/workflows.ts` accepts and forwards body `tenantId` into enqueue payload instead of deriving tenant from auth context.
   - Why this matters: violates tenant isolation; enables cross-tenant job triggering if abused.
   - Industry standard: tenant identity must be server-authoritative at boundaries (zero trust for tenant identifiers from client payloads).
   - Remediation: derive tenant exclusively from `request.auth.tenantId`; reject mismatches with canonical tenant fault.

2. **Potential cross-tenant workflow status disclosure**
   - Evidence: `apps/api/src/routes/v1/workflows.ts` status endpoint resolves by `executionId` without explicit tenant-ownership check in route layer.
   - Why this matters: execution IDs can become cross-tenant data access vectors.
   - Industry standard: all read paths of async execution resources must enforce tenant ownership checks before returning state/results.
   - Remediation: persist and verify tenant ownership per execution ID, fail closed on mismatch/not found.

### High

3. **Canonical contract bypass in REST routes**
   - Evidence: `apps/api/src/routes/v1/workflows.ts` and `apps/api/src/routes/v1/reports.ts` return non-canonical ad hoc codes/shapes (`validation_error`, `not_found`, `unauthorized`).
   - Why this matters: fragments client behavior, weakens registry governance, and reintroduces duplicated error semantics.
   - Industry standard: all user-visible boundary errors should be translated from a typed canonical domain contract.
   - Remediation: replace direct payload construction with `AppFault` + `toHttpErrorResponse` in all failure branches.

4. **Unsafe frontend fallback message behavior**
   - Evidence: `apps/frontend/src/lib/api/trpc-error-message.ts` returns `error.message` in production path for tRPC and generic `Error`.
   - Why this matters: backend/internal messages can leak into UI.
   - Industry standard: production UIs should display stable localized keys/messages, never raw exception messages.
   - Remediation: route all user messaging through normalized adapter + message keys; keep raw text dev-only.

5. **Governance scanner misses real violations**
   - Evidence: `scripts/error-system/verify-error-governance.mjs` only matches uppercase `code: "..."` and uses global `/g` regex with `.test()` across files.
   - Why this matters: non-canonical lowercase codes pass undetected; regex state can produce false negatives.
   - Industry standard: policy enforcement should be deterministic (AST-level checks for contract compliance in critical paths).
   - Remediation: remove stateful regex behavior, broaden detection, and migrate to AST-based scanning.

### Medium

6. **tRPC transport mapping loses semantic fidelity**
   - Evidence: `packages/core/src/error-translators.ts` maps 5xx broadly to `INTERNAL_SERVER_ERROR` and does not map 409/504 to richer transport equivalents.
   - Why this matters: clients lose retry/conflict-specific handling opportunities.
   - Industry standard: preserve semantically meaningful transport codes where possible (`CONFLICT`, `TIMEOUT`).
   - Remediation: add explicit mappings and regression tests.

7. **Raw worker/job failure text is returned in status path**
   - Evidence: `apps/api/src/routes/v1/workflows.ts` assigns `snapshot.error` directly into response body.
   - Why this matters: may expose internal stack/upstream details.
   - Industry standard: sanitize/translate external error payloads; keep raw causes only in secured logs.
   - Remediation: translate to canonical safe payload for client responses; retain raw details only in internal observability.

8. **Frontend model consolidation is incomplete**
   - Evidence: active frontend paths still rely on legacy route/auth-specific handling (e.g., `apps/frontend/src/lib/api/trpc-error-message.ts`), while normalized adapter exists in `apps/frontend/src/lib/errors/normalized-error-adapter.ts`.
   - Why this matters: inconsistent UX, duplicate logic, and drift between features.
   - Industry standard: one normalized adapter/view-model per app surface.
   - Remediation: migrate remaining auth/route consumers to normalized adapter and retire legacy mappers.

9. **Observability envelope not consistently canonical**
   - Evidence: route-level logs such as in `apps/api/src/routes/v1/workflows.ts` still log raw error object (`{ err }`) without guaranteed canonical dimensions.
   - Why this matters: weaker triage, cardinality/noise, and potential leakage risk.
   - Industry standard: consistent structured error envelope (`code`, `category`, `surface`, `retryable`, correlation IDs, operation context).
   - Remediation: enforce shared backend/frontend observability helpers and validate fields in tests.

10. **Correlation metadata propagation is incomplete**
    - Evidence: `packages/core/src/error-translators.ts` `toTrpcErrorMeta` excludes request/correlation metadata expected by frontend normalization and telemetry.
    - Why this matters: harder cross-surface traceability.
    - Industry standard: every user-visible failure should be traceable across client, API, and worker logs.
    - Remediation: include correlation metadata in canonical tRPC meta/details path and test for propagation.

### Low

11. **Weak cross-field invariants in direct `AppFault` construction**
    - Evidence: `packages/core/src/errors.ts` constructor accepts direct `code/category/httpStatus/retryable` combinations without strict invariant validation.
    - Why this matters: accidental inconsistent faults can be created manually.
    - Industry standard: factory-driven canonical fault construction reduces configuration drift.
    - Remediation: add `createAppFault(code, overrides)` factory with strict defaults and validation.

## Strengths

- Strong shared core foundation in `packages/core` with typed canonical contracts and normalization.
- Clear directional progress in removing message-string matching and legacy frontend error modules.
- Global Fastify error translation path exists, reducing baseline risk for unhandled errors.
- Dedicated governance artifacts are present (registry doc + verification script + targeted checks).
- Added tests in core and frontend indicate serious investment in contract reliability.

## Industry Benchmark Comparison

### Where the implementation aligns well

- **Canonical taxonomy and typed contract:** aligned with modern platform error architecture.
- **Boundary translators:** aligned in design; partially complete in runtime adoption.
- **Safe defaults for unknown failures:** aligned with fail-closed principles.

### Where the implementation lags

- **Full boundary adoption:** best-practice systems avoid any ad hoc boundary payloads.
- **Tenant-safe boundary guarantees:** execution/status ownership controls must be explicit and test-enforced.
- **Policy enforcement rigor:** regex-only scanning is weaker than AST/lint-rule enforcement.
- **Traceability completeness:** correlation propagation needs to be universal, not partial.

## Prioritized Remediation Plan

### Phase 0 (Immediate: 1-2 days)

1. Enforce tenant-authoritative identity in workflow trigger and status routes.
2. Stop returning raw job error text to clients; translate/sanitize consistently.
3. Patch governance script reliability bug (`/g` stateful pattern usage).

### Phase 1 (Short-term hardening: 3-7 days)

1. Complete REST migration from ad hoc error payloads to canonical translator path.
2. Lock down production frontend messaging to message-key-only behavior.
3. Expand governance checks to catch lowercase/non-canonical code literals and direct ad hoc route payload patterns.

### Phase 2 (Stabilization: 1-2 sprints)

1. Improve tRPC code fidelity (`CONFLICT`, `TIMEOUT`) and validate through contract tests.
2. Standardize backend/frontend observability envelopes with canonical dimensions + correlation IDs.
3. Complete frontend migration to one normalized adapter and remove remaining legacy code paths.

### Phase 3 (Strategic quality gate uplift: quarterly)

1. Replace regex governance checks with AST-based static analysis.
2. Add cross-surface contract conformance suite (HTTP/tRPC/queue/worker/frontend golden tests).
3. Add CI SLO gates for unknown-code rate, missing-correlation rate, and non-canonical code usage.

## Test and Validation Gaps

- Missing negative tests for tenant spoofing in workflow trigger payloads.
- Missing cross-tenant access tests for workflow status by execution ID.
- Missing tests asserting no raw internal error text leaks in workflow status responses.
- Missing regression tests enforcing canonical codes in all REST route failures.
- Missing tests for production message safety in frontend route-error paths.
- Missing tests for governance checker detection edge cases and regex-state behavior.
- Missing end-to-end correlation propagation assertions across tRPC -> frontend telemetry.

## Recommended Acceptance Gates Before Declaring Production-Ready

1. No route-level ad hoc error payloads in runtime-critical API paths.
2. Tenant ownership enforced for all async execution resources.
3. Frontend production paths never display raw exception messages.
4. Governance checks catch non-canonical codes deterministically.
5. Correlation IDs available for all user-visible errors across HTTP and tRPC.
6. CI runs governance + translator + boundary integration checks as required gates.

## Conclusion

The current implementation is a strong architectural step toward a professional, robust error system with observability. The core model is credible and well structured, but critical runtime boundary and governance gaps must be closed to reach production-grade quality. With the remediation plan above, the system can be elevated from developing maturity to a clean, enforceable, and operationally reliable error platform.
