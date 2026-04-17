# Implementation Plan: Production Hardening

**Branch**: `013-production-hardening` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/13-production-hardening/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Phase 13 implements production hardening for the AgenticVerdict UI system through accessibility compliance (WCAG 2.1 AA), performance monitoring (Core Web Vitals), bundle optimization, error tracking, and analytics integration. This phase establishes continuous quality assurance through automated CI checks, production monitoring, and documented maintenance processes. The technical approach integrates Lighthouse CI for performance budgets, axe-core for accessibility testing, webpack-bundle-analyzer for bundle optimization, Sentry for error tracking, and privacy-friendly analytics (Plausible or PostHog). All monitoring tools integrate with existing CI/CD pipelines and observability infrastructure without disrupting the multi-process architecture (TanStack Start web frontend, Fastify API server, BullMQ worker).

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**: TanStack Start 1.x, Mantine UI v9, tRPC v11, Playwright, Vitest
**Storage**: PostgreSQL 16 (tenant settings, feature flags, audit logs), Redis (caching, queues)
**Testing**: Playwright (E2E accessibility tests), Vitest (unit tests), axe-core (accessibility assertions)
**Target Platform**: Web browsers (Chrome/Firefox/Safari latest 2 versions, Edge), Mobile browsers (iOS Safari, Android Chrome)
**Project Type**: Multi-tenant SaaS web application with server-side rendering (TanStack Start)
**Performance Goals**: <2s page load (3G), <3s time to interactive, <500KB initial bundle, Lighthouse score ≥90
**Constraints**: WCAG 2.1 AA compliance required, RTL support for Arabic, bundle size budgets enforced in CI, PII scrubbing for error tracking
**Scale/Scope**: 14 major application routes, 50+ UI components, 5 critical user paths, 2 languages (English/Arabic), 10+ tenant themes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|-----------|--------|-------|
| **Accessibility First** | ✅ Pass | WCAG 2.1 AA is non-negotiable; all user stories prioritize accessibility compliance with automated and manual testing |
| **Performance Is a Feature** | ✅ Pass | Performance budgets enforced in CI; Core Web Vitals tracked in production; bundle optimization prevents bloat |
| **Data-Driven Decisions** | ✅ Pass | Analytics integration provides real usage data for product decisions; error tracking informs prioritization |
| **Continuous Quality** | ✅ Pass | Automated CI checks (Lighthouse, axe-core) prevent regressions; documented maintenance processes ensure sustainability |
| **Privacy by Design** | ✅ Pass | PII scrubbing in error tracking; privacy-friendly analytics (GDPR compliant); tenant data isolation respected |

**Rationale**: Phase 13 strengthens existing architectural principles by adding observability, automation, and compliance verification. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/13-production-hardening/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification with user stories
├── research.md          # (Optional) Tool evaluation research
├── data-model.md        # (Optional) Monitoring/auditing data models
├── quickstart.md        # (Optional) Developer onboarding guide
├── contracts/           # (Optional) Monitoring API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/frontend/
├── .github/
│   └── workflows/
│       ├── lighthouse-ci.yml          # Lighthouse CI workflow
│       └── accessibility-ci.yml       # axe-core accessibility tests
├── apps/frontend/src/
│   ├── lib/
│   │   ├── monitoring/
│   │   │   ├── analytics.ts           # Analytics event tracking (Plausible/PostHog)
│   │   │   ├── error-tracking.ts      # Sentry initialization and error scrubbing
│   │   │   ├── performance.ts         # Core Web Vitals tracking
│   │   │   └── bundle-analysis.ts     # Bundle analysis utilities
│   │   └── utils/
│   │       ├── accessibility.ts       # Accessibility helper functions (A11yAnnouncer, focus management)
│   │       └── keyboard-nav.ts        # Keyboard navigation utilities
│   ├── components/
│   │   ├── monitoring/
│   │   │   ├── ErrorBoundary.tsx      # React error boundary with Sentry integration
│   │   │   ├── PerformanceDashboard.tsx # Internal performance metrics viewer
│   │   │   └── A11yLiveRegion.tsx     # Live region component for dynamic content announcements
│   │   └── atoms/
│   │       ├── SkipLink.tsx           # "Skip to main content" accessibility link
│   │       └── FocusTrap.tsx          # Focus trap for modals/dropdowns
│   ├── routes/
│   │   ├── _index.tsx                 # Dashboard with Core Web Vitals tracking
│   │   └── admin/
│   │       └── performance.tsx        # Internal performance monitoring dashboard
│   └── styles/
│       └── accessibility.css          # Accessibility-only styles (focus indicators, screen reader only text)
├── package.json                        # Added: @axe-core/react, @sentry/react, webpack-bundle-analyzer
├── playwright.config.ts                # Updated: Accessibility test configurations
├── vitest.config.ts                    # Updated: Coverage thresholds for monitoring code
└── tsconfig.json                       # Updated: Strict type checking for monitoring utilities

