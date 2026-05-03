# Frontend Account Types Remediation Plan

**Created:** 2026-05-02  
**Priority:** High (Pre-Production Blocker)  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** Backend API changes required

---

## Overview

This plan addresses the critical gaps identified in the frontend account types review. The remediation is organized into three phases:

1. **Phase 1: Critical Security Fixes** (3-5 days)
2. **Phase 2: Feature Enforcement** (5-7 days)
3. **Phase 3: UX Polish** (3-5 days)

---

## Phase 1: Critical Security Fixes

### Task 1.1: Add Tenant Type to Backend Session Response

**Objective:** Include `tenantType` in authentication session data

**Backend Changes Required:**

#### 1.1.1 Update Database Schema Query

**File:** `packages/database/src/schema/tenants.ts`

```typescript
// tenants table already has agencyPartnerId column
// Add computed tenantType based on agencyPartnerId presence
```

#### 1.1.2 Update Auth Types

**File:** `packages/types/src/auth.ts:118-134`

```typescript
// Add tenant type enum
export const tenantTypeSchema = z.enum(["direct", "agency-partner", "agency-managed"]);
export type TenantType = z.infer<typeof tenantTypeSchema>;

// Update getSession output
export const getSessionOutputSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    emailVerified: z.boolean(),
    tenantId: z.string().uuid(),
    tenantType: tenantTypeSchema, // NEW
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
  sessionExpiresAt: z.string().nullable(),
});
```

#### 1.1.3 Update Auth Router

**File:** `apps/api/src/trpc/routers/auth.ts:150-188`

```typescript
// In getSession procedure
const tenantWithInfo = await tx
  .select({
    tenant: tenants,
    agencyPartner: agencyPartners,
  })
  .from(tenants)
  .leftJoin(agencyPartners, eq(tenants.agencyPartnerId, agencyPartners.id))
  .where(and(eq(users.id, session.auth.userId), eq(users.tenantId, session.auth.tenantId)))
  .limit(1);

const tenantType = tenantWithInfo[0]?.agencyPartner
  ? "agency-managed"
  : tenantWithInfo[0]?.tenant?.isAgencyPartner
    ? "agency-partner"
    : "direct";

return {
  user: {
    ...(await mapUserRow(row, db)),
    tenantType, // NEW
  },
  sessionExpiresAt: session.sessionExpiresAt,
};
```

**Acceptance Criteria:**

- [ ] Session response includes `tenantType` field
- [ ] Type is correctly computed from database relationships
- [ ] Types exported and shared with frontend

**Estimated Effort:** 1 day

---

### Task 1.2: Add Tenant Type to JWT Payload

**Objective:** Include `tenant_type` in JWT for header-based validation

**File:** `apps/api/src/lib/auth-session-jwt.ts`

```typescript
export async function signSessionAccessToken(params: {
  userId: string;
  tenantId: string;
  tenantType: string; // NEW
  rememberMe: boolean;
  secret: string;
  roles: string[];
}): Promise<{ token: string; maxAgeSeconds: number }> {
  // Include tenant_type in JWT payload
  const payload = {
    sub: params.userId,
    tenant_id: params.tenantId,
    tenant_type: params.tenantType, // NEW
    roles: params.roles,
  };
  // ... rest of signing logic
}
```

**File:** `apps/api/src/middleware/auth.ts:229-270`

```typescript
// Update verifyBearerSessionFromRequest to extract tenant_type
const tenantType = typeof payload.tenant_type === "string" ? payload.tenant_type : undefined;

return {
  auth: { userId: sub, tenantId, tenantType, roles }, // NEW tenantType
  sessionExpiresAt,
};
```

**Acceptance Criteria:**

- [ ] JWT includes `tenant_type` claim
- [ ] Middleware extracts and validates tenant type
- [ ] Backward compatibility maintained for existing tokens

**Estimated Effort:** 0.5 days

---

### Task 1.3: Update Frontend Auth Store

**Objective:** Track tenant type in frontend authentication state

**File:** `apps/frontend/src/stores/auth-store.ts:22-30`

