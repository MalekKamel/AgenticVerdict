# Frontend Account Types Review Findings

**Review Date:** 2026-05-02  
**Reviewer:** AI Agent  
**Scope:** Frontend Application (`/apps/frontend/`)  
**Status:** ✅ Complete

---

## Executive Summary

The frontend implementation demonstrates **partial support** for the two tenant types defined in the business architecture. While agency dashboard functionality exists, there is **no explicit tenant type detection or enforcement** at the authentication or session level. The current implementation relies on **mock data** and **route-based access** rather than server-driven tenant type resolution.

**Overall Assessment:** 🟡 **Moderate Risk** - Requires remediation before production

---

## 1. Tenant Type Detection & Context

### Current State

| Aspect                 | Status     | Evidence                                                             |
| ---------------------- | ---------- | -------------------------------------------------------------------- |
| Tenant type in session | ❌ Missing | `auth-store.ts:48` - `tenantId` only, no `tenantType`                |
| Tenant type in JWT     | ❌ Missing | `auth-session-jwt.ts` - JWT payload lacks `tenant_type` claim        |
| API session response   | ❌ Missing | `auth.ts:150-188` - `getSession` returns `tenantId` only             |
| Frontend context       | ❌ Missing | `TenantProvider.tsx:10-13` - `TenantContextValue` lacks `tenantType` |

### Findings

**1.1 Auth Store Limitation** (`src/stores/auth-store.ts:45-52`)

```typescript
export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  tenantId: string | null; // ❌ No tenantType field
  isLoading: boolean;
  error: AuthError | null;
}
```

**1.2 Session Output Schema** (`packages/types/src/auth.ts:118-134`)

```typescript
export const getSessionOutputSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    emailVerified: z.boolean(),
    tenantId: z.string().uuid(), // ❌ No tenantType
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
  sessionExpiresAt: z.string().nullable(),
});
```

**1.3 Tenant Provider** (`src/providers/TenantProvider.tsx:10-13`)

```typescript
export interface TenantContextValue {
  /** Resolved tenant UUID for the current client session, when known. */
  tenantId: string | undefined; // ❌ No tenantType
}
```

### Gap Analysis

The business architecture defines two tenant types with different capabilities (Section 6.2):

| Capability               | Direct Business | Agency Partner |
| ------------------------ | --------------- | -------------- |
| Create/edit own Insights | ✓               | ✓              |
| Manage data connectors   | ✓               | ✓              |
| View own reports         | ✓               | ✓              |
| Access client tenants    | —               | ✓              |
| Create client Insights   | —               | ✓              |
| View client reports      | —               | ✓              |
| White-label reporting    | —               | ✓ (Phase 2)    |

**Critical Gap:** The frontend cannot distinguish between tenant types, making it impossible to:

- Conditionally render agency-specific features
- Enforce capability restrictions
- Provide appropriate UX flows

---

## 2. UI/UX Differentiation

### Current State

| Feature                   | Status         | Implementation                         |
| ------------------------- | -------------- | -------------------------------------- |
| Agency dashboard route    | ✅ Implemented | `/dashboard/agency`                    |
| Agency client dashboard   | ✅ Implemented | `/dashboard/agency/$clientId`          |
| Agency dashboard surface  | ✅ Implemented | `AgencyDashboardSurface.tsx`           |
| Tenant-type-based UI      | ❌ Missing     | No conditional rendering based on type |
| Agency feature visibility | ⚠️ Mock Data   | Uses hardcoded constants               |

### Findings

**2.1 Agency Dashboard Exists** (`src/features/dashboard/pages/agency/AgencyDashboardPage.tsx`)

- Route accessible at `/dashboard/agency`
- Renders `AgencyDashboardSurface` component
- Shows aggregate KPIs and client list

**2.2 Mock Agency Data** (`src/features/dashboard/model/dashboard-agency-constants.ts:1-2`)

```typescript
/** Mock agency dataset: permitted client ids for guard + aggregate scoping (task 4.4). */
export const DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS = new Set(["client-a", "client-b"]);
```

⚠️ **Risk:** Hardcoded mock data instead of server-driven agency client list

**2.3 Agency Client View** (`src/features/dashboard/ui/surfaces/AgencyDashboardSurface.tsx:48-50`)

```typescript
const permittedClients = useMemo(
  () => (overviewQuery.data ? filterAgencyClientsForRendering(overviewQuery.data) : []),
  [overviewQuery.data],
);
```

✅ **Positive:** Uses API data for client list rendering

