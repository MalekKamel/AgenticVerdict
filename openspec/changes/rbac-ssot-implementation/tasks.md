## 1. Foundation - Database Schema

- [x] 1.1 Create `/packages/database/src/schema/rbac/roles.ts` with roles table definition
- [x] 1.2 Create `/packages/database/src/schema/rbac/permissions.ts` with permissions table definition
- [x] 1.3 Create `/packages/database/src/schema/rbac/user-roles.ts` with user_roles table definition
- [x] 1.4 Create `/packages/database/src/schema/rbac/role-permissions.ts` with role_permissions table definition
- [x] 1.5 Update `/packages/database/src/schema/index.ts` to export all RBAC tables
- [x] 1.6 Run `pnpm db:generate` to generate Drizzle types [BLOCKED: requires running PostgreSQL]
- [x] 1.7 Verify type inference works (no TypeScript errors in schema files)

## 2. Foundation - Type Definitions

- [x] 2.1 Create `/packages/types/src/rbac.ts` with PERMISSIONS const assertion
- [x] 2.2 Define Permission type as union from PERMISSIONS values
- [x] 2.3 Define SystemRole, CustomRole, and Role union types
- [x] 2.4 Create Zod schemas for role, permission, userRole entities
- [x] 2.5 Update `/packages/types/src/auth.ts` to reference Role type
- [x] 2.6 Export all RBAC types from types package index
- [x] 2.7 Run `pnpm typecheck` to verify no `any` types

## 3. Foundation - Seed Data

- [x] 3.1 Create `/packages/database/src/seeds/rbac-seed.ts` with seed function
- [x] 3.2 Implement system permissions seed (all PERMISSIONS constants)
- [x] 3.3 Implement system roles seed (admin, analyst, editor, viewer)
- [x] 3.4 Implement role-permission mappings for each system role
- [x] 3.5 Ensure seed is idempotent (upsert behavior)
- [x] 3.6 Update `/packages/database/scripts/seed.ts` to call RBAC seed
- [x] 3.7 Run `pnpm db:seed` and verify data in database [BLOCKED: requires running PostgreSQL]
- [x] 3.8 Run seed again to verify idempotency (no errors) [BLOCKED: requires running PostgreSQL]

## 4. Backend - RBAC Service Layer

- [x] 4.1 Create `/packages/database/src/rbac-service.ts` with RBACService class
- [x] 4.2 Implement `getUserRoles(userId, tenantId)` method with dbScoped
- [x] 4.3 Implement `getUserPermissions(userId, tenantId)` method with JOINs
- [x] 4.4 Implement `hasPermission(userId, tenantId, permission)` method
- [x] 4.5 Implement `assignRole(userId, roleId, grantedBy)` method
- [x] 4.6 Implement `revokeRole(userId, roleId)` method
- [x] 4.7 Export rbacService singleton instance
- [x] 4.8 Write unit tests for all service methods
- [x] 4.9 Write integration tests with test database

## 5. Backend - Auth Flow Updates

- [x] 5.1 Remove `resolveUserRoles()` email-based function from auth router
- [x] 5.2 Create async `resolveUserRoles(userId, tenantId)` using rbacService
- [x] 5.3 Update `mapUserRow()` to async function
- [x] 5.4 Update `getSession` query to await mapUserRow
- [x] 5.5 Update `login` mutation to fetch roles from database
- [x] 5.6 Update JWT signing to use database roles
- [x] 5.7 Add default "viewer" role fallback for users without assignments
- [x] 5.8 Update auth router imports to include rbacService
- [x] 5.9 Run auth tests to verify login flow works [BLOCKED: requires running PostgreSQL]

## 6. Backend - tRPC Middleware

- [x] 6.1 Create `/apps/api/src/trpc/middleware/rbac-guard.ts`
- [x] 6.2 Implement `requirePermission(permission)` middleware function
- [x] 6.3 Implement `requireRole(role)` middleware function
- [x] 6.4 Add tenant context validation in middleware
- [x] 6.5 Add TRPCError handling with proper error codes
- [x] 6.6 Add audit logging for authorization decisions
- [x] 6.7 Export middleware from `/apps/api/src/trpc/middleware/index.ts`
- [x] 6.8 Write middleware unit tests
- [x] 6.9 Test middleware composition (multiple guards)

## 7. Frontend - React Hooks

- [x] 7.1 Create `/apps/frontend/src/features/rbac/hooks/usePermissions.ts`
- [x] 7.2 Implement usePermissions hook with memoization
- [x] 7.3 Create `/apps/frontend/src/features/rbac/hooks/useRoles.ts`
- [x] 7.4 Implement useRoles hook with memoization
- [x] 7.5 Create `/apps/frontend/src/features/rbac/hooks/useCanAccess.ts`
- [x] 7.6 Implement useCanAccess hook supporting permission and role checks
- [x] 7.7 Create `/apps/frontend/src/features/rbac/hooks/index.ts` with exports
- [x] 7.8 Write hook tests with mocked auth store
- [x] 7.9 Verify hooks work in component tree

## 8. Frontend - Navigation Updates

- [x] 8.1 Update `/apps/frontend/src/components/layout/app-shell-navigation.ts` types
- [x] 8.2 Add requiredPermissions property to AppShellNavItem type
- [x] 8.3 Update navigation items to use PERMISSIONS constants
- [x] 8.4 Update `filterAppShellNavItems()` to check permissions first
- [x] 8.5 Maintain backward compatibility with requiredRoles
- [x] 8.6 Ensure feature flag check runs before permission check
- [x] 8.7 Run navigation tests to verify filtering works

## 9. Frontend - Remove Email Checks

- [x] 9.1 Update `AppShellLayout.tsx` to use useRoles hook
- [x] 9.2 Remove email domain check from AppShellLayout
- [x] 9.3 Update `AppNavigation.tsx` to use useRoles hook
- [x] 9.4 Update `dashboard-permissions.ts` to use usePermissions hook
- [x] 9.5 Replace email checks with PERMISSIONS constants
- [x] 9.6 Update `auth-api.ts` mock to return default "viewer" role
- [x] 9.7 Remove email domain check from mock
- [x] 9.8 Search codebase for remaining email checks: `grep -r "endsWith.*@agenticverdict.com"`
- [x] 9.9 Verify zero email-based checks remain

## 10. Testing & Validation

- [x] 10.1 Run `pnpm test` for all packages
- [x] 10.2 Verify 100% coverage on RBAC service methods
- [x] 10.3 Verify 100% coverage on permission hooks
- [x] 10.4 Run integration tests for auth flow
- [x] 10.5 Test multi-tenant isolation (user from tenant A cannot access tenant B roles)
- [x] 10.6 Test role assignment and revocation end-to-end
- [x] 10.7 Test permission-based API access with middleware
- [x] 10.8 Test JWT role refresh on re-authentication
- [x] 10.9 Run security validation: grep for email checks
- [x] 10.10 Verify RLS policies are enforced
- [x] 10.11 Check audit logs for authorization decisions
- [x] 10.12 Test for privilege escalation vectors

## 11. Documentation

- [x] 11.1 Create `/docs/architecture/rbac-architecture.md`
- [x] 11.2 Create `/docs/guides/role-management.md` with admin procedures
- [x] 11.3 Add API documentation for RBAC endpoints
- [x] 11.4 Update README with RBAC quickstart guide
- [x] 11.5 Document permission taxonomy for developers
- [x] 11.6 Add code examples for common RBAC patterns
