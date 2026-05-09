# Implementation Plan 07 — Agency Multi-Tenant Dashboard

**Phase:** P2 (Multi-Tenant & Agency Features)
**Original Reference:** Comprehensive Plan §2.6 (Tasks 2.6.1 – 2.6.5)
**Priority:** P2 — Agency partner support
**Estimated Effort:** 5 tasks, ~3-4 days

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. All database changes use **destructive approaches**:

- No migration files with up/down — use `make db:push` to apply schema directly
- No backward compatibility concerns — break freely, rename freely, drop freely
- If a schema change is needed mid-development, drop the table and recreate it
- After any schema change, run `make db:reset` to rebuild from scratch

---

## 1. Overview

Implement the agency multi-tenant dashboard that enables agency partners to manage multiple client tenants from a single interface. This plan aligns with the business architecture requirements defined in `/docs/architecture/business/business-architecture.md`.

### Business Requirements Mapping

| Business Architecture Requirement (Section) | Implementation Task | Description                                                |
| ------------------------------------------- | ------------------- | ---------------------------------------------------------- |
| **Section 3.3: Multi-Tenant Dashboard**     | Task 7.2            | Switch between tenants instantly with aggregate oversight  |
| **Section 3.3: Client Onboarding**          | Task 7.3            | Rapid provisioning with templates (Appendix A)             |
| **Section 3.3: White-Label Reporting**      | Task 7.4            | Foundation for agency branding on client reports (Phase 2) |
| **Section 3.3: Aggregate Oversight**        | Task 7.2, 7.4       | Monitor all client Insights from one interface             |
| **Section 6.1: Tenant Isolation**           | Task 7.5            | Data, configuration, resource, and visual isolation        |
| **Section 6.2: Agency Capabilities**        | Task 7.4            | Create client Insights, view client reports                |
| **Section 4.2: Agency Partner Roles**       | Task 7.2            | Agency Owners, Account Managers, Analysts access           |
| **Section 9.3: Business Metric**            | All tasks           | "2+ agency partners with 5+ clients each"                  |

### Business Value

- Supports agency partner workflow (Section 3.3): "Monitor all client Insights from one interface"
- Enables rapid client provisioning with templates (Section 3.3: "Rapid provisioning with templates"; Appendix A: 5 pre-built templates)
- Foundation for white-label reporting and cross-client benchmarking (plan-08)
- Required for business metric: "2+ agency partners with 5+ clients each" (Section 9.3)
- Aligns with value proposition: "Agency Partner Support: Manage multiple client tenants with complete data isolation" (Section 1.2)

### Key Design Decisions