```typescript
export type UserInfo = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
  roles: string[];
  permissions: Permission[];
  tenantType?: "direct" | "agency-partner" | "agency-managed"; // NEW
};
```

**File:** `apps/frontend/src/stores/auth-store.ts:45-52`

```typescript
export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  tenantId: string | null;
  tenantType: "direct" | "agency-partner" | "agency-managed" | null; // NEW
  isLoading: boolean;
  error: AuthError | null;
}
```

**File:** `apps/frontend/src/features/auth/hooks/useSessionQuery.ts:38-58`

```typescript
authActions.setAuth(
  true,
  {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    emailVerified: data.user.emailVerified,
    roles: data.user.roles,
    permissions: data.user.permissions as Permission[],
    tenantType: data.user.tenantType, // NEW
  },
  data.user.tenantId,
  data.user.tenantType, // NEW
);
```

**Acceptance Criteria:**

- [ ] Auth store tracks tenant type
- [ ] Session hook populates tenant type
- [ ] Type-safe tenant type handling

**Estimated Effort:** 0.5 days

---

### Task 1.4: Update Tenant Provider

**Objective:** Expose tenant type through React context

**File:** `apps/frontend/src/providers/TenantProvider.tsx:10-13`

```typescript
export interface TenantContextValue {
  /** Resolved tenant UUID for the current client session, when known. */
  tenantId: string | undefined;
  /** Tenant type for capability-based rendering */
  tenantType: "direct" | "agency-partner" | "agency-managed" | undefined; // NEW
}
```

**Acceptance Criteria:**

- [ ] Tenant context includes tenant type
- [ ] Type derived from auth store
- [ ] Available throughout app via `useTenant()`

**Estimated Effort:** 0.5 days

---

### Task 1.5: Implement Agency Route Guards

**Objective:** Protect agency routes from non-agency tenants

**File:** `apps/frontend/src/features/dashboard/route-guards/create-agency-dashboard-before-load.ts` (NEW)

```typescript
import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import type { RouteGuardBeforeLoadFn } from "@/lib/auth/route-guards/guard-types";

export function createAgencyDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  return async function agencyDashboardBeforeLoad(ctx: unknown) {
    const auth = useAuthStore();
    const { params } = ctx as { params: { locale: string } };

    // Only agency-partner tenants can access agency dashboard
    if (auth.tenantType !== "agency-partner") {
      throw redirect({
        to: "/$locale/dashboard",
        params: { locale: params.locale },
        replace: true,
      });
    }
  };
}
```

**File:** `apps/frontend/src/routes/$locale/dashboard/agency.tsx`

```typescript
import { createAgencyDashboardBeforeLoad } from "@/features/dashboard/route-guards/create-agency-dashboard-before-load";

export const Route = createFileRoute("/$locale/dashboard/agency")({
  beforeLoad: createAgencyDashboardBeforeLoad(),
  component: () => import("@/features/dashboard/pages/agency/AgencyDashboardPage"),
});
```

**File:** `apps/frontend/src/features/dashboard/route-guards/create-agency-client-dashboard-before-load.ts` (UPDATE)

```typescript
// Replace mock constant check with API call
export function createAgencyClientDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  const base = createDashboardParentBeforeLoad();
  const beforeLoad: RouteGuardBeforeLoadFn = async (ctx: unknown) => {
    const { params } = ctx as { params: { locale: string; clientId: string } };
    const auth = useAuthStore();

    // Verify tenant type
    if (auth.tenantType !== "agency-partner") {
      throw redirect({
        to: "/$locale/dashboard",
        params: { locale: params.locale },
        replace: true,
      });
    }

    // TODO: Server-side validation of client access (Phase 2)
    await base(ctx);
  };
  beforeLoad.__routeGuardFactoryKind = "protected";
  return beforeLoad;
}
```

**Acceptance Criteria:**

- [ ] Non-agency tenants redirected from `/dashboard/agency`
- [ ] Agency client routes protected by tenant type
- [ ] Error handling for unauthorized access

