## Tenant Logic Consolidation Implementation Plan Prompt

### Background

Tenant requirements were implemented using the plan in:

- `/docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`

Implementation is currently distributed across multiple services and layers, which increases maintenance overhead, creates duplication risk, and weakens consistency guarantees.

### Objective

Develop a comprehensive, standards-aligned implementation plan to consolidate tenant logic into a single shared source of truth package while preserving current behavior and tenant isolation guarantees.

### Task

Conduct a deep analysis of the existing tenant implementation and produce one actionable implementation plan document that defines how to centralize tenant logic, ownership, and integration points.

### Required Inputs

Use the following changelogs as mandatory analysis inputs:

- `/changelog/2026-04-25-tenant-requirements-phase-1-2-implementation.md`
- `/changelog/2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md`
- `/changelog/2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md`
- `/changelog/2026-04-25-tenant-requirements-phase-7-observability-rate-limits-docs.md`

### Analysis Requirements

1. Map all tenant-related logic by layer (API, shared packages, frontend, worker, database, middleware, observability).
2. Identify duplication, coupling hotspots, drift risks, and inconsistent contracts.
3. Define a target architecture for a shared tenant package (clear module boundaries, public API, and ownership).
4. Specify migration strategy (phased rollout, backward compatibility, deprecation path, and rollback safety).
5. Include quality controls (test strategy, validation gates, performance impact checks, security/isolation checks).
6. Align recommendations with industry best practices for multi-tenant SaaS architecture and maintainability.

### Deliverable

Produce a single file containing a comprehensive implementation plan with:

- Executive summary
- Current-state findings
- Target-state architecture
- Step-by-step migration plan with phases and dependencies
- Risk register with mitigations
- Verification and acceptance criteria
- Estimated effort and sequencing recommendations

### Output Standard

The plan must be specific, implementation-ready, and written in a professional engineering format suitable for direct execution by multiple teams.
