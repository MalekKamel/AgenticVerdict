## Route Guards Single Source of Truth - Analysis and Implementation Plan Prompt

### Context

The current `beforeLoad` authorization and routing logic is duplicated across individual route files, which increases maintenance overhead and raises the risk of inconsistent behavior and regressions.  
Example reference: `/apps/frontend/src/routes/$locale/onboarding.tsx`.

### Objective

Produce a complete, reusable route-guard architecture that serves as the single source of truth for all route-level access and redirect decisions in the frontend application.

### Task

Conduct a thorough analysis of the current route-guard and `beforeLoad` implementation across the codebase, then create a comprehensive implementation plan for consolidating this logic into a centralized, reusable solution aligned with industry standards and best practices.

### Required Deliverable

Create one markdown file that includes:

- Current-state analysis of how route guards and `beforeLoad` logic are implemented today
- Key maintainability, correctness, and scalability issues in the current approach
- Target architecture for a single source of truth route-guard system
- Recommended design patterns and rationale (with best-practice references)
- Step-by-step implementation plan, including sequencing and dependencies
- Migration strategy for existing routes with low regression risk
- Testing strategy (unit, integration, and route-level behavior coverage)
- Risk assessment with mitigation actions and rollback considerations
- Clear acceptance criteria and definition of done

### Quality Expectations

- Be specific, practical, and implementation-ready
- Prioritize consistency, maintainability, and developer ergonomics
- Ensure compatibility with existing routing and auth flows
- Avoid generic recommendations; tie decisions directly to repository context