**Estimated Effort:** 1 day

---

### Task 1.6: Remove Mock Agency Constants

**Objective:** Replace hardcoded agency data with API-driven approach

**File:** `apps/frontend/src/features/dashboard/model/dashboard-agency-constants.ts` (DELETE)

```typescript
// DELETE THIS FILE
export const DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS = new Set(["client-a", "client-b"]);
```

**File:** `apps/frontend/src/features/dashboard/api/dashboard-api.ts` (UPDATE)

```typescript
// Remove import
// import { DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS } from "@/features/dashboard/model/dashboard-agency-constants";

// Add API call to fetch permitted clients
export async function fetchAgencyPermittedClients(
  tenantId: string | undefined,
): Promise<DashboardResult<Array<{ clientId: string; name: string }>>> {
  const missing = assertTenant(tenantId);
  if (missing) return missing;

  try {
    // TODO: Call tRPC endpoint when backend implemented
    // const result = await trpc.agency.getPermittedClients.query({ tenantId });

    // Temporary mock until backend ready
    return ok([
      { clientId: "client-a", name: "Client A" },
      { clientId: "client-b", name: "Client B" },
    ]);
  } catch (error) {
    return err(mapUnknownToDashboardError(error));
  }
}
```

**Acceptance Criteria:**

- [ ] Mock constant file deleted
- [ ] API function prepared for backend integration
- [ ] Route guards updated to not use mock data

**Estimated Effort:** 0.5 days

---

## Phase 2: Feature Enforcement

### Task 2.1: Create Tenant Type Hook

**Objective:** Provide reusable tenant type checking

**File:** `apps/frontend/src/hooks/useTenantType.ts` (NEW)

```typescript
import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";

export type TenantType = "direct" | "agency-partner" | "agency-managed";

export function useTenantType(): {
  tenantType: TenantType | null;
  isDirect: boolean;
  isAgencyPartner: boolean;
  isAgencyManaged: boolean;
  isLoading: boolean;
} {
  const auth = useAuthStore();

  return useMemo(() => {
    const tenantType = auth.tenantType ?? null;
    return {
      tenantType,
      isDirect: tenantType === "direct",
      isAgencyPartner: tenantType === "agency-partner",
      isAgencyManaged: tenantType === "agency-managed",
      isLoading: auth.isLoading,
    };
  }, [auth.tenantType, auth.isLoading]);
}
```

**Acceptance Criteria:**

- [ ] Hook provides type-safe tenant type checks
- [ ] Boolean flags for easy conditional rendering
- [ ] Loading state handling

**Estimated Effort:** 0.5 days

---

### Task 2.2: Implement Feature Flag System

**Objective:** Gate features by tenant type

**File:** `apps/frontend/src/lib/features/tenant-capabilities.ts` (NEW)

```typescript
import type { TenantType } from "@/hooks/useTenantType";

export interface TenantCapabilities {
  canAccessAgencyDashboard: boolean;
  canManageClientTenants: boolean;
  canCreateInsights: boolean;
  canManageConnectors: boolean;
  canViewReports: boolean;
  canWhiteLabelReports: boolean; // Phase 2
  canSwitchClientContext: boolean;
}

export function getTenantCapabilities(tenantType: TenantType | null): TenantCapabilities {
  switch (tenantType) {
    case "direct":
      return {
        canAccessAgencyDashboard: false,
        canManageClientTenants: false,
        canCreateInsights: true,
        canManageConnectors: true,
        canViewReports: true,
        canWhiteLabelReports: false,
        canSwitchClientContext: false,
      };
    case "agency-partner":
      return {
        canAccessAgencyDashboard: true,
        canManageClientTenants: true,
        canCreateInsights: true,
        canManageConnectors: true,
        canViewReports: true,
        canWhiteLabelReports: true, // Phase 2
        canSwitchClientContext: true,
      };
    case "agency-managed":
      return {
        canAccessAgencyDashboard: false,
        canManageClientTenants: false,
        canCreateInsights: true,
        canManageConnectors: true,
        canViewReports: true,
        canWhiteLabelReports: false,
        canSwitchClientContext: false,
      };
    default:
      // Fail closed - no capabilities
      return {
        canAccessAgencyDashboard: false,
        canManageClientTenants: false,
        canCreateInsights: false,
        canManageConnectors: false,
        canViewReports: false,
        canWhiteLabelReports: false,
        canSwitchClientContext: false,
      };
  }
}
```