1. **Route Structure:** Maintain existing `/dashboard/agency` route pattern (TanStack Router file-based) rather than creating `/agency/dashboard`. The existing route structure at `routes/$locale/dashboard/agency.tsx` and `routes/$locale/dashboard/agency.index.tsx` is already established.
2. **Feature Directory:** Create `apps/frontend/src/features/agency/` as a top-level feature directory for agency-specific components, while keeping route files in the TanStack Router `routes/` directory.
3. **API Layer:** Extend the existing `agencyRouter` at `apps/api/src/trpc/routers/agency.ts` (304 lines, 6 procedures) rather than creating a new router. The existing procedures (`getPermittedClients`, `getAggregateMetrics`, `switchClientContext`, `createClientTenant`, `getClientById`, `listClientInsights`) provide the foundation.
4. **Tenant Switcher:** Inject into the existing `headerContext` via `useAppShellHeader()` hook rather than modifying `AppShellLayout` directly. This follows the established pattern where pages set header content through context.

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component                | Location                                                                      | Status     | Notes                                                                    |
| ------------------------ | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| AgencyDashboardPage      | `apps/frontend/src/features/dashboard/pages/agency/AgencyDashboardPage.tsx`   | **Exists** | 55 lines, auth-gated, uses `useRequireAuth` and `useTenantType`          |
| AgencyDashboardSurface   | `apps/frontend/src/features/dashboard/ui/surfaces/AgencyDashboardSurface.tsx` | **Exists** | 148 lines, renders KPI cards + client list                               |
| Agency tRPC Router       | `apps/api/src/trpc/routers/agency.ts`                                         | **Exists** | 304 lines, 6 procedures, 2 middlewares                                   |
| Dashboard API Layer      | `apps/frontend/src/features/dashboard/api/dashboard-api.ts`                   | **Exists** | `fetchDashboardAgencyOverview()`, `filterAgencyClientsForRendering()`    |
| Route Guards             | `features/dashboard/route-guards/create-agency-dashboard-before-load.ts`      | **Exists** | Checks `tenantType === "agency_partner"` and `tenantStatus === "active"` |
| Tenant Schema            | `packages/database/src/schema/tenants.ts`                                     | **Exists** | 101 lines, `type` enum, `parentTenantId`, `agencyPartnerId`              |
| Agency Partners Schema   | `packages/database/src/schema/core/tenants.ts`                                | **Exists** | 38 lines, `tier`, `maxClients`, `whiteLabelEnabled`                      |
| Tenant Context (FE)      | `apps/frontend/src/features/auth/providers/TenantProvider.tsx`                | **Exists** | 95 lines, `tenantId`, `tenantType`, `tenantStatus`, `capabilities`       |
| Tenant Context (BE)      | `packages/core/src/tenant-context.ts`                                         | **Exists** | 207 lines, `AsyncLocalStorage`, `runWithTenantContext()`                 |
| Auth Store               | `apps/frontend/src/features/auth/model/state/auth-store.ts`                   | **Exists** | `tenantId`, `tenantType`, `tenantStatus` in state                        |
| Dashboard Store          | `apps/frontend/src/features/dashboard/model/dashboard-store.ts`               | **Exists** | `activeClientId`, `setDashboardContext()` with agency modes              |
| Shell Header Context     | `apps/frontend/src/features/shell/ui/app-shell-context.tsx`                   | **Exists** | `useAppShellHeader()` for injecting header content                       |
| Navigation Filtering     | `apps/frontend/src/features/shell/ui/app-shell-navigation.ts`                 | **Exists** | `requiresAgencyPartner` flag, `filterAppShellNavItems()`                 |
| Insight Templates Router | `apps/api/src/trpc/routers/insight-templates.ts`                              | **Exists** | Template selection for onboarding                                        |
| Testing Utilities        | `packages/testing/src/`                                                       | **Exists** | `createTenant`, `TestTenant`, `RLS_TENANT_A/B`, `TestResourceManager`    |

### Items Requiring Fixes Before This Plan

| Item                        | Location                                                 | Issue                                                                                | Fix Required                                                    |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Stub Client IDs             | `features/dashboard/model/dashboard-agency-constants.ts` | `DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS = new Set(["client-a", "client-b"])`          | Replace with API-fetched data from `agency.getPermittedClients` |
| Agency Tests                | `apps/api/src/trpc/routers/agency.test.ts`               | All tests are `expect(true).toBe(true)`                                              | Implement real test coverage (Task 7.5)                         |
| Dashboard API Inconsistency | `dashboard.ts` vs `agency.ts`                            | `dashboard.agencyOverview` uses `parentTenantId`; `agency.ts` uses `agencyPartnerId` | Align query patterns                                            |

### Dependencies

| Plan                      | Relationship | Notes                                                                    |
| ------------------------- | ------------ | ------------------------------------------------------------------------ |
| plan-01-insight-templates | Depends on   | Onboarding wizard uses templates (Task 7.3, Step 2)                      |
| plan-04-domain-mapping    | Depends on   | Domain filtering in agency views (connector domain tags per Section 2.3) |
| plan-02-scheduler         | Depends on   | Schedule management per tenant (Insight configuration per Section 2.4)   |
| plan-08-advanced-features | Provides     | Benchmarking and white-label depend on agency dashboard                  |

