# Insights Reports Feature Specification

**Status:** ✅ Complete - Production Ready  
**Last Updated:** 2026-05-04  
**Feature Flag:** `ENABLE_INSIGHTS_UI`

---

## Overview

This specification defines the complete Insights Reports feature for AgenticVerdict, enabling users to:

- Create and configure AI-powered insights with multi-connector support
- Generate automated reports (PDF/Excel) on customizable schedules
- View, share, and manage generated reports
- Access AI-generated analysis and recommendations
- Track complete audit trails for compliance

---

## Quick Navigation

### Core Specifications

- **Proposal** → [`proposal.md`](./proposal.md) — Why, what changes, capabilities, impact
- **Design** → [`design.md`](./design.md) — Architecture, decisions, risks, migration plan
- **Tasks** → [`tasks.md`](./tasks.md) — Implementation checklist (all complete)

### Feature Specs

1. **Insight List** — Browse and filter insights
2. **Insight Create** — 6-step wizard for insight configuration
3. **Insight Detail** — Comprehensive view with tabs
4. **Insight Edit** — Modify existing insights
5. **Report List** — Browse and manage reports
6. **Report Viewer** — Embedded PDF/Excel viewing
7. **Report Sharing** — Time-limited share tokens
8. **Audit Trail** — Immutable event timeline

### Production Hardening Specs

9. **Connector Hooks** — React Query hooks for connector data
10. **Insights Hooks** — React Query hooks for insights CRUD
11. **Reports Hooks** — React Query hooks for reports operations
12. **AI Insights Integration** — Agent-runtime integration
13. **Audit Trail Hooks** — Audit trail queries
14. **Route Paths** — Type-safe navigation
15. **Arabic Locale** — Complete RTL localization
16. **Unit Tests** — Comprehensive test coverage

---

## Production Readiness

This specification includes complete production hardening requirements:

### Code Quality ✅

- Zero TypeScript errors
- Zero ESLint violations
- Zero mock implementations
- Type-safe routes (`ROUTE_PATHS`)

### Localization ✅

- English (complete)
- Arabic (complete, ~117 keys)
- RTL layout support

### Testing ✅

- Unit tests for hooks, mutations, utilities, schemas
- 70%+ overall coverage
- 85%+ business logic coverage
- 90%+ critical paths coverage

### API Integration ✅

- Real tRPC API integration
- React Query with tenant scoping
- Cache invalidation
- Canonical error handling

---

## Implementation Status

**All tasks complete.** The feature is production-ready and deployed behind the `ENABLE_INSIGHTS_UI` feature flag.

### Deployment Phases

1. ✅ **Phase 1:** Foundation (type/lint fixes, route paths)
2. ✅ **Phase 2:** API Integration (mock data replacement)
3. ✅ **Phase 3:** Localization (Arabic translations)
4. ✅ **Phase 4:** Testing (unit tests, coverage validation)
5. ✅ **Phase 5:** Validation (final build verification)
6. 🔄 **Phase 6:** Internal Testing (ready)
7. ⏳ **Phase 7:** Beta User Rollout (planned)
8. ⏳ **Phase 8:** GA Release (planned)

---

## Key Files

```
openspec/changes/insights-reports/
├── proposal.md                    # Feature overview and impact
├── design.md                      # Architecture and decisions
├── tasks.md                       # Implementation checklist
├── CONSOLIDATION_SUMMARY.md       # Spec consolidation details
└── specs/                         # Detailed feature specifications
    ├── insight-list/
    ├── insight-create/
    ├── insight-detail/
    ├── insight-edit/
    ├── report-list/
    ├── report-viewer/
    ├── report-sharing/
    ├── audit-trail/
    ├── connector-hooks/
    ├── insights-hooks/
    ├── reports-hooks/
    ├── ai-insights-integration/
    ├── audit-trail-hooks/
    ├── route-paths-insights/
    ├── insights-arabic-locale/
    └── insights-unit-tests/
```

---

## Related Documentation

- **Testing Policy:** `docs/05-reference/testing-policy.md`
- **Multi-Tenant Guardrails:** `docs/05-reference/multi-tenant-guardrails.md`
- **Frontend Governance:** `docs/05-reference/frontend-governance.md`
- **Router SSOT:** `apps/frontend/src/router/utils/route-paths.ts`
- **Deployment Runbook:** `docs/04-deployment-and-monitoring/insights-reports-deployment-runbook.md`

---

## Consolidation Note

This specification was consolidated from two sources on 2026-05-04:

- Original: `/openspec/changes/insights-reports/`
- Production: `/openspec/changes/insights-reports-production/` (archived)

**Single Source of Truth:** All future development should reference this consolidated specification only.

See [`CONSOLIDATION_SUMMARY.md`](./CONSOLIDATION_SUMMARY.md) for consolidation details.
