## Context

**Current State:**

- Backend APIs for insights and reports are fully implemented (`apps/api/src/routes/v1/insights.ts`, `apps/api/src/routes/v1/reports.ts`)
- Frontend has only a basic dashboard widget showing recent insights
- No UI for creating, configuring, or managing insights
- No report viewer or report list pages
- Design system documentation complete (`docs/architecture/ui/04-pages/insights-reports.md`)
- **Production Readiness Gaps**: Mock implementations in wizard flows, 9 TypeScript errors, 4 ESLint violations, 2 failing unit tests, missing Arabic localization, 12 hardcoded route references

**Constraints:**

- Must use existing REST API endpoints (no backend changes needed)
- Must follow multi-tenant safety patterns (tenant context from JWT, `dbScoped()` wrapper)
- Must use design system components from `packages/ui/` and Mantine
- Must support Arabic RTL and English LTR layouts
- Must implement proper error handling using canonical error system
- Unit tests only (no UI/E2E testing required per testing policy)
- Must work with mock adapter mode for deterministic testing

**Stakeholders:**

- Frontend Team (implementation)
- Backend Team (API support, already complete)
- UX Team (design system compliance)
- QA Team (testing strategy)

## Goals / Non-Goals

**Goals:**

- Implement complete insight management UI (list, create, detail, edit)
- Implement report viewer and list pages
- Integrate with existing backend APIs using React Query
- Follow design system patterns and accessibility standards
- Support multi-tenant context propagation
- Implement proper loading, empty, error, and success states
- Replace all mock implementations with real tRPC API integration
- Achieve zero TypeScript errors and zero ESLint violations
- Fix failing unit tests and add missing test coverage
- Complete Arabic localization for all insights/reports strings
- Replace hardcoded routes with type-safe ROUTE_PATHS constants
- Meet unit test coverage thresholds (70% overall, 85% business logic, 90% critical)

**Non-Goals:**

- Backend API changes (already complete)
- Database schema changes (JSONB columns already support flexible config)
- New design system components (reuse existing Mantine + `packages/ui/`)
- Mobile app implementation (web-only for this phase)
- Template library for insights (future enhancement)
- UI component testing (React Testing Library component tests out of scope)
- E2E testing with Playwright (explicitly excluded per plan)
- Accessibility audits or visual regression testing

## Decisions

### 1. Feature-Based Directory Structure

**Decision:** Organize code by feature (`features/insights/`, `features/reports/`) rather than by type.

**Rationale:**

- Follows existing connector feature pattern
- Better code locality (pages, hooks, API integration co-located)
- Easier to reason about and maintain
- Supports team ownership by feature area

**Alternatives Considered:**

- Type-based structure (`pages/`, `components/`, `hooks/`): Rejected due to poor code locality
- Domain-based structure (`domains/business-intelligence/`): Over-engineered for current scope

### 2. React Query for Server State

**Decision:** Use React Query (TanStack Query) for all API interactions.

**Rationale:**

- Consistent with existing connector feature implementation
- Built-in caching, invalidation, and optimistic updates
- DevTools for debugging
- Handles loading/error states elegantly

**Alternatives Considered:**

- SWR: Less feature-rich for complex mutations
- Redux Toolkit Query: Overkill for this use case, adds bundle size
- Custom hooks: Would duplicate React Query functionality

### 3. Multi-Step Wizard for Insight Creation

**Decision:** Implement 6-step wizard with form state preservation.

**Rationale:**

- Complex configuration requires guided flow
- Reduces cognitive load per step
- Allows validation at each step
- Users can go back without losing progress
- Follows design spec wireframes

**Alternatives Considered:**

- Single long form: Rejected due to complexity and poor UX
- Modal-based wizard: Rejected due to space constraints for connector/metric selection
- Accordion form: Rejected due to validation complexity

### 4. PDF Viewer Integration

**Decision:** Use `react-pdf` for embedded PDF viewing.

**Rationale:**

- Lightweight and well-maintained
- Supports zoom, page navigation, text selection
- Works with Next.js App Router
- No external service dependencies

**Alternatives Considered:**

- Native browser PDF viewer (iframe): Rejected due to inconsistent UX across browsers
- PDF.js directly: More complex, `react-pdf` provides better React integration
- Third-party service (DocuSign, etc.): Unnecessary cost and complexity

### 5. Excel Preview Strategy

**Decision:** Implement basic Excel preview using SheetJS for rendering, with download for full experience.

**Rationale:**

- Complex Excel rendering (charts, formulas) is better handled by native Excel
- Preview provides quick glance at data
- Download button available for full spreadsheet experience

**Alternatives Considered:**

