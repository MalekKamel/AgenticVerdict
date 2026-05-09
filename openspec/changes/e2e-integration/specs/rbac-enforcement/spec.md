## ADDED Requirements

### Requirement: RBAC middleware on tRPC routers
All tRPC mutation procedures SHALL be protected by RBAC middleware using `requirePermission()` and/or `requireRole()` from `apps/api/src/trpc/middleware/rbac-guard.ts`. Unauthorized access SHALL return a 403 Forbidden error.

#### Scenario: Mutation requires permission
- **WHEN** a user without the required permission calls a mutation procedure
- **THEN** a 403 Forbidden error is returned

#### Scenario: Admin procedure requires admin role
- **WHEN** a non-admin user calls an admin-only procedure
- **THEN** a 403 Forbidden error is returned

#### Scenario: Authorized user succeeds
- **WHEN** a user with the required permission calls a mutation procedure
- **THEN** the procedure executes successfully

### Requirement: Permission mapping for insight procedures
The insight tRPC router SHALL apply the following permission requirements: `insight.create` requires `insights:write`, `insight.update` requires `insights:write`, `insight.delete` requires `insights:delete`, `insight.run` requires `insights:execute`, and `insight.getById` / `insight.list` require `insights:read`.

#### Scenario: Viewer cannot run insight
- **WHEN** a user with only `insights:read` permission calls `insight.run`
- **THEN** a 403 Forbidden error is returned

#### Scenario: Editor can update insight
- **WHEN** a user with `insights:write` permission calls `insight.update`
- **THEN** the update succeeds

### Requirement: Permission mapping for report procedures
The report tRPC router SHALL apply the following permission requirements: `report.create` requires `reports:write`, `report.delete` requires `reports:delete`, `report.deleteMany` requires `reports:delete`, and `report.list` / `report.getById` require `reports:read`.

#### Scenario: Viewer cannot delete report
- **WHEN** a user with only `reports:read` permission calls `report.delete`
- **THEN** a 403 Forbidden error is returned

### Requirement: Permission mapping for connector procedures
The connector tRPC router SHALL apply the following permission requirements: `connector.test` requires `connectors:execute`, `connector.configure` requires `connectors:write`, and `connector.list` requires `connectors:read`.

#### Scenario: Viewer cannot test connector
- **WHEN** a user without `connectors:execute` calls `connector.test`
- **THEN** a 403 Forbidden error is returned

### Requirement: RBAC test coverage
Tests SHALL verify permission enforcement for all protected procedures. Each procedure SHALL have at least one test case for unauthorized access returning 403.

#### Scenario: Unauthorized access test
- **WHEN** a test calls a protected procedure without required permissions
- **THEN** the test asserts a 403 error is returned
