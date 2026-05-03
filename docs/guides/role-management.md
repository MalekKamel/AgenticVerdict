# Role Management Guide

This guide provides administrators with procedures for managing user roles and permissions in AgenticVerdict.

## Quick Start

### Assign a Role to a User

```sql
-- Assign "editor" role to a user
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT
  u.id as user_id,
  r.id as role_id,
  :admin_user_id as granted_by
FROM users u
CROSS JOIN roles r
WHERE u.email = 'user@example.com'
  AND r.name = 'editor'
  AND r.tenant_id = :tenant_id
ON CONFLICT (user_id, role_id) DO NOTHING;
```

### Revoke a Role from a User

```sql
-- Revoke "editor" role from a user
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
  AND role_id = (SELECT id FROM roles WHERE name = 'editor');
```

### Check User's Current Roles

```sql
SELECT r.name, r.description, ur.granted_at, ur.granted_by
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'user@example.com'
  AND r.tenant_id = :tenant_id
ORDER BY ur.granted_at DESC;
```

### Check User's Permissions

```sql
SELECT DISTINCT p.name as permission, p.resource, p.action
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = (SELECT id FROM users WHERE email = 'user@example.com')
ORDER BY p.resource, p.action;
```

## System Roles

The platform provides four pre-configured system roles:

### Viewer

**Purpose**: Read-only access for stakeholders and observers.

**Typical Permissions**:

- `reports:read`
- `analytics:read`
- `dashboard:read`

**Use Cases**:

- Executive dashboards
- Stakeholder reporting
- Compliance auditors

### Editor

**Purpose**: Content creation and editing capabilities.

**Typical Permissions**:

- All viewer permissions, plus:
- `reports:write`
- `reports:delete` (own content)
- `content:write`

**Use Cases**:

- Report authors
- Content managers
- Data analysts

### Analyst

**Purpose**: Advanced data analysis and insights.

**Typical Permissions**:

- All editor permissions, plus:
- `analytics:write`
- `data:export`
- `queries:execute`

**Use Cases**:

- Data analysts
- Business intelligence
- Power users

### Admin

**Purpose**: Full administrative access.

**Typical Permissions**:

- All permissions including:
- `users:*`
- `roles:*`
- `settings:*`
- `audit:read`

**Use Cases**:

- Platform administrators
- IT managers
- System operators

## Common Administrative Procedures

### Onboarding a New User

1. **Create User Account** (if not auto-provisioned):

```sql
INSERT INTO users (tenant_id, email, display_name)
VALUES (:tenant_id, 'user@example.com', 'User Name');
```

2. **Assign Default Role** (typically "viewer"):

```sql
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT
  u.id,
  r.id,
  :admin_user_id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'user@example.com'
  AND r.name = 'viewer'
  AND r.tenant_id = :tenant_id;
```

3. **Verify Assignment**:

```sql
SELECT r.name FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com';
```

### Promoting a User

1. **Review Current Permissions**:

```sql
SELECT DISTINCT p.name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

2. **Assign New Role**:

```sql
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT
  u.id,
  r.id,
  :admin_user_id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'user@example.com'
  AND r.name = 'editor'
  AND r.tenant_id = :tenant_id;
```

3. **Optionally Revoke Old Role** (if replacing):

```sql
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')
  AND role_id = (SELECT id FROM roles WHERE name = 'viewer');
```

### Offboarding a User

1. **Revoke All Roles**:

```sql
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

2. **Deactivate User Account** (optional):

```sql
-- Mark user as inactive if column exists
UPDATE users SET active = false
WHERE email = 'user@example.com';
```

3. **Audit Trail** (verify deletion was logged):

```sql
SELECT * FROM audit_log
WHERE user_email = 'user@example.com'
  AND action_type = 'role_revoked'
ORDER BY created_at DESC
LIMIT 10;
```

### Bulk Role Assignment

Assign a role to multiple users:

```sql
INSERT INTO user_roles (user_id, role_id, granted_by)
SELECT
  u.id,
  r.id,
  :admin_user_id
FROM users u
CROSS JOIN roles r
WHERE u.email IN (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
)
  AND r.name = 'editor'
  AND r.tenant_id = :tenant_id
ON CONFLICT (user_id, role_id) DO NOTHING;
```

