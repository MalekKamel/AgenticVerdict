# Insights Reports Production Readiness Audit

## Context

All tasks defined in `/openspec/changes/insights-reports/tasks.md` have been marked as completed. However, the current implementation contains mock implementations and development placeholders that must be replaced with production-ready code.

**Example:** `/apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx` contains mock logic that requires replacement.

## Objective

Transform the Insights Reports feature into a 100% production-ready implementation by ensuring:

1. **Zero Mock Implementations** - Replace all mock data, stubbed services, and placeholder logic with real integrations
2. **Type Safety** - Zero TypeScript type-check errors across all packages
3. **Code Quality** - Zero ESLint violations; all code adheres to repository standards
4. **Test Coverage** - All unit, integration, and E2E tests passing; coverage thresholds met (70% overall, 85% business logic, 90% critical paths)
5. **Localization** - All user-facing strings externalized and localized via `packages/i18n/` (English + Arabic)
6. **Routing Compliance** - Zero hardcoded routes; all navigation uses the routing system as single source of truth (`apps/frontend/src/lib/router/`)
7. **Production Standards** - Error handling, logging, observability, tenant-scoping, and security controls implemented per `AGENTS.md` and `CLAUDE.md`

## Task

Conduct a comprehensive audit of the Insights Reports implementation and produce a detailed remediation plan.

### Deliverable

Create a markdown document at `/openspec/changes/insights-reports/production-readiness-plan.md` containing:

1. **Gap Analysis** - Inventory of all mock implementations, type errors, lint violations, and missing tests
2. **Remediation Tasks** - Prioritized, actionable tasks to address each gap
3. **Validation Criteria** - Clear acceptance criteria for each task
4. **Testing Strategy** - Required tests per `docs/05-reference/testing-policy.md`
5. **Risk Assessment** - Identify high-risk changes requiring additional review

### Scope

Audit all files under:

- `/apps/frontend/src/features/insights/`
- `/apps/api/src/routes/insights/` (if applicable)
- `/apps/worker/src/jobs/insights/` (if applicable)
- Related packages and shared modules

### Success Criteria

The plan is complete when executing all tasks results in:

- ✅ `pnpm run typecheck` passes with zero errors
- ✅ `pnpm run lint` passes with zero violations
- ✅ `pnpm run test:unit` passes with required coverage thresholds
- ✅ `pnpm run test:e2e` passes for Insights flows
- ✅ Zero mock implementations in production code paths
- ✅ Full localization coverage (en + ar)
- ✅ All routes sourced from routing SSOT
