# RBAC Architecture

## Overview

This document describes the Role-Based Access Control (RBAC) architecture implemented in AgenticVerdict. The system follows NIST RBAC standards with a database-driven approach, providing secure, configurable, and auditable access control across all tenants.

## Core Principles

1. **Database-Driven**: All roles and permissions are stored in the database, not in JWT tokens or hardcoded logic
2. **Tenant-Scoped**: Every role is scoped to a specific tenant, enforcing multi-tenant isolation
3. **Type-Safe**: Full TypeScript typing with permission constants and union types
4. **Audit-Ready**: All authorization decisions are logged for compliance and debugging
5. **Configuration-Driven**: No hardcoded tenant logic; behavior driven by database configuration

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  tenants    │       │     users        │       │    roles        │
├─────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)     │       │ id (PK)          │       │ id (PK)         │
│ name        │       │ tenant_id (FK)   │       │ tenant_id (FK)  │
│ slug        │       │ email            │       │ name            │
│ active      │       │ display_name     │       │ description     │
└─────────────┘       │ ...              │       │ is_system_role  │
                      └──────────────────┘       │ is_custom_role  │
                               │                 │ ...             │
                               │                 └─────────────────┘
                               │                        │
                               │                        │
                    ┌──────────┴──────────┐    ┌────────┴────────┐
                    │   user_roles        │    │ role_permissions│
                    ├─────────────────────┤    ├─────────────────┤
                    │ id (PK)             │    │ id (PK)         │
                    │ user_id (FK)        │    │ role_id (FK)    │
                    │ role_id (FK)        │    │ permission_id   │
                    │ granted_by (FK)     │    │ granted_at      │
                    │ granted_at          │    └─────────────────┘
                    │ expires_at          │             │
                    └─────────────────────┘             │
                                              ┌─────────┴─────────┐
                                              │   permissions     │
                                              ├───────────────────┤
                                              │ id (PK)           │
                                              │ name              │
                                              │ resource          │
                                              │ action            │
                                              │ description       │
                                              └───────────────────┘
```

### Tables

#### `tenants`

Platform tenants. Each tenant has isolated roles and users.

#### `users`

User accounts belonging to tenants. Includes authentication fields.

#### `roles`

Role definitions scoped to tenants.

- `is_system_role`: Platform-provided roles (admin, analyst, editor, viewer)
- `is_custom_role`: Tenant-defined custom roles

#### `permissions`

Atomic permission strings (e.g., `reports:read`, `users:write`).

- Global across all tenants (not tenant-scoped)
- Defined as TypeScript constants for type safety

#### `user_roles`

Many-to-many relationship between users and roles.

- `granted_by`: Admin who assigned the role
- `granted_at`: Timestamp of assignment
- `expires_at`: Optional expiration (null for permanent)

#### `role_permissions`

Many-to-many relationship between roles and permissions.

- Defines what permissions each role grants

## System Roles

The platform provides four system roles:

| Role      | Description                | Typical Permissions           |
| --------- | -------------------------- | ----------------------------- |
| `viewer`  | Read-only access           | `*:read`                      |
| `editor`  | Can create/edit content    | `*:read`, `*:write` (limited) |
| `analyst` | Data analysis focus        | `reports:*`, `analytics:*`    |
| `admin`   | Full administrative access | All permissions               |

## Permission Taxonomy

Permissions follow the pattern `{resource}:{action}`:

### Resources

- `users`: User management
- `roles`: Role management
- `permissions`: Permission management
- `reports`: Report generation and viewing
- `analytics`: Analytics and insights
- `settings`: Tenant configuration
- `audit`: Audit logs and compliance

### Actions

- `read`: View/list resources
- `write`: Create/update resources
- `delete`: Remove resources
- `manage`: Full CRUD + administrative actions

## Component Architecture

### Backend Services

```
┌─────────────────────────────────────────────────────────┐
│                   API Layer (tRPC)                       │
├─────────────────────────────────────────────────────────┤
│  RBAC Middleware (requirePermission, requireRole)       │
├─────────────────────────────────────────────────────────┤
│                   RBAC Service                           │
│  - getUserRoles(userId, tenantId)                        │
│  - getUserPermissions(userId, tenantId)                  │
│  - hasPermission(userId, tenantId, permission)           │
│  - assignRole(userId, roleId, grantedBy)                 │
│  - revokeRole(userId, roleId)                            │
├─────────────────────────────────────────────────────────┤
│              Database (Drizzle ORM + RLS)                │
└─────────────────────────────────────────────────────────┘
```

### Frontend Hooks

```typescript
// Permission checking
const { hasPermission, permissions } = usePermissions();
const canEdit = hasPermission("reports:write");