- Full Excel rendering with all features: Rejected due to complexity and bundle size
- Download-only: Rejected due to poor UX for quick previews
- Third-party Excel viewer: Unnecessary cost and complexity

### 6. Form Validation with React Hook Form + Zod

**Decision:** Use React Hook Form with Zod schema validation.

**Rationale:**

- Consistent with existing forms in codebase
- Type-safe validation schemas
- Excellent error message handling
- Performance optimized (minimal re-renders)

**Alternatives Considered:**

- Formik: Less performant, larger bundle
- Custom validation: Would duplicate functionality
- Yup: Less type-safe than Zod

### 7. Report Versioning Display

**Decision:** Show version history in report detail view with SHA-256 verification indicator.

**Rationale:**

- Transparency about report immutability
- Builds trust in compliance scenarios
- Leverages existing backend versioning

**Alternatives Considered:**

- Hide versioning complexity: Rejected due to compliance requirements
- Separate version history page: Rejected due to navigation complexity

### 8. Hook Architecture: Use React Query v5 Patterns

**Decision:** Create dedicated hooks for each entity (insights, reports, connectors, audit-trail) using TanStack Query v5 patterns with proper tenant scoping.

**Rationale:**

- Consistent with existing frontend patterns in other features
- Built-in caching, retry logic, and error handling
- Cache invalidation on mutations ensures data consistency
- Type-safe through tRPC hook inference

**Alternatives Considered:**

- SWR: Less mature TypeScript support, smaller ecosystem
- Manual fetch + useState: Would lose caching, retries, deduplication
- Redux/Zustand: Overkill for server-state management

### 9. Mock Data Replacement Strategy

**Decision:** Replace mock data incrementally with feature flag fallback. Use `ENABLE_INSIGHTS_UI` flag to toggle between mock and real API during rollout.

**Rationale:**

- Allows gradual rollout and quick rollback if issues discovered
- Enables testing in mock adapter mode for deterministic tests
- Reduces risk of breaking production during deployment

**Alternatives Considered:**

- Big-bang replacement: Higher risk, harder to rollback
- A/B testing: Unnecessary complexity for internal feature

### 10. TypeScript Error Resolution

**Decision:** Fix type errors by aligning schema definitions with actual database columns and query patterns, not by using type assertions.

**Rationale:**

- Type assertions hide real issues and defeat type safety
- Schema alignment ensures runtime behavior matches types
- Prevents future bugs from type drift

**Specific Fixes:**

- Line 96/98: Properly handle optional `or()` conditions with null checks
- Line 365: Remove `updatedAt` from update payload (not in Drizzle schema)
- Missing `getById`: Add procedure to tRPC router definition

### 11. Localization Approach

**Decision:** Translate all missing Arabic keys in a single batch, then verify with RTL layout testing.

**Rationale:**

- Batch approach ensures consistency across related keys
- Prevents partial localization issues
- Single review cycle with native speaker

**Key Namespaces:**

- `insights.*` (~75 keys)
- `reports.*` (~30 keys)
- `auditTrail.*` (~12 keys)

### 12. Route Path Centralization

**Decision:** Add all insights/reports routes to `ROUTE_PATHS` constant and replace all hardcoded strings with imports.

**Rationale:**

- Single source of truth for route paths
- Type safety prevents typos and broken links
- Easier refactoring if routes change
- Consistent with existing frontend governance standards

### 13. Unit Test Scope

**Decision:** Test only hooks, mutations, utilities, and schemas. Exclude all component/UI tests.

**Rationale:**

- Per testing policy and production-readiness-plan requirements
- Hooks provide highest ROI for test coverage
- UI tests are brittle and slow; hook tests verify business logic
- Coverage thresholds achievable without component tests

**Test Files:**

- `insight-api.test.ts` (fix existing)
- `insight-api.mutation.test.ts` (new)
- `report-api.test.ts` (fix existing)
- `wizard-validation.test.ts` (new)

## Risks / Trade-offs

**[PDF Viewer Performance]** → Mitigation: Implement virtualization for large PDFs, lazy load pages, show loading states

**[Form State Management Complexity]** → Mitigation: Use React Hook Form's `useFormContext` for wizard state, preserve state on navigation

**[Excel Preview Limitations]** → Mitigation: Clear UI indication that preview is simplified, prominent download button

**[Multi-Step Wizard Abandonment]** → Mitigation: Save draft insights (future enhancement), show progress indicator, allow cancel anytime

**[Large Report Files]** → Mitigation: Show file size before download, implement progress indicators, use streaming for very large files

**[RTL Layout Complexity]** → Mitigation: Use Mantine's built-in RTL support, test all pages in Arabic locale, use logical CSS properties

