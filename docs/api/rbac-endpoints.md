# RBAC API Documentation

This document describes the Role-Based Access Control (RBAC) API endpoints and middleware for AgenticVerdict.

## Overview

The RBAC system provides permission-based access control for all API endpoints. Access is enforced through tRPC middleware that checks user permissions and roles against the database.

## Authentication Flow

All RBAC-protected endpoints require authentication. The authentication flow is:

1. User authenticates via `/auth/login` endpoint
2. Server fetches user roles from database
3. Roles embedded in JWT token
4. Client includes JWT in subsequent requests
5. Middleware validates JWT and extracts user context

## Middleware Guards

### `requirePermission(permission)`

Protects endpoints with permission-based access control.

**Parameters**:

- `permission`: Permission constant (e.g., `PERMISSIONS.REPORTS_WRITE`)

**Behavior**:

1. Validates user is authenticated
2. Queries database for user's current permissions
3. Checks if required permission is granted
4. Logs authorization decision for audit trail
5. Proceeds or throws `FORBIDDEN` error

**Example**:

```typescript
import { requirePermission } from "./trpc/middleware/rbac-guard";
import { PERMISSIONS } from "@agenticverdict/types";

const createReport = baseProcedure
  .use(authedProcedure)
  .use(requirePermission(PERMISSIONS.REPORTS_WRITE))
  .mutation(async ({ ctx, input }) => {
    // User has reports:write permission
    return await reportsService.create(input);
  });
```

**Errors**:

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required permission
- `INTERNAL_SERVER_ERROR`: Authorization service unavailable

### `requireRole(role)`

Protects endpoints with role-based access control.

**Parameters**:

- `role`: Role name string (e.g., `"admin"`, `"editor"`)

**Behavior**:

1. Validates user is authenticated
2. Queries database for user's current roles
3. Checks if required role is assigned
4. Logs authorization decision for audit trail
5. Proceeds or throws `FORBIDDEN` error

**Example**:

```typescript
import { requireRole } from "./trpc/middleware/rbac-guard";

const deleteUser = baseProcedure
  .use(authedProcedure)
  .use(requireRole("admin"))
  .mutation(async ({ ctx, input }) => {
    // User has admin role
    return await usersService.delete(input);
  });
```

**Errors**:

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required role
- `INTERNAL_SERVER_ERROR`: Authorization service unavailable

### `validateTenantContext()`

Validates tenant context for additional isolation.

**Behavior**:

1. Checks tenant context is present
2. Validates tenant matches authenticated user
3. Logs tenant mismatch events
4. Proceeds or throws `FORBIDDEN` error

**Example**:

```typescript
import { validateTenantContext } from "./trpc/middleware/rbac-guard";

const tenantData = baseProcedure
  .use(authedProcedure)
  .use(validateTenantContext())
  .query(async ({ ctx }) => {
    // Tenant context validated
    return await tenantService.getData();
  });
```

**Errors**:

- `FORBIDDEN`: Tenant context missing or mismatched

## Composing Middleware

Multiple middleware guards can be composed for fine-grained access control:

### Permission + Role Combination

```typescript
const adminWriteProcedure = baseProcedure
  .use(authedProcedure)
  .use(requireRole("admin"))
  .use(requirePermission(PERMISSIONS.USERS_WRITE));
```

### Multiple Permissions (OR Logic)

```typescript
const readProcedure = baseProcedure.use(authedProcedure).use(async ({ ctx, next }) => {
  const rbac = getRbacService();
  const hasPermission = await rbac.hasPermission(
    ctx.auth.userId,
    ctx.auth.tenantId,
    ctx.input.requiredPermission,
  );

  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions",
    });
  }

  return next();
});
```

## Protected Endpoints

### Auth Endpoints

#### `POST /auth/login`

Authenticates user and returns JWT with roles.

**Request**:

```typescript
{
  email: string;
  password: string;
  tenantId: string;
}
```

**Response**:

```typescript
{
  user: {
    id: string;
    email: string;
    displayName: string | null;
    roles: string[];  // Fetched from database
  };
  token: string;  // JWT with embedded roles
}
```

**RBAC**: No authentication required (public endpoint)

#### `POST /auth/refresh`

Refreshes JWT token with current database roles.

**Request**: Valid JWT token in Authorization header

**Response**:

```typescript
{
  user: {
    id: string;
    email: string;
    roles: string[];  // Fresh from database
  };
  token: string;  // New JWT with updated roles
}
```

**RBAC**: Requires authentication

### User Management Endpoints

#### `GET /users`

Lists users in tenant.

**Protected By**: `requirePermission(PERMISSIONS.USERS_READ)`

**Response**:

```typescript
{
  users: Array<{
    id: string;
    email: string;
    displayName: string | null;
    roles: string[];
    createdAt: string;
  }>;
}
```

#### `POST /users`

Creates new user.

**Protected By**: `requirePermission(PERMISSIONS.USERS_WRITE)`

**Request**:

```typescript
{
  email: string;
  displayName?: string;
  initialRole?: string;  // Optional: defaults to "viewer"
}
```

#### `PATCH /users/:id`

Updates user details.

**Protected By**: `requirePermission(PERMISSIONS.USERS_WRITE)`

#### `DELETE /users/:id`

Deletes user.

**Protected By**: `requirePermission(PERMISSIONS.USERS_DELETE)`

### Role Management Endpoints

#### `POST /users/:id/roles`

Assigns role to user.

**Protected By**: `requirePermission(PERMISSIONS.USERS_MANAGE)`

**Request**:

```typescript
{
  roleId: string;
}
```

**Behavior**:

- Creates `user_roles` record
- Sets `granted_by` to current user ID
- Sets `granted_at` to current timestamp

**Response**:

```typescript
{
  success: true;
  user: {
    id: string;
    roles: string[];
  };
}
```

#### `DELETE /users/:id/roles/:roleId`

Revokes role from user.

**Protected By**: `requirePermission(PERMISSIONS.USERS_MANAGE)`

**Behavior**:

- Deletes `user_roles` record
- Idempotent (no error if record doesn't exist)

**Response**:

```typescript
{
  success: true;
  user: {
    id: string;
    roles: string[];
  };
}
```

#### `GET /roles`

Lists available roles for tenant.

**Protected By**: `requirePermission(PERMISSIONS.ROLES_READ)`

**Response**:

```typescript
{
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
    isSystemRole: boolean;
    isCustomRole: boolean;
    permissions: string[];
  }>;
}
```

#### `GET /permissions`

Lists all available permissions.

**Protected By**: `requirePermission(PERMISSIONS.PERMISSIONS_READ)`

**Response**:

```typescript
{
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
  }>;
}
```

## Error Responses

### Standard Error Format

```typescript
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### RBAC Error Codes

| Code                      | HTTP Status | Description                           |
| ------------------------- | ----------- | ------------------------------------- |
| `UNAUTHORIZED`            | 401         | User not authenticated                |
| `FORBIDDEN`               | 403         | User lacks required permission/role   |
| `TENANT_CONTEXT_REQUIRED` | 500         | Missing tenant context (server error) |
| `TENANT_MISMATCH`         | 403         | Tenant context mismatch               |
| `INTERNAL_SERVER_ERROR`   | 500         | Authorization service error           |

## Audit Logging

All authorization decisions are logged via `recordTenantSecurityEvent()`:

**Logged Events**:

- `RBAC_ALLOW`: Permission/role check passed
- `RBAC_DENY`: Permission/role check failed
- `TENANT_MISMATCH`: Tenant validation failed

**Log Context**:

- User ID
- Tenant ID
- Permission/role checked
- Timestamp
- Request metadata

## Rate Limiting

RBAC endpoints are subject to standard rate limits:

- Login: 10 requests per minute per IP
- Role management: 100 requests per minute per user
- Permission checks: No additional limit (included in request quota)

## Performance Considerations

### Database Queries

Permission checks execute efficient single queries:

```sql
-- hasPermission query (indexed)
SELECT p.id
FROM permissions p
INNER JOIN role_permissions rp ON rp.permission_id = p.id
INNER JOIN user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = $1
  AND p.name = $2
LIMIT 1;
```

### Caching

- Roles cached in JWT (refresh on login)
- No additional caching layer (Phase 1)
- Future: Redis caching for high-traffic tenants

### Response Times

Target latencies (p95):

- Permission check: < 50ms
- Role assignment: < 100ms
- User listing: < 200ms

## Security Best Practices

### Client-Side Usage

1. **Always check permissions before API calls**:

```typescript
const { hasPermission } = usePermissions();
if (hasPermission("reports:write")) {
  await api.reports.create(input);
}
```

2. **Handle permission errors gracefully**:

```typescript
try {
  await api.reports.create(input);
} catch (error) {
  if (error.code === "FORBIDDEN") {
    showPermissionDeniedMessage();
  }
}
```

3. **Refresh roles after assignment**:

```typescript
await api.users.assignRole(userId, roleId);
await auth.refresh(); // Get updated roles
```

### Server-Side Usage

1. **Always protect sensitive endpoints**:

```typescript
const deleteReport = baseProcedure
  .use(authedProcedure)
  .use(requirePermission(PERMISSIONS.REPORTS_DELETE))
  .mutation(...);
```

2. **Use most specific permission available**:

```typescript
// Good
.use(requirePermission(PERMISSIONS.REPORTS_WRITE))

// Avoid (too broad)
.use(requireRole("admin"))
```

3. **Log custom authorization events**:

```typescript
recordTenantSecurityEvent("custom", "ROLE_ASSIGNED", {
  userId,
  roleId,
  grantedBy: ctx.auth.userId,
});
```

## Testing

### Unit Tests

Test middleware with mocked RBAC service:

```typescript
import { describe, expect, it, vi } from "vitest";
import { requirePermission } from "./rbac-guard";

describe("requirePermission", () => {
  it("allows access when user has permission", async () => {
    vi.mocked(rbacService.hasPermission).mockResolvedValue(true);

    const middleware = requirePermission("reports:read");
    // Test middleware behavior
  });

  it("denies access when user lacks permission", async () => {
    vi.mocked(rbacService.hasPermission).mockResolvedValue(false);

    const middleware = requirePermission("reports:read");
    // Expect FORBIDDEN error
  });
});
```

### Integration Tests

Test end-to-end with test database:

```typescript
import { describe, expect, it, beforeAll } from "vitest";
import { createTestClient } from "../test-utils";

describe("RBAC Integration", () => {
  it("enforces permission checks on protected endpoint", async () => {
    const client = createTestClient({ userId: "user-123" });

    // User without permission
    await expect(client.reports.create({})).rejects.toThrow("FORBIDDEN");

    // Assign permission
    await assignPermission("user-123", "reports:write");

    // User with permission
    await expect(client.reports.create({})).resolves.toBeDefined();
  });
});
```

## Related Documentation

- [RBAC Architecture](/docs/architecture/rbac-architecture.md)
- [Role Management Guide](/docs/guides/role-management.md)
- [Permission Taxonomy](/docs/architecture/rbac-architecture.md#permission-taxonomy)