---

## 3. Tasks

### Task 7.1: Tenant Switcher Component

**Original:** 2.6.1
**File:** `apps/frontend/src/features/agency/ui/tenant-switcher.tsx` (NEW)

**Business Requirement:** Section 3.3 — "Switch between tenants instantly"; Section 6.1 — "Agencies can switch between clients without data mixing"

**Implementation:**

1. **Component Architecture:**
   - Mantine `Combobox` or `Select` component with search/filter
   - Fetch tenant list via `trpc.agency.getPermittedClients.query()` (existing procedure)
   - Display tenant name, slug, status badge, and connector count
   - Visual indicator of current tenant (checkmark via `tenantId` from `useTenant()`)

2. **Features:**
   - Search/filter tenants by name or slug
   - Visual indicator of current tenant (checkmark, highlight)
   - Tenant status badge (active, onboarding, suspended) per `tenantStatusEnum`
   - "View all tenants" link to `/dashboard/agency`
   - Only visible to users with `isAgencyPartner === true` (from `useTenantType()`)

3. **Integration Point:**
   - Inject via `useAppShellHeader()` in `AgencyDashboardPage.tsx` (existing pattern, line 22-27)
   - Set as `headerContext` node to appear in header center group (AppShellLayout line 203)
   - Alternative: Add to right group of `AppShellLayout` header (alongside LanguageSwitcher, ColorSchemeToggle)

4. **Tenant Switch Behavior:**
   - On selection: call `trpc.agency.switchClientContext.query({ clientId })` (existing procedure)
   - Update auth store: `setTenantId()`, `setTenantType()`, `setTenantStatus()` (auth-store.ts lines 82-84)
   - Update dashboard store: `setDashboardContext({ mode: "agency_client", activeClientId })` (dashboard-store.ts lines 46-56)
   - Trigger full data reload: invalidate tRPC query cache for tenant-scoped queries
   - Persist selection: store `lastActiveClientId` in `sessionStorage` (not localStorage — per-tenant isolation)

5. **Access Control:**
   - Only visible when `tenantType === "agency_partner"` (Section 4.2: Agency Owners, Account Managers)
   - Filter out suspended/archived tenants from dropdown
   - Enforce `validateClientAccess` middleware (agency.ts lines 35-70) on all switch operations

**Testing:**

- Component tests: search filtering, selection state, visual indicators
- Integration test: switch tenant → verify `setTenantId()` called with correct ID
- E2E test: switch tenant → navigate to `/dashboard/agency/${clientId}` → verify data changes

---

### Task 7.2: Enhance Agency Dashboard Surface

**Original:** 2.6.2
**Files:**

- `apps/frontend/src/features/dashboard/ui/surfaces/AgencyDashboardSurface.tsx` (ENHANCE — 148 lines existing)
- `apps/frontend/src/features/dashboard/pages/agency/AgencyDashboardPage.tsx` (MODIFY — 55 lines existing)

**Business Requirement:** Section 3.3 — "Multi-Tenant Dashboard: Switch between tenants instantly"; "Aggregate Oversight: Monitor all client Insights from one interface"; Section 4.2 — Agency Owner, Account Manager, Analyst role requirements

**Implementation:**

1. **Enhance AgencyDashboardSurface (existing 148-line component):**
   - Current state: Renders aggregate KPI cards (total clients, insights, connectors) + client list with status badges
   - Add **tenant health summary** section: Per-tenant status grid (active, inactive, errors) with color-coded indicators
   - Add **recent activity** feed: Latest insight executions across all tenants (use `dashboard.agencyOverview` existing endpoint)
   - Add **quick actions** toolbar: "Onboard New Tenant" button, "View All Reports" link, "Manage Connectors" link

