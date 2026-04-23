## Mocking and Development Code Consolidation Plan

### Context

Mocking and development-only logic are currently distributed across multiple parts of the codebase, including frontend and tenant-related paths (for example, `/apps/frontend/src/lib/api/auth-api.ts`). Tenant ID mocking is also repeated in several locations. This pattern introduces risk, increases maintenance overhead, and can allow mock behavior to leak into production paths.

### Objective

Design a centralized mocking and development configuration system as a single source of truth in a core package. The system must be environment-variable driven and reusable across all applications and packages, with no hardcoded mock toggles in feature code.

### Task

Conduct a full repository-level analysis of mocking and development-only behavior, then produce a comprehensive implementation plan to consolidate all mocks into the new core system.

### Scope of Analysis

- Identify all current mock/dev code paths across `apps/*` and `packages/*`.
- Detect hardcoded tenant IDs, hardcoded mock flags, and conditional mock logic embedded in production modules.
- Map how environment variables are currently used (or bypassed) for mock behavior.
- Classify each finding by runtime surface (frontend, API, worker, shared packages, tests, scripts, CI/dev tooling).

### Required Deliverable

Create one planning document that includes:

- A complete inventory of existing mock/dev patterns and locations.
- Risk assessment (especially production-leak risk and tenant-isolation risk).
- Target architecture for a core-package mock/dev source of truth.
- Standardized environment-variable contract (names, defaults, allowed values, precedence rules).
- Migration strategy by phase, including sequencing, rollback approach, and dependency ordering.
- Refactor guidelines for replacing hardcoded logic with centralized utilities.
- Validation strategy (unit, integration, and production-safety checks).
- Rollout checklist with acceptance criteria and definition of done.

### Constraints

- Preserve multi-tenant isolation and avoid tenant-specific hardcoding.
- Ensure production-safe defaults (mocks disabled unless explicitly enabled in approved environments).
- Keep behavior deterministic across local dev, CI, and production builds.
- Do not mix mock logic directly into feature/business flows when central abstraction can be used.
