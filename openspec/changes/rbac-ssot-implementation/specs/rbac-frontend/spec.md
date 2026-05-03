## ADDED Requirements

### Requirement: Permission Hooks

The system SHALL provide React hooks for permission checking in components. Hooks SHALL be memoized for performance.

#### Scenario: usePermissions hook
- **WHEN** component calls `usePermissions()`
- **THEN** returns object with permissions array and helper methods
- **THEN** hasPermission(permission) returns boolean
- **THEN** hasAnyPermission(permissions) returns true if user has any of listed permissions
- **THEN** hasAllPermissions(permissions) returns true if user has all listed permissions
- **THEN** result is memoized (same reference unless permissions change)

#### Scenario: useRoles hook
- **WHEN** component calls `useRoles()`
- **THEN** returns object with roles array and helper methods
- **THEN** hasRole(role) returns boolean
- **THEN** hasAnyRole(roles) returns true if user has any of listed roles
- **THEN** hasAllRoles(roles) returns true if user has all listed roles
- **THEN** result is memoized

#### Scenario: useCanAccess hook
- **WHEN** component calls `useCanAccess({ permission: PERMISSIONS.REPORTS_WRITE })`
- **THEN** returns true if user has permission
- **THEN** returns false if user lacks permission
- **WHEN** component calls `useCanAccess({ role: "admin" })`
- **THEN** returns true if user has role
- **THEN** permission check takes precedence over role check if both provided

### Requirement: Navigation Gating

Navigation components SHALL use permission-based gating instead of role-based or email-based gating. System SHALL support both permission and role checks for backward compatibility.

#### Scenario: Navigation item with required permissions
- **WHEN** navigation item defines `requiredPermissions: [PERMISSIONS.SETTINGS_WRITE]`
- **AND** user has SETTINGS_WRITE permission
- **THEN** navigation item is visible
- **WHEN** user lacks SETTINGS_WRITE permission
- **THEN** navigation item is hidden from navigation menu

#### Scenario: Navigation filtering function
- **WHEN** `filterAppShellNavItems()` is called with user context
- **THEN** items with requiredPermissions are filtered by permission check
- **THEN** items with requiredRoles (legacy) are filtered by role check
- **THEN** permission check is evaluated before role check
- **THEN** items without requirements are always visible (subject to feature flags)

#### Scenario: Feature flag integration
- **WHEN** navigation item has `featureFlag` property
- **AND** feature flag is disabled
- **THEN** item is hidden regardless of permissions
- **THEN** feature flag check runs before permission check

### Requirement: Component UI Gating

Components SHALL use hooks to conditionally render UI elements based on permissions. Gating logic SHALL be centralized, not duplicated.

#### Scenario: Conditional button rendering
- **WHEN** component uses `const { hasPermission } = usePermissions()`
- **AND** checks `hasPermission(PERMISSIONS.REPORTS_DELETE)`
- **THEN** delete button renders only if user has permission
- **THEN** button is completely absent from DOM (not just disabled)

#### Scenario: Dashboard permissions hook
- **WHEN** component calls `useDashboardPermissions()`
- **THEN** returns canCustomizeLayout based on SETTINGS_WRITE permission
- **THEN** returns canUsePrivilegedQuickActions based on REPORTS_WRITE permission
- **THEN** hook uses usePermissions internally (no duplicate logic)

### Requirement: Email Check Removal

All email-based authorization checks SHALL be removed from frontend codebase. No `endsWith("@agenticverdict.com")` patterns SHALL remain.

#### Scenario: AppShellLayout update
- **WHEN** AppShellLayout component renders
- **THEN** roles come from useRoles() hook
- **THEN** no email domain checks are performed
- **THEN** navigation items are filtered by permission/role

#### Scenario: Auth store mock update
- **WHEN** frontend uses mock auth for development
- **THEN** mock returns default "viewer" role
- **THEN** mock does not check email domain
- **THEN** mock is clearly marked as development-only

### Requirement: Type Safety

All permission and role checks SHALL use shared types from @agenticverdict/types. No string literals SHALL be used for permission checks.

#### Scenario: Permission type enforcement
- **WHEN** developer writes `hasPermission("users:read")`
- **THEN** TypeScript shows error (string literal not assignable)
- **THEN** developer must use PERMISSIONS.USERS_READ constant
- **THEN** autocomplete suggests valid permissions

#### Scenario: Role type enforcement
- **WHEN** developer writes `hasRole("superuser")`
- **THEN** TypeScript shows error if "superuser" is not in SystemRole union
- **THEN** developer must use valid role or cast to CustomRole
