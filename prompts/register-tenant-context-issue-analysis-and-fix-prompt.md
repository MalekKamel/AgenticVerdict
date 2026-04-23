## Objective

Investigate and resolve a registration failure occurring at `http://localhost:3000/en/auth/register`.

## Issue Summary

- User-facing error on submit: `Registration failed`
- Detailed message: `Organization context is missing. Refresh the page or open the link from your invitation again.`

## Scope and Constraints

- Treat this as a **tenant context propagation and validation** issue.
- Use the tenant requirements document as the primary reference:  
  `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
- Preserve existing architecture boundaries and avoid ad hoc tenant-specific logic.

## Required Approach (Step-by-Step)

1. Reproduce the issue reliably on the registration route and capture relevant logs/events.
2. Trace tenant/organization context resolution across:
   - Route/page entry
   - Client state and request payload
   - API boundary (middleware/tRPC/context)
   - Validation and registration service flow
3. Identify the exact failure point where organization context is lost, not initialized, or rejected.
4. Implement a minimal, robust fix aligned with tenant SSOT requirements.
5. Add or update tests (unit/integration) to cover:
   - Successful registration with valid tenant context
   - Expected failure behavior when tenant context is missing
6. Verify end-to-end behavior locally and confirm no regressions in related auth/tenant flows.

## Deliverables

- Root cause analysis (what failed, where, and why).
- Code changes with clear rationale.
- Test updates and execution results.
- Brief risk/regression notes and any follow-up recommendations.
