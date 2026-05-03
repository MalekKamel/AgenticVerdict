## Why

The current authorization system relies on fragile email-based checks (`@agenticverdict.com`) and JWT-stored roles that never refresh, creating critical security vulnerabilities and preventing dynamic access management. This change implements a database-driven Role-Based Access Control (RBAC) system with a single source of truth, enabling secure, configurable, and auditable access control across all tenants.

## What Changes

- **Database Schema**: 4 new RBAC tables (`roles`, `permissions`, `user_roles`, `role_permissions`) replacing email-based role determination
- **Backend Services**: New RBAC service layer for role/permission management with tenant-scoped queries
- **Auth Flow**: Database role resolution replaces hardcoded email domain checks
- **API Protection**: tRPC middleware guards for permission-based access control
- **Frontend Integration**: React hooks for permission checking and UI gating
- **Type Safety**: Full TypeScript typing with permission enums and role union types
- **Audit Trail**: Comprehensive logging of all authorization decisions

**BREAKING**: Email-based role checks (`endsWith("@agenticverdict.com")`) will be removed entirely. All role assignments must be managed through the database.

## Capabilities

### New Capabilities

- **rbac-core**: Database schema, types, and service layer for role and permission management
- **rbac-auth**: Auth flow integration with database role resolution and JWT refresh
- **rbac-middleware**: tRPC middleware guards for permission and role-based API protection
- **rbac-frontend**: React hooks and UI components for permission-based gating
- **rbac-seed**: System roles and permissions seed data with configuration-driven setup

### Modified Capabilities

- **auth**: Role resolution mechanism changes from email-based to database-driven (behavior change: roles now refresh on login)
- **multi-tenant-authorization**: Authorization checks now use database permissions instead of role strings

## Impact

- **Affected Code**:
  - `packages/database/src/schema/` - New RBAC schema files
  - `packages/database/src/rbac-service.ts` - New service layer
  - `apps/api/src/trpc/routers/auth.ts` - Updated auth flow
  - `apps/api/src/trpc/middleware/` - New RBAC guards
  - `apps/frontend/src/features/rbac/` - New hooks and components
  - `apps/frontend/src/components/layout/` - Updated navigation gating
- **Dependencies**: PostgreSQL 15+, Drizzle ORM, tRPC, React
- **Migration**: Greenfield implementation - no backward compatibility needed
- **Security**: Eliminates hardcoded tenant logic, enforces tenant isolation at database level
