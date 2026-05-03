# RBAC Industry Standards and Best Practices

**Document Type:** Research Reference  
**Audience:** Architecture, Backend, and Security Teams  
**Last Updated:** 2026-04-30  
**Purpose:** Inform RBAC implementation design decisions for AgenticVerdict multi-tenant SaaS

---

## Executive Summary

This document synthesizes industry-standard RBAC patterns from NIST standards, PostgreSQL documentation, and modern SaaS implementations. Key findings:

- **Database Layer:** Standard 4-table RBAC schema with PostgreSQL Row-Level Security (RLS) for defense-in-depth
- **Application Layer:** Type-safe TypeScript guards with permission caching and middleware patterns
- **Security:** Principle of least privilege, separation of duties, comprehensive audit logging
- **Multi-tenant:** Tenant-scoped roles with optional custom role support

---

## 1. Database Schema Design

### 1.1 Standard RBAC Table Structure

The industry-standard RBAC model (NIST/ANSI INCITS 359-2004) defines four core tables:

```sql
-- Core entity tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(320) NOT NULL,
    display_name VARCHAR(256),
    password_hash VARCHAR(512),
    email_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, email)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    is_custom_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (tenant_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(256) NOT NULL UNIQUE,
    resource VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (resource, action)
);

-- Junction tables
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    UNIQUE (user_id, role_id)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (role_id, permission_id)
);

-- Optional: Role hierarchy support
CREATE TABLE role_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

    UNIQUE (parent_role_id, child_role_id),
    CHECK (parent_role_id != child_role_id)
);
```

**Rationale:**

- **Tenant isolation:** All tables include `tenant_id` for multi-tenant scoping
- **System vs. custom roles:** Distinguish platform-defined roles from tenant-customizable roles
- **Permission granularity:** Resource-action pairs (e.g., `reports:read`, `users:write`)
- **Temporal constraints:** `expires_at` supports time-limited role assignments

### 1.2 PostgreSQL Row-Level Security (RLS) Integration

**Best Practice:** Apply RLS policies as defense-in-depth, not as primary authorization mechanism.

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (applies to all tenant-scoped tables)
CREATE POLICY tenant_isolation_policy ON users
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Role-based access within tenant
CREATE POLICY user_roles_read_policy ON user_roles
    FOR SELECT
    USING (
        -- Users can see their own role assignments
        user_id = current_setting('app.current_user_id')::uuid
        OR
        -- Admins can see all role assignments in their tenant
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = current_setting('app.current_user_id')::uuid
            AND r.name IN ('admin', 'tenant_admin')
        )
    );

-- Restrictive policy for sensitive operations
CREATE POLICY user_roles_admin_write_policy ON user_roles
    AS RESTRICTIVE
    FOR ALL
    TO admin
    USING (pg_catalog.inet_client_addr() IS NULL); -- Local socket only
```

**Key RLS Concepts:**

- **Permissive policies (default):** Combined with OR
- **Restrictive policies:** Combined with AND (stricter)
- **Bypass:** Superusers and `BYPASSRLS` roles bypass RLS
- **Performance:** Policy expressions should be simple; avoid subqueries when possible

**Warning:** Race conditions can occur when policies reference other tables. Use `SELECT ... FOR SHARE` in subqueries or lock referenced tables during updates.

### 1.3 Indexing Strategies

```sql
-- User role lookups (frequent in auth checks)
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_lookup ON user_roles(user_id, role_id);

-- Permission checks
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_role_permissions_composite ON role_permissions(role_id, permission_id);

-- Role queries
CREATE INDEX idx_roles_tenant_id ON roles(tenant_id, name);
CREATE INDEX idx_roles_system_flag ON roles(is_system_role) WHERE is_system_role = true;

-- Audit log queries
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Composite index for permission checks
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
```

**Performance Considerations:**

- Covering indexes reduce table scans for common queries
- Partial indexes for system roles reduce index size
- Time-based indexes support audit log retention policies

---

## 2. Application-Layer Patterns

### 2.1 TypeScript Type-Safe RBAC

```typescript
// Permission definitions (SSOT)
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

  // Settings
  SETTINGS_READ: "settings:read" as const,
  SETTINGS_WRITE: "settings:write" as const,
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role types
export type SystemRole = "admin" | "analyst" | "viewer";
export type CustomRole = string; // Tenant-defined
export type Role = SystemRole | CustomRole;