2. **Role-Based Dashboard Variants (Section 4.2):**
   - **Agency Owners:** Full dashboard access — all KPIs, client list, onboarding, connector management
   - **Account Managers:** Tenant management + report delivery — client list, report links, onboarding
   - **Analysts:** Benchmarking access — aggregate metrics only (deferred to plan-08)
   - Implement via `useTenantType()` capabilities check + conditional rendering

3. **Aggregate Stats Enhancement:**
   - Extend `getAggregateMetrics` procedure (agency.ts existing) to include:
     - Total active insights across all clients
     - Recent execution count (last 24h, last 7d)
     - Connector health (active, error, disconnected counts)
     - Per-domain breakdown (Marketing, Finance, SEO, Social, Local per Section 5)

4. **Client List Enhancement:**
   - Current: Client name, connector status badges, "View Tenant" button
   - Add: Last insight execution timestamp, insight count, health status indicator
   - Add: Quick action dropdown per client (View Dashboard, View Reports, Edit Settings, Suspend)
   - Link to `/dashboard/agency/${clientId}` for client-specific view (existing route: `agency.$clientId.tsx`)

5. **Fix Stub Constants:**
   - Remove `DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS` stub from `dashboard-agency-constants.ts`
   - Replace with live data from `agency.getPermittedClients` query
   - Update `isPermittedAgencyClient()` to use API response instead of hardcoded Set

6. **Route Registration:**
   - Keep existing route structure: `/dashboard/agency` (index), `/dashboard/agency/:clientId`
   - No route changes needed — existing `beforeLoad` guards are correct

**Testing:**

- Component tests: KPI cards render, client list filters, role-based visibility
- Integration test: `getAggregateMetrics` returns correct counts
- E2E test: Navigate to `/dashboard/agency` → verify all sections render

---

### Task 7.3: Tenant Onboarding Wizard

**Original:** 2.6.3
**File:** `apps/frontend/src/features/agency/ui/TenantOnboardingWizard.tsx` (NEW)

**Business Requirement:** Section 3.3 — "Client Onboarding: Rapid provisioning with templates"; Section 2.4 — Insight Configuration (connectors, metrics, AI config, schedule, delivery); Appendix A — 5 pre-built templates

**Implementation:**

1. **Multi-Step Wizard Pattern (follow existing Insight Wizard pattern):**
   - Use Mantine `Stepper` component (same as `OnboardingPage.tsx` pattern)
   - Use `react-hook-form` + Zod validation (same as Insight Wizard validation pattern)
   - 5 steps as defined, with validation at each step

2. **Step Details:**

   **Step 1: Tenant Info**
   - Fields: `name` (string, required), `slug` (auto-generated from name, editable), `industry` (enum), `timezone` (select), `contactEmail` (email), `language` (select), `region` (select), `currency` (select)
   - Schema maps to `tenants.ts` columns: `name`, `slug`, `localization` fields
   - Validation: unique slug check via `trpc.tenant.resolveSlug.query({ slug })`

   **Step 2: Template Selection**
   - Fetch templates via `trpc.insightTemplates.list.query()` (existing router)
   - Display 5 pre-built templates (Appendix A): Marketing Insight, Finance Insight, SEO Performance Insight, Social Media Insight, Executive Summary
   - Each template card shows: name, description, required connectors, key metrics
   - Multi-select allowed (agency can provision multiple templates at once)
   - Per Section 2.4: "All properties can be initialized from templates, with full customization preserved"

   **Step 3: Connector Assignment**
   - Fetch available connectors via `trpc.connector.list.query()` (existing router)
   - Filter connectors by domain tags (Section 2.3: GA4, Meta, GSC, GBP, TikTok, QuickBooks, Stripe)
   - Assign connectors to the new tenant with metric selection per connector
   - Per Section 2.4: "Metric Selection: Which metrics to track from each connector"

   **Step 4: Users & Permissions**
   - Add initial users to the tenant (email, role)
   - RBAC roles per Section 2.2: Business Owner, Marketing Manager, Financial Controller, Operations Lead
   - Per Section 4.2: Agency roles map to client roles (Agency Owner → Business Owner, Account Manager → Marketing Manager, etc.)
   - Optional: Send invitation emails to new users

   **Step 5: Review & Create**
   - Summary of all form values
   - Preview of tenant configuration
   - Confirm button triggers `trpc.agency.createClientTenant.mutation()` (existing procedure)
   - On success: create insights from selected templates, assign connectors, create users

