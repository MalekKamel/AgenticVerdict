## ADDED Requirements

### Requirement: System Permissions Seed

The system SHALL seed all permissions defined in PERMISSIONS constant on database initialization. Seed script SHALL be idempotent.

#### Scenario: Initial permission seeding
- **WHEN** `pnpm db:seed` runs for first time
- **THEN** all permissions from PERMISSIONS constant are inserted
- **THEN** each permission includes name, resource, action, description
- **THEN** resource is extracted from permission string (before colon)
- **THEN** action is extracted from permission string (after colon)

#### Scenario: Idempotent seeding
- **WHEN** `pnpm db:seed` runs multiple times
- **THEN** no duplicate permissions are created
- **THEN** existing permissions are not modified (upsert behavior)
- **THEN** script completes without error on subsequent runs

### Requirement: System Roles Seed

The system SHALL seed four system roles: admin, analyst, editor, viewer. Each role SHALL have appropriate permission mappings.

#### Scenario: Admin role seeding
- **WHEN** seed script runs
- **THEN** "admin" role is created with isSystemRole=true
- **THEN** admin role has ALL permissions assigned
- **THEN** role description is "Full system access"

#### Scenario: Analyst role seeding
- **WHEN** seed script runs
- **THEN** "analyst" role is created with isSystemRole=true
- **THEN** analyst role has permissions: REPORTS_READ, REPORTS_WRITE, TRANSLATIONS_READ, CONNECTORS_READ
- **THEN** role description is "Read + analysis capabilities"

#### Scenario: Editor role seeding
- **WHEN** seed script runs
- **THEN** "editor" role is created with isSystemRole=true
- **THEN** editor role has permissions: REPORTS_READ, REPORTS_WRITE, TRANSLATIONS_READ, TRANSLATIONS_WRITE
- **THEN** role description is "Content editing access"

#### Scenario: Viewer role seeding
- **WHEN** seed script runs
- **THEN** "viewer" role is created with isSystemRole=true
- **THEN** viewer role has permissions: REPORTS_READ, TRANSLATIONS_READ, CONNECTORS_READ
- **THEN** role description is "Read-only access"

### Requirement: Role-Permission Mappings

The system SHALL create role_permissions records linking system roles to their permissions. Mappings SHALL be created atomically.

#### Scenario: Admin role permissions
- **WHEN** seed script creates admin role
- **THEN** role_permissions records are created for ALL permissions
- **THEN** each record links admin role_id to permission_id
- **THEN** granted_at is set to current timestamp

#### Scenario: Transaction safety
- **WHEN** seed script runs
- **THEN** all inserts occur within database transaction
- **THEN** if any insert fails, entire seed rolls back
- **THEN** database is not left in partial state

### Requirement: Seed Script Integration

The RBAC seed SHALL integrate with main seed script. Seed SHALL run automatically on database reset.

#### Scenario: Main seed script integration
- **WHEN** `pnpm db:seed` runs
- **THEN** RBAC seed is called after tenants table is seeded
- **THEN** system roles are associated with SYSTEM_TENANT_ID
- **THEN** console logs "seeded RBAC system (roles / permissions)"

#### Scenario: Environment configuration
- **WHEN** seed runs in development environment
- **THEN** all system roles and permissions are seeded
- **WHEN** seed runs in production environment
- **THEN** seed is idempotent (safe to run on existing data)
- **THEN** seed does not overwrite custom tenant roles

### Requirement: Default Role Assignment

The system SHALL provide mechanism to assign default role to new users. Default role SHALL be configurable.

#### Scenario: Default viewer role
- **WHEN** new user authenticates for first time
- **THEN** user has no explicit role assignments
- **THEN** auth flow returns ["viewer"] as default roles
- **THEN** default is not persisted to database (implicit)

#### Scenario: Explicit default assignment (future)
- **WHEN** configuration enables auto-assignment
- **THEN** new users are automatically assigned viewer role
- **THEN** user_roles record is created on first login
- **THEN** granted_by is system (null or service user)
