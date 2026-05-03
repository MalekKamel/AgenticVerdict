## ADDED Requirements

### Requirement: Permission Guard Middleware

The system SHALL provide tRPC middleware that guards procedures based on required permissions. Unauthorized access SHALL return FORBIDDEN error.

#### Scenario: requirePermission with valid permission
- **WHEN** procedure is protected with `requirePermission(PERMISSIONS.REPORTS_WRITE)`
- **AND** user has the required permission
- **THEN** procedure executes normally
- **THEN** context includes permissionContext with userId, tenantId, permission

#### Scenario: requirePermission without permission
- **WHEN** procedure is protected with `requirePermission(PERMISSIONS.USERS_DELETE)`
- **AND** user lacks the required permission
- **THEN** TRPCError is thrown with code "FORBIDDEN"
- **THEN** error message includes missing permission name
- **THEN** procedure does not execute

#### Scenario: requirePermission without authentication
- **WHEN** procedure is protected with `requirePermission()`
- **AND** user is not authenticated (no ctx.auth)
- **THEN** TRPCError is thrown with code "UNAUTHORIZED"
- **THEN** error message is "Authentication required"

### Requirement: Role Guard Middleware

The system SHALL provide tRPC middleware that guards procedures based on required roles. Role checks SHALL use database-resolved roles.

#### Scenario: requireRole with matching role
- **WHEN** procedure is protected with `requireRole("admin")`
- **AND** user has "admin" role
- **THEN** procedure executes normally
- **THEN** no additional context is added (role check only)

#### Scenario: requireRole without matching role
- **WHEN** procedure is protected with `requireRole("admin")`
- **AND** user has "viewer" role only
- **THEN** TRPCError is thrown with code "FORBIDDEN"
- **THEN** error message is "Missing required role: admin"

#### Scenario: requireRole without authentication
- **WHEN** procedure is protected with `requireRole()`
- **AND** user is not authenticated
- **THEN** TRPCError is thrown with code "UNAUTHORIZED"

### Requirement: Middleware Composition

Middleware guards SHALL be composable. Multiple guards SHALL be chainable on single procedure.

#### Scenario: Multiple permission guards
- **WHEN** procedure uses both `requirePermission(PERMISSIONS.REPORTS_READ)` and `requirePermission(PERMISSIONS.REPORTS_WRITE)`
- **AND** user has both permissions
- **THEN** procedure executes normally
- **THEN** both checks pass in sequence

#### Scenario: Role and permission guards combined
- **WHEN** procedure uses `requireRole("editor")` and `requirePermission(PERMISSIONS.REPORTS_DELETE)`
- **AND** user has "editor" role but lacks REPORTS_DELETE permission
- **THEN** TRPCError is thrown for missing permission
- **THEN** role check passes first, permission check fails second

### Requirement: Error Handling

Middleware SHALL handle errors gracefully. All authorization failures SHALL be logged for audit trail.

#### Scenario: Database error during permission check
- **WHEN** database query fails during permission lookup
- **THEN** TRPCError is thrown with code "INTERNAL_SERVER_ERROR"
- **THEN** error is logged with userId and permission (no PII)
- **THEN** procedure does not execute (fail-closed)

#### Scenario: Audit logging
- **WHEN** permission check succeeds or fails
- **THEN** audit log entry is created with: userId, tenantId, permission, result (allow/deny), timestamp
- **THEN** log does not include email addresses or other PII