**2.4 Home Dashboard with Agency Context** (`src/features/dashboard/ui/surfaces/HomeDashboardSurface.tsx:39-40`)

```typescript
export type HomeDashboardSurfaceProps = {
  user: AuthUserData | null;
  /** When set, cache keys and context are scoped for agency client mode (task 4.2). */
  scopedClientId?: string; // ✅ Supports agency client context
};
```

### Gap Analysis

✅ **Strengths:**

- Agency dashboard routes and surfaces implemented
- Dashboard store supports `agency_overview` and `agency_client` context modes
- Client-scoped data fetching implemented

❌ **Gaps:**

- No tenant-type-based navigation adaptation
- Agency features accessible to all tenants (no type guard)
- Mock data used for permitted client IDs instead of API-driven list

---

## 3. Navigation & Route Protection

### Current State

| Route                         | Protected | Tenant-Type Guarded | Status             |
| ----------------------------- | --------- | ------------------- | ------------------ |
| `/dashboard`                  | ✅ Yes    | ❌ No               | All tenants access |
| `/dashboard/agency`           | ✅ Yes    | ❌ No               | All tenants access |
| `/dashboard/agency/$clientId` | ✅ Yes    | ⚠️ Partial          | Mock guard only    |

### Findings

**3.1 Agency Client Route Guard** (`src/features/dashboard/route-guards/create-agency-client-dashboard-before-load.ts:8-20`)

```typescript
export function createAgencyClientDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  const base = createDashboardParentBeforeLoad();
  const beforeLoad: RouteGuardBeforeLoadFn = async (ctx: unknown) => {
    const { params } = ctx as { params: { locale: string; clientId: string } };
    if (!DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS.has(params.clientId)) {
      throw redirect({
        to: "/$locale/dashboard/agency",
        params: { locale: params.locale },
        replace: true,
      });
    }
    await base(ctx);
  };
  beforeLoad.__routeGuardFactoryKind = "protected";
  return beforeLoad;
}
```

⚠️ **Issue:** Guard checks against mock constant, not actual agency permissions

**3.2 Route Paths** (`src/router/utils/route-paths.ts:26-27`)

```typescript
DASHBOARD_AGENCY: "/$locale/dashboard/agency" as const,
DASHBOARD_AGENCY_CLIENT: "/$locale/dashboard/agency/$clientId" as const,
```

**3.3 Dashboard Store Context Modes** (`src/features/dashboard/model/dashboard-store.ts:5`)

```typescript
export type DashboardContextMode = "tenant" | "agency_overview" | "agency_client";
```

✅ **Positive:** Store supports different context modes

### Gap Analysis

❌ **Critical Gaps:**

1. No tenant-type-based route protection
2. Agency routes accessible by direct business tenants
3. Mock guard constants instead of server-driven permissions
4. No redirect logic based on tenant type

---

## 4. Feature Flags & Capabilities

### Current State

| Capability              | Implementation           | Enforcement           |
| ----------------------- | ------------------------ | --------------------- |
| Agency dashboard access | UI route exists          | ❌ None               |
| Client tenant switching | Dashboard store supports | ⚠️ Manual context set |
| White-label reporting   | i18n keys exist          | ❌ Not implemented    |
| Agency KPIs             | API mock data            | ⚠️ Placeholder        |

### Findings

**4.1 Dashboard Permissions Resolver** (`src/features/dashboard/ui/surfaces/dashboard-permissions.ts` - not found in search)

- Permission resolution exists but tenant-type awareness unclear

**4.2 Capability Matrix Not Enforced**
Business architecture Section 6.2 defines clear capability differences, but:

- No feature flag system based on tenant type
- No UI conditional rendering based on tenant capabilities
- No API-level capability enforcement visible from frontend

**4.3 Internationalization Support** (`messages/en.json:692,701`)

```json
"agency": {
  "title": "Agency Dashboard",
  "subtitle": "Manage your client tenants",
  "clientList": "Client Tenants",
  "viewTenant": "View Tenant"
}
```

✅ **Positive:** i18n keys prepared for agency features

### Gap Analysis

❌ **Missing:**

- Tenant-type-based feature flag system
- Capability matrix enforcement
- White-label reporting implementation (Phase 2 per roadmap)

---

## 5. Data Display & Tenant Isolation

### Current State

| Aspect                        | Status         | Notes                   |
| ----------------------------- | -------------- | ----------------------- |
| Tenant ID in tRPC headers     | ✅ Implemented | `trpc-tenant-bridge.ts` |
| Tenant context propagation    | ✅ Implemented | `TenantProvider.tsx`    |
| Agency client data scoping    | ⚠️ Partial     | Uses `scopedClientId`   |
| Cross-tenant data mixing risk | ⚠️ Moderate    | Mock guards             |

