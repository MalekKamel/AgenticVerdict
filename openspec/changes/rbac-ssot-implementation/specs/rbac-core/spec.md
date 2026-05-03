## ADDED Requirements

### Requirement: Database Schema for RBAC

The system SHALL provide four database tables to implement NIST RBAC model: `roles`, `permissions`, `user_roles`, and `role_permissions`. All tables SHALL include proper foreign key constraints, unique constraints, and tenant scoping.

#### Scenario: Roles table creation
- **WHEN** database migration runs
- **THEN** `roles` table exists with columns: id (UUID, PK), tenant_id (UUID, FK to tenants), name (varchar 128), description (text), is_system_role (boolean), is_custom_role (boolean), created_at, updated_at
- **THEN** unique constraint on (tenant_id, name) prevents duplicate role names per tenant

#### Scenario: Permissions table creation
- **WHEN** database migration runs
- **THEN** `permissions` table exists with columns: id (UUID, PK), name (varchar 256, unique), resource (varchar 128), action (varchar 64), description (text), created_at
- **THEN** unique constraint on (resource, action) prevents duplicate permissions

#### Scenario: User roles table creation
- **WHEN** database migration runs
- **THEN** `user_roles` table exists with columns: id (UUID, PK), user_id (UUID, FK to users), role_id (UUID, FK to roles), granted_by (UUID, FK to users), granted_at, expires_at (nullable)
- **THEN** unique constraint on (user_id, role_id) prevents duplicate assignments

#### Scenario: Role permissions table creation
- **WHEN** database migration runs
- **THEN** `role_permissions` table exists with columns: id (UUID, PK), role_id (UUID, FK to roles), permission_id (UUID, FK to permissions), granted_at
- **THEN** unique constraint on (role_id, permission_id) prevents duplicate mappings

### Requirement: TypeScript Type Definitions

The system SHALL provide full TypeScript type safety for all RBAC entities with no `any` types. Permission types SHALL be derived from const assertions for autocomplete support.

#### Scenario: Permission constants definition
- **WHEN** developer imports PERMISSIONS from @agenticverdict/types
- **THEN** all permission constants are available with autocomplete (e.g., PERMISSIONS.USERS_READ)
- **THEN** Permission type is inferred as union of all permission strings

#### Scenario: Role type definition
- **WHEN** developer imports Role type
- **THEN** SystemRole union includes "admin" | "analyst" | "editor" | "viewer"
- **THEN** CustomRole is string type for tenant-defined roles
- **THEN** Role is union of SystemRole | CustomRole

#### Scenario: Schema type inference
- **WHEN** developer queries roles table with Drizzle ORM
- **THEN** returned type includes all role fields with correct TypeScript types
- **THEN** tenant_id is required field in type definition

### Requirement: RBAC Service Layer

The system SHALL provide an RBAC service with methods for role and permission management. All queries SHALL use dbScoped pattern for tenant isolation.

#### Scenario: Get user roles
- **WHEN** `rbacService.getUserRoles(userId, tenantId)` is called
- **THEN** returns array of role names assigned to user within tenant context
- **THEN** returns empty array if user has no roles
- **THEN** query includes tenant_id filter for isolation

#### Scenario: Get user permissions
- **WHEN** `rbacService.getUserPermissions(userId, tenantId)` is called
- **THEN** returns array of all permissions from user's roles
- **THEN** permissions are deduplicated (unique set)
- **THEN** returns empty array if user has no roles or roles have no permissions

#### Scenario: Check permission
- **WHEN** `rbacService.hasPermission(userId, tenantId, permission)` is called
- **THEN** returns true if user has the specified permission
- **THEN** returns false if user lacks the permission
- **THEN** performs single efficient query (not fetch all permissions)

#### Scenario: Assign role
- **WHEN** `rbacService.assignRole(userId, roleId, grantedBy)` is called
- **THEN** creates new user_roles record
- **THEN** granted_at timestamp is set to current time
- **THEN** expires_at is null by default

#### Scenario: Revoke role
- **WHEN** `rbacService.revokeRole(userId, roleId)` is called
- **THEN** deletes user_roles record for user and role
- **THEN** operation is idempotent (no error if record doesn't exist)

### Requirement: Tenant Isolation Enforcement

All RBAC operations SHALL enforce strict tenant isolation. Cross-tenant role assignments SHALL be impossible at database and application layers.

#### Scenario: Tenant-scoped role query
- **WHEN** querying roles for a user
- **THEN** query includes WHERE clause filtering by tenant_id
- **THEN** user cannot see roles from other tenants

#### Scenario: Cross-tenant assignment prevention
- **WHEN** attempting to assign role from tenant A to user from tenant B
- **THEN** foreign key constraint prevents assignment (different tenant_id)
- **THEN** application layer validates tenant context before operation

#### Scenario: Database-level isolation
- **WHEN** RLS policies are enabled
- **THEN** all RBAC table queries automatically filter by current tenant context
- **THEN** even direct SQL queries cannot bypass tenant isolation