// Permission checker interface
export interface PermissionChecker {
  hasPermission(permission: Permission): Promise<boolean>;
  hasAnyPermission(permissions: Permission[]): Promise<boolean>;
  hasAllPermissions(permissions: Permission[]): Promise<boolean>;
  hasRole(role: Role): Promise<boolean>;
}

// Context object for request scope
export interface AuthContext {
  userId: string;
  tenantId: string;
  roles: Role[];
  permissions: Set<Permission>;
  isSystemRole: boolean;
}
```

### 2.2 Middleware/Guard Patterns

**Fastify/tRPC Middleware:**

```typescript
// Permission guard middleware
export function createPermissionGuard(requiredPermission: Permission) {
  return async (opts: tRPCMiddlewareOpts) => {
    const ctx = opts.ctx as AuthenticatedContext;

    if (!ctx.auth.permissions.has(requiredPermission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required permission: ${requiredPermission}`,
      });
    }

    return opts.next();
  };
}

// Usage in tRPC router
const userRouter = router({
  list: publicProcedure
    .use(createPermissionGuard(PERMISSIONS.USERS_READ))
    .query(async ({ ctx }) => {
      return db.select().from(users).where(eq(users.tenantId, ctx.auth.tenantId));
    }),

  create: publicProcedure
    .use(createPermissionGuard(PERMISSIONS.USERS_WRITE))
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

**Route Guards (Frontend):**

```typescript
// TanStack Start route guard
export function createProtectedRoute(requiredPermission?: Permission) {
  return {
    beforeLoad: async ({ context, location }) => {
      const auth = context.auth;

      if (!auth.isAuthenticated) {
        throw redirect({ to: "/auth/login", search: { redirect: location.href } });
      }

      if (requiredPermission && !auth.hasPermission(requiredPermission)) {
        throw redirect({ to: "/unauthorized" });
      }

      return { auth };
    },
  };
}
```

### 2.3 Frontend Permission Checking

```typescript
// React hook for permission checks
export function usePermission(permission: Permission): boolean {
  const auth = useAuth();
  return auth.permissions.has(permission);
}

// Component-level permission gate
interface PermissionGateProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return fallback;
  }

  return children;
}

// Usage
<PermissionGate permission={PERMISSIONS.USERS_WRITE}>
  <Button onClick={handleDeleteUser}>Delete User</Button>
</PermissionGate>
```

### 2.4 Caching Strategies

**Permission Cache Architecture:**

```typescript
// In-memory cache with TTL
class PermissionCache {
  private cache = new Map<string, CachedPermissions>();
  private ttlMs: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.ttlMs = ttlMs;
  }

  async getPermissions(userId: string, tenantId: string): Promise<Set<Permission>> {
    const key = `${userId}:${tenantId}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.permissions;
    }

    // Cache miss - fetch from database
    const permissions = await this.fetchPermissionsFromDB(userId, tenantId);
    this.cache.set(key, {
      permissions,
      expiresAt: Date.now() + this.ttlMs,
    });

    return permissions;
  }

  invalidate(userId: string, tenantId: string): void {
    const key = `${userId}:${tenantId}`;
    this.cache.delete(key);
  }

  invalidateRole(roleId: string, tenantId: string): void {
    // Invalidate all users with this role
    for (const key of this.cache.keys()) {
      if (key.endsWith(`:${tenantId}`)) {
        this.cache.delete(key);
      }
    }
  }
}

// Redis cache for distributed systems
class RedisPermissionCache {
  private redis: Redis;
  private ttlSeconds: number;

  async getPermissions(userId: string, tenantId: string): Promise<Set<Permission>> {
    const key = `permissions:${tenantId}:${userId}`;
    const cached = await this.redis.get(key);

    if (cached) {
      return new Set(JSON.parse(cached));
    }

    const permissions = await this.fetchPermissionsFromDB(userId, tenantId);
    await this.redis.setex(key, this.ttlSeconds, JSON.stringify([...permissions]));

    return permissions;
  }
}
```

**Cache Invalidation Triggers:**

- Role assignment changes (`user_roles` INSERT/DELETE)
- Permission changes to roles (`role_permissions` INSERT/DELETE)
- Role updates (permission grants/revokes)
- User role changes

---

## 3. Security Best Practices

### 3.1 Principle of Least Privilege

**Implementation Guidelines:**

1. **Default-deny posture:**
   - New roles start with zero permissions
   - Explicit grants required for all access
   - No wildcard permissions (`*:*`)

2. **Granular permissions:**

   ```typescript
   // ✅ Good: Fine-grained
   ("reports:read", "reports:write", "reports:delete");

   // ❌ Bad: Overly broad
   ("reports:*", "admin:all");
   ```

3. **Role minimization:**
   - Start with minimal viable permissions
   - Regular permission audits (quarterly)
   - Remove unused permissions

4. **Time-limited access:**
   ```sql
   -- Temporary elevated access
   INSERT INTO user_roles (user_id, role_id, expires_at)
   VALUES ($1, $2, NOW() + INTERVAL '24 hours');
   ```

### 3.2 Separation of Duties (SoD)

**NIST RBAC Standard SoD Types:**

1. **Static Separation of Duty (SSD):**
   - Users cannot be assigned to conflicting roles
   - Enforced at role assignment time

   ```sql
   CREATE TABLE conflicting_roles (
     id UUID PRIMARY KEY,
     role_a UUID NOT NULL REFERENCES roles(id),
     role_b UUID NOT NULL REFERENCES roles(id),

     UNIQUE (role_a, role_b)
   );

   -- Example conflicts
   INSERT INTO conflicting_roles (role_a, role_b) VALUES
     ('admin', 'auditor'),
     ('creator', 'approver'),
     ('requester', 'approver');
   ```

2. **Dynamic Separation of Duty (DSoD):**
   - Users can have conflicting roles but not activate simultaneously
   - Enforced at session/permission check time

   ```typescript
   function checkDynamicSoD(userId: string, activeRoles: Role[]): boolean {
     const conflictingPairs = [
       ["content_creator", "content_approver"],
       ["payment_requester", "payment_approver"],
       ["admin", "security_auditor"],
     ];

     for (const [roleA, roleB] of conflictingPairs) {
       if (activeRoles.includes(roleA) && activeRoles.includes(roleB)) {
         return false; // Conflict detected
       }
     }

     return true;
   }
   ```

**SoD Best Practices:**

- Identify critical business processes requiring SoD
- Document role conflicts in policy
- Audit SoD violations
- Consider workflow-based approvals for sensitive operations

### 3.3 Audit Logging

**Comprehensive Audit Trail:**

```sql
-- Enhanced audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Actor
  actor_user_id UUID REFERENCES users(id),
  actor_role_id UUID REFERENCES roles(id),

  -- Action
  action VARCHAR(128) NOT NULL, -- 'role.assign', 'permission.revoke', 'user.create'
  resource_type VARCHAR(128) NOT NULL,
  resource_id VARCHAR(256) NOT NULL,

  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,

  -- Details
  metadata JSONB,
  previous_state JSONB, -- For updates/deletes
  new_state JSONB,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexing
  INDEX idx_audit_logs_tenant_time (tenant_id, created_at DESC),
  INDEX idx_audit_logs_actor (actor_user_id, created_at DESC),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_resource (resource_type, resource_id)
);
```

**Critical Events to Log:**

- Role assignments/revocations
- Permission grants/revokes
- Failed authorization attempts
- Privilege escalation attempts
- SoD conflict violations
- Bulk permission changes
- System role modifications

**Example:**

```typescript
async function logRoleAssignment(
  ctx: AuthContext,
  targetUserId: string,
  roleId: string,
  granted: boolean,
): Promise<void> {
  await db.insert(auditLogs).values({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    action: granted ? "role.assign" : "role.revoke",
    resourceType: "user_role",
    resourceId: `${targetUserId}:${roleId}`,
    metadata: {
      roleId,
      targetUserId,
      grantedBy: ctx.userId,
    },
    ipAddress: ctx.ipAddress,
    sessionId: ctx.sessionId,
  });
}
```

### 3.4 Defense in Depth

**Layered Security Approach:**

```
┌─────────────────────────────────────────┐
│  Layer 1: Frontend UI Guards            │
│  - Route guards                         │
│  - Permission-based UI rendering        │
│  - Disabled controls for no-permission  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 2: API Middleware                │
│  - tRPC/Fastify permission guards       │
│  - Request validation                   │
│  - Rate limiting                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 3: Service Layer                 │
│  - Business logic checks                │
│  - Context validation                   │
│  - Audit logging                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 4: Database RLS                  │
│  - Tenant isolation                     │
│  - Row-level restrictions               │
│  - Default-deny policies                │
└─────────────────────────────────────────┘
```

**Key Principles:**

- Each layer should be independently secure
- Failure in one layer doesn't compromise entire system
- RLS as last line of defense, not primary control
- Consistent error messages (avoid information leakage)

---

## 4. Modern SaaS Considerations

### 4.1 Multi-Tenant RBAC Patterns

**Pattern 1: Tenant-Scoped Roles (Recommended)**

```sql
-- Each tenant has isolated roles
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL, -- Tenant isolation
  name VARCHAR(128) NOT NULL,
  is_system_role BOOLEAN DEFAULT false,

  UNIQUE (tenant_id, name)
);
```

**Pattern 2: Shared System Roles + Custom Roles**

```typescript
// System roles defined at platform level
const SYSTEM_ROLES = {
  admin: {
    name: "admin",
    permissions: ["*:*"], // All permissions
    isCustomizable: false,
  },
  analyst: {
    name: "analyst",
    permissions: ["reports:read", "reports:write", "dashboards:read"],
    isCustomizable: false,
  },
  viewer: {
    name: "viewer",
    permissions: ["reports:read", "dashboards:read"],
    isCustomizable: false,
  },
};

// Tenant can create custom roles
const customRole = {
  name: "custom_analyst",
  baseRoleId: "analyst", // Inherit from system role
  additionalPermissions: ["users:read"],
  excludedPermissions: ["reports:delete"],
};
```

**Pattern 3: Role Templates**

```sql
CREATE TABLE role_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL, -- Array of permission strings
  is_active BOOLEAN DEFAULT true
);

-- Tenant instantiates from template
INSERT INTO roles (tenant_id, name, permissions)
SELECT
  $1, -- tenant_id
  template_name || ' (Custom)',
  permissions
FROM role_templates
WHERE id = $2;
```

### 4.2 Custom Roles vs. Fixed Roles

| Aspect                | Fixed Roles | Custom Roles | Hybrid Approach |
| --------------------- | ----------- | ------------ | --------------- |
| **Complexity**        | Low         | High         | Medium          |
| **Flexibility**       | Low         | High         | High            |
| **Support Burden**    | Low         | High         | Medium          |
| **Security Risk**     | Low         | Medium       | Low-Medium      |
| **Time to Implement** | Days        | Weeks        | 1-2 Weeks       |

**Recommendation for MVP:** Start with fixed system roles, add custom roles in Phase 2.

**Fixed Role Strategy:**

```typescript
const FIXED_ROLES = {
  admin: {
    displayName: "Administrator",
    description: "Full access to all tenant resources",
    permissions: Object.values(PERMISSIONS),
    canDelete: false,
    canModify: false,
  },
  analyst: {
    displayName: "Analyst",
    description: "Can view and create reports, manage connectors",
    permissions: [
      PERMISSIONS.REPORTS_READ,
      PERMISSIONS.REPORTS_WRITE,
      PERMISSIONS.CONNECTORS_READ,
      PERMISSIONS.CONNECTORS_WRITE,
      PERMISSIONS.DASHBOARDS_READ,
    ],
    canDelete: false,
    canModify: false,
  },
  viewer: {
    displayName: "Viewer",
    description: "Read-only access to reports and dashboards",
    permissions: [PERMISSIONS.REPORTS_READ, PERMISSIONS.DASHBOARDS_READ],
    canDelete: false,
    canModify: false,
  },
};
```

### 4.3 Permission Granularity

**Coarse-Grained (MVP):**

```typescript
"reports:read";
"reports:write";
"users:read";
"users:write";
"settings:read";
"settings:write";
```

**Fine-Grained (Future):**

```typescript
"reports:read:own";
"reports:read:all";
"reports:write:create";
"reports:write:update";
"reports:delete:own";
"reports:delete:all";
"reports:share";
"reports:export";
```

**Decision Framework:**

- Start with 10-20 coarse permissions
- Add granularity based on customer requests
- Consider resource ownership (own vs. all)
- Evaluate administrative overhead

### 4.4 RBAC vs. ABAC Hybrid

**When to Consider ABAC:**

- Context-dependent access (time, location, device)
- Dynamic policies based on attributes
- Complex organizational hierarchies
- Compliance requirements (data classification)

**Hybrid Approach Example:**

```typescript
// RBAC base
const basePermissions = await getRolePermissions(user.roles);

// ABAC overlay
const context = {
  timeOfDay: new Date().getHours(),
  ipAddress: request.ip,
  deviceType: request.device,
  dataClassification: resource.classification,
};

const finalPermissions = basePermissions.filter((permission) => {
  if (permission === "reports:read:sensitive") {
    // Additional ABAC check
    return (
      context.dataClassification <= user.clearanceLevel &&
      context.timeOfDay >= 9 &&
      context.timeOfDay <= 17 &&
      isCorporateNetwork(context.ipAddress)
    );
  }
  return true;
});
```

**Recommendation:** Start with pure RBAC, add ABAC attributes only when business requirements demand it.

---

## 5. Anti-Patterns to Avoid

### 5.1 Role Explosion

**Problem:** Creating a new role for every permission combination.

**❌ Bad:**

```typescript
const roles = {
  reports_viewer: ["reports:read"],
  reports_editor: ["reports:read", "reports:write"],
  reports_admin: ["reports:read", "reports:write", "reports:delete"],
  users_viewer: ["users:read"],
  users_admin: ["users:read", "users:write"],
  // ... 50+ roles
};
```

**✅ Good:**

```typescript
const roles = {
  admin: ["*:*"],
  analyst: ["reports:read", "reports:write", "dashboards:*"],
  viewer: ["reports:read", "dashboards:read"],
};
// Use permission checks for edge cases
```

**Mitigation:**

- Use role hierarchies
- Leverage permission wildcards carefully
- Regular role audits
- Document role purpose

### 5.2 Direct Permission Assignment

**❌ Bad:**

```sql
-- Assigning permissions directly to users
CREATE TABLE user_permissions (
  user_id UUID,
  permission_id UUID
);
```

**✅ Good:**

```sql
-- All permissions through roles
CREATE TABLE user_roles (
  user_id UUID,
  role_id UUID
);

CREATE TABLE role_permissions (
  role_id UUID,
  permission_id UUID
);
```

**Rationale:** RBAC requires all access through roles for manageable administration.

### 5.3 Hardcoded Role Checks

**❌ Bad:**

```typescript
if (user.role === "admin") {
  // Allow access
}
```

**✅ Good:**

```typescript
if (await permissionChecker.hasPermission(PERMISSIONS.USERS_WRITE)) {
  // Allow access
}
```

**Rationale:** Permission-based checks are more flexible and testable.

### 5.4 Missing Tenant Isolation

**❌ Bad:**

```sql
-- No tenant scoping
SELECT * FROM users WHERE id = $1;
```

**✅ Good:**

```sql
-- Explicit tenant scoping
SELECT * FROM users
WHERE id = $1
  AND tenant_id = current_setting('app.current_tenant_id')::uuid;
```

**Best Practice:** Combine application-layer checks with RLS policies.

### 5.5 Insufficient Audit Logging

**❌ Bad:**

```typescript
// No audit trail for permission changes
await db.delete(user_roles).where(eq(user_roles.userId, userId));
```

**✅ Good:**

```typescript
// Comprehensive audit
await db.transaction(async (tx) => {
  await tx.delete(user_roles).where(eq(user_roles.userId, userId));

  await tx.insert(auditLogs).values({
    action: "role.revoke_all",
    resourceType: "user",
    resourceId: userId,
    metadata: { revokedBy: ctx.userId },
  });
});
```

### 5.6 Circular Role Dependencies

**Problem:** Role hierarchies with circular references cause infinite loops.

**Prevention:**

```sql
-- Trigger to prevent circular references
CREATE FUNCTION check_role_hierarchy_cycle() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    WITH RECURSIVE role_path AS (
      SELECT child_role_id, parent_role_id, 1 as depth
      FROM role_hierarchy
      WHERE child_role_id = NEW.parent_role_id

      UNION ALL

      SELECT rh.child_role_id, rh.parent_role_id, rp.depth + 1
      FROM role_hierarchy rh
      JOIN role_path rp ON rh.child_role_id = rp.parent_role_id
      WHERE rp.depth < 100 -- Prevent infinite recursion
    )
    SELECT 1 FROM role_path WHERE child_role_id = NEW.child_role_id
  ) THEN
    RAISE EXCEPTION 'Circular role hierarchy detected';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_role_cycle
  BEFORE INSERT OR UPDATE ON role_hierarchy
  FOR EACH ROW
  EXECUTE FUNCTION check_role_hierarchy_cycle();
```

---

## 6. Reference Implementation Examples

### 6.1 Complete Permission Check Flow

```typescript
// packages/authorization/src/permission-checker.ts
export class PermissionCheckerImpl implements PermissionChecker {
  constructor(
    private db: Database,
    private cache: PermissionCache,
    private auditLogger: AuditLogger,
  ) {}

  async hasPermission(userId: string, tenantId: string, permission: Permission): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Check cache first
      const permissions = await this.cache.getPermissions(userId, tenantId);

      if (permissions.has(permission)) {
        return true;
      }

      // Cache miss - check database
      const hasPermission = await this.checkPermissionInDB(userId, tenantId, permission);

      // Log failed permission check for security monitoring
      if (!hasPermission) {
        await this.auditLogger.log({
          tenantId,
          actorUserId: userId,
          action: "permission.denied",
          resourceType: "permission",
          resourceId: permission,
          metadata: { permission },
        });
      }

      return hasPermission;
    } catch (error) {
      // Fail closed on errors
      await this.auditLogger.log({
        tenantId,
        actorUserId: userId,
        action: "permission.error",
        resourceType: "permission",
        resourceId: permission,
        metadata: { error: error.message },
      });

      return false;
    }
  }

  private async checkPermissionInDB(
    userId: string,
    tenantId: string,
    permission: Permission,
  ): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(roles.tenantId, tenantId),
          eq(permissions.name, permission),
          eq(roles.active, true),
          or(isNull(userRoles.expiresAt), gt(userRoles.expiresAt, new Date())),
        ),
      );

    return (result[0]?.count ?? 0) > 0;
  }
}
```

### 6.2 tRPC Router with RBAC

```typescript
// apps/api/src/routers/users.ts
import { router, publicProcedure } from "../trpc";
import { PERMISSIONS } from "@agenticverdict/authorization";
import { createPermissionGuard } from "../middleware/permission-guard";

export const usersRouter = router({
  // List users - requires USERS_READ permission
  list: publicProcedure
    .use(createPermissionGuard(PERMISSIONS.USERS_READ))
    .query(async ({ ctx }) => {
      return ctx.db.query.users.findMany({
        where: eq(users.tenantId, ctx.auth.tenantId),
      });
    }),

  // Get user by ID - requires USERS_READ
  getById: publicProcedure
    .use(createPermissionGuard(PERMISSIONS.USERS_READ))
    .input(z.object({ userId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: and(eq(users.id, input.userId), eq(users.tenantId, ctx.auth.tenantId)),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return user;
    }),

  // Create user - requires USERS_WRITE
  create: publicProcedure
    .use(createPermissionGuard(PERMISSIONS.USERS_WRITE))
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const user = await tx
          .insert(users)
          .values({
            ...input,
            tenantId: ctx.auth.tenantId,
          })
          .returning();

        // Assign default role
        const defaultRole = await tx.query.roles.findFirst({
          where: and(eq(roles.tenantId, ctx.auth.tenantId), eq(roles.name, "viewer")),
        });

        if (defaultRole) {
          await tx.insert(userRoles).values({
            userId: user[0].id,
            roleId: defaultRole.id,
            grantedBy: ctx.auth.userId,
          });
        }

        return user[0];
      });
    }),

  // Delete user - requires USERS_DELETE
  delete: publicProcedure
    .use(createPermissionGuard(PERMISSIONS.USERS_DELETE))
    .input(z.object({ userId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deletion
      if (input.userId === ctx.auth.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your own account",
        });
      }

      await ctx.db
        .delete(users)
        .where(and(eq(users.id, input.userId), eq(users.tenantId, ctx.auth.tenantId)));
    }),

  // Assign role - requires ROLES_WRITE
  assignRole: publicProcedure
    .use(createPermissionGuard(PERMISSIONS.ROLES_WRITE))
    .input(
      z.object({
        userId: z.uuid(),
        roleId: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        // Check SoD conflicts
        const userRoles = await tx.query.userRoles.findMany({
          where: eq(userRoles.userId, input.userId),
          with: { role: true },
        });

        const targetRole = await tx.query.roles.findFirst({
          where: eq(roles.id, input.roleId),
        });

        if (
          hasSoDConflict(
            userRoles.map((ur) => ur.role),
            targetRole,
          )
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Role assignment would violate separation of duties",
          });
        }

        await tx.insert(userRoles).values({
          userId: input.userId,
          roleId: input.roleId,
          grantedBy: ctx.auth.userId,
        });

        // Invalidate permission cache
        await ctx.cache.invalidate(input.userId, ctx.auth.tenantId);
      });
    }),
});
```

### 6.3 Frontend Route Guard

```typescript
// apps/frontend/src/lib/auth/route-guards/rbac-guard.ts
import { PERMISSIONS } from "@agenticverdict/authorization";
import { redirect } from "@tanstack/start";

export function createRBACGuard(requiredPermission: Permission) {
  return {
    beforeLoad: async ({ context, location }: BeforeLoadContext) => {
      const auth = context.auth;

      // Check authentication first
      if (!auth.isAuthenticated) {
        throw redirect({
          to: "/auth/login",
          search: { redirect: location.href },
        });
      }

      // Check permission
      const hasPermission = await auth.checkPermission(requiredPermission);

      if (!hasPermission) {
        // Log unauthorized access attempt
        await auth.logAccessAttempt({
          permission: requiredPermission,
          resource: location.href,
          granted: false,
        });

        throw redirect({
          to: "/unauthorized",
          search: {
            required: requiredPermission,
            from: location.href,
          },
        });
      }

      return { auth };
    },
  };
}

// Usage in route file
export const Route = createFileRoute("/settings/users")({
  beforeLoad: createRBACGuard(PERMISSIONS.USERS_READ),
  component: UsersPage,
});
```

### 6.4 Database Migration Script

```sql
-- migrations/001_create_rbac_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create permissions table (platform-wide)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(256) NOT NULL UNIQUE,
  resource VARCHAR(128) NOT NULL,
  action VARCHAR(64) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_permission_name_format
    CHECK (name ~ '^[a-z_]+:[a-z_]+$')
);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('users:read', 'users', 'read', 'View user list and details'),
  ('users:write', 'users', 'write', 'Create and update users'),
  ('users:delete', 'users', 'delete', 'Delete users'),
  ('roles:read', 'roles', 'read', 'View roles and permissions'),
  ('roles:write', 'roles', 'write', 'Create and modify roles'),
  ('reports:read', 'reports', 'read', 'View reports'),
  ('reports:write', 'reports', 'write', 'Create and edit reports'),
  ('reports:delete', 'reports', 'delete', 'Delete reports'),
  ('settings:read', 'settings', 'read', 'View tenant settings'),
  ('settings:write', 'settings', 'write', 'Modify tenant settings');

-- Create roles table (tenant-scoped)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  is_custom_role BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, name),
  CONSTRAINT chk_role_name_format
    CHECK (name ~ '^[a-z_]+$')
);

-- Create system roles for each existing tenant
INSERT INTO roles (tenant_id, name, description, is_system_role)
SELECT
  id,
  'admin',
  'Full administrative access',
  true
FROM tenants;

INSERT INTO roles (tenant_id, name, description, is_system_role)
SELECT
  id,
  'analyst',
  'Can view and create reports',
  true
FROM tenants;

INSERT INTO roles (tenant_id, name, description, is_system_role)
SELECT
  id,
  'viewer',
  'Read-only access',
  true
FROM tenants;

-- Create role_permissions junction table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (role_id, permission_id)
);

-- Grant all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND r.is_system_role = true;

-- Grant read/write permissions to analyst role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'analyst'
  AND r.is_system_role = true
  AND p.resource IN ('reports', 'dashboards', 'connectors')
  AND p.action IN ('read', 'write');

-- Grant read permissions to viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND r.is_system_role = true
  AND p.action = 'read';

-- Create user_roles junction table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  UNIQUE (user_id, role_id)
);

-- Migrate existing users to default role
INSERT INTO user_roles (user_id, role_id, granted_at)
SELECT
  u.id,
  r.id,
  NOW()
FROM users u
JOIN roles r ON r.tenant_id = u.tenant_id AND r.name = 'viewer'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_roles_tenant_name ON roles(tenant_id, name);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY roles_tenant_isolation ON roles
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY user_roles_tenant_isolation ON user_roles
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_roles.user_id
      AND u.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

CREATE POLICY role_permissions_read ON role_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = current_setting('app.current_user_id')::uuid
      AND r.tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );
```

---

## 7. Implementation Checklist

### Phase 1: Core RBAC (MVP)

- [ ] Create database schema (permissions, roles, user_roles, role_permissions)
- [ ] Implement system roles (admin, analyst, viewer)
- [ ] Build permission checker service
- [ ] Add tRPC middleware for permission guards
- [ ] Implement frontend permission hooks
- [ ] Add audit logging for role changes
- [ ] Migrate existing users to default roles

### Phase 2: Enhanced Security

- [ ] Enable PostgreSQL RLS policies
- [ ] Implement separation of duties checks
- [ ] Add permission caching layer
- [ ] Build admin UI for role management
- [ ] Implement comprehensive audit log queries
- [ ] Add security monitoring alerts

### Phase 3: Advanced Features

- [ ] Support custom roles
- [ ] Add role hierarchies
- [ ] Implement time-limited role assignments
- [ ] Build role template system
- [ ] Add ABAC attributes (if needed)
- [ ] Implement bulk role operations

---

## 8. References

### Standards

- **NIST/ANSI INCITS 359-2004:** American National Standard for Information Technology - Role Based Access Control
- **NIST RBAC FAQ:** https://csrc.nist.gov/projects/role-based-access-control/faqs
- **PostgreSQL RLS Documentation:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html

### Academic Papers

- Ferraiolo, D.F. & Kuhn, D.R. (1992). "Role-Based Access Control". 15th National Computer Security Conference.
- Sandhu, R., Coyne, E.J., Feinstein, H.L. & Youman, C.E. (1996). "Role-Based Access Control Models". IEEE Computer.
- Sandhu, R., Ferraiolo, D.F. & Kuhn, D.R. (2000). "The NIST model for role-based access control". ACM Workshop on Role-Based Access Control.

### Industry Resources

- Auth0 RBAC Documentation: https://auth0.com/docs/manage-users/access-control/rbac
- Cerbos RBAC Best Practices: https://www.cerbos.dev/blog/rbac-best-practices
- OWASP Access Control Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html

---

## 9. Glossary

| Term                             | Definition                                                         |
| -------------------------------- | ------------------------------------------------------------------ |
| **RBAC**                         | Role-Based Access Control - access control through roles           |
| **ABAC**                         | Attribute-Based Access Control - access control through attributes |
| **RLS**                          | Row-Level Security - database-level row filtering                  |
| **SoD**                          | Separation of Duties - preventing conflicts of interest            |
| **SSD**                          | Static Separation of Duty - SoD enforced at assignment time        |
| **DSoD**                         | Dynamic Separation of Duty - SoD enforced at activation time       |
| **Principle of Least Privilege** | Users should have minimum necessary permissions                    |
| **Defense in Depth**             | Multiple layers of security controls                               |
| **Role Explosion**               | Anti-pattern of creating too many roles                            |
| **System Role**                  | Platform-defined, non-customizable role                            |
| **Custom Role**                  | Tenant-defined, customizable role                                  |

---

**Document History:**

- 2026-04-30: Initial research compilation
- Sources: NIST standards, PostgreSQL docs, industry best practices

**Next Steps:**

1. Review with architecture team
2. Create implementation plan based on Phase 1 checklist
3. Define system roles and permissions SSOT
4. Schedule security review
