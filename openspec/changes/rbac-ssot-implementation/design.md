## Context

The current authorization system has critical security vulnerabilities:

- Email domain checks (`@agenticverdict.com`) hardcoded in 5+ locations
- JWT-stored roles that never refresh until re-authentication
- No database storage for roles or permissions
- 11 inconsistent role names across the codebase
- No audit trail for authorization decisions

The system needs a complete overhaul to implement NIST RBAC standards with database-driven role management, tenant-scoped permissions, and full type safety.

**Stakeholders:**

- Platform team (backend services)
- Frontend team (UI gating)
- Security team (audit & compliance)
- All tenants (multi-tenant access control)

**Constraints:**

- Must maintain multi-tenant isolation
- Zero `any` types in TypeScript
- No blocking operations in API handlers
- No sensitive data in logs
- Configuration-driven behavior (no hardcoded tenant logic)

## Goals / Non-Goals

**Goals:**

- Implement 4-table NIST RBAC schema (roles, permissions, user_roles, role_permissions)
- Replace all email-based role checks with database lookups
- Provide type-safe permission checking with full TypeScript inference
- Enable dynamic role assignment without deployment
- Add comprehensive audit logging for authorization decisions
- Support both system roles and tenant-defined custom roles
- Implement permission-based API protection via tRPC middleware
- Provide React hooks for frontend permission checking

**Non-Goals:**

- Attribute-Based Access Control (ABAC) - future enhancement
- Hierarchical roles with inheritance - out of scope for Phase 1
- Real-time permission propagation across active sessions - roles refresh on next login
- Admin UI for role management - manual database assignment for now
- OAuth/OIDC integration changes - separate auth provider work

## Decisions

### 1. NIST RBAC 4-Table Model

**Decision:** Implement core NIST RBAC model with 4 tables: `roles`, `permissions`, `user_roles`, `role_permissions`

**Rationale:**

- Industry standard with proven scalability
- Clear separation of concerns (role assignment vs permission assignment)
- Supports many-to-many relationships naturally
- Enables future RBAC extensions (role hierarchies, constraints)

**Alternatives Considered:**

- Simple user-permissions table: Would duplicate permissions across users, no role abstraction
- 2-table model (roles + user_roles): No permission granularity, role names become permissions
- Graph-based authorization: Overkill for current requirements, adds complexity

### 2. Tenant-Scoped Roles with System Role Support

**Decision:** All roles include `tenant_id` column, with `isSystemRole` flag for platform-wide roles

**Rationale:**

- Enforces multi-tenant isolation at database level
- Allows tenants to create custom roles alongside system roles
- System roles (admin, analyst, editor, viewer) provide consistent baseline
- Prevents cross-tenant role leakage

**Alternatives Considered:**

- Global roles table with tenant overrides: More complex queries, harder to reason about
- Separate system_roles and tenant_roles tables: Duplicates schema, harder to maintain
- No tenant scoping: Violates multi-tenant guardrails

### 3. Permission Constants with Const Assertion

**Decision:** Define permissions as TypeScript const object with `as const` assertion, derive union type

**Rationale:**

- Single source of truth for permission strings
- Full type inference, no manual type updates
- Autocomplete support in IDE
- Prevents typos in permission checks

```typescript
export const PERMISSIONS = {
  USERS_READ: "users:read" as const,
  USERS_WRITE: "users:write" as const,
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
```

**Alternatives Considered:**

- String enum: Less flexible, runtime overhead
- Union type only: No runtime values, easy to mismatch
- Plain strings: No type safety, typo-prone

### 4. Database Role Resolution on Every Login

**Decision:** Fetch roles from database during authentication, embed in JWT, refresh on re-authentication

**Rationale:**

- Roles always current (no stale JWT permissions)
- Minimal performance impact (one extra JOIN on login)
- Simple mental model for developers
- Enables role revocation (takes effect on next login)

**Alternatives Considered:**

- Real-time permission checks on every API call: Higher latency, more DB queries
- Redis-cached roles with TTL: Added complexity, cache invalidation challenges
- WebSocket role push: Over-engineered for current needs

