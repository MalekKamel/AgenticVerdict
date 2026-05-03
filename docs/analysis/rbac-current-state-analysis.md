# RBAC Current State Analysis

**Document Type:** Security Analysis  
**Date:** 2026-04-30  
**Author:** AI Analysis Agent  
**Status:** Complete

---

## Executive Summary

The AgenticVerdict platform currently implements Role-Based Access Control (RBAC) through **fragile, email-based heuristics** rather than a proper database-driven authorization system. This analysis identifies **27 distinct locations** where authorization logic exists across the codebase, with the most critical vulnerability being the reliance on email domain matching (`email.endsWith("@agenticverdict.com")`) to determine administrative privileges.

### Key Findings

| Category                        | Count | Risk Level   |
| ------------------------------- | ----- | ------------ |
| Email-based role determination  | 5     | **CRITICAL** |
| Role-based middleware checks    | 8     | HIGH         |
| Frontend UI gating              | 6     | MEDIUM       |
| Permission hook implementations | 2     | MEDIUM       |
| Database schema gaps            | 1     | **CRITICAL** |
| Type definitions (incomplete)   | 4     | LOW          |

### Critical Vulnerabilities

1. **Email Domain Dependency**: Admin status is determined by email domain, not database records
2. **No Database Authority**: The `users` table has no role/permission columns
3. **Inconsistent Role Sets**: Different parts of the codebase use different role names (`admin`, `viewer`, `member`, `analyst`, `owner`, `reports:read`, `reports:write`, etc.)
4. **JWT-Stored Roles**: Roles are embedded in JWT tokens at login time and never refreshed during session

---

## Complete Inventory of RBAC-Related Code

### 1. Role Determination Logic (CRITICAL)

These locations determine what roles a user has. This is the most critical area as it's the foundation of all authorization decisions.

#### 1.1 Backend: Primary Role Resolution

| File                                 | Lines   | Pattern                       | Risk         |
| ------------------------------------ | ------- | ----------------------------- | ------------ |
| `/apps/api/src/trpc/routers/auth.ts` | 50-55   | `resolveUserRoles()` function | **CRITICAL** |
| `/apps/api/src/trpc/routers/auth.ts` | 78, 199 | Calls to `resolveUserRoles()` | **CRITICAL** |

**Code Snippet:**

```typescript
// /apps/api/src/trpc/routers/auth.ts:50-55
function resolveUserRoles(email: string): string[] {
  if (email.endsWith("@agenticverdict.com")) {
    return ["admin"];
  }
  return ["viewer"];
}
```

**Impact:** Any user with an `@agenticverdict.com` email automatically receives admin privileges. This is hardcoded and cannot be changed without code deployment.

#### 1.2 Frontend: Mock API Role Resolution

| File                                     | Lines | Pattern                  | Risk         |
| ---------------------------------------- | ----- | ------------------------ | ------------ |
| `/apps/frontend/src/lib/api/auth-api.ts` | 388   | Email-based role in mock | **CRITICAL** |

**Code Snippet:**

```typescript
// /apps/frontend/src/lib/api/auth-api.ts:388
const roles = input.email.endsWith("@agenticverdict.com") ? ["admin"] : ["viewer"];
```

**Impact:** Mock implementation mirrors the vulnerable backend pattern.

#### 1.3 Frontend: UI Role Determination

| File                                                                         | Lines | Pattern                               | Risk         |
| ---------------------------------------------------------------------------- | ----- | ------------------------------------- | ------------ |
| `/apps/frontend/src/components/layout/AppShellLayout.tsx`                    | 72-73 | Email check for navigation roles      | **CRITICAL** |
| `/apps/frontend/src/components/layout/AppNavigation.tsx`                     | 58-59 | Email check for navigation roles      | **CRITICAL** |
| `/apps/frontend/src/features/dashboard/ui/surfaces/dashboard-permissions.ts` | 10    | Email check for dashboard permissions | **CRITICAL** |

**Code Snippets:**

```typescript
// AppShellLayout.tsx:72-73
const roles: AppShellNavRole[] = auth.user?.email?.endsWith("@agenticverdict.com")
  ? ["admin", "member"]
  : ["member"];

// AppNavigation.tsx:58-59
const roles: AppShellNavRole[] = auth.user?.email?.endsWith("@agenticverdict.com")
  ? ["admin", "member"]
  : ["member"];

// dashboard-permissions.ts:10
const privileged = Boolean(user?.email?.endsWith("@agenticverdict.com"));
```

---

### 2. Authorization Middleware (HIGH RISK)

These locations enforce role-based access control on API routes.