packages/monitoring/                    # (Optional) Shared monitoring package for web/mobile/CLI
├── src/
│   ├── analytics.ts                    # Analytics client abstraction
│   ├── error-tracking.ts               # Error tracking client abstraction
│   └── performance.ts                  # Performance monitoring utilities
└── package.json

docs/
├── 06-reference/
│   ├── accessibility-guide.md         # Accessibility testing guide and patterns
│   ├── performance-guide.md           # Performance optimization strategies
│   └── incident-runbooks.md           # Runbooks for common operational issues
└── architecture/
    └── ui/
        └── 13-production-hardening.md  # Phase 13 implementation details
```

**Structure Decision**: Monitoring and accessibility utilities live in `apps/frontend/src/lib/monitoring/` since they are web-specific (browser APIs for Core Web Vitals, DOM manipulation for accessibility). Shared monitoring abstractions (`packages/monitoring/`) enable future mobile/CLI clients to use the same analytics and error tracking services with platform-specific implementations. CI configuration uses standard GitHub Actions workflows (`.github/workflows/`) for Lighthouse and accessibility testing.

## Complexity Tracking

> **No violations detected** - Phase 13 strengthens existing architecture without introducing complexity that violates the constitution.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| N/A | N/A | N/A |

## Implementation Approach

### Phase 0: Tool Evaluation (1-2 days)

**Goal**: Evaluate and select monitoring, accessibility testing, and analytics tools that integrate with the existing TanStack Start + Mantine v9 stack.

**Research Tasks**:
- Evaluate error tracking providers (Sentry vs. LogRocket vs. Rollbar) for React SSR applications
- Test analytics providers (Plausible vs. PostHog vs. Google Analytics) for privacy compliance and ease of integration
- Validate Lighthouse CI integration with TanStack Start's file-based routing
- Test axe-core React integration with Mantine v9 components
- Confirm webpack-bundle-analyzer compatibility with Turborepo build pipeline

**Deliverables**: `research.md` documenting tool selections with comparison matrices and proof-of-concept code snippets.

### Phase 1: Accessibility Compliance (1 week)

**Goal**: Implement WCAG 2.1 AA compliance with automated testing and manual validation.

**Implementation Tasks**:
1. **Accessibility Utilities** (`apps/frontend/src/lib/utils/accessibility.ts`)
   - `A11yAnnouncer` component for screen reader announcements (live regions)
   - `useFocusManagement` hook for trapping focus in modals/dropdowns
   - `skipToContent` link implementation for keyboard users
   - `announceToScreenReader` utility for dynamic content updates

2. **Component Remediation**
   - Audit existing Mantine components for accessibility gaps
   - Add missing ARIA labels, roles, and states to interactive elements
   - Implement visible focus indicators (custom CSS overrides for Mantine focus rings)
   - Ensure all icons have `aria-label` or are hidden from screen readers (`aria-hidden`)

3. **Automated Testing**
   - Integrate `@axe-core/react` for automated accessibility testing
   - Add Playwright a11y tests for 5 critical user paths
   - Configure CI to fail on axe-core violations (zero-tolerance policy)
   - Set up GitHub Actions workflow for accessibility scans

4. **Manual Testing**
   - Conduct keyboard-only navigation audit of all routes
   - Test with NVDA (Windows), VoiceOver (macOS/iOS), and TalkBack (Android)
   - Validate RTL accessibility (Arabic) with screen readers
   - Document accessibility patterns in `accessibility-guide.md`

**Deliverables**: WCAG 2.1 AA compliant UI, automated a11y tests in CI, accessibility guide documentation.

### Phase 2: Performance Monitoring (1 week)

**Goal**: Implement Core Web Vitals tracking, bundle optimization, and CI performance budgets.

**Implementation Tasks**:
1. **Core Web Vitals Tracking** (`apps/frontend/src/lib/monitoring/performance.ts`)
   - Integrate `web-vitals` library for LCP, FID, CLS measurement
   - Send metrics to analytics backend (Plausible custom events or dedicated metrics endpoint)
   - Add performance context (page, tenant, route, device type)
   - Calculate percentiles (p75, p95) server-side for aggregated reporting

2. **Lighthouse CI Integration**
   - Install `@lhci/cli` and configure for TanStack Start
   - Create `.lighthouserc.json` with performance budgets (score ≥90, budgets for all routes)
   - Add GitHub Actions workflow to run Lighthouse on all PRs
   - Configure Lighthouse to fail on budget regression

3. **Bundle Optimization**
   - Analyze current bundle with `webpack-bundle-analyzer`
   - Implement route-based code splitting (automatic with TanStack Start, verify configuration)
   - Lazy load heavy components (chart libraries, rich text editors) via `React.lazy()`
   - Remove duplicate dependencies (check for multiple versions of lodash, moment.js, etc.)
   - Configure Turborepo to cache bundle analysis results

4. **Performance Dashboard** (Internal)
   - Create internal route `/admin/performance` for viewing Core Web Vitals
   - Display aggregate metrics (p75 LCP, FID, CLS) with trend lines
   - Show page-level breakdowns and route-specific performance
   - Link to Lighthouse reports for detailed audits

**Deliverables**: Core Web Vitals tracking, Lighthouse CI with budgets, optimized bundles, internal performance dashboard.

### Phase 3: Error Tracking and Analytics (1 week)

**Goal**: Integrate error tracking and analytics to enable data-driven product development and rapid incident response.

**Implementation Tasks**:
1. **Error Tracking with Sentry** (`apps/frontend/src/lib/monitoring/error-tracking.ts`)
   - Install `@sentry/react` and configure for TanStack Start SSR
   - Implement PII scrubbing (sanitize URLs, query params, error context)
   - Attach tenant context (tenant ID, user role, feature flags) to all errors
   - Integrate with tRPC error handling for backend error correlation
   - Create `ErrorBoundary` component to catch React component errors

2. **Analytics Integration** (`apps/frontend/src/lib/monitoring/analytics.ts`)
   - Select provider (Plausible recommended for privacy, self-hostable)
   - Implement `trackPageView` for route changes
   - Implement `trackEvent` for feature usage (e.g., `insight_created`, `connector_added`)
   - Add funnel tracking for critical user paths (connector setup → insight creation → report generation)
   - Configure analytics to respect tenant data isolation (no cross-tenant data leakage)

3. **Error and Analytics Dashboards**
   - Configure Sentry dashboards for error monitoring (grouped errors, severity, trends)
   - Configure analytics dashboards for product metrics (DAU, feature adoption, user flows)
   - Set up alerts for critical error spikes (>50 errors/min, >10% error rate)
   - Document incident response runbooks in `incident-runbooks.md`

4. **Privacy and Compliance**
   - Implement consent banner for analytics (GDPR/CCPA compliance)
   - Ensure PII scrubbing in error reports (passwords, tokens, personal identifiers)
   - Configure analytics to anonymize IP addresses
   - Add tenant-level analytics opt-out for enterprise customers

**Deliverables**: Error tracking with Sentry, analytics integration, monitoring dashboards, incident runbooks.

### Phase 4: Bundle Analysis and Optimization (3-5 days)

**Goal**: Optimize bundle sizes through strategic code splitting, tree shaking, and dependency analysis.

**Implementation Tasks**:
1. **Bundle Analysis Setup**
   - Integrate `webpack-bundle-analyzer` with TanStack Start build
   - Generate baseline bundle report for all routes
   - Identify large dependencies (>50KB) for optimization opportunities
   - Check for duplicate dependencies across packages (yarn/npm dedupe)

2. **Code Splitting Strategies**
   - Verify route-based splitting is enabled (TanStack Start default)
   - Lazy load heavy components:
     - Chart libraries (Recharts, Victory) - load only on insight/report pages
     - Rich text editors (used in template editing) - load on-demand
     - Date pickers (Mantine DateTime) - load only when needed
   - Split vendor chunks for better caching (React, ReactDOM, Mantine separate)

3. **Dependency Optimization**
   - Replace moment.js with date-fns or luxon (smaller, tree-shakeable)
   - Replace lodash with individual functions or es-toolkit (smaller alternatives)
   - Remove unused Mantine modules (Mantine supports tree-shaking, verify imports)
   - Audit for font file sizes and optimize (subset fonts, use WOFF2)

4. **CI Integration**
   - Add bundle size check to CI (fail if bundle grows >5% without explicit approval)
   - Generate bundle diff in PR comments (using size-limit or bundlesize)
   - Cache bundle analysis reports in Turborepo for faster builds

**Deliverables**: Optimized bundles (<500KB initial, <200KB per route), CI bundle checks, dependency audit report.

### Phase 5: Ongoing Maintenance Processes (3-5 days)

**Goal**: Document and automate maintenance processes to ensure sustainability.

**Implementation Tasks**:
1. **Accessibility Maintenance**
   - Create accessibility checklist for developers (keyboard nav, screen reader test, color contrast)
   - Document accessibility patterns in `accessibility-guide.md`
   - Set up quarterly accessibility audits (internal or external)
   - Configure axe-core to run in CI for every PR (zero violations)

2. **Performance Maintenance**
   - Document performance optimization strategies in `performance-guide.md`
   - Set up monthly Lighthouse audits (automated via GitHub Actions cron)
   - Create performance regression runbook (steps to diagnose and fix)
   - Configure alerts for Core Web Vitals degradation in production

3. **Incident Response Runbooks** (`incident-runbooks.md`)
   - Performance degradation: Diagnose slow routes, optimize bundles, check database queries
   - Error spikes: Triage errors in Sentry, identify root cause, deploy hotfix
   - Accessibility issues: Reproduce with screen reader, fix component, update tests
   - Bundle regression: Identify new dependencies, implement code splitting, tree-shake unused code

4. **Documentation**
   - Update `CLAUDE.md` with monitoring and accessibility requirements
   - Create quickstart guide for running audits locally
   - Document how to interpret metrics and dashboards
   - Add onboarding section for new developers (how to run tests, audits)

**Deliverables**: Maintenance documentation, runbooks, CI automation for recurring audits.

## Dependencies

### External Dependencies

```json
{
  "dependencies": {
    "@axe-core/react": "^4.9.0",
    "@sentry/react": "^7.80.0",
    "web-vitals": "^3.5.0",
    "plausible-tracker": "^0.3.8" // or posthog-js
  },
  "devDependencies": {
    "@lhci/cli": "^0.12.0",
    "webpack-bundle-analyzer": "^4.10.0",
    "@playwright/test": "^1.40.0" // already installed, add a11y tests
  }
}
```

### Internal Dependencies

- Requires TanStack Start application (Phase 00: Foundation)
- Requires tRPC API integration for error correlation
- Requires tenant context for multi-tenant analytics isolation
- Requires existing component library for accessibility remediation

## Integration Points

### CI/CD Pipeline

```yaml
# .github/workflows/accessibility-ci.yml
name: Accessibility Tests
on: [pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:a11y  # axe-core tests

# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - run: lhci autorun --collect.url=http://localhost:3000
```

### Error Tracking Integration

```typescript
// apps/frontend/src/lib/monitoring/error-tracking.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSend(event) {
    // Scrub PII
    event.request?.url &&= sanitizeUrl(event.request.url);
    event.user &&= sanitizeUser(event.user);
    return event;
  }
});
```

### Analytics Integration

```typescript
// apps/frontend/src/lib/monitoring/analytics.ts
import Plausible from "plausible-tracker";