3. **API Integration:**
   - Use existing `agency.createClientTenant` mutation (agency.ts existing)
   - Extend mutation payload to include: `templateIds`, `connectorAssignments`, `initialUsers`
   - On success: redirect to new tenant's dashboard at `/dashboard/agency/${newTenantId}`
   - Show success toast with "Tenant created successfully" message

4. **Access Control:**
   - Only visible to Agency Owners (Section 4.2) — check `capabilities.canManageTenants`
   - Enforce `maxClients` limit from `agencyPartners.maxClients` (schema default: 10)

**Testing:**

- Component tests: each step renders, validation works, form state persists between steps
- Integration test: `createClientTenant` mutation creates tenant with all related records
- E2E test: Complete onboarding flow → verify tenant appears in client list

---

### Task 7.4: Cross-Tenant Insight Management

**Original:** 2.6.4
**Files:**

- `apps/api/src/trpc/routers/agency.ts` (EXTEND — 304 lines existing)
- `apps/frontend/src/features/agency/ui/TenantInsightManager.tsx` (NEW)

**Business Requirement:** Section 3.3 — "Monitor all client Insights from one interface"; Section 6.2 — "Create client Insights, View client reports"; Section 2.4 — Insight Configuration

**Implementation:**

1. **Extend Agency tRPC Router (existing 304-line file):**

   Add procedures:
   - `agency.insights.listAll` — List insights across ALL client tenants with pagination
     - Input: `{ status?, domain?, dateRange?, limit?, cursor? }`
     - Output: `{ insights: Insight[], nextCursor?: string, totalCount: number }`
     - Uses `dbScoped()` with agency's tenant hierarchy

   - `agency.insights.bulkAction` — Bulk enable/disable/delete insights
     - Input: `{ action: "enable" | "disable" | "delete", insightIds: string[] }`
     - Enforces tenant ownership check on each insight ID

   - `agency.tenants.update` — Update tenant settings (name, status, feature flags)
     - Input: `{ tenantId, updates: Partial<Tenant> }`
     - Enforces `validateClientAccess` middleware

2. **TenantInsightManager Component:**
   - Table/grid view using Mantine `DataTable` or `Table` component
   - Columns: Insight Name, Tenant, Domain, Status, Last Execution, Next Schedule, Actions
   - Filters: Tenant dropdown, Status (active/paused/error), Domain (Marketing/Finance/SEO/Social/Local), Date Range
   - Bulk actions: Select multiple → Enable/Disable/Delete
   - Per-row actions: View Report, Edit Settings, Run Now, View History
   - Pagination: Server-side with cursor-based pagination

3. **Tenant Isolation Enforcement:**
   - All queries scoped to agency's client tenants via `parentTenantId` or `agencyPartnerId`
   - No raw tenant data exposed in aggregate views (Section 6.1: Visual Isolation)
   - Cross-tenant aggregation uses anonymized/summarized data only
   - Per Section 6.1: "Data Isolation (RLS), Configuration Isolation (TenantConfig), Resource Isolation (rate limiting/quotas)"

4. **Integration with Existing Components:**
   - Link from AgencyDashboardSurface "View All Insights" button
   - Share filter state with dashboard store (`setDashboardContext`)
   - Use existing `dashboard-api.ts` patterns for data fetching

**Testing:**

