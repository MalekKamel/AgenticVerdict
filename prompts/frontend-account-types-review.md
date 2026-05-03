# Frontend Account Types Implementation Review

**Created:** 2026-05-02  
**Priority:** High  
**Scope:** Frontend Application (`/apps/frontend/`)  
**Context:** Pre-production greenfield development

---

## Background

The AgenticVerdict business architecture defines two distinct tenant types with different capabilities and workflows:

1. **Direct Business Tenants** - End consumers running their own business intelligence (e.g., Masafh GPS fleet tracking)
2. **Agency Partner Tenants** - Agencies managing multiple client tenants with white-label reporting capabilities

This distinction is implemented in:

- **Business Architecture:** `/docs/architecture/business/business-architecture.md` (Section 2.1, 6.2)
- **Seed Data:** `/docs/development/seeded-data-reference.md` (Multi-tenant seeding with agency partner support)

---

## Objective

Conduct a comprehensive review of the frontend application to verify correct handling of both tenant types and identify any gaps in implementation.

---

## Review Scope

### 1. Tenant Type Detection & Context

- [ ] How does the frontend determine tenant type (Direct vs Agency-Managed)?
- [ ] Is tenant type available in authentication context/session?
- [ ] Are there type guards or utilities for tenant type checks?

### 2. UI/UX Differentiation

- [ ] Do dashboards reflect tenant-type-specific capabilities?
- [ ] Are agency partner features visible/accessible only to agency tenants?
- [ ] Is tenant switching implemented for agency partners managing multiple clients?

### 3. Navigation & Route Protection

- [ ] Are routes guarded based on tenant type where appropriate?
- [ ] Does the navigation menu adapt to tenant capabilities?
- [ ] Are agency-specific routes protected from direct business tenants?

### 4. Feature Flags & Capabilities

- [ ] How are tenant-type-specific features controlled?
- [ ] Is the capability matrix (Section 6.2 of business architecture) enforced in UI?
- [ ] Are white-label reporting features conditional on agency status?

### 5. Data Display & Operations

- [ ] Do connector, insight, and report views respect tenant isolation?
- [ ] Are agency partners able to view/manage client tenant data appropriately?
- [ ] Is there any risk of data mixing between tenants in agency views?

### 6. Authentication & User Roles

- [ ] Does the frontend handle RBAC roles correctly for both tenant types?
- [ ] Are user role permissions consistent with tenant type (e.g., agency-managed tenants use editor role vs analyst)?

---

## Deliverables

Produce one or more markdown files containing:

### 1. Review Findings (`/prompts/frontend-account-types-review-findings.md`)

- Current implementation state for each review scope area
- Evidence (file references, code snippets) supporting findings
- Identified gaps, inconsistencies, or risks

### 2. Remediation Plan (`/prompts/frontend-account-types-remediation-plan.md`) - _if gaps identified_

- Prioritized list of required changes
- Implementation approach for each gap
- Estimated effort and dependencies
- Recommended validation/testing approach

### 3. Architecture Notes (`/prompts/frontend-tenant-architecture-notes.md`) - _optional_

- Patterns discovered in current implementation
- Recommendations for tenant-type handling conventions
- Suggestions for reusable utilities or hooks

---

## Constraints & Assumptions

- **Greenfield Development:** No backward compatibility concerns
- **Pre-Production:** Focus on correctness over performance optimization
- **Multi-Tenant Safety:** Tenant isolation is non-negotiable (see `/docs/05-reference/multi-tenant-guardrails.md`)
- **Type Safety:** No `any` types in production code

---

## Success Criteria

The review is complete when:

1. ✅ All review scope areas have been investigated and documented
2. ✅ Findings are supported by concrete evidence from the codebase
3. ✅ Remediation plan (if needed) is actionable and prioritized
4. ✅ No tenant isolation risks or data leakage paths exist
5. ✅ Agency partner capabilities align with business architecture specification

---

## Related Documentation

- **Business Architecture:** `/docs/architecture/business/business-architecture.md`
- **Seed Data Reference:** `/docs/development/seeded-data-reference.md`
- **Multi-Tenant Guardrails:** `/docs/05-reference/multi-tenant-guardrails.md`
- **Frontend Governance:** `/docs/05-reference/frontend-ui-architecture-guidelines.md`
- **Tenant Entity Spec:** `/docs/architecture/ui/02-system-entities/tenant.md`

---

## Output Format

All deliverables should be written as markdown files in the `/prompts/` directory with:

- Clear section headers
- Code references using `file_path:line_number` format
- Tables for comparisons and capability matrices
- Actionable recommendations with implementation guidance