export const plausible = Plausible({
  domain: window.location.hostname,
  trackLocalhost: false
});

export const trackEvent = (name: string, props?: Record<string, unknown>) => {
  plausible.trackEvent(name, { props });
};
```

## Testing Strategy

### Accessibility Testing

- **Automated**: axe-core tests for all routes (zero violations in CI)
- **Manual**: Keyboard-only navigation, screen reader testing (NVDA, VoiceOver, TalkBack)
- **Visual**: Color contrast checks, zoom testing (200%), layout testing (RTL)

### Performance Testing

- **Automated**: Lighthouse CI for all routes (score ≥90, budgets enforced)
- **Production**: Core Web Vitals tracked for p75 and p95 percentiles
- **Manual**: Bundle analysis on every build, route load time testing

### Error Tracking Testing

- **Unit**: PII scrubbing functions, error context attachment
- **Integration**: Sentry receives errors with correct context, tenant ID is attached
- **E2E**: Trigger intentional errors, verify they appear in Sentry dashboard

### Analytics Testing

- **Unit**: Event tracking functions fire with correct properties
- **Integration**: Analytics events appear in dashboard with correct dimensions
- **E2E**: Complete user journey generates expected funnel events

## Rollout Plan

### Phase 1 Rollout (Accessibility)
1. Week 1: Implement accessibility utilities and component remediation
2. Week 1: Add automated axe-core tests to CI
3. Week 2: Conduct manual testing and fix remaining issues
4. Week 2: Deploy accessibility fixes to production (no breaking changes)

### Phase 2 Rollout (Performance)
1. Week 3: Implement Core Web Vitals tracking and Lighthouse CI
2. Week 3: Optimize bundles, implement code splitting
3. Week 4: Deploy performance monitoring to production
4. Week 4: Validate performance budgets in production

### Phase 3 Rollout (Error Tracking & Analytics)
1. Week 5: Integrate Sentry and Plausible/PostHog
2. Week 5: Deploy error tracking to production (test error reporting)
3. Week 6: Deploy analytics to production (respect consent)
4. Week 6: Create dashboards and validate data collection

### Phase 4 Rollout (Bundle Optimization)
1. Week 7: Analyze bundles and implement optimizations
2. Week 7: Deploy optimized bundles to production
3. Week 8: Monitor bundle sizes and performance in production

### Phase 5 Rollout (Maintenance)
1. Week 9: Document maintenance processes and runbooks
2. Week 9: Set up automated recurring audits (GitHub Actions cron)
3. Week 10: Validate all processes and handoff to ops team

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Accessibility fixes break existing functionality** | Comprehensive E2E tests for all user paths before remediation; gradual rollout with feature flags |
| **Performance budgets prevent critical features** | Temporary override process with explicit approval; optimize dependencies before adding features |
| **Error tracking exposes PII** | Multi-layer PII scrubbing (client-side, server-side, Sentry filters); regular audits of error context |
| **Analytics rejected by privacy-conscious customers** | Privacy-first provider (Plausible); tenant-level opt-out; explicit consent banner; GDPR/CCPA compliance |
| **Bundle optimization effort exceeds value** | Focus on low-hanging fruit first (route splitting, lazy loading); measure performance improvements before deep optimization |
| **CI tests increase build time** | Parallelize Lighthouse and axe-core tests; cache results; run on PRs only (not every commit) |

## Success Metrics

### Accessibility Metrics
- Zero axe-core violations in CI for 100% of routes
- Manual keyboard navigation passes for 5 critical user paths
- Screen reader testing passes (NVDA, VoiceOver, TalkBack) for English and Arabic

### Performance Metrics
- Lighthouse score ≥90 for all routes in CI
- Core Web Vitals (p75) in production: LCP <2.5s, FID <100ms, CLS <0.1
- Initial bundle <500KB gzipped, route chunks <200KB gzipped

### Error Tracking Metrics
- Mean time to detection (MTTD) for critical errors <5 minutes
- Mean time to resolution (MTTR) for errors with context <4 hours
- Zero critical errors without context in Sentry

### Analytics Metrics
- Analytics events firing for 100% of page views and critical user actions
- Funnel tracking operational for connector setup → insight creation → report generation
- Tenant-level data isolation validated (no cross-tenant leakage)

### Maintenance Metrics
- Monthly performance audits automated and documented
- Quarterly accessibility audits scheduled and completed
- Runbooks validated for top 5 incident scenarios

## Open Questions

1. **Error tracking provider**: Sentry is the default choice. Should we evaluate Rollbar or LogRocket for specific features (session replay)?
2. **Analytics provider**: Plausible (privacy-first, self-hostable) vs. PostHog (more features, product analytics). Decision needed based on privacy requirements and feature needs.
3. **External accessibility audit**: Should we budget for an external accessibility audit, or is internal testing sufficient for initial compliance?
4. **Performance budget enforcement**: Should performance budget failures block all deployments, or allow temporary overrides with approval?
5. **Multi-process monitoring**: How do we correlate errors across the web frontend, API server, and worker processes? (Unified Sentry project vs. separate projects)

## Next Steps

1. **Phase 0 Research**: Evaluate error tracking and analytics providers (1-2 days). Document findings in `research.md`.
2. **Phase 1 Implementation**: Begin accessibility compliance work (1 week). Start with automated axe-core tests.
3. **Phase 2 Implementation**: Set up performance monitoring and Lighthouse CI (1 week).
4. **Phase 3 Implementation**: Integrate error tracking and analytics (1 week).
5. **Phase 4 Implementation**: Optimize bundles and set up CI checks (3-5 days).
6. **Phase 5 Implementation**: Document maintenance processes and runbooks (3-5 days).