- Integration tests: All new API procedures with tenant isolation checks
- Component tests: Table rendering, filtering, bulk actions
- Security test: Verify agency A cannot access agency B's tenant insights

---

### Task 7.5: Implement Tenant Isolation Enforcement Tests

**Original:** 2.6.5
**Files:** Multiple (test files)

**Business Requirement:** Section 6.1 — "Data Isolation (RLS), Configuration Isolation (TenantConfig), Resource Isolation (rate limiting/quotas), Visual Isolation (no data mixing)"; Section 6.2 — Agency capability matrix

**Implementation:**

1. **Fix Existing Agency Tests:**
   - Replace all `expect(true).toBe(true)` in `apps/api/src/trpc/routers/agency.test.ts` (41 lines)
   - Implement real tests for all 6 existing procedures + new procedures from Task 7.4

2. **Tenant Isolation Test Suite:**

   **Data Isolation (RLS):**
   - Test: Agency user A queries `getPermittedClients` → returns only agency A's clients
   - Test: Agency user A queries `listClientInsights` for agency B's client → throws `TRPCError` (UNAUTHORIZED)
   - Test: Direct DB query with tenant A context → returns only tenant A's rows
   - Test: RLS policy blocks cross-tenant access at database level

   **Configuration Isolation (TenantConfig):**
   - Test: Tenant A's config changes do not affect Tenant B
   - Test: `TenantConfig` is scoped via `dbScoped(tenantId)` pattern
   - Test: AI config, feature flags, localization are tenant-specific

   **Resource Isolation (Rate Limiting/Quotas):**
   - Test: Per-tenant rate limiting via `rateLimitMiddleware` (procedures.ts lines 31-44)
   - Test: `maxInsights` quota enforced per tenant
   - Test: `maxUsers` quota enforced per tenant

   **Visual Isolation (No Data Mixing):**
   - Test: Tenant switcher updates all data contexts (Task 7.1)
   - Test: Aggregate views never expose raw tenant data
   - Test: Cross-tenant metrics are anonymized/summarized only
   - Test: UI components render only the active tenant's data

3. **API Endpoint Audit:**
   - Audit each endpoint in `agency.ts` router (existing 6 + new from Task 7.4)
   - Verify `dbScoped(tenantId)` is used consistently
   - Verify `requireAgencyPartner` middleware (agency.ts lines 8-33) is applied to all agency procedures
   - Verify `validateClientAccess` middleware (agency.ts lines 35-70) is applied to client-specific procedures

4. **Security Test Utilities:**
   - Add `createTestAgencyPartner()` factory to `packages/testing/src/factories/`
   - Add `createAgencyClientTenant()` factory linking tenant to agency via `agencyPartnerId`
   - Add `switchAgencyContext(testContext, agencyId)` helper for test setup
   - Use existing `RLS_TENANT_A`, `RLS_TENANT_B` for cross-tenant isolation tests

**Testing:**

- Integration tests: All isolation scenarios (100% coverage required)
- Security audit: Manual review of all agency endpoints
- E2E test: Cross-tenant data leakage attempt → verify blocked

---

## 4. File Change Summary