#### 2.1 Core RBAC Middleware

| File                                      | Lines  | Purpose                                 |
| ----------------------------------------- | ------ | --------------------------------------- |
| `/apps/api/src/middleware/report-rbac.ts` | 6-23   | `requireAnyRole()` middleware           |
| `/apps/api/src/middleware/auth.ts`        | 90-220 | `jwtAuth()` with optional role checking |

**Code Snippet:**

```typescript
// report-rbac.ts:6-23
export function requireAnyRole(...allowed: string[]) {
  return async function requireRoleMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const roles = request.auth?.roles ?? [];
    if (!allowed.some((r) => roles.includes(r))) {
      await reply.status(403).send({
        error: { code: "forbidden", message: "errors.auth.forbidden", details: {} },
        requestId: request.id,
      });
      return;
    }
  };
}
```

#### 2.2 Routes Using RBAC Middleware

| File                                          | Lines            | Roles Required                          | Endpoint Pattern             |
| --------------------------------------------- | ---------------- | --------------------------------------- | ---------------------------- |
| `/apps/api/src/routes/v1/reports.ts`          | 172-174, 176-197 | `readRoles`, `writeRoles`, `shareRoles` | `/api/v1/reports/*`          |
| `/apps/api/src/routes/v1/report-schedules.ts` | 27-28, 65-78     | `readRoles`, `writeRoles`               | `/api/v1/report-schedules/*` |
| `/apps/api/src/routes/v1/report-templates.ts` | 26-27, 44-57     | `readRoles`, `writeRoles`               | `/api/v1/report-templates/*` |
| `/apps/api/src/routes/v1/translations.ts`     | 22-23, 42-56     | `readRoles`, `writeRoles`               | `/api/v1/translations/*`     |
| `/apps/api/src/routes/v1/workflows.ts`        | 61, 143-145      | `adminRoles`                            | `/api/v1/workflows/*`        |
| `/apps/api/src/routes/v1/test-flow.ts`        | 19, 54           | `adminRoles`                            | `/api/v1/test-flow/*`        |

**Role Definitions by Route:**

```typescript
// reports.ts:172-174
const readRoles = ["analyst", "reports:read", "admin"] as const;
const writeRoles = ["reports:write", "admin"] as const;
const shareRoles = ["admin", "reports:share", "reports:write"] as const;

// translations.ts:22-23
const readRoles = ["analyst", "reports:read", "admin", "translations:read"] as const;
const writeRoles = ["admin", "translations:write"] as const;

// report-schedules.ts:27-28
const readRoles = ["analyst", "reports:read"] as const;
const writeRoles = ["reports:write", "admin"] as const;

// workflows.ts:61
const adminRoles = ["admin"] as const;
```

---

### 3. Frontend UI Gating (MEDIUM RISK)

These locations control what UI elements are visible/accessible based on roles.

#### 3.1 Navigation Filtering

| File                                                           | Lines | Purpose                           |
| -------------------------------------------------------------- | ----- | --------------------------------- |
| `/apps/frontend/src/components/layout/app-shell-navigation.ts` | 4-78  | Navigation item filtering by role |

**Code Snippet:**

```typescript
// app-shell-navigation.ts:4-49
export type AppShellNavRole = "admin" | "member";

export const APP_SHELL_NAV_ITEMS: readonly AppShellNavItem[] = [
  { id: "home", href: "/", labelKey: "home", ... },
  { id: "dashboard", href: "/dashboard", labelKey: "dashboard", ... },
  {
    id: "featureFlags",
    href: "/dashboard/feature-flags",
    labelKey: "featureFlags",
    requiredRoles: ["admin"],  // Admin-only navigation
    featureFlag: "featureFlagsAdminUi",
  },
];

// Lines 67-72: Role checking logic
function hasRequiredRole(item: AppShellNavItem, roles: readonly AppShellNavRole[]): boolean {
  if (!item.requiredRoles || item.requiredRoles.length === 0) {
    return true;
  }
  return item.requiredRoles.some((role) => roles.includes(role));
}
```

#### 3.2 Permission Hooks

| File                                                                      | Lines | Purpose                      |
| ------------------------------------------------------------------------- | ----- | ---------------------------- |
| `/apps/frontend/src/features/connectors/hooks/useConnectorPermissions.ts` | 21-36 | Connector action permissions |

**Code Snippet:**

```typescript
// useConnectorPermissions.ts:24-36
export function useConnectorPermissions(): ConnectorPermissions {
  const { user } = useAuthStore();

  return useMemo(() => {
    const roles = user?.roles ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("owner");
    const isAnalyst = roles.includes("analyst");

    return {
      canView: true,
      canSync: isAdmin || isAnalyst,
      canConfigure: isAdmin,
      canAdd: isAdmin,
      canRemove: isAdmin,
    };
  }, [user?.roles]);
}
```