// Role checking
const { hasRole, roles } = useRoles();
const isAdmin = hasRole("admin");

// Combined access control
const { canAccess } = useCanAccess();
const canManageUsers = canAccess({ permission: "users:manage" });
```

## Authorization Flow

### Authentication Flow

1. User logs in with credentials
2. Auth service fetches roles from `user_roles` table
3. Roles embedded in JWT token
4. Client receives JWT with current roles

### API Request Flow

1. Client sends request with JWT
2. tRPC middleware extracts tenant context from JWT
3. `dbScoped()` sets PostgreSQL `app.current_tenant_id`
4. RBAC middleware checks permission via `hasPermission()`
5. Database query executes with Row-Level Security (RLS)
6. Response returned or 403 FORBIDDEN

### Role Refresh

Roles refresh on:

- Re-authentication (login)
- Manual token refresh (if implemented)
- Session invalidation + re-login

**Note**: Role changes do not propagate to active sessions in real-time (Phase 1 limitation).

## Security Considerations

### Tenant Isolation

- All role queries include `tenant_id` filter
- PostgreSQL RLS enforces isolation at database level
- `dbScoped()` automatically sets tenant context
- Cross-tenant access attempts return empty results

### Privilege Escalation Prevention

- Only admins can assign roles
- Role assignment requires `users:manage` permission
- Self-escalation prevented by permission checks
- Audit trail tracks all role assignments

### Audit Logging

All authorization decisions are logged:

- User ID and tenant ID
- Permission/role checked
- Result (allowed/denied)
- Timestamp and request context

## Performance Considerations

### Query Optimization

- Indexes on `user_roles(user_id, role_id)`
- Indexes on `role_permissions(role_id, permission_id)`
- Efficient JOINs with limit clauses
- Single-query permission checks (`hasPermission`)

### Caching Strategy

- Roles cached in JWT (refresh on login)
- No real-time permission checks on every API call
- Future enhancement: Redis caching for high-traffic tenants

## Error Handling

### Error Codes

- `FORBIDDEN`: User lacks required permission
- `UNAUTHORIZED`: No authentication provided
- `TENANT_CONTEXT_REQUIRED`: Missing tenant context
- `ROLE_NOT_FOUND`: Invalid role reference

### Fail-Closed Default

All authorization checks default to **DENY**:

- Missing permission → denied
- Database error → denied
- Invalid context → denied

## Migration from Email-Based Checks

### Before (Legacy)

```typescript
// Hardcoded email domain check
if (user.email.endsWith("@agenticverdict.com")) {
  // Grant admin access
}
```

### After (RBAC)

```typescript
// Type-safe permission check
const { hasPermission } = usePermissions();
if (hasPermission("users:manage")) {
  // Grant admin access
}
```

### Migration Checklist

- [x] Remove all `endsWith('@agenticverdict.com')` checks
- [x] Replace with `usePermissions()` hooks
- [x] Update navigation gating to use permissions
- [x] Verify zero email-based checks remain

## Future Enhancements

### Phase 2 (Planned)

- Role hierarchies with inheritance
- Real-time permission propagation (WebSocket)
- Admin UI for role management
- Custom role creation by tenants

### Phase 3 (Considered)

- Attribute-Based Access Control (ABAC)
- Dynamic permission constraints
- Time-based access rules
- Service account support

## Related Documentation

- [Role Management Guide](/docs/guides/role-management.md)
- [API Documentation](/docs/api/rbac-endpoints.md)
- [Permission Taxonomy](#permission-taxonomy)