| File                                                                          | Action      | Type           | Notes                                                                              |
| ----------------------------------------------------------------------------- | ----------- | -------------- | ---------------------------------------------------------------------------------- |
| `apps/frontend/src/features/agency/ui/tenant-switcher.tsx`                    | **Create**  | UI component   | Tenant switcher for header injection                                               |
| `apps/frontend/src/features/agency/ui/TenantOnboardingWizard.tsx`             | **Create**  | UI component   | 5-step wizard with react-hook-form + Zod                                           |
| `apps/frontend/src/features/agency/ui/TenantInsightManager.tsx`               | **Create**  | UI component   | Cross-tenant insight table with filters                                            |
| `apps/frontend/src/features/agency/index.ts`                                  | **Create**  | Barrel export  | Export all agency feature components                                               |
| `apps/frontend/src/features/dashboard/ui/surfaces/AgencyDashboardSurface.tsx` | **Enhance** | UI component   | Add health summary, recent activity, quick actions (148 → ~250 lines)              |
| `apps/frontend/src/features/dashboard/pages/agency/AgencyDashboardPage.tsx`   | **Modify**  | Page component | Wire tenant switcher to headerContext (55 → ~70 lines)                             |
| `apps/frontend/src/features/dashboard/model/dashboard-agency-constants.ts`    | **Delete**  | Stub removal   | Replace hardcoded Set with API-fetched data                                        |
| `apps/frontend/src/features/dashboard/api/dashboard-api.ts`                   | **Modify**  | API layer      | Update `filterAgencyClientsForRendering` to use live data                          |
| `apps/api/src/trpc/routers/agency.ts`                                         | **Extend**  | API router     | Add `insights.listAll`, `insights.bulkAction`, `tenants.update` (304 → ~450 lines) |
| `apps/api/src/trpc/routers/agency.test.ts`                                    | **Replace** | Test file      | Replace placeholder tests with real coverage (41 → ~200 lines)                     |
| `packages/testing/src/factories/agency.ts`                                    | **Create**  | Test factory   | `createTestAgencyPartner()`, `createAgencyClientTenant()`                          |
| `packages/testing/src/index.ts`                                               | **Modify**  | Barrel export  | Export new agency test factories                                                   |
| `apps/frontend/src/features/shell/ui/app-shell-navigation.ts`                 | **Modify**  | Config         | Add onboarding wizard nav item (if not present)                                    |

---

## 5. Testing Requirements

| Test Type   | Scope                            | Coverage Target | Notes                                                |
| ----------- | -------------------------------- | --------------- | ---------------------------------------------------- |
| Component   | TenantSwitcher                   | 80%+            | Search, selection, visual states, header injection   |
| Component   | AgencyDashboardSurface           | 80%+            | KPI cards, client list, role-based visibility        |
| Component   | TenantOnboardingWizard           | 80%+            | Each step, validation, form state persistence        |
| Component   | TenantInsightManager             | 80%+            | Table rendering, filtering, bulk actions             |
| Integration | Agency API procedures            | 85%+            | All 9 procedures (6 existing + 3 new)                |
| Integration | Tenant isolation boundaries      | 100%            | **Critical** — no cross-tenant data leakage          |
| Integration | Dashboard API consistency        | 100%            | Align `parentTenantId` vs `agencyPartnerId` patterns |
| E2E         | Tenant switch → data reload      | Full flow       | Switch → verify all data contexts update             |
| E2E         | Onboard tenant → verify creation | Full flow       | Complete wizard → tenant appears in list             |
| E2E         | Cross-tenant insight management  | Full flow       | Filter, bulk action, verify isolation                |
| Security    | Cross-tenant data leakage        | 100%            | **Critical** — RLS + middleware enforcement          |
| Security    | Rate limiting per tenant         | 100%            | Verify `rateLimitMiddleware` scopes correctly        |

---

## 6. Success Criteria

### Functional

- [ ] Tenant switcher visible in header for agency partner users (Section 4.2)
- [ ] Switching tenants reloads all data with correct tenant context (Section 6.1: Visual Isolation)
- [ ] Agency dashboard shows aggregate stats: total clients, insights, connectors, recent executions
- [ ] Tenant health summary displays per-tenant status with color-coded indicators
- [ ] Quick actions: Onboard new tenant, view reports, manage connectors
- [ ] Recent activity feed shows latest insight executions across all tenants
- [ ] Tenant onboarding wizard creates tenants with templates, connectors, and users (Section 3.3)
- [ ] Cross-tenant insight management shows all client insights with filtering (Section 3.3)
- [ ] Bulk actions work: enable/disable/delete insights across tenants
- [ ] Role-based dashboard variants: Agency Owners (full), Account Managers (limited), Analysts (aggregate only)