**Acceptance Criteria:**

- [ ] Capability matrix matches business architecture
- [ ] Type-safe capability checking
- [ ] Fail-closed default behavior

**Estimated Effort:** 1 day

---

### Task 2.3: Update Navigation with Capability Checks

**Objective:** Adapt navigation menu based on tenant capabilities

**File:** `apps/frontend/src/components/layout/app-shell-navigation.tsx` (UPDATE)

```typescript
import { useTenantType } from "@/hooks/useTenantType";
import { getTenantCapabilities } from "@/lib/features/tenant-capabilities";

export function AppShellNavigation() {
  const { tenantType, isLoading } = useTenantType();
  const capabilities = getTenantCapabilities(tenantType);

  return (
    <nav>
      {/* Standard navigation for all tenants */}
      <NavLink href="/dashboard">{t("dashboard")}</NavLink>
      <NavLink href="/dashboard/connectors">{t("connectors")}</NavLink>
      <NavLink href="/dashboard/insights">{t("insights")}</NavLink>

      {/* Agency-only navigation */}
      {capabilities.canAccessAgencyDashboard && (
        <NavLink href="/dashboard/agency">{t("agency.title")}</NavLink>
      )}
    </nav>
  );
}
```

**Acceptance Criteria:**

- [ ] Agency links hidden for non-agency tenants
- [ ] Navigation adapts on tenant type change
- [ ] Loading state handled gracefully

**Estimated Effort:** 1 day

---

### Task 2.4: Conditional Dashboard Rendering

**Objective:** Show/hide dashboard features based on capabilities

**File:** `apps/frontend/src/features/dashboard/ui/surfaces/HomeDashboardSurface.tsx` (UPDATE)

```typescript
import { useTenantType } from "@/hooks/useTenantType";
import { getTenantCapabilities } from "@/lib/features/tenant-capabilities";

export function HomeDashboardSurface({ user, scopedClientId }: HomeDashboardSurfaceProps) {
  const { tenantType } = useTenantType();
  const capabilities = getTenantCapabilities(tenantType);

  return (
    <Stack>
      {/* KPI Section - All tenants */}
      <DashboardAsyncSection>{/* KPIs */}</DashboardAsyncSection>

      {/* Quick Actions - Conditional */}
      <Stack>
        <Text fw={600}>{t("home.quickActions.title")}</Text>
        <SimpleGrid cols={3}>
          <Button component={Link} href="/dashboard/insights">
            {t("home.quickActions.insights")}
          </Button>

          {/* Agency-only quick action */}
          {capabilities.canAccessAgencyDashboard && (
            <Button component={Link} href="/dashboard/agency">
              {t("home.quickActions.agency")}
            </Button>
          )}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
```

**Acceptance Criteria:**

- [ ] Features gated by capabilities
- [ ] UI adapts without layout shifts
- [ ] Accessibility maintained

**Estimated Effort:** 1 day

---

### Task 2.5: Backend API for Agency Clients

**Objective:** Create tRPC endpoint for agency client list

**Backend File:** `apps/api/src/trpc/routers/agency.ts` (NEW)

```typescript
import { t } from "../init";
import { requireAgencyPartnerTenant } from "../../middleware/tenant-type-guard";

export const agencyRouter = t.router({
  getPermittedClients: t.procedure
    .use(requireAgencyPartnerTenant) // Custom middleware
    .query(async ({ ctx }) => {
      const db = getTrpcDatabase();
      const agencyPartnerId = ctx.auth.tenantId;

      const clients = await db
        .select({
          clientId: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
        })
        .from(tenants)
        .where(eq(tenants.agencyPartnerId, agencyPartnerId));

      return clients;
    }),
});
```