### Findings

**5.1 tRPC Tenant Bridge** (`src/lib/tenant/trpc-tenant-bridge.ts:47-58`)

```typescript
export function getTenantIdForTrpcRequest(): string | undefined {
  const authTenantId =
    authStore.state.isAuthenticated && isTenantUuid(authStore.state.tenantId)
      ? authStore.state.tenantId
      : undefined;
  const fromEnvOnly = getEffectiveTenantId({});
  return resolveTenantIdByPriority(
    authTenantId,
    providerResolvedTenantId,
    fromEnvOnly,
    getDevLocalhostTenantFallback(),
  );
}
```

✅ **Positive:** Proper tenant ID resolution for API requests

**5.2 Agency Overview API** (`src/features/dashboard/api/dashboard-api.ts:19`)

```typescript
import { DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS } from "@/features/dashboard/model/dashboard-agency-constants";
```

⚠️ **Risk:** Imports mock constant instead of using API-driven list

**5.3 Dashboard Query Keys** (`src/features/dashboard/model/dashboard-query-keys.ts:29`)

```typescript
return [...root, "agency", scope.tenantId] as const;
```

✅ **Positive:** Agency queries scoped by tenant ID

### Gap Analysis

✅ **Strengths:**

- Tenant isolation in API calls via `x-tenant-id` header
- Query cache scoping by tenant

⚠️ **Risks:**

- Agency client list uses mock data
- No server-side agency permission validation visible from frontend
- Potential for unauthorized client access if mock guards bypassed

---

## 6. Authentication & RBAC Roles

### Current State

| Aspect                       | Status         | Notes                     |
| ---------------------------- | -------------- | ------------------------- |
| RBAC roles in session        | ✅ Implemented | `roles` array in JWT      |
| Role-based permissions       | ✅ Implemented | `usePermissions` hook     |
| Tenant-type role differences | ❌ Missing     | Same roles for both types |
| Agency-specific roles        | ❌ Missing     | No agency partner roles   |

### Findings

**6.1 RBAC Hooks** (`src/features/rbac/hooks/usePermissions.ts`)

- Permission checking implemented
- No tenant-type awareness

**6.2 Seed Data Role Assignment** (from `/docs/development/seeded-data-reference.md:294-303`)

**Direct Business Tenants:**
| Role | Email Pattern |
|------|---------------|
| Admin | `admin+{slug}@test.local` |
| Analyst | `analyst+{slug}@test.local` |
| Viewer | `viewer+{slug}@test.local` |

**Agency-Managed Tenants:**
| Role | Email Pattern |
|------|---------------|
| Admin | `admin+{slug}@test.local` |
| Editor | `editor+{slug}@test.local` |

✅ **Positive:** Seed data respects tenant type role differences

