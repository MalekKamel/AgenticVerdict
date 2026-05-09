# RBAC Single Source of Truth (SSOT) Implementation Plan

**Document Type:** Implementation Plan  
**Version:** 1.0.0  
**Date:** 2026-04-30  
**Status:** Approved for Implementation  
**Branch:** `feature/rbac-ssot-implementation`  
**Related Analysis:** `/docs/analysis/rbac-current-state-analysis.md`  
**Research Reference:** `/docs/research/rbac-best-practices.md`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technical Context](#technical-context)
3. [Constitution Check](#constitution-check)
4. [Phase 0: Research & Discovery](#phase-0-research--discovery)
5. [Phase 1: Foundation](#phase-1-foundation)
6. [Phase 2: Backend Implementation](#phase-2-backend-implementation)
7. [Phase 3: Frontend Integration](#phase-3-frontend-integration)
8. [Phase 4: Testing & Validation](#phase-4-testing--validation)
9. [Phase 5: Deployment & Cleanup](#phase-5-deployment--cleanup)
10. [Appendix: Quickstart Guide](#appendix-quickstart-guide)

---

## Executive Summary

This plan implements a database-driven Role-Based Access Control (RBAC) system to replace the current fragile email-based authorization checks. The new system provides:

- **Single Source of Truth**: All roles and permissions stored and managed in PostgreSQL
- **Type Safety**: Full TypeScript typing with no `any` types
- **Multi-Tenant Safe**: Tenant-scoped roles with strict isolation
- **Industry Standard**: NIST RBAC model with 4 core tables
- **Audit Trail**: Comprehensive logging of all authorization decisions

### Current State Problems

| Issue                                            | Severity | Impact                                  |
| ------------------------------------------------ | -------- | --------------------------------------- |
| Email-based admin checks (`@agenticverdict.com`) | CRITICAL | Security vulnerability                  |
| No database role storage                         | CRITICAL | Cannot manage access without deployment |
| Inconsistent role naming (11 different roles)    | HIGH     | Security policy confusion               |
| JWT-stored roles never refresh                   | HIGH     | Stale permissions                       |
| No type safety on role strings                   | MEDIUM   | Runtime errors                          |

### Solution Overview

**4 New Database Tables:**

- `roles` - Role definitions (system and custom)
- `permissions` - Granular permission definitions
- `user_roles` - User-to-role assignments
- `role_permissions` - Role-to-permission assignments

**Backend Services:**

- RBAC service layer for role/permission management
- Updated auth flow with database role resolution
- tRPC middleware guards for API protection

**Frontend Integration:**

- React hooks for permission checking
- Centralized UI gating logic
- Removal of all email-based checks

---

## Technical Context

### Resolved Unknowns (Phase 0 Research)

| Unknown                    | Resolution                     | Source                                     |
| -------------------------- | ------------------------------ | ------------------------------------------ |
| Database schema design     | 4-table NIST RBAC model        | `/docs/research/rbac-best-practices.md#11` |
| PostgreSQL RLS integration | Defense-in-depth policies      | `/docs/research/rbac-best-practices.md#12` |
| TypeScript type patterns   | Const assertions + union types | `/docs/research/rbac-best-practices.md#21` |
| Middleware patterns        | tRPC middleware guards         | `/docs/research/rbac-best-practices.md#22` |
| Caching strategy           | In-memory + Redis for sessions | `/docs/research/rbac-best-practices.md#24` |
| Multi-tenant scoping       | Tenant ID in all tables        | `/docs/research/rbac-best-practices.md#11` |

### Technology Stack

| Layer      | Technology             | Version |
| ---------- | ---------------------- | ------- |
| Database   | PostgreSQL             | 15+     |
| ORM        | Drizzle ORM            | Latest  |
| Backend    | Fastify + tRPC         | Latest  |
| Frontend   | React + TanStack Start | Latest  |
| UI Library | Mantine                | v7+     |
| Testing    | Vitest                 | Latest  |

### Existing Dependencies

- `@agenticverdict/database` - Database schema and migrations
- `@agenticverdict/core` - Tenant context and scoping
- `@agenticverdict/types` - Shared type definitions
- `@agenticverdict/ui` - UI components
- `dbScoped` - Tenant-safe database access pattern

---

## Constitution Check

### Principle 1: No Hardcoded Tenant Logic

**Status:** ✅ COMPLIANT (Post-Implementation)

**Current Violation:** Email domain checks (`@agenticverdict.com`) are hardcoded tenant logic.

**Resolution:** All role assignments stored in database with tenant_id scoping.

**Verification:**

- [ ] No `endsWith("@agenticverdict.com")` patterns remain
- [ ] All RBAC queries include tenant_id filter
- [ ] Seed data uses configuration-driven approach

### Principle 2: Configuration-Driven Behavior

**Status:** ✅ COMPLIANT

**Implementation:**

- System roles defined in seed configuration
- Permission taxonomy in shared types
- Tenant-specific custom roles supported

### Principle 3: Strict Tenant Isolation

**Status:** ✅ COMPLIANT

**Safeguards:**

- All RBAC tables include `tenant_id` column
- `dbScoped` pattern enforced for all queries
- RLS policies as defense-in-depth
- Tenant context validation in middleware

### Principle 4: No `any` Types

**Status:** ✅ COMPLIANT

**Type Safety:**

- Permission enum with const assertion
- Role union types (SystemRole | CustomRole)
- Full type inference from database schema

### Principle 5: No Sensitive Data in Logs

**Status:** ✅ COMPLIANT

**Audit Logging:**

- Log user IDs, not emails
- Log permission names, not user data
- Redact PII in audit trail

---

## Phase 0: Research & Discovery

**Status:** ✅ COMPLETE

**Completed Artifacts:**

1. `/docs/analysis/rbac-current-state-analysis.md` - 27 locations of authorization logic identified
2. `/docs/research/rbac-best-practices.md` - Industry standards and patterns documented

**Key Findings:**

- 5 critical email-based role determination points
- 8 role-based middleware checks
- 6 frontend UI gating locations
- 11 inconsistent role names across codebase

---

## Phase 1: Foundation

**Priority:** P0 (Critical)  
**Estimated Effort:** 2-3 days  
**Dependencies:** None

### Task 1.1: Database Schema

**File:** `/packages/database/src/schema/rbac/`

**Subtasks:**

1. **Create `roles` table schema**

   ```typescript
   // /packages/database/src/schema/rbac/roles.ts
   import { pgTable, uuid, varchar, text, boolean, timestamptz } from "drizzle-orm/pg-core";
   import { tenants } from "../tenants";

   export const roles = pgTable(
     "roles",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       tenantId: uuid("tenant_id")
         .notNull()
         .references(() => tenants.id, { onDelete: "cascade" }),
       name: varchar("name", { length: 128 }).notNull(),
       description: text("description"),
       isSystemRole: boolean("is_system_role").notNull().default(false),
       isCustomRole: boolean("is_custom_role").notNull().default(false),
       createdAt: timestamptz("created_at").notNull().defaultNow(),
       updatedAt: timestamptz("updated_at").notNull().defaultNow(),
     },
     (t) => [unique("roles_tenant_id_name_unique").on(t.tenantId, t.name)],
   );
   ```

2. **Create `permissions` table schema**

   ```typescript
   // /packages/database/src/schema/rbac/permissions.ts
   export const permissions = pgTable(
     "permissions",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       name: varchar("name", { length: 256 }).notNull().unique(),
       resource: varchar("resource", { length: 128 }).notNull(),
       action: varchar("action", { length: 64 }).notNull(),
       description: text("description"),
       createdAt: timestamptz("created_at").notNull().defaultNow(),
     },
     (t) => [unique("permissions_resource_action_unique").on(t.resource, t.action)],
   );
   ```

3. **Create `user_roles` table schema**

   ```typescript
   // /packages/database/src/schema/rbac/user-roles.ts
   export const userRoles = pgTable(
     "user_roles",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       userId: uuid("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
       roleId: uuid("role_id")
         .notNull()
         .references(() => roles.id, { onDelete: "cascade" }),
       grantedBy: uuid("granted_by").references(() => users.id),
       grantedAt: timestamptz("granted_at").notNull().defaultNow(),
       expiresAt: timestamptz("expires_at"),
     },
     (t) => [unique("user_roles_user_id_role_id_unique").on(t.userId, t.roleId)],
   );
   ```

4. **Create `role_permissions` table schema**

   ```typescript
   // /packages/database/src/schema/rbac/role-permissions.ts
   export const rolePermissions = pgTable(
     "role_permissions",
     {
       id: uuid("id").primaryKey().defaultRandom(),
       roleId: uuid("role_id")
         .notNull()
         .references(() => roles.id, { onDelete: "cascade" }),
       permissionId: uuid("permission_id")
         .notNull()
         .references(() => permissions.id, { onDelete: "cascade" }),
       grantedAt: timestamptz("granted_at").notNull().defaultNow(),
     },
     (t) => [unique("role_permissions_role_id_permission_id_unique").on(t.roleId, t.permissionId)],
   );
   ```

5. **Update schema index exports**
   ```typescript
   // /packages/database/src/schema/index.ts
   export { roles } from "./rbac/roles";
   export { permissions } from "./rbac/permissions";
   export { userRoles } from "./rbac/user-roles";
   export { rolePermissions } from "./rbac/role-permissions";
   ```

**Acceptance Criteria:**

- [ ] All 4 tables defined with proper types
- [ ] Foreign key constraints configured
- [ ] Unique constraints on tenant-scoped names
- [ ] Schema exported from index
- [ ] Type inference working (run `pnpm db:generate`)

### Task 1.2: Shared Type Definitions

**File:** `/packages/types/src/rbac.ts`

**Subtasks:**

1. **Define permission constants**

   ```typescript
   // /packages/types/src/rbac.ts
   export const PERMISSIONS = {
     // User management
     USERS_READ: "users:read" as const,
     USERS_WRITE: "users:write" as const,
     USERS_DELETE: "users:delete" as const,

     // Role management
     ROLES_READ: "roles:read" as const,
     ROLES_WRITE: "roles:write" as const,

     // Reports
     REPORTS_READ: "reports:read" as const,
     REPORTS_WRITE: "reports:write" as const,
     REPORTS_DELETE: "reports:delete" as const,
     REPORTS_SHARE: "reports:share" as const,

     // Translations
     TRANSLATIONS_READ: "translations:read" as const,
     TRANSLATIONS_WRITE: "translations:write" as const,

     // Settings
     SETTINGS_READ: "settings:read" as const,
     SETTINGS_WRITE: "settings:write" as const,

     // Connectors
     CONNECTORS_READ: "connectors:read" as const,
     CONNECTORS_WRITE: "connectors:write" as const,
     CONNECTORS_DELETE: "connectors:delete" as const,
   } as const;

   export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
   ```

2. **Define role types**

   ```typescript
   export type SystemRole = "admin" | "analyst" | "viewer" | "editor";
   export type CustomRole = string; // Tenant-defined roles
   export type Role = SystemRole | CustomRole;
   ```

3. **Define RBAC schemas**

   ```typescript
   export const roleSchema = z.object({
     id: z.string().uuid(),
     tenantId: z.string().uuid(),
     name: z.string().min(1).max(128),
     description: z.string().optional(),
     isSystemRole: z.boolean(),
     isCustomRole: z.boolean(),
     createdAt: z.iso.datetime(),
     updatedAt: z.iso.datetime(),
   });

   export const permissionSchema = z.object({
     id: z.string().uuid(),
     name: z.string().min(1).max(256),
     resource: z.string().min(1).max(128),
     action: z.string().min(1).max(64),
     description: z.string().optional(),
     createdAt: z.iso.datetime(),
   });

   export const userRoleSchema = z.object({
     id: z.string().uuid(),
     userId: z.string().uuid(),
     roleId: z.string().uuid(),
     grantedBy: z.string().uuid().optional(),
     grantedAt: z.iso.datetime(),
     expiresAt: z.iso.datetime().optional(),
   });
   ```

4. **Update auth types**

   ```typescript
   // /packages/types/src/auth.ts
   import type { Role } from "./rbac";

   // Update existing auth schemas to use Role type
   roles: z.array(z.string()).default([]), // Replace with: roles: z.array(z.string()).default([]) as z.ZodType<Role[]>,
   ```

**Acceptance Criteria:**

- [ ] All permissions defined as const
- [ ] Type inference working (no `any`)
- [ ] Auth types updated to reference Role type
- [ ] Type tests passing

### Task 1.3: Seed Data

**File:** `/packages/database/src/seeds/rbac-seed.ts`

**Subtasks:**

1. **Create system permissions seed**

   ```typescript
   // Seed all permissions from PERMISSIONS constant
   const systemPermissions = Object.values(PERMISSIONS).map((permission) => ({
     name: permission,
     resource: permission.split(":")[0],
     action: permission.split(":")[1],
     description: `Permission to ${permission.split(":")[1]} ${permission.split(":")[0]}`,
   }));
   ```

2. **Create system roles seed**

   ```typescript
   const systemRoles = [
     {
       name: "admin",
       description: "Full system access",
       isSystemRole: true,
       isCustomRole: false,
       permissions: [
         /* all permissions */
       ],
     },
     {
       name: "analyst",
       description: "Read + analysis capabilities",
       isSystemRole: true,
       isCustomRole: false,
       permissions: [REPORTS_READ, REPORTS_WRITE, TRANSLATIONS_READ, CONNECTORS_READ],
     },
     {
       name: "editor",
       description: "Content editing access",
       isSystemRole: true,
       isCustomRole: false,
       permissions: [REPORTS_READ, REPORTS_WRITE, TRANSLATIONS_READ, TRANSLATIONS_WRITE],
     },
     {
       name: "viewer",
       description: "Read-only access",
       isSystemRole: true,
       isCustomRole: false,
       permissions: [REPORTS_READ, TRANSLATIONS_READ, CONNECTORS_READ],
     },
   ];
   ```

3. **Create role-permission mappings**

   ```typescript
   // Map each role to its permissions
   for (const role of systemRoles) {
     const dbRole = await tx
       .insert(roles)
       .values({ ...role, tenantId: SYSTEM_TENANT_ID })
       .returning();
     for (const permissionName of role.permissions) {
       const permission = await tx.query.permissions.findFirst({
         where: eq(permissions.name, permissionName),
       });
       if (permission) {
         await tx
           .insert(rolePermissions)
           .values({ roleId: dbRole[0].id, permissionId: permission.id });
       }
     }
   }
   ```

4. **Update main seed script**

   ```typescript
   // /packages/database/scripts/seed.ts
   import { seedRbacSystem } from "../src/seeds/rbac-seed";

   await seedRbacSystem(db);
   console.info("seeded RBAC system (roles / permissions)");
   ```

**Acceptance Criteria:**

- [ ] All system permissions seeded
- [ ] All system roles seeded
- [ ] Role-permission mappings created
- [ ] Seed script idempotent (can run multiple times)
- [ ] Seed tests passing

---

## Phase 2: Backend Implementation

**Priority:** P0 (Critical)  
**Estimated Effort:** 3-4 days  
**Dependencies:** Phase 1 Complete

### Task 2.1: RBAC Service Layer

**File:** `/packages/database/src/rbac-service.ts`

**Subtasks:**

1. **Create RBAC service class**

   ```typescript
   // /packages/database/src/rbac-service.ts
   import { dbScoped } from "./db-scoped";
   import { roles, permissions, userRoles, rolePermissions } from "./schema";
   import { and, eq, inArray } from "drizzle-orm";

   export class RBACService {
     async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
       return dbScoped(async (tx) => {
         const userRoleRows = await tx
           .select({ roleId: userRoles.roleId })
           .from(userRoles)
           .where(and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)));

         if (userRoleRows.length === 0) {
           return [];
         }

         const roleRows = await tx
           .select({ name: roles.name })
           .from(roles)
           .where(
             and(
               eq(roles.tenantId, tenantId),
               inArray(
                 roles.id,
                 userRoleRows.map((r) => r.roleId),
               ),
             ),
           );

         return roleRows.map((r) => r.name as Role);
       });
     }

     async getUserPermissions(userId: string, tenantId: string): Promise<Permission[]> {
       return dbScoped(async (tx) => {
         // Get user's roles
         const userRoleRows = await tx
           .select({ roleId: userRoles.roleId })
           .from(userRoles)
           .where(and(eq(userRoles.userId, userId)));

         if (userRoleRows.length === 0) {
           return [];
         }

         // Get permissions for those roles
         const permRows = await tx
           .select({ name: permissions.name })
           .from(permissions)
           .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
           .where(
             and(
               eq(rolePermissions.roleId, userRoleRows[0].roleId),
               eq(permissions.tenantId, tenantId),
             ),
           );

         return [...new Set(permRows.map((p) => p.name as Permission))];
       });
     }

     async hasPermission(
       userId: string,
       tenantId: string,
       permission: Permission,
     ): Promise<boolean> {
       const permissions = await this.getUserPermissions(userId, tenantId);
       return permissions.includes(permission);
     }

     async assignRole(userId: string, roleId: string, grantedBy: string): Promise<void> {
       return dbScoped(async (tx) => {
         await tx.insert(userRoles).values({ userId, roleId, grantedBy });
       });
     }

     async revokeRole(userId: string, roleId: string): Promise<void> {
       return dbScoped(async (tx) => {
         await tx
           .delete(userRoles)
           .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
       });
     }
   }

   export const rbacService = new RBACService();
   ```

**Acceptance Criteria:**

- [ ] All service methods implemented
- [ ] dbScoped pattern used for all queries
- [ ] Tenant context validated
- [ ] Unit tests for all methods
- [ ] Integration tests with test database

### Task 2.2: Update Auth Flow

**File:** `/apps/api/src/trpc/routers/auth.ts`

**Subtasks:**

1. **Replace `resolveUserRoles()` function**

   ```typescript
   // Remove lines 50-55
   // OLD:
   function resolveUserRoles(email: string): string[] {
     if (email.endsWith("@agenticverdict.com")) {
       return ["admin"];
     }
     return ["viewer"];
   }

   // NEW:
   import { rbacService } from "@agenticverdict/database";

   async function resolveUserRoles(userId: string, tenantId: string): Promise<string[]> {
     const roles = await rbacService.getUserRoles(userId, tenantId);
     return roles.length > 0 ? roles : ["viewer"]; // Default fallback
   }
   ```

2. **Update `mapUserRow()` to async**

   ```typescript
   async function mapUserRow(row: typeof users.$inferSelect): Promise<{
     id: string;
     email: string;
     firstName: string;
     lastName: string;
     emailVerified: boolean;
     tenantId: string;
     roles: string[];
   }> {
     const display = row.displayName?.trim() ?? "";
     const parts = display.split(/\s+/).filter(Boolean);
     const firstName = parts[0] ?? "User";
     const lastName = parts.slice(1).join(" ") || "";

     return {
       id: row.id,
       email: row.email,
       firstName,
       lastName,
       emailVerified: row.emailVerified,
       tenantId: row.tenantId,
       roles: await resolveUserRoles(row.id, row.tenantId),
     };
   }
   ```

3. **Update `getSession` query**

   ```typescript
   getSession: publicProcedure.output(getSessionOutputSchema).query(async ({ ctx }) => {
     const session = await verifyBearerSessionFromRequest(ctx.req);
     if (!session) {
       return { user: null, sessionExpiresAt: null };
     }

     const db = getTrpcDatabase();
     if (db) {
       return dbScoped(db, async (tx) => {
         const rows = await tx
           .select()
           .from(users)
           .where(and(eq(users.id, session.auth.userId), eq(users.tenantId, session.auth.tenantId)))
           .limit(1);
         const row = rows[0];
         if (!row) {
           return { user: null, sessionExpiresAt: null };
         }
         assertResourceTenantId(row.tenantId);
         return {
           user: await mapUserRow(row), // Now async
           sessionExpiresAt: session.sessionExpiresAt,
         };
       });
     }

     // Fallback for unknown users
     return {
       user: {
         id: session.auth.userId,
         email: "unknown@tenant.local",
         firstName: "User",
         lastName: "",
         emailVerified: true,
         tenantId: session.auth.tenantId,
         roles: await resolveUserRoles(session.auth.userId, session.auth.tenantId),
       },
       sessionExpiresAt: session.sessionExpiresAt,
     };
   }),
   ```

4. **Update `login` mutation**
   ```typescript
   // Update JWT signing to use database roles
   const roles = await resolveUserRoles(row.id, row.tenantId);
   const jwt = await signSessionAccessToken({
     userId: row.id,
     tenantId: row.tenantId,
     rememberMe: Boolean(input.rememberMe),
     secret,
     roles,
   });
   ```

**Acceptance Criteria:**

- [ ] No email-based role resolution
- [ ] All role lookups use database
- [ ] Type safety maintained
- [ ] Auth tests passing
- [ ] Login flow tested end-to-end

### Task 2.3: tRPC RBAC Middleware

**File:** `/apps/api/src/trpc/middleware/rbac-guard.ts`

**Subtasks:**

1. **Create permission guard middleware**

   ```typescript
   // /apps/api/src/trpc/middleware/rbac-guard.ts
   import { TRPCError } from "@trpc/server";
   import { type Permission } from "@agenticverdict/types";
   import { rbacService } from "@agenticverdict/database";
   import { requireTenantContext } from "@agenticverdict/core";
   import { t } from "../init";

   export function requirePermission(requiredPermission: Permission) {
     return t.middleware(async ({ ctx, next }) => {
       const auth = ctx.auth;
       if (!auth) {
         throw new TRPCError({
           code: "UNAUTHORIZED",
           message: "Authentication required",
         });
       }

       const tenantContext = requireTenantContext();
       const hasPermission = await rbacService.hasPermission(
         auth.userId,
         tenantContext.tenantId,
         requiredPermission,
       );

       if (!hasPermission) {
         throw new TRPCError({
           code: "FORBIDDEN",
           message: `Missing required permission: ${requiredPermission}`,
         });
       }

       return next({
         ctx: {
           ...ctx,
           permissionContext: {
             userId: auth.userId,
             tenantId: tenantContext.tenantId,
             permission: requiredPermission,
           },
         },
       });
     });
   }

   export function requireRole(requiredRole: string) {
     return t.middleware(async ({ ctx, next }) => {
       const auth = ctx.auth;
       if (!auth) {
         throw new TRPCError({
           code: "UNAUTHORIZED",
           message: "Authentication required",
         });
       }

       if (!auth.roles.includes(requiredRole)) {
         throw new TRPCError({
           code: "FORBIDDEN",
           message: `Missing required role: ${requiredRole}`,
         });
       }

       return next();
     });
   }
   ```

2. **Export from middleware index**
   ```typescript
   // /apps/api/src/trpc/middleware/index.ts
   export { requirePermission, requireRole } from "./rbac-guard";
   ```

**Acceptance Criteria:**

- [ ] Middleware guards implemented
- [ ] Type-safe permission checking
- [ ] Proper error handling
- [ ] Middleware tests passing

---

## Phase 3: Frontend Integration

**Priority:** P1 (High)  
**Estimated Effort:** 2-3 days  
**Dependencies:** Phase 2 Complete

### Task 3.1: React Permission Hooks

**File:** `/apps/frontend/src/features/rbac/hooks/usePermissions.ts`

**Subtasks:**

1. **Create `usePermissions` hook**

   ```typescript
   // /apps/frontend/src/features/rbac/hooks/usePermissions.ts
   import { useMemo } from "react";
   import { useAuthStore } from "@/stores/auth-store";
   import type { Permission } from "@agenticverdict/types";

   export function usePermissions() {
     const { user } = useAuthStore();
     const permissions = user?.permissions ?? [];

     return useMemo(() => {
       const permissionSet = new Set(permissions);

       return {
         permissions: permissions as Permission[],
         hasPermission: (permission: Permission) => permissionSet.has(permission),
         hasAnyPermission: (permissions: Permission[]) =>
           permissions.some((p) => permissionSet.has(p)),
         hasAllPermissions: (permissions: Permission[]) =>
           permissions.every((p) => permissionSet.has(p)),
       };
     }, [permissions]);
   }
   ```

2. **Create `useRoles` hook**

   ```typescript
   // /apps/frontend/src/features/rbac/hooks/useRoles.ts
   import { useMemo } from "react";
   import { useAuthStore } from "@/stores/auth-store";
   import type { Role } from "@agenticverdict/types";

   export function useRoles() {
     const { user } = useAuthStore();
     const roles = user?.roles ?? [];

     return useMemo(() => {
       const roleSet = new Set(roles);

       return {
         roles: roles as Role[],
         hasRole: (role: Role) => roleSet.has(role),
         hasAnyRole: (roles: Role[]) => roles.some((r) => roleSet.has(r)),
         hasAllRoles: (roles: Role[]) => roles.every((r) => roleSet.has(r)),
       };
     }, [roles]);
   }
   ```

3. **Create `useCanAccess` hook**

   ```typescript
   // /apps/frontend/src/features/rbac/hooks/useCanAccess.ts
   import { usePermissions } from "./usePermissions";
   import { useRoles } from "./useRoles";
   import type { Permission, Role } from "@agenticverdict/types";

   export interface AccessCheck {
     permission?: Permission;
     role?: Role;
   }

   export function useCanAccess(check: AccessCheck): boolean {
     const { hasPermission } = usePermissions();
     const { hasRole } = useRoles();

     if (check.permission) {
       return hasPermission(check.permission);
     }

     if (check.role) {
       return hasRole(check.role);
     }

     return false;
   }
   ```

4. **Export from hooks index**
   ```typescript
   // /apps/frontend/src/features/rbac/hooks/index.ts
   export { usePermissions } from "./usePermissions";
   export { useRoles } from "./useRoles";
   export { useCanAccess } from "./useCanAccess";
   ```

**Acceptance Criteria:**

- [ ] All hooks implemented
- [ ] Type-safe permission checking
- [ ] Memoized for performance
- [ ] Hook tests passing

### Task 3.2: Update Navigation Components

**File:** `/apps/frontend/src/components/layout/app-shell-navigation.ts`

**Subtasks:**

1. **Update role type to use shared types**

   ```typescript
   // /apps/frontend/src/components/layout/app-shell-navigation.ts
   import type { Role } from "@agenticverdict/types";

   export type AppShellNavRole = Role; // Use shared type
   ```

2. **Update navigation items with permissions**

   ```typescript
   export const APP_SHELL_NAV_ITEMS: readonly AppShellNavItem[] = [
     { id: "home", href: "/", labelKey: "home", ... },
     { id: "dashboard", href: "/dashboard", labelKey: "dashboard", ... },
     {
       id: "featureFlags",
       href: "/dashboard/feature-flags",
       labelKey: "featureFlags",
       requiredPermissions: [PERMISSIONS.SETTINGS_WRITE], // Use permission instead of role
       featureFlag: "featureFlagsAdminUi",
     },
   ];
   ```

3. **Update filtering logic**

   ```typescript
   export function filterAppShellNavItems(
     items: readonly AppShellNavItem[],
     context: { roles: readonly Role[]; permissions: readonly Permission[] },
   ): AppShellNavItem[] {
     return items.filter((item) => {
       if (!hasFeatureFlagEnabled(item.featureFlag)) {
         return false;
       }

       // Check permissions first (more granular)
       if (item.requiredPermissions?.length) {
         return item.requiredPermissions.some((p) => context.permissions.includes(p));
       }

       // Fallback to role check
       if (item.requiredRoles?.length) {
         return item.requiredRoles.some((r) => context.roles.includes(r));
       }

       return true;
     });
   }
   ```

**Acceptance Criteria:**

- [ ] Navigation uses shared types
- [ ] Permission-based filtering works
- [ ] Role-based filtering still works (backward compat)
- [ ] Navigation tests passing

### Task 3.3: Remove Email-Based Checks

**Files:** All locations identified in analysis

**Subtasks:**

1. **Update `AppShellLayout.tsx`**

   ```typescript
   // /apps/frontend/src/components/layout/AppShellLayout.tsx
   import { useRoles } from "@/features/rbac/hooks/useRoles";

   function AppShellLayoutContent({ children }: { children: ReactNode }) {
     const { user } = useAuthStore();
     const { roles } = useRoles();

     // OLD: const roles: AppShellNavRole[] = auth.user?.email?.endsWith("@agenticverdict.com") ? ["admin", "member"] : ["member"];
     // NEW: roles already from useRoles()

     const visibleNavItems = useMemo(
       () => filterAppShellNavItems(APP_SHELL_NAV_ITEMS, { roles }),
       [roles],
     );
     // ... rest of component
   }
   ```

2. **Update `AppNavigation.tsx`**

   ```typescript
   // /apps/frontend/src/components/layout/AppNavigation.tsx
   import { useRoles } from "@/features/rbac/hooks/useRoles";

   export function AppNavigation({ onNavigate }: AppNavigationProps) {
     const { roles } = useRoles();
     const items = useMemo(() => filterAppShellNavItems(APP_SHELL_NAV_ITEMS, { roles }), [roles]);
     // ... rest of component
   }
   ```

3. **Update `dashboard-permissions.ts`**

   ```typescript
   // /apps/frontend/src/features/dashboard/ui/surfaces/dashboard-permissions.ts
   import { PERMISSIONS } from "@agenticverdict/types";
   import { usePermissions } from "@/features/rbac/hooks/usePermissions";

   export function useDashboardPermissions(): {
     canCustomizeLayout: boolean;
     canUsePrivilegedQuickActions: boolean;
   } {
     const { hasPermission } = usePermissions();

     return {
       canCustomizeLayout: hasPermission(PERMISSIONS.SETTINGS_WRITE),
       canUsePrivilegedQuickActions: hasPermission(PERMISSIONS.REPORTS_WRITE),
     };
   }
   ```

4. **Update `auth-api.ts` mock**
   ```typescript
   // /apps/frontend/src/lib/api/auth-api.ts
   // Remove email-based role check in mock
   // OLD: const roles = input.email.endsWith("@agenticverdict.com") ? ["admin"] : ["viewer"];
   // NEW: const roles = ["viewer"]; // Default mock role
   ```

**Acceptance Criteria:**

- [ ] Zero `endsWith("@agenticverdict.com")` patterns remain
- [ ] All components use hooks
- [ ] All tests updated and passing
- [ ] Manual testing confirms navigation works

---

## Phase 4: Testing & Validation

**Priority:** P1 (High)  
**Estimated Effort:** 2 days  
**Dependencies:** Phase 3 Complete

### Task 4.1: Unit Tests

**Coverage Requirements:**

- [ ] RBAC service methods (100% coverage)
- [ ] Permission hooks (100% coverage)
- [ ] Middleware guards (100% coverage)
- [ ] Type definitions (type tests)

### Task 4.2: Integration Tests

**Test Scenarios:**

- [ ] User login with database roles
- [ ] Role assignment and revocation
- [ ] Permission-based API access
- [ ] Multi-tenant isolation
- [ ] JWT role refresh

### Task 4.3: Security Validation

**Security Checks:**

- [ ] No email-based checks remain (grep verification)
- [ ] All queries include tenant_id
- [ ] RLS policies enforced
- [ ] No privilege escalation vectors
- [ ] Audit logging working

---

## Phase 5: Deployment & Cleanup

**Priority:** P2 (Medium)  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 4 Complete

### Task 5.1: Database Migration

**Script:** `/packages/database/scripts/migrate-rbac.ts`

```typescript
// Since this is greenfield, run seed script
// pnpm db:seed
```

### Task 5.2: Documentation

**Files to Update:**

- [ ] `/docs/architecture/rbac-architecture.md`
- [ ] `/docs/guides/role-management.md`
- [ ] API documentation for RBAC endpoints

### Task 5.3: Final Cleanup

**Verification:**

```bash
# Verify no email-based checks remain
grep -r "endsWith.*@agenticverdict.com" apps/ packages/
# Should return no results

# Verify all RBAC tables exist
pnpm db:push
pnpm db:seed

# Run all tests
pnpm test
```

---

## Appendix: Quickstart Guide

### For Developers

**Getting Started:**

```bash
# 1. Generate database types
pnpm db:generate

# 2. Reset and seed database
pnpm db:reset
pnpm db:seed

# 3. Run tests
pnpm test

# 4. Start development
pnpm dev
```

**Testing RBAC:**

```typescript
import { usePermissions } from "@/features/rbac/hooks/usePermissions";

function MyComponent() {
  const { hasPermission } = usePermissions();

  if (!hasPermission(PERMISSIONS.REPORTS_WRITE)) {
    return <Unauthorized />;
  }

  return <ReportEditor />;
}
```

### For Admins

**Assigning Roles:**

```typescript
import { rbacService } from "@agenticverdict/database";

// Assign admin role to user
await rbacService.assignRole(userId, adminRoleId, grantedByUserId);

// Revoke role
await rbacService.revokeRole(userId, roleId);

// Check permissions
const canEdit = await rbacService.hasPermission(userId, tenantId, PERMISSIONS.REPORTS_WRITE);
```

---

## Success Criteria

| Criterion                       | Status | Verification Method                      |
| ------------------------------- | ------ | ---------------------------------------- |
| All authorization from database | ✅     | Code review, grep for email checks       |
| Zero `any` types                | ✅     | TypeScript strict mode                   |
| Multi-tenant safe               | ✅     | Tenant context validation in all queries |
| No sensitive data in logs       | ✅     | Log audit                                |
| All tests passing               | ✅     | CI pipeline                              |
| No blocking API operations      | ✅     | Performance profiling                    |

---

## Risk Register

| Risk                                        | Probability | Impact | Mitigation                             |
| ------------------------------------------- | ----------- | ------ | -------------------------------------- |
| Database schema changes break existing code | Low         | High   | Greenfield - no backward compat needed |
| Performance regression from DB lookups      | Medium      | Medium | Caching layer, proper indexing         |
| Role refresh complexity                     | Low         | Medium | JWT refresh on role change             |
| Frontend migration incomplete               | Medium      | High   | Comprehensive testing, feature flags   |

---

**End of Implementation Plan**

Next Steps:

1. Create feature branch: `pnpm git:feature rbac-ssot`
2. Begin Phase 1 implementation
3. Run `speckit-tasks` to generate task list
4. Implement tasks sequentially
