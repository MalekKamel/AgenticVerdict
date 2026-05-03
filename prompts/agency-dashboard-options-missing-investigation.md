# Agency Dashboard Options Missing - Root Cause Analysis

**Priority:** P1 - User Experience Blocker  
**Created:** 2026-05-02  
**Status:** Investigation Required

---

## Context

The frontend account types remediation plan has been implemented (`/prompts/frontend-account-types-remediation-plan-updated.md`). This implementation should enable agency partners to access agency-specific features and dashboard options.

## Issue Description

When logging in with the agency partner admin account (`admin@agency-dma-agency.example.com`), the agency dashboard options are not visible in the UI, despite the user having the correct tenant type (`agency_partner`) and status (`active`).

## Reference Data

**Seed Configuration:** `/tests/fixtures/dev-seed-configs/agency-dma.json`

Expected tenant configuration:

- `tenantId`: `11111111-1111-4111-8111-111111111111`
- `type`: `agency_partner`
- `status`: `active`
- `slug`: `dma-agency`

## Investigation Scope

Conduct a systematic root cause analysis covering the following areas:

### 1. Authentication & Session Layer

- Verify JWT token includes `tenant_type` and `tenant_status` claims
- Confirm auth middleware extracts and validates tenant metadata
- Check `getSession` trpc procedure returns correct tenant type

### 2. Frontend State Management

- Verify auth store populates `tenantType` and `tenantStatus` from session
- Confirm `useTenantType` hook computes capabilities correctly
- Check `TenantProvider` context value propagation

### 3. Navigation & UI Rendering

- Verify navigation component receives correct capability flags
- Check `canAccessAgencyDashboard` capability computation
- Inspect conditional rendering logic for agency menu items

### 4. Route Guard Configuration

- Verify agency dashboard route guard checks tenant type correctly
- Confirm no premature redirects blocking agency access

### 5. Data Flow Validation

- Trace tenant type from database → JWT → auth store → UI components
- Identify where tenant type information is lost or misinterpreted

## Required Deliverables

1. **Root Cause Identification:** Pinpoint the exact location(s) where tenant type information fails to propagate
2. **Impact Assessment:** Identify all affected components and user flows
3. **Fix Implementation:** Apply targeted fixes with minimal side effects
4. **Verification:** Test with agency partner account to confirm resolution
5. **Prevention:** Recommend guardrails to prevent similar issues

## Acceptance Criteria

- [ ] Agency partner login displays agency dashboard options
- [ ] Navigation correctly shows agency-specific menu items
- [ ] Agency dashboard route is accessible
- [ ] Tenant type flows correctly through entire stack
- [ ] Unit tests cover tenant type propagation scenarios
- [ ] Manual testing passes with `admin@agency-dma-agency.example.com`

## Constraints

- Maintain backward compatibility with direct business tenants
- Do not modify seed data configuration
- Follow existing error handling patterns
- Preserve multi-tenant isolation guarantees

---

**Next Steps:** Execute investigation, document findings, and implement fixes in priority order.