---

### 4. Database Schema (CRITICAL GAP)

| File                                     | Status            | Issue                      |
| ---------------------------------------- | ----------------- | -------------------------- |
| `/packages/database/src/schema/users.ts` | **MISSING ROLES** | No role/permission columns |

**Current Schema:**

```typescript
// users.ts:5-25
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  email: varchar("email", { length: 320 }).notNull(),
  displayName: varchar("display_name", { length: 256 }),
  passwordHash: varchar("password_hash", { length: 512 }),
  emailVerified: boolean("email_verified").notNull().default(true),
  // ... verification tokens, timestamps
  // NO ROLE OR PERMISSION COLUMNS
});
```

**Impact:** Roles cannot be managed, audited, or changed without code deployment.

---

### 5. Type Definitions (INCOMPLETE)

| File                                      | Lines          | Purpose                    |
| ----------------------------------------- | -------------- | -------------------------- |
| `/packages/types/src/auth.ts`             | 44-47, 125-128 | Role array in auth schemas |
| `/apps/frontend/src/stores/auth-store.ts` | 27             | Role array in UserInfo     |
| `/apps/api/src/middleware/auth.ts`        | 62-66          | AuthPayload interface      |
| `/apps/api/src/lib/auth-session-jwt.ts`   | 11, 16         | JWT signing with roles     |

**Type Definitions:**

```typescript
// types/src/auth.ts:44-47
roles: z.array(z.string()).default([])  // Unrestricted string array - no type safety

// auth-store.ts:27
roles: string[];  // No enum or union type

// auth.ts:62-66
export interface AuthPayload {
  userId: string;
  tenantId: string;
  roles: string[];  // Unrestricted
}
```

---

### 6. JWT Token Handling

| File                                    | Lines   | Purpose                  |
| --------------------------------------- | ------- | ------------------------ |
| `/apps/api/src/lib/auth-session-jwt.ts` | 11, 16  | Roles embedded in JWT    |
| `/apps/api/src/middleware/auth.ts`      | 229-269 | Role extraction from JWT |

**Issue:** Roles are set at login time and never refreshed. If a user's roles change in the database (when implemented), they won't take effect until the user logs out and back in.

---

### 7. Test Files (Evidence of Role Usage)

| File                                                                           | Lines       | Roles Tested                 |
| ------------------------------------------------------------------------------ | ----------- | ---------------------------- |
| `/apps/api/src/middleware/auth-security-matrix.test.ts`                        | 59, 122-436 | `admin`, `analyst`           |
| `/apps/api/src/routes/v1/workflows.test.ts`                                    | 25-63       | `admin`                      |
| `/apps/frontend/src/features/connectors/hooks/useConnectorPermissions.test.ts` | 17-40       | `admin`, `viewer`, `analyst` |
| `/apps/frontend/src/components/layout/app-shell-navigation.test.ts`            | 12-20       | `member`, `admin`            |

---

## Categorization by Type

### Category 1: Role Determination (5 locations)

**Definition:** Code that decides what roles a user has.

| Location                      | Method             | Input             | Output                                |
| ----------------------------- | ------------------ | ----------------- | ------------------------------------- |
| `auth.ts:50-55`               | Email domain check | `email: string`   | `["admin"]` or `["viewer"]`           |
| `auth-api.ts:388`             | Email domain check | `email: string`   | `["admin"]` or `["viewer"]`           |
| `AppShellLayout.tsx:72`       | Email domain check | `auth.user.email` | `["admin", "member"]` or `["member"]` |
| `AppNavigation.tsx:58`        | Email domain check | `auth.user.email` | `["admin", "member"]` or `["member"]` |
| `dashboard-permissions.ts:10` | Email domain check | `user.email`      | `boolean` (privileged)                |

### Category 2: Permission Checks / Middleware (8 locations)

**Definition:** Code that enforces role-based access control.

| Location              | Roles Checked                           | Action on Failure |
| --------------------- | --------------------------------------- | ----------------- |
| `report-rbac.ts`      | Any in allowed list                     | HTTP 403          |
| `auth.ts:198-219`     | Required roles                          | HTTP 403          |
| `reports.ts`          | `readRoles`, `writeRoles`, `shareRoles` | HTTP 403          |
| `report-schedules.ts` | `readRoles`, `writeRoles`               | HTTP 403          |
| `report-templates.ts` | `readRoles`, `writeRoles`               | HTTP 403          |
| `translations.ts`     | `readRoles`, `writeRoles`               | HTTP 403          |
| `workflows.ts`        | `adminRoles`                            | HTTP 403          |
| `test-flow.ts`        | `adminRoles`                            | HTTP 403          |