**Frontend Integration:** Update `fetchAgencyPermittedClients` to call actual endpoint

**Acceptance Criteria:**

- [ ] Endpoint returns agency's client tenants
- [ ] Middleware validates agency partner access
- [ ] Frontend integrated with real data

**Estimated Effort:** 2 days (backend + frontend)

---

## Phase 3: UX Polish

### Task 3.1: Tenant Type Onboarding

**Objective:** Provide tenant-type-specific onboarding flows

**File:** `apps/frontend/src/features/onboarding/tenant-type-onboarding.tsx` (NEW)

```typescript
export function TenantTypeOnboarding() {
  const { tenantType } = useTenantType();

  if (tenantType === "agency-partner") {
    return <AgencyPartnerOnboarding />;
  }

  if (tenantType === "agency-managed") {
    return <AgencyManagedOnboarding />;
  }

  return <DirectBusinessOnboarding />;
}
```

**Acceptance Criteria:**

- [ ] Different onboarding per tenant type
- [ ] Highlights tenant-specific features
- [ ] Skippable for returning users

**Estimated Effort:** 1-2 days

---

### Task 3.2: Agency Client Switcher UI

**Objective:** Polish tenant switching for agency partners

**File:** `apps/frontend/src/components/tenant/agency-client-switcher.tsx` (NEW)

```typescript
export function AgencyClientSwitcher() {
  const { tenantType } = useTenantType();
  const { data: clients } = useQuery({
    queryKey: ['agency', 'clients'],
    queryFn: () => fetchAgencyPermittedClients(currentTenantId),
    enabled: tenantType === "agency-partner",
  });

  return (
    <Select
      label="Select Client Tenant"
      data={clients?.map(c => ({ value: c.clientId, label: c.name }))}
      onChange={(clientId) => setDashboardContext({
        contextMode: "agency_client",
        activeClientId: clientId
      })}
    />
  );
}
```

**Acceptance Criteria:**

- [ ] Easy client switching for agencies
- [ ] Clear visual indication of active client
- [ ] Only visible to agency partners

**Estimated Effort:** 1 day

---

### Task 3.3: Dashboard Context Indicators

**Objective:** Show clear indication of current dashboard context

**File:** `apps/frontend/src/features/dashboard/ui/toolbar/DashboardToolbar.tsx` (UPDATE)

```typescript
export function DashboardToolbar() {
  const { contextMode, activeClientId } = useDashboardStore(s => s);

  return (
    <Toolbar>
      {contextMode === "agency_client" && activeClientId && (
        <Badge color="blue">
          Viewing: {activeClientId}
          <Button variant="subtle" onClick={() => setDashboardContext({ contextMode: "tenant" })}>
            Exit Client View
          </Button>
        </Badge>
      )}
      {/* ... rest of toolbar */}
    </Toolbar>
  );
}
```

**Acceptance Criteria:**

- [ ] Clear indication of agency client context
- [ ] Easy exit from client view
- [ ] Prevents accidental data mixing

**Estimated Effort:** 0.5 days

---

### Task 3.4: Error Messages & Edge Cases

**Objective:** Handle tenant type mismatches gracefully

**File:** `apps/frontend/src/lib/errors/tenant-type-errors.ts` (NEW)

```typescript
export const TENANT_TYPE_ERRORS = {
  AGENCY_ACCESS_DENIED: {
    code: "AGENCY_ACCESS_DENIED",
    message: "This feature is only available for agency partners",
    action: "redirect",
    redirectPath: "/dashboard",
  },
  CLIENT_ACCESS_DENIED: {
    code: "CLIENT_ACCESS_DENIED",
    message: "You do not have permission to access this client tenant",
    action: "redirect",
    redirectPath: "/dashboard/agency",
  },
} as const;
```

**Acceptance Criteria:**

- [ ] Clear error messages for type mismatches
- [ ] Appropriate redirects on errors
- [ ] User-friendly explanations

**Estimated Effort:** 0.5 days

---

## Testing Strategy

