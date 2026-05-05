# Insights Reports Navigation Implementation Plan

## Context

All development tasks defined in `/openspec/changes/insights-reports/tasks.md` have been completed. However, frontend navigation access to the Insights Reports feature has not yet been implemented.

## Objective

Enable user access to the Insights Reports feature through the application's primary navigation system, specifically integrating with the existing navigation architecture at `/apps/frontend/src/features/shell/ui/app-shell-navigation.ts`.

## Task

Analyze the following artifacts and produce a comprehensive navigation implementation plan:

### Required Analysis

1. **Task Review**: Examine `/openspec/changes/insights-reports/tasks.md` to understand completed feature scope
2. **Architecture Documentation**: Review `/docs/architecture/ui/04-pages/insights-reports.md` for UI patterns and routing requirements

### Deliverable

Create a detailed implementation plan document that addresses:

- **Route Configuration**: Path structure, route hierarchy, and lazy-loading strategy
- **Navigation Integration**: App shell navigation menu placement, icons, labels, and permission gates
- **Accessibility Compliance**: Keyboard navigation, ARIA labels, and screen reader support per WCAG 2.1
- **Localization**: Arabic/English route names and RTL layout considerations
- **State Management**: Navigation state persistence and breadcrumb integration
- **Testing Strategy**: Unit tests for navigation components and E2E flow validation

### Requirements

- Align with existing navigation patterns and design system conventions
- Follow AgenticVerdict multi-tenant architecture (tenant-scoped routes)
- Adhere to Next.js 15 App Router best practices
- Maintain consistency with industry standards for enterprise SaaS navigation

## Output Format

Write the implementation plan to `/openspec/changes/insights-reports/navigation-implementation-plan.md`