### Category 3: UI Gating (6 locations)

**Definition:** Code that controls UI visibility based on roles.

| Location                          | UI Element           | Role Logic                                 |
| --------------------------------- | -------------------- | ------------------------------------------ |
| `app-shell-navigation.ts`         | Navigation items     | `requiredRoles` array                      |
| `AppShellLayout.tsx`              | Navigation rendering | Email-based role derivation                |
| `AppNavigation.tsx`               | Navigation rendering | Email-based role derivation                |
| `dashboard-permissions.ts`        | Dashboard features   | Email-based privilege flag                 |
| `useConnectorPermissions.ts`      | Connector actions    | `includes("admin")`, `includes("analyst")` |
| `useConnectorPermissions.test.ts` | Test validation      | Role-based assertions                      |

### Category 4: Data Storage (1 location - GAP)

**Definition:** Where role/permission data is stored.

| Location          | Status      | Issue                      |
| ----------------- | ----------- | -------------------------- |
| `users.ts` schema | **MISSING** | No role/permission columns |

### Category 5: Type Definitions (4 locations)

**Definition:** TypeScript types for roles and permissions.

| Location                  | Type                  | Safety Level                 |
| ------------------------- | --------------------- | ---------------------------- | ----------------------------------- |
| `types/src/auth.ts`       | `z.array(z.string())` | **LOW** - Any string allowed |
| `auth-store.ts`           | `string[]`            | **LOW** - Any string allowed |
| `auth.ts middleware`      | `string[]`            | **LOW** - Any string allowed |
| `app-shell-navigation.ts` | `"admin"              | "member"`                    | **MEDIUM** - Union type but limited |

---

## Role Taxonomy Analysis

The codebase uses **inconsistent role naming** across different modules:

| Role Name            | Used In               | Purpose                         |
| -------------------- | --------------------- | ------------------------------- |
| `admin`              | Everywhere            | Administrative access           |
| `viewer`             | Auth, seeds           | Read-only access                |
| `member`             | Navigation            | General member access           |
| `analyst`            | Reports, translations | Analysis capabilities           |
| `owner`              | Connector permissions | Owner-level access              |
| `reports:read`       | Reports routes        | Report read permission          |
| `reports:write`      | Reports routes        | Report write permission         |
| `reports:share`      | Reports routes        | Report sharing permission       |
| `translations:read`  | Translations routes   | Translation read permission     |
| `translations:write` | Translations routes   | Translation write permission    |
| `editor`             | Seed data             | Edit access (unused in runtime) |

**Issue:** Mix of role-based (`admin`, `viewer`) and permission-based (`reports:read`) naming creates confusion.

---

## Risk Assessment

### Critical Risks

| Risk                            | Severity     | Likelihood | Impact                                  | Mitigation Priority |
| ------------------------------- | ------------ | ---------- | --------------------------------------- | ------------------- |
| Email-based admin determination | **CRITICAL** | High       | Complete system compromise              | **P0**              |
| No database authority for roles | **CRITICAL** | High       | Cannot manage access without deployment | **P0**              |
| JWT-stored roles never refresh  | **HIGH**     | Medium     | Stale permissions during session        | **P1**              |
| Inconsistent role naming        | **HIGH**     | High       | Security policy confusion               | **P1**              |

### High Risks

| Risk                                        | Severity | Likelihood | Impact                                |
| ------------------------------------------- | -------- | ---------- | ------------------------------------- |
| No type safety on role strings              | HIGH     | Medium     | Runtime errors, typos bypass security |
| No permission granularity                   | HIGH     | Medium     | All-or-nothing access control         |
| Frontend role derivation duplicates backend | HIGH     | High       | Inconsistent security posture         |

### Medium Risks

| Risk                                | Severity | Likelihood | Impact                                     |
| ----------------------------------- | -------- | ---------- | ------------------------------------------ |
| Navigation filtering on client only | MEDIUM   | Low        | Information leakage about available routes |
| Permission hooks not centralized    | MEDIUM   | Medium     | Inconsistent permission logic              |

---

## Recommendations for SSOT Migration

### Phase 1: Database Schema (Foundation)

1. **Create RBAC Tables:**

   ```sql
   - roles (id, name, description, tenant_id, created_at)
   - permissions (id, name, resource, action, description)
   - role_permissions (role_id, permission_id)
   - user_roles (user_id, role_id, granted_at, granted_by)
   ```