### Role Audit Report

Generate a report of all role assignments:

```sql
SELECT
  u.email as user_email,
  u.display_name,
  r.name as role_name,
  r.is_system_role,
  ur.granted_at,
  admin.email as granted_by_email
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
JOIN users admin ON ur.granted_by = admin.id
WHERE r.tenant_id = :tenant_id
ORDER BY u.email, r.name;
```

## Custom Roles (Future Feature)

**Note**: Custom role creation is planned for Phase 2. Currently, only system roles are available.

### Creating a Custom Role (Planned)

```sql
-- Step 1: Create the role
INSERT INTO roles (tenant_id, name, description, is_custom_role)
VALUES (:tenant_id, 'custom-role', 'Custom role description', true);

-- Step 2: Assign permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'custom-role'
  AND r.tenant_id = :tenant_id
  AND p.name IN (
    'reports:read',
    'reports:write',
    'analytics:read'
  );
```

## Troubleshooting

### User Reports Missing Access

1. **Verify Role Assignment**:

```sql
SELECT r.name FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com';
```

2. **Check Permissions for Role**:

```sql
SELECT p.name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'editor';
```

3. **Verify Tenant Context**:

```sql
-- Ensure role belongs to correct tenant
SELECT r.tenant_id, t.name as tenant_name
FROM roles r
JOIN tenants t ON r.tenant_id = t.id
WHERE r.name = 'editor'
  AND r.tenant_id = :tenant_id;
```

### Permission Not Working

1. **Check Permission Exists**:

```sql
SELECT * FROM permissions WHERE name = 'reports:write';
```

2. **Check Role-Permission Link**:

```sql
SELECT r.name, p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.name = 'reports:write';
```

3. **Check User Has Role**:

```sql
SELECT u.email, r.name
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'user@example.com';
```

### Cross-Tenant Access Issues

**Symptom**: User cannot access resources despite having roles.

**Check**: Ensure tenant context is correct:

```sql
-- Verify user belongs to tenant
SELECT u.tenant_id, t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.id = :user_id;

-- Verify roles belong to same tenant
SELECT r.tenant_id, r.name
FROM roles r
WHERE r.id IN (
  SELECT role_id FROM user_roles WHERE user_id = :user_id
);
```

## Best Practices

### Security

1. **Principle of Least Privilege**: Grant minimum permissions needed
2. **Regular Audits**: Review role assignments quarterly
3. **Document Changes**: Log all role changes with justification
4. **Segregation of Duties**: Separate admin roles from operational roles

### Maintenance

1. **Monitor Orphaned Roles**: Clean up roles for departed users
2. **Track Role Usage**: Identify unused permissions
3. **Review Custom Roles**: Validate custom roles still meet needs
4. **Update Documentation**: Keep role definitions current

### Performance

1. **Avoid Role Proliferation**: Use permissions, not excessive roles
2. **Batch Operations**: Use bulk inserts for multiple assignments
3. **Index Maintenance**: Ensure indexes on foreign keys
4. **Query Optimization**: Use prepared statements for repeated checks

## API Integration

### Programmatic Role Management

Use the RBAC service for programmatic access:

```typescript
import { getRbacService } from "@agenticverdict/database";

const rbac = getRbacService();

// Assign role
await rbac.assignRole(userId, roleId, adminUserId);

// Revoke role
await rbac.revokeRole(userId, roleId);

// Check permissions
const hasAccess = await rbac.hasPermission(userId, tenantId, "reports:write");

// Get user permissions
const permissions = await rbac.getUserPermissions(userId, tenantId);
```

### tRPC Middleware

Protect API routes with RBAC middleware:

```typescript
import { requirePermission } from "./trpc/middleware/rbac-guard";

const protectedProcedure = baseProcedure.use(requirePermission("reports:write"));
```

## Support

For issues or questions:

- Check [RBAC Architecture](/docs/architecture/rbac-architecture.md)
- Review [API Documentation](/docs/api/rbac-endpoints.md)
- Contact platform team for escalations