### Unit Tests

1. **Tenant Type Hook Tests**
   - `useTenantType.test.ts` - Test all tenant type scenarios
   - Test loading states and null handling

2. **Capability Function Tests**
   - `tenant-capabilities.test.ts` - Test capability matrix
   - Verify fail-closed defaults

3. **Route Guard Tests**
   - Test redirects for unauthorized tenant types
   - Test edge cases (null tenant type, loading)

### Integration Tests

1. **Agency Dashboard Access**
   - Agency partner can access `/dashboard/agency`
   - Direct tenant redirected to `/dashboard`
   - Agency-managed tenant redirected to `/dashboard`

2. **Client Switching**
   - Agency partner can switch between clients
   - Client context properly scoped
   - Data isolation maintained

### E2E Tests

1. **Tenant Type Flows**
   - Complete flow for each tenant type
   - Verify correct features visible/hidden
   - Test navigation adaptation

---

## Rollback Plan

If issues arise during deployment:

1. **Immediate Rollback Triggers:**
   - Authentication failures
   - Route guard loops
   - Data access issues

2. **Rollback Steps:**
   - Revert frontend deployment
   - Maintain backward-compatible API
   - Monitor error rates

3. **Mitigation:**
   - Feature flag tenant type enforcement
   - Gradual rollout (10% → 50% → 100%)
   - Real-time monitoring dashboard

---

## Success Metrics

### Phase 1 Success Criteria

- [ ] Zero unauthorized agency route accesses
- [ ] Session includes tenant type 100% of time
- [ ] JWT includes tenant_type claim

### Phase 2 Success Criteria

- [ ] Capability matrix enforced across UI
- [ ] Navigation adapts correctly for all tenant types
- [ ] Zero capability bypass attempts

### Phase 3 Success Criteria

- [ ] User satisfaction > 4.5/5 for agency partners
- [ ] Client switching time < 2 seconds
- [ ] Zero tenant data mixing incidents

---

## Dependencies & Blockers

### Backend Dependencies

1. **Session API Update** (Task 1.1) - Blocks all frontend work
2. **JWT Update** (Task 1.2) - Blocks route guards
3. **Agency Clients Endpoint** (Task 2.5) - Blocks Phase 2 completion

### Frontend Dependencies

1. **Type Definitions** - Must be shared from backend
2. **Auth Store Update** - Required before hooks
3. **Tenant Provider** - Required before conditional rendering

### External Dependencies

- None identified

---

## Timeline Summary

| Phase       | Tasks   | Duration       | Dependencies       |
| ----------- | ------- | -------------- | ------------------ |
| **Phase 1** | 1.1-1.6 | 3-5 days       | Backend first      |
| **Phase 2** | 2.1-2.5 | 5-7 days       | Phase 1 complete   |
| **Phase 3** | 3.1-3.4 | 3-5 days       | Phase 2 complete   |
| **Testing** | All     | 2-3 days       | Parallel to phases |
| **Total**   | -       | **13-20 days** | -                  |

---

## Resource Requirements

- **Backend Engineer:** 3-4 days (Tasks 1.1, 1.2, 2.5)
- **Frontend Engineer:** 8-12 days (All frontend tasks)
- **QA Engineer:** 2-3 days (Testing strategy)
- **Product Review:** 0.5 days (Capability matrix validation)

---

## Next Steps

1. **Immediate:** Backend team to implement Tasks 1.1 and 1.2
2. **Day 1:** Frontend team starts Tasks 1.3 and 1.4 (can use mock data)
3. **Day 2:** Implement route guards (Task 1.5)
4. **Day 3-5:** Complete Phase 1, begin Phase 2
5. **Day 6-12:** Phase 2 implementation
6. **Day 13-15:** Phase 3 polish and testing
7. **Day 16-20:** QA, bug fixes, production deployment

---

**Approval Required:** Product team to review and approve capability matrix before implementation begins.

**Review Checkpoints:**

- End of Phase 1: Security review
- End of Phase 2: Feature completeness review
- End of Phase 3: UX review and sign-off