2. **Add Migration Scripts:** Create from scratch (no backward compatibility needed)

### Phase 2: Shared Type Definitions

1. **Create Enum Types:**

   ```typescript
   // packages/types/src/rbac.ts
   export const RoleEnum = z.enum(['admin', 'analyst', 'viewer', 'editor']);
   export const PermissionEnum = z.enum(['reports:read', 'reports:write', ...]);
   ```

2. **Update Auth Types:** Replace `string[]` with typed arrays

### Phase 3: Backend Services

1. **Create RBAC Service Layer:**
   - `getUserRoles(userId, tenantId)` - Database lookup
   - `hasPermission(userId, permission)` - Permission check
   - `assignRole(userId, roleId)` - Role assignment
   - `revokeRole(userId, roleId)` - Role revocation

2. **Update Auth Flow:**
   - Replace `resolveUserRoles()` with database lookup
   - Add role refresh mechanism (optional: on each request or periodic)

### Phase 4: Frontend Integration

1. **Create Shared Hooks:**
   - `useRoles()` - Get current user's roles
   - `usePermission(permission)` - Check single permission
   - `usePermissions(permissions[])` - Check multiple permissions

2. **Update UI Components:**
   - Replace email checks with hook calls
   - Centralize permission logic

### Phase 5: Seed Data

1. **Create Initial Roles:**
   - `admin` - Full system access
   - `analyst` - Read + analysis capabilities
   - `editor` - Content editing
   - `viewer` - Read-only access

2. **Create Initial Permissions:**
   - Map to existing route requirements
   - Document permission taxonomy

### Phase 6: Cleanup

1. **Remove Email-Based Checks:** All 5 locations
2. **Remove Hardcoded Role Logic:** Replace with service calls
3. **Add Audit Logging:** Track role assignments and permission checks

---

## Implementation Priority Matrix

| Component               | Priority | Effort | Risk Reduction |
| ----------------------- | -------- | ------ | -------------- |
| Database schema         | P0       | Medium | 40%            |
| Backend role resolution | P0       | Low    | 30%            |
| Shared type definitions | P1       | Low    | 10%            |
| Frontend hooks          | P1       | Medium | 10%            |
| Seed data               | P1       | Low    | 5%             |
| Cleanup email checks    | P2       | Low    | 5%             |

---

## Appendix: File Reference Index

### Backend Files

- `/apps/api/src/trpc/routers/auth.ts` - Lines 50-55, 78, 199
- `/apps/api/src/middleware/report-rbac.ts` - Lines 6-23
- `/apps/api/src/middleware/auth.ts` - Lines 62-66, 90-220, 229-269
- `/apps/api/src/lib/auth-session-jwt.ts` - Lines 11, 16
- `/apps/api/src/routes/v1/reports.ts` - Lines 172-174, 176-197
- `/apps/api/src/routes/v1/report-schedules.ts` - Lines 27-28, 65-78
- `/apps/api/src/routes/v1/report-templates.ts` - Lines 26-27, 44-57
- `/apps/api/src/routes/v1/translations.ts` - Lines 22-23, 42-56
- `/apps/api/src/routes/v1/workflows.ts` - Lines 61, 143-145
- `/apps/api/src/routes/v1/test-flow.ts` - Lines 19, 54

### Frontend Files

- `/apps/frontend/src/lib/api/auth-api.ts` - Line 388
- `/apps/frontend/src/components/layout/AppShellLayout.tsx` - Lines 72-73
- `/apps/frontend/src/components/layout/AppNavigation.tsx` - Lines 58-59
- `/apps/frontend/src/components/layout/app-shell-navigation.ts` - Lines 4-78
- `/apps/frontend/src/features/dashboard/ui/surfaces/dashboard-permissions.ts` - Line 10
- `/apps/frontend/src/features/connectors/hooks/useConnectorPermissions.ts` - Lines 21-36
- `/apps/frontend/src/stores/auth-store.ts` - Line 27

### Database Files

- `/packages/database/src/schema/users.ts` - Missing role columns
- `/packages/database/src/schema/index.ts` - Schema exports
- `/packages/database/src/factories/user-factory.ts` - Seed user creation with roles
- `/packages/database/src/seeds/users-seed.ts` - User seed definitions

### Type Definition Files

- `/packages/types/src/auth.ts` - Lines 44-47, 125-128

---

**End of Analysis**

This document provides the foundation for the RBAC SSOT implementation plan. All identified locations must be addressed to achieve a secure, database-driven authorization system.