**6.3 Auth Session** (`src/features/auth/hooks/useSessionQuery.ts:38-58`)

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
  },
  data.user.tenantId, // ❌ No tenantType
);
```

### Gap Analysis

✅ **Strengths:**

- RBAC roles and permissions implemented
- Seed data differentiates roles by tenant type

❌ **Gaps:**

- Session doesn't include tenant type
- No agency partner-specific roles
- Frontend can't adapt UX based on tenant type

---

## 7. Security & Tenant Isolation Risks

### Identified Risks

| Risk ID      | Severity  | Description                                | Mitigation                |
| ------------ | --------- | ------------------------------------------ | ------------------------- |
| **RISK-001** | 🔴 High   | Agency routes accessible to direct tenants | Add tenant-type guard     |
| **RISK-002** | 🔴 High   | Mock agency client guards bypassable       | Server-driven permissions |
| **RISK-003** | 🟡 Medium | No tenant type in JWT/session              | Add `tenant_type` claim   |
| **RISK-004** | 🟡 Medium | Capability matrix not enforced             | Feature flag system       |
| **RISK-005** | 🟡 Medium | Agency features visible to all tenants     | Conditional rendering     |

### Risk Details

**RISK-001: Agency Route Access**

- **Impact:** Direct business tenants can access `/dashboard/agency`
- **Exploit:** Navigate directly to agency URL
- **Fix:** Add tenant-type check in route `beforeLoad`

**RISK-002: Mock Guard Bypass**

- **Impact:** Unauthorized client tenant access
- **Exploit:** Modify `clientId` parameter
- **Fix:** Server-side agency permission validation

**RISK-003: Missing Tenant Type in Session**

- **Impact:** Cannot enforce tenant-type logic
- **Exploit:** N/A (architectural gap)
- **Fix:** Add `tenant_type` to JWT and session response

---

## 8. Summary of Gaps

### Critical Gaps (Must Fix Before Production)

1. **No Tenant Type Detection** - Frontend cannot distinguish tenant types
2. **Missing Session Data** - JWT and session lack `tenant_type`
3. **No Route Protection** - Agency routes accessible to all tenants
4. **Mock Agency Guards** - Hardcoded constants instead of API data

### High Priority Gaps

5. **Capability Matrix Not Enforced** - Features not gated by tenant type
6. **No Conditional UI** - UI doesn't adapt to tenant capabilities
7. **Missing Agency Roles** - No agency partner-specific RBAC roles

### Medium Priority Gaps

8. **Dashboard Navigation** - Menu doesn't adapt to tenant type
9. **White-Label Reporting** - Phase 2 feature not implemented
10. **Tenant Switching UX** - Agency client switching not polished

---

## 9. Recommendations

### Immediate Actions (Pre-Production)

1. **Add Tenant Type to Session**
   - Update `getSessionOutputSchema` to include `tenantType`
   - Modify JWT signing to include `tenant_type` claim
   - Update auth store to track `tenantType`

2. **Implement Route Guards**
   - Add tenant-type checks to agency route `beforeLoad`
   - Redirect non-agency tenants away from agency routes
   - Server-side validation for agency client access

3. **Replace Mock Data**
   - Create tRPC endpoint for agency client list
   - Remove `DASHBOARD_AGENCY_PERMITTED_CLIENT_IDS` constant
   - Fetch permitted clients from API

### Short-Term Actions (Phase 1)

4. **Feature Flag System**
   - Implement tenant-type-based feature flags
   - Gate agency features behind tenant type check
   - Add capability matrix enforcement

5. **Conditional UI Rendering**
   - Adapt navigation menu based on tenant type
   - Show/hide agency features appropriately
   - Provide tenant-type-specific onboarding

### Long-Term Actions (Phase 2)

6. **White-Label Reporting**
   - Agency branding on client reports
   - Custom domain support for agencies
   - Client-facing reporting portal

7. **Enhanced Agency Tools**
   - Bulk client operations
   - Cross-client analytics
   - Agency billing integration

---

## 10. Related Files

### Frontend Files Reviewed

| File Path                                                                           | Purpose              |
| ----------------------------------------------------------------------------------- | -------------------- |
| `src/stores/auth-store.ts`                                                          | Authentication state |
| `src/providers/TenantProvider.tsx`                                                  | Tenant context       |
| `src/lib/tenant/trpc-tenant-bridge.ts`                                              | tRPC tenant headers  |
| `src/features/dashboard/model/dashboard-store.ts`                                   | Dashboard state      |
| `src/features/dashboard/api/dashboard-api.ts`                                       | Dashboard API        |
| `src/features/dashboard/route-guards/create-agency-client-dashboard-before-load.ts` | Route guard          |
| `src/features/dashboard/ui/surfaces/AgencyDashboardSurface.tsx`                     | Agency UI            |

### Backend Files Referenced

| File Path                                   | Purpose          |
| ------------------------------------------- | ---------------- |
| `apps/api/src/trpc/routers/auth.ts`         | Auth tRPC router |
| `apps/api/src/middleware/auth.ts`           | Auth middleware  |
| `packages/types/src/auth.ts`                | Auth types       |
| `packages/database/src/seeds/users-seed.ts` | Seed data        |

### Documentation References

| Document                                               | Relevance                     |
| ------------------------------------------------------ | ----------------------------- |
| `/docs/architecture/business/business-architecture.md` | Tenant type definition        |
| `/docs/development/seeded-data-reference.md`           | Seed data structure           |
| `/docs/05-reference/multi-tenant-guardrails.md`        | Tenant isolation requirements |

---

## 11. Conclusion

The frontend demonstrates **solid foundational work** on agency dashboard functionality, but lacks **critical tenant type awareness** required for production multi-tenant SaaS operations. The implementation relies on **mock data** and **route-based access** rather than server-driven tenant type resolution and enforcement.

**Priority:** Address critical gaps (RISK-001 through RISK-004) before any production deployment.

**Estimated Effort:**

- Critical fixes: 3-5 days
- High priority: 5-7 days
- Full remediation: 2-3 weeks

---

**Next Steps:** See `/prompts/frontend-account-types-remediation-plan.md` for detailed implementation plan.