### Security & Isolation

- [ ] All agency endpoints enforce tenant isolation via `dbScoped()` and RLS (Section 6.1)
- [ ] Agency A cannot access Agency B's tenants (data isolation test)
- [ ] Cross-tenant aggregation never exposes raw tenant data (visual isolation test)
- [ ] Rate limiting enforced per tenant (resource isolation test)
- [ ] TenantConfig changes are scoped to individual tenants (configuration isolation test)
- [ ] Stub `DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS` removed and replaced with API data

### Quality

- [ ] All integration tests pass (85%+ coverage on agency router)
- [ ] All E2E tests pass (tenant switch, onboarding, insight management flows)
- [ ] All security tests pass (100% isolation coverage)
- [ ] No TypeScript errors (`pnpm run typecheck`)
- [ ] No lint errors (`pnpm run lint`)

---

## 7. Dependencies on Other Plans

| Plan                      | Relationship | Notes                                                                               |
| ------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| plan-01-insight-templates | Depends on   | Onboarding wizard uses templates (Step 2: Template Selection); Appendix A templates |
| plan-04-domain-mapping    | Depends on   | Domain filtering in agency views; connector domain tags (Section 2.3)               |
| plan-02-scheduler         | Depends on   | Schedule management per tenant (Insight configuration per Section 2.4)              |
| plan-08-advanced-features | Provides     | Benchmarking (Analyst role) and white-label reporting depend on this dashboard      |

---

## 8. Risk Mitigation

| Risk                                                      | Severity     | Mitigation                                                                                                       |
| --------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Multi-tenant data leakage                                 | **Critical** | RLS already implemented; add integration tests (Task 7.5); audit all endpoints for `dbScoped()` usage            |
| Agency cross-tenant data exposure                         | **Critical** | Enforce `validateClientAccess` middleware on all client-specific procedures; test with dual-agency test fixtures |
| Tenant switcher state inconsistency                       | High         | Update auth store + dashboard store on switch; invalidate tRPC query cache; use `sessionStorage` for persistence |
| Onboarding wizard complexity                              | Medium       | Multi-step pattern with validation at each step; reuse existing Insight Wizard patterns (react-hook-form + Zod)  |
| Schema changes mid-development                            | Low          | Use `make db:reset` to drop and recreate — no migration rollback needed (Greenfield Policy, Section 0)           |
| API inconsistency (`parentTenantId` vs `agencyPartnerId`) | Medium       | Align query patterns in Task 7.2; single source of truth for agency-client relationship                          |
| Stub constants causing production issues                  | High         | Remove `DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS` stub immediately; replace with API-fetched data                   |
| Rate limiting bypass                                      | Medium       | Verify `rateLimitMiddleware` is applied to all mutation procedures; test with rapid-fire requests                |

---

## 9. Implementation Order & Dependencies

```
Task 7.5 (Tests) ──────────────────────────────────────┐
  ↓ (fix stub tests first to establish baseline)        │
Task 7.2 (Dashboard Surface) ──────────────────────────┤
  ↓ (enhance existing surface, fix stub constants)      │
Task 7.1 (Tenant Switcher) ────────────────────────────┤
  ↓ (depends on dashboard data being correct)           │
Task 7.4 (Insight Management) ─────────────────────────┤
  ↓ (extends agency router, new UI component)           │
Task 7.3 (Onboarding Wizard) ──────────────────────────┘
  (depends on all above being stable)
```

**Recommended sequence:**

1. **Task 7.5** — Fix stub tests first to establish test baseline and catch any existing issues
2. **Task 7.2** — Enhance dashboard surface and fix stub constants (unblocks switcher)
3. **Task 7.1** — Build tenant switcher (uses dashboard data, injects into header)
4. **Task 7.4** — Extend agency router with insight management procedures
5. **Task 7.3** — Build onboarding wizard (most complex, depends on stable API)