**[API Integration Breaks Existing Flows]** → Mitigation: Use feature flag `ENABLE_INSIGHTS_UI` for gradual rollout. Test extensively in mock adapter mode before enabling. Keep mock data as fallback during transition.

**[Arabic Translations Inaccurate]** → Mitigation: Schedule native speaker review before GA release. Use professional translation service if internal review unavailable. Test RTL layout visually.

**[Unit Test Coverage Thresholds Not Met]** → Mitigation: Focus on critical paths first (tenant scoping, error handling). Use parametrized tests for similar hooks. Skip low-value edge cases if blocking.

**[Type Changes Break Downstream Consumers]** → Mitigation: Verify all tRPC router changes compile across all packages. Run full typecheck after each change. No breaking changes to public router contracts.

**[AI Insights Fallback]** → Mitigation: Show "AI insights unavailable" message with retry button if agent-runtime is unavailable.

**[Connector Metrics Caching]** → Decision: 5-minute stale time, refetch on window focus.

## Migration Plan

**Phase 1: Foundation (Week 1 / Days 1-2)**

- Set up feature directory structure
- Create React Query API hooks
- Implement insight list page
- Fix TypeScript errors in API routers
- Remove ESLint violations
- Add missing route paths to ROUTE_PATHS
- Fix failing unit test configuration

**Phase 2: Core Features (Week 2-3 / Days 3-5)**

- Implement insight create wizard (all 6 steps)
- Implement insight detail page with tabs
- Implement insight edit page
- Create connector hooks (`useConnectorList`, `useConnectorMetrics`)
- Replace mock data in wizard flows
- Create insights/report hooks
- Implement AI insights integration

**Phase 3: Reports (Week 4 / Day 6)**

- Implement report list page
- Implement report viewer with PDF support
- Implement report sharing modal
- Add Arabic translations for all missing keys
- Verify RTL layout visually
- Test string interpolation and pluralization

**Phase 4: Polish (Week 5 / Days 7-11)**

- Add audit trail visualization
- Implement bulk actions
- Add comprehensive error handling
- Accessibility audit and fixes
- Replace all 12 hardcoded routes with ROUTE_PATHS
- Add missing unit tests for hooks and mutations
- Add validation schema tests
- Run coverage reports and fill gaps
- Verify all thresholds met

**Phase 5: Validation (Day 11)**

- Run `pnpm run typecheck` (zero errors)
- Run `pnpm run lint` (zero violations)
- Run `pnpm run test:unit` (all passing)
- Run `pnpm run build` (successful)

**Rollback Strategy:**

- Feature flag: `ENABLE_INSIGHTS_UI` (default: false)
- Deploy behind flag, enable gradually
- If issues: disable flag, no code rollback needed
- Flip `ENABLE_INSIGHTS_UI` flag to disable feature
- Revert mock data replacement commits if critical issues
- No database migrations required (safe rollback)

**Recommended Rollout Strategy:**

1. Phase 1: Fix type/lint errors (P0 tasks)
2. Phase 2: Replace mock implementations (P0 tasks)
3. Phase 3: Fix unit tests + add missing unit tests (P1 tasks)
4. Phase 4: Add localization (P1 tasks)
5. Phase 5: Route refactoring (P2 tasks)
6. Phase 6: Complete remaining tabs (P2 tasks)
7. Phase 7: Unit test coverage validation
8. Phase 8: Deploy behind `ENABLE_INSIGHTS_UI` feature flag
9. Phase 9: Internal testing (manual QA)
10. Phase 10: Beta user rollout
11. Phase 11: GA release

## Open Questions

1. **PDF Viewer Library**: Confirm `react-pdf` license compatibility with project license
2. **Excel Preview Depth**: How much Excel functionality to support in preview vs. download?
3. **Draft Insights**: Should we implement auto-save draft functionality for incomplete wizard sessions?
4. **Report Retention UI**: Should users see retention policy and `retainUntil` dates in UI?
5. **Bulk Operations**: Which bulk operations are MVP vs. future enhancement?
6. **AI Insights Fallback**: What should display if agent-runtime is unavailable?
   - **Proposed:** Show "AI insights unavailable" message with retry button
7. **Connector Metrics Caching**: How aggressively should connector metrics be cached?
   - **Proposed:** 5-minute stale time, refetch on window focus
8. **Arabic Review**: Do we have access to native Arabic speaker for translation review?
   - **Proposed:** Use professional translation service if internal resource unavailable
9. **Feature Flag Strategy**: Should insights be enabled by default or opt-in for beta?
   - **Proposed:** Opt-in beta for first 2 weeks, then GA rollout