### 5. tRPC Middleware Guards for API Protection

**Decision:** Implement `requirePermission()` and `requireRole()` middleware for tRPC procedures

**Rationale:**

- Declarative API protection
- Centralized authorization logic
- Type-safe permission checking
- Consistent error responses (403 FORBIDDEN)

**Alternatives Considered:**

- Manual checks in each handler: Duplication, error-prone
- Route-level guards only: Too coarse-grained for permission-based access
- Policy engine (OPA, Cedar): Overkill for current requirements

### 6. React Hooks for Frontend Permission Checking

**Decision:** Provide `usePermissions()`, `useRoles()`, `useCanAccess()` hooks

**Rationale:**

- Consistent permission checking across components
- Memoized for performance
- Easy to test and mock
- Integrates with existing auth store

**Alternatives Considered:**

- HOC pattern: More boilerplate, less flexible
- Context-based checks: Harder to compose multiple checks
- Prop drilling: Verbose, error-prone

## Risks / Trade-offs

### [Risk] Performance regression from database lookups on login

**Mitigation:**

- Add database indexes on `user_roles.user_id`, `role_permissions.role_id`
- Use efficient JOINs with proper query planning
- Consider Redis caching for high-traffic tenants (future optimization)
- Monitor login latency metrics post-deployment

### [Risk] Incomplete migration leaves email checks in place

**Mitigation:**

- Automated grep check in CI: `grep -r "endsWith.*@agenticverdict.com"`
- Comprehensive code review checklist
- Feature flag for gradual rollout
- Manual testing protocol for all authorization flows

### [Risk] Role refresh requires re-authentication

**Trade-off:** Users must log out/in to see role changes immediately

**Mitigation:**

- Admin documentation on role assignment workflow
- Future enhancement: JWT invalidation + WebSocket notification
- Acceptable for Phase 1 - role changes are infrequent

### [Risk] Complex permission model confuses developers

**Mitigation:**

- Comprehensive documentation with examples
- TypeScript types provide autocomplete and inline docs
- Code snippets in `/docs/guides/role-management.md`
- Team training session on RBAC patterns

### [Risk] Seed data conflicts in multi-environment setup

**Mitigation:**

- Idempotent seed script (upsert instead of insert)
- System roles marked with `isSystemRole` flag
- Environment-specific seed configurations
- Clear rollback procedure in migration plan

## Migration Plan

### Phase 1: Foundation (Days 1-3)

1. Create database schema files
2. Define TypeScript types
3. Create seed data script
4. Run `pnpm db:generate` and `pnpm db:seed`

### Phase 2: Backend (Days 4-7)

1. Implement RBAC service layer
2. Update auth flow with database role resolution
3. Create tRPC middleware guards
4. Write unit and integration tests

### Phase 3: Frontend (Days 8-10)

1. Implement React permission hooks
2. Update navigation components
3. Remove all email-based checks
4. Update frontend tests

### Phase 4: Validation (Days 11-12)

1. Security audit (grep for email checks)
2. Performance testing
3. Multi-tenant isolation testing
4. End-to-end testing

### Phase 5: Deployment (Day 13)

1. Deploy database migrations
2. Deploy backend services
3. Deploy frontend
4. Monitor logs for authorization errors

### Rollback Strategy

- Database: Drop RBAC tables, revert to previous schema
- Backend: Deploy previous version with email-based checks
- Frontend: Revert navigation components
- Timeline: < 30 minutes for full rollback

## Open Questions

1. **Should we implement role hierarchies in Phase 1?**
   - Decision: No, defer to Phase 2. Current flat model sufficient.

2. **What's the default role for new users?**
   - Decision: `viewer` role with read-only permissions.

3. **How do we handle service accounts?**
   - Decision: Out of scope for Phase 1. Use admin user credentials for now.

4. **Should audit logs be in separate table or event stream?**
   - Decision: Start with database table, migrate to event stream if volume requires.
