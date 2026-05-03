# Multi-Tenant SaaS Architecture: Comprehensive Industry Standards Analysis

**Analysis Date:** 2026-05-02  
**Status:** Critical Architecture Review  
**Scope:** Database Schema, API Design, Frontend Implementation  
**Compliance:** Industry Best Practices for Multi-Tenant SaaS

---

## Executive Summary

This analysis identifies **critical architectural gaps** between the current AgenticVerdict implementation and industry best practices for multi-tenant SaaS platforms serving both direct businesses and agency partners. The findings reveal **fundamental schema design issues** that require immediate refactoring to ensure production readiness, security, and scalability.

**Overall Assessment:** 🔴 **Critical Risk** - Requires immediate architectural remediation

### Key Findings

| Area                        | Status           | Risk Level  | Priority |
| --------------------------- | ---------------- | ----------- | -------- |
| Database Schema             | ❌ Non-compliant | 🔴 Critical | P0       |
| Tenant Type Enforcement     | ❌ Missing       | 🔴 Critical | P0       |
| Tenant Lifecycle Management | ❌ Missing       | 🔴 Critical | P0       |
| API Tenant Context          | ⚠️ Partial       | 🟡 High     | P1       |
| Frontend Tenant Awareness   | ❌ Missing       | 🔴 Critical | P0       |
| RBAC for Agency Partners    | ❌ Missing       | 🟡 High     | P1       |

---

## 1. Business Requirements Compliance Analysis

### 1.1 Business Architecture Requirements

Per `/docs/architecture/business/business-architecture.md` Section 2.1:

> "The platform supports **two tenant types**:
>
> 1. **Direct Business** - End consumer running their own intelligence
> 2. **Agency Partner** - Managing multiple client tenants"

**Per Section 6.2 - Capability Matrix:**

| Capability               | Direct Business | Agency Partner |
| ------------------------ | --------------- | -------------- |
| Create/edit own Insights | ✓               | ✓              |
| Manage data connectors   | ✓               | ✓              |
| View own reports         | ✓               | ✓              |
| Access client tenants    | —               | ✓              |
| Create client Insights   | —               | ✓              |
| View client reports      | —               | ✓              |
| White-label reporting    | —               | ✓ (Phase 2)    |

### 1.2 Tenant Entity Specification Compliance

Per `/docs/architecture/ui/02-system-entities/tenant.md`:

**Required Properties (Section: Core Properties):**

| Property               | Required | Current Status | Gap         |
| ---------------------- | -------- | -------------- | ----------- |
| `tenantId` (UUID)      | ✓        | ✅ Implemented | None        |
| `name` (String)        | ✓        | ✅ Implemented | None        |
| **`type` (Enum)**      | ✓        | ❌ **MISSING** | 🔴 Critical |
| **`status` (Enum)**    | ✓        | ❌ **MISSING** | 🔴 Critical |
| `createdAt` (DateTime) | ✓        | ✅ Implemented | None        |
| `updatedAt` (DateTime) | ✓        | ✅ Implemented | None        |

**Required Properties (Localization):**

| Property                | Required | Current Status          | Gap               |
| ----------------------- | -------- | ----------------------- | ----------------- |
| `localization.language` | ✓        | ⚠️ In TenantConfig only | 🟡 Schema missing |
| `localization.region`   | ✓        | ⚠️ In TenantConfig only | 🟡 Schema missing |
| `localization.timezone` | ✓        | ⚠️ In TenantConfig only | 🟡 Schema missing |
| `localization.currency` | ✓        | ⚠️ In TenantConfig only | 🟡 Schema missing |

**Required Properties (Branding, Features, AI Config, Business):**

- All stored in `TenantConfig` (JSONB) but **NOT in database schema**
- ⚠️ **Risk:** Configuration not queryable, no validation at DB level

### 1.3 Lifecycle States Requirement

Per specification Section "Lifecycle States":

| State          | Required | Current Status   | Gap               |
| -------------- | -------- | ---------------- | ----------------- |
| **ONBOARDING** | ✓        | ❌ **MISSING**   | 🔴 Critical       |
| **ACTIVE**     | ✓        | ⚠️ Implicit only | 🟡 No enforcement |
| **SUSPENDED**  | ✓        | ❌ **MISSING**   | 🔴 Critical       |
| **RESTRICTED** | ✓        | ❌ **MISSING**   | 🔴 Critical       |
| **ARCHIVED**   | ✓        | ❌ **MISSING**   | 🔴 Critical       |
| **DELETED**    | ✓        | ❌ **MISSING**   | 🔴 Critical       |

**Impact:** Cannot enforce state-specific business rules (e.g., blocked insight creation for suspended tenants)

---

## 2. Database Schema Analysis

### 2.1 Current Schema Structure

**File:** `/packages/database/src/schema/tenants.ts`

```typescript
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  active: boolean("active").notNull().default(true), // ⚠️ Oversimplified
  agencyPartnerId: uuid("agency_partner_id").references(() => agencyPartners.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**File:** `/packages/database/src/schema/core/tenants.ts`

```typescript
export const agencyPartners = coreSchema.table("agency_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 2.2 Critical Schema Gaps

#### Gap 2.2.1: Missing Tenant Type Enum

**Industry Standard:** Explicit enum for tenant type at database level

**Current Issue:** Tenant type inferred from `agencyPartnerId` presence

- ❌ No data integrity enforcement
- ❌ Cannot query by tenant type efficiently
- ❌ No validation at database level
- ❌ Ambiguous: Is a tenant with `agencyPartnerId IS NULL` a direct business or an agency partner itself?

**Required Schema:**

```typescript
export const tenantTypeEnum = pgEnum("tenant_type", [
  "direct_business",
  "agency_partner",
  "agency_managed",
]);

export const tenants = pgTable("tenants", {
  // ... existing fields
  type: tenantTypeEnum("type").notNull(), // NEW - EXPLICIT TYPE
  // ...
});
```

**Industry Best Practice Reference:**

- Salesforce: Explicit `OrganizationType` enum
- HubSpot: `AccountType` with CHECK constraints
- Stripe: `AccountType` enum with validation triggers

#### Gap 2.2.2: Missing Tenant Status Lifecycle

**Industry Standard:** Lifecycle state machine with explicit transitions

**Current Issue:** Boolean `active` flag cannot represent:

- Onboarding state (setup incomplete)
- Suspended state (billing/admin action)
- Restricted state (plan downgrade)
- Archived state (voluntary deactivation)
- Deleted state (soft delete for purge)

**Required Schema:**

```typescript
export const tenantStatusEnum = pgEnum("tenant_status", [
  "onboarding",
  "active",
  "suspended",
  "restricted",
  "archived",
  "deleted",
]);

export const tenants = pgTable("tenants", {
  // ... existing fields
  status: tenantStatusEnum("status").notNull().default("onboarding"), // NEW
  suspendedAt: timestamp("suspended_at", { withTimezone: true }), // NEW
  suspendedReason: text("suspended_reason"), // NEW
  archivedAt: timestamp("archived_at", { withTimezone: true }), // NEW
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // NEW (soft delete)
  // ...
});
```

**Industry Best Practice Reference:**

- AWS Organizations: Account status lifecycle
- Shopify: Shop status with soft deletes
- Atlassian: Site lifecycle management

#### Gap 2.2.3: Missing Agency Partner Metadata

**Industry Standard:** Agency partners as first-class entities with metadata

**Current Issue:** `agencyPartners` table lacks:

- Partner tier (Registered, Certified, Elite)
- Commission rate
- Max clients allowed
- White-label enabled flag
- Partner since date
- Certification status

**Required Schema:**

```typescript
export const agencyPartnerTierEnum = pgEnum("agency_partner_tier", [
  "registered",
  "certified",
  "elite",
]);

export const agencyPartners = coreSchema.table("agency_partners", {
  // ... existing fields
  tier: agencyPartnerTierEnum("tier").notNull().default("registered"), // NEW
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"), // NEW
  maxClients: integer("max_clients").default(10), // NEW
  whiteLabelEnabled: boolean("white_label_enabled").default(false), // NEW
  partnerSince: timestamp("partner_since", { withTimezone: true }), // NEW
  certifiedAt: timestamp("certified_at", { withTimezone: true }), // NEW
  // ...
});
```

#### Gap 2.2.4: Configuration Not in Schema

**Industry Standard:** Queryable configuration with validation

**Current Issue:** All tenant configuration in `TenantConfig` (file-based or JSONB)

- ❌ Cannot query tenants by feature flags
- ❌ Cannot enforce localization constraints
- ❌ No validation at database level
- ❌ Configuration drift risk

**Required Schema (Recommended Approach):**

```typescript
// Core tenant properties in main table
export const tenants = pgTable("tenants", {
  // ... identity fields
  type: tenantTypeEnum("type").notNull(),
  status: tenantStatusEnum("status").notNull(),

  // Localization (queryable, validated)
  language: varchar("language", { length: 2 }).notNull().default("en"),
  region: varchar("region", { length: 2 }).notNull().default("US"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),

  // Feature flags (queryable)
  enableInsights: boolean("enable_insights").notNull().default(true),
  enableVerdict: boolean("enable_verdict").notNull().default(true),
  enableReports: boolean("enable_reports").notNull().default(true),
  maxInsights: integer("max_insights").notNull().default(10),
  maxUsers: integer("max_users").notNull().default(5),

  // AI Configuration (queryable)
  aiProvider: varchar("ai_provider", { length: 32 }).notNull().default("anthropic"),
  aiModel: varchar("ai_model", { length: 64 }).notNull().default("claude-3-5-sonnet-20241022"),
  aiQualityLevel: varchar("ai_quality_level", { length: 16 }).notNull().default("standard"),

  // Complex configs still in JSONB
  branding: jsonb("branding").$type<BrandingConfig>(),
  business: jsonb("business").$type<BusinessConfig>(),
});
```

**Industry Best Practice Reference:**

- LaunchDarkly: Feature flags in database for querying
- Auth0: Tenant settings with schema validation
- Vercel: Project configuration with typed JSONB

### 2.3 Proposed Schema Refactoring

**Migration Priority:** P0 (Blocker for Production)

```typescript
-- Step 1: Create enums
CREATE TYPE tenant_type AS ENUM ('direct_business', 'agency_partner', 'agency_managed');
CREATE TYPE tenant_status AS ENUM ('onboarding', 'active', 'suspended', 'restricted', 'archived', 'deleted');
CREATE TYPE agency_partner_tier AS ENUM ('registered', 'certified', 'elite');

-- Step 2: Add columns to tenants table
ALTER TABLE tenants
  ADD COLUMN type tenant_type NOT NULL DEFAULT 'direct_business',
  ADD COLUMN status tenant_status NOT NULL DEFAULT 'onboarding',
  ADD COLUMN language varchar(2) NOT NULL DEFAULT 'en',
  ADD COLUMN region varchar(2) NOT NULL DEFAULT 'US',
  ADD COLUMN timezone varchar(64) NOT NULL DEFAULT 'UTC',
  ADD COLUMN currency varchar(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN enable_insights boolean NOT NULL DEFAULT true,
  ADD COLUMN enable_verdict boolean NOT NULL DEFAULT true,
  ADD COLUMN enable_reports boolean NOT NULL DEFAULT true,
  ADD COLUMN max_insights integer NOT NULL DEFAULT 10,
  ADD COLUMN max_users integer NOT NULL DEFAULT 5,
  ADD COLUMN ai_provider varchar(32) NOT NULL DEFAULT 'anthropic',
  ADD COLUMN ai_model varchar(64) NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  ADD COLUMN ai_quality_level varchar(16) NOT NULL DEFAULT 'standard',
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_reason text,
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN deleted_at timestamptz;

-- Step 3: Migrate existing data
UPDATE tenants
SET type = CASE
  WHEN agency_partner_id IS NOT NULL THEN 'agency_managed'
  WHEN slug LIKE '%agency%' THEN 'agency_partner'
  ELSE 'direct_business'
END;

-- Step 4: Add CHECK constraints
ALTER TABLE tenants
  ADD CONSTRAINT tenants_type_status_valid
  CHECK (
    (type = 'agency_managed' AND agency_partner_id IS NOT NULL) OR
    (type != 'agency_managed' AND agency_partner_id IS NULL)
  );

-- Step 5: Create indexes for common queries
CREATE INDEX idx_tenants_type ON tenants(type);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at) WHERE deleted_at IS NOT NULL;
```

---

## 3. Industry Best Practices Analysis

### 3.1 Multi-Tenant SaaS Architecture Patterns

Based on research from leading SaaS platforms (Salesforce, HubSpot, Stripe, AWS):

#### Pattern 3.1.1: Tenant Hierarchy Model

**Industry Standard:** Three-tier hierarchy for agency model

```
┌─────────────────────────────────────┐
│         Platform (Root)             │
│  - Platform Admin                   │
│  - Global Settings                  │
│  - Agency Partner Management        │
└─────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │                         │
┌───▼────────┐        ┌──────▼────────┐
│   Agency   │        │    Direct     │
│  Partner   │        │   Business    │
│  Tenant    │        │   Tenant      │
└────────────┘        └───────────────┘
         │
    ┌────┴────┬────────────┐
    │         │            │
┌───▼───┐ ┌──▼────┐  ┌────▼────┐
│Client │ │Client │  │ Client  │
│   A   │ │   B   │  │    C    │
└───────┘ └───────┘  └─────────┘
```

**Current Implementation Gap:**

- ❌ No explicit hierarchy in schema
- ❌ Agency partner is separate table, not a tenant type
- ❌ Cannot query "all tenants under agency partner" efficiently

**Recommended Model:**

```typescript
// Self-referential tenant hierarchy
export const tenants = pgTable("tenants", {
  // ... identity fields
  type: tenantTypeEnum("type").notNull(),
  parentTenantId: uuid("parent_tenant_id").references(() => tenants.id), // NEW
  // ...
});

// Agency partner is a tenant with type='agency_partner'
// Client tenants have parentTenantId pointing to agency partner
```

**Benefits:**

- Single table for all tenant types
- Recursive queries for agency hierarchy
- Consistent foreign key relationships
- Simplified RBAC (all users belong to `tenants`)

#### Pattern 3.1.2: Tenant Context Propagation

**Industry Standard:** AsyncLocalStorage for request-scoped tenant context

**Current Implementation:** ✅ **GOOD** - Uses `AsyncLocalStorage` pattern

**File:** `/packages/core/src/tenant-context.ts` (assumed based on imports)

**Enhancement Needed:**

```typescript
interface TenantContext {
  tenantId: string;
  tenantType: TenantType; // ADD
  tenantStatus: TenantStatus; // ADD
  requestId: string;
  userId?: string;
}

// Add validation middleware
function validateTenantContext(context: TenantContext) {
  if (context.tenantStatus === "suspended") {
    throw new TenantSuspendedError();
  }
  if (context.tenantStatus === "deleted") {
    throw new TenantDeletedError();
  }
}
```

#### Pattern 3.1.3: Row-Level Security (RLS)

**Industry Standard:** Database-enforced tenant isolation

**Current Implementation:** ⚠️ **PARTIAL** - Uses `tenantId` in queries

**Gap:** No explicit RLS policies visible in schema

**Recommended:**

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Set tenant context in session
SET app.current_tenant_id = 'uuid-here';
```

**Industry Reference:**

- Supabase: RLS policies on all tables
- Vercel: Database-level tenant scoping
- Clerk: Multi-tenant RLS enforcement

### 3.2 Authentication & Authorization Best Practices

#### Pattern 3.2.1: JWT Claims for Multi-Tenancy

**Industry Standard:** Include tenant metadata in JWT

**Current JWT Payload:**

```typescript
{
  sub: "user-id",
  tenant_id: "tenant-uuid",
  roles: ["admin", "analyst"],
  exp: 1234567890
}
```

**Recommended JWT Payload:**

```typescript
{
  sub: "user-id",
  tenant_id: "tenant-uuid",
  tenant_type: "agency_partner",  // ADD
  tenant_status: "active",  // ADD
  roles: ["admin"],
  permissions: ["insights:create", "connectors:manage"],
  agency_permissions: {  // ADD for agency partners
    can_access_agency_dashboard: true,
    permitted_client_tenants: ["client-a", "client-b"]
  },
  exp: 1234567890
}
```

**Benefits:**

- Frontend can make decisions without API calls
- Reduced latency for capability checks
- Consistent authorization across services

**Industry Reference:**

- Auth0: Custom claims for tenant metadata
- Okta: Groups and permissions in JWT
- AWS Cognito: Custom attributes in tokens

#### Pattern 3.2.2: RBAC for Agency Partners

**Industry Standard:** Extended RBAC for agency hierarchy

**Current RBAC Roles:**

- admin, analyst, editor, viewer (per tenant)

**Missing Agency Roles:**

```typescript
// Agency Partner Specific Roles
export const agencyRoles = {
  AGENCY_OWNER: {
    description: "Full access to agency and all client tenants",
    permissions: ["*"],
  },
  AGENCY_ACCOUNT_MANAGER: {
    description: "Manage assigned client tenants",
    permissions: ["clients:read:assigned", "insights:create:clients", "reports:send:clients"],
  },
  AGENCY_ANALYST: {
    description: "Read-only across all clients",
    permissions: ["clients:read:all", "reports:read:all", "analytics:read:aggregate"],
  },
};
```

**Recommended Schema:**

```typescript
export const agencyRoles = pgTable("agency_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyPartnerId: uuid("agency_partner_id").notNull().references(() => agencyPartners.id),
  name: varchar("name", { length: 128 }).notNull(),
  permissions: jsonb("permissions").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agencyUserRoles = pgTable("agency_user_roles", {
  userId: uuid("user_id").notNull().references(() => users.id),
  agencyRoleId: uuid("agency_role_id").notNull().references(() => agencyRoles.id),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  primaryKey("user_id", "agency_role_id"),
});
```

**Industry Reference:**

- Salesforce: Role hierarchy with inheritance
- HubSpot: Team-based permissions for agencies
- Stripe: Organization roles with granular permissions

---

## 4. API Design Best Practices

### 4.1 Tenant-Aware API Design

**Industry Standard:** Explicit tenant context in all API operations

#### Current API Pattern:

```typescript
// tRPC procedure
export const insightsRouter = t.router({
  list: t.procedure.use(attachTrpcRequestAuth()).query(async ({ ctx }) => {
    const tenantId = ctx.req.auth?.tenantId;
    // ... query insights
  }),
});
```

#### Recommended API Pattern:

```typescript
// Enhanced with tenant type validation
export const insightsRouter = t.router({
  list: t.procedure
    .use(attachTrpcRequestAuth())
    .use(validateTenantActive) // NEW middleware
    .query(async ({ ctx }) => {
      // Tenant context already validated and available
      const { tenantId, tenantType } = ctx.req.auth;

      // Agency-specific logic
      if (tenantType === "agency_partner") {
        // Return agency dashboard data
      }

      // ... query insights
    }),

  // Agency-only procedure
  listClientInsights: t.procedure
    .use(attachTrpcRequestAuth())
    .use(requireAgencyPartner) // NEW middleware
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Validate client belongs to agency
      await validateAgencyClientAccess(ctx.req.auth.tenantId, input.clientId);
      // ... query client insights
    }),
});
```

### 4.2 API Endpoint Organization

**Industry Standard:** Separate endpoints for agency operations

**Recommended Router Structure:**

```typescript
export const appRouter = t.router({
  // Tenant-scoped operations
  insights: insightsRouter,
  connectors: connectorsRouter,
  reports: reportsRouter,

  // Agency operations (separate namespace)
  agency: t.router({
    getPermittedClients: agencyGetClientsRouter,
    getAggregateMetrics: agencyAggregateRouter,
    switchClientContext: agencySwitchClientRouter,
    createClientTenant: agencyCreateClientRouter, // Agency owners only
  }),

  // Platform operations (admin only)
  admin: t.router({
    listTenants: adminListTenantsRouter,
    suspendTenant: adminSuspendTenantRouter,
    manageAgencyPartners: adminAgencyRouter,
  }),
});
```

**Industry Reference:**

- GitHub: `/orgs/{org}/` vs `/user/` endpoints
- Stripe: `/accounts/` vs `/customers/` separation
- Vercel: `/teams/{id}/` vs `/user/` patterns

---

## 5. Frontend Architecture Best Practices

### 5.1 Tenant Type Awareness

**Industry Standard:** Centralized tenant context with type-safe hooks

#### Current Implementation Gap:

```typescript
// ❌ Current: No tenant type
const { tenantId } = useTenant();
```

#### Recommended Implementation:

```typescript
// ✅ Recommended: Full tenant context
interface TenantContext {
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  capabilities: TenantCapabilities;
  branding: BrandingTokens;
}

const tenant = useTenantContext();

// Type-safe capability checks
if (tenant.capabilities.canAccessAgencyDashboard) {
  // Show agency features
}

// Status-based rendering
if (tenant.tenantStatus === 'suspended') {
  return <SuspendedBanner />;
}
```

### 5.2 Feature Flag Architecture

**Industry Standard:** Server-driven feature flags with client caching

**Recommended Implementation:**

```typescript
// Server-side capability resolution
export function getTenantCapabilities(tenant: Tenant): TenantCapabilities {
  return {
    canAccessAgencyDashboard: tenant.type === "agency_partner",
    canManageClientTenants: tenant.type === "agency_partner",
    canCreateInsights: tenant.status === "active" && tenant.features.enableInsights,
    canManageConnectors: tenant.status === "active",
    canViewReports: tenant.status !== "deleted",
    canWhiteLabelReports: tenant.type === "agency_partner" && tenant.features.whiteLabel,
    canSwitchClientContext: tenant.type === "agency_partner",
  };
}

// Client-side hook
export function useCapabilities(): TenantCapabilities {
  const { data: tenant } = useTenantQuery();
  return useMemo(() => getTenantCapabilities(tenant), [tenant]);
}
```

**Industry Reference:**

- LaunchDarkly: Real-time feature flags
- Unleash: Gradual rollouts with tenant scoping
- Firebase Remote Config: Tenant-specific configuration

### 5.3 Route Guard Enhancement

**Current Implementation:** Basic auth state checks

**Recommended Enhancement:**

```typescript
// Enhanced route guard with tenant type
export function createAgencyDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  return async function agencyDashboardBeforeLoad(ctx) {
    const auth = await fetchProtectedRouteSession(ctx);

    // Check tenant type
    if (auth.tenantType !== "agency_partner") {
      throw redirect({ to: "/dashboard" });
    }

    // Check tenant status
    if (auth.tenantStatus !== "active") {
      throw redirect({ to: "/account/suspended" });
    }

    // Check specific permission
    if (!auth.permissions.includes("agency:access_dashboard")) {
      throw redirect({ to: "/dashboard" });
    }
  };
}
```

---

## 6. Security & Compliance Best Practices

### 6.1 Tenant Isolation Security

**Industry Standard:** Defense in depth for tenant isolation

| Layer       | Current           | Recommended            |
| ----------- | ----------------- | ---------------------- |
| Application | ✅ Tenant context | Add type validation    |
| API         | ⚠️ Manual checks  | Middleware enforcement |
| Database    | ⚠️ Query scoping  | RLS policies           |
| Network     | ✅ tRPC headers   | Add tenant signature   |

**Recommended Security Enhancements:**

1. **Database-Level RLS:**

```sql
-- All tenant-scoped tables
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_insights ON insights
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

2. **API Middleware:**

```typescript
// Automatic tenant context validation
export function requireActiveTenant() {
  return middleware(async ({ ctx, next }) => {
    const tenant = await getTenant(ctx.auth.tenantId);

    if (tenant.status !== "active") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tenant is not active",
      });
    }

    return next({
      ctx: { ...ctx, tenant },
    });
  });
}
```

3. **Audit Logging:**

```typescript
// Log all cross-tenant operations
await auditLog.create({
  tenantId: ctx.tenantId,
  userId: ctx.userId,
  action: "TENANT_CONTEXT_SWITCH",
  metadata: {
    fromTenantId: previousTenantId,
    toTenantId: newTenantId,
    agencyPartnerId: ctx.auth.tenantId,
  },
});
```

### 6.2 Data Privacy & Compliance

**Industry Standard:** Tenant-level data governance

**Required Enhancements:**

1. **Data Retention Policies:**

```typescript
// Per-tenant retention configuration
export const tenants = pgTable("tenants", {
  // ... fields
  dataRetentionDays: integer("data_retention_days").default(90),
  gdprCompliant: boolean("gdpr_compliant").default(true),
  dataProcessingRegion: varchar("data_processing_region", { length: 32 }).default("us-east-1"),
});
```

2. **Right to Erasure:**

```typescript
// Soft delete with purge schedule
export async function deleteTenant(tenantId: string) {
  await db
    .update(tenants)
    .set({
      status: "deleted",
      deletedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  // Schedule purge after retention period
  await purgeJobs.create({
    tenantId,
    scheduledAt: addDays(new Date(), 30), // 30-day grace period
  });
}
```

3. **Data Export:**

```typescript
// GDPR-compliant data export
export async function exportTenantData(tenantId: string) {
  const tables = ["users", "insights", "connectors", "reports"];
  const exports = {};

  for (const table of tables) {
    exports[table] = await db.select().from(table).where(eq(table.tenantId, tenantId));
  }

  return exports;
}
```

---

## 7. Implementation Priority Matrix

### P0 - Critical (Block Production)

| Task                               | Effort     | Risk    | Dependencies   |
| ---------------------------------- | ---------- | ------- | -------------- |
| Add `type` enum to tenants table   | 1 day      | 🔴 High | None           |
| Add `status` enum to tenants table | 1 day      | 🔴 High | None           |
| Add tenant type to JWT/session     | 1 day      | 🔴 High | Schema change  |
| Update frontend auth store         | 1 day      | 🔴 High | Session change |
| Implement route guards             | 2 days     | 🔴 High | Frontend store |
| **Total**                          | **6 days** |         |                |

### P1 - High (Required for Launch)

| Task                        | Effort     | Risk      | Dependencies    |
| --------------------------- | ---------- | --------- | --------------- |
| Add localization to schema  | 1 day      | 🟡 Medium | None            |
| Add feature flags to schema | 1 day      | 🟡 Medium | None            |
| Implement RLS policies      | 2 days     | 🟡 Medium | Schema changes  |
| Add agency partner metadata | 1 day      | 🟡 Medium | None            |
| Create agency RBAC roles    | 2 days     | 🟡 Medium | Agency metadata |
| Implement capability system | 2 days     | 🟡 Medium | Tenant type     |
| **Total**                   | **9 days** |           |                 |

### P2 - Medium (Post-Launch)

| Task                    | Effort      | Risk   | Dependencies    |
| ----------------------- | ----------- | ------ | --------------- |
| White-label branding    | 3 days      | 🟢 Low | Agency metadata |
| Agency hierarchy model  | 3 days      | 🟢 Low | Schema refactor |
| Advanced audit logging  | 2 days      | 🟢 Low | None            |
| Data retention policies | 2 days      | 🟢 Low | Status enum     |
| **Total**               | **10 days** |        |                 |

---

## 8. Migration Strategy

### Phase 1: Schema Migration (Week 1)

```sql
-- Transactional migration
BEGIN;

-- 1. Create enums
CREATE TYPE tenant_type AS ENUM (...);
CREATE TYPE tenant_status AS ENUM (...);

-- 2. Add columns
ALTER TABLE tenants ADD COLUMN type tenant_type ...;
ALTER TABLE tenants ADD COLUMN status tenant_status ...;

-- 3. Migrate data
UPDATE tenants SET type = ... WHERE ...;

-- 4. Add constraints
ALTER TABLE tenants ADD CONSTRAINT ... CHECK (...);

-- 5. Update application (deploy with feature flag)

-- 6. Remove old columns (after validation)
-- ALTER TABLE tenants DROP COLUMN active;

COMMIT;
```

### Phase 2: Application Updates (Week 2)

1. Update database schema files
2. Update auth/session handling
3. Update frontend tenant context
4. Deploy with feature flag

### Phase 3: Validation & Rollout (Week 3)

1. Monitor error rates
2. Validate tenant isolation
3. Gradual rollout (10% → 50% → 100%)
4. Remove feature flag

---

## 9. Testing Strategy

### Unit Tests

```typescript
// Tenant type enforcement
describe("TenantType", () => {
  it("should enforce valid tenant types", () => {
    expect(() => createTenant({ type: "invalid" })).toThrow("Invalid tenant type");
  });

  it("should set correct capabilities for agency_partner", () => {
    const tenant = createTenant({ type: "agency_partner" });
    expect(tenant.capabilities.canAccessAgencyDashboard).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Tenant isolation
describe("Tenant Isolation", () => {
  it("should prevent cross-tenant data access", async () => {
    const tenantA = await createTenant();
    const tenantB = await createTenant();

    const insightsA = await getInsights(tenantA.id);
    expect(insightsA.every((i) => i.tenantId === tenantA.id)).toBe(true);
  });
});
```

### E2E Tests

```typescript
// Agency workflow
describe("Agency Partner Flow", () => {
  it("should allow agency to switch client contexts", async () => {
    const agency = await createAgencyPartner();
    const clientA = await createClientTenant(agency.id);
    const clientB = await createClientTenant(agency.id);

    await switchToClient(clientA.id);
    expect(await getCurrentTenant()).toBe(clientA.id);

    await switchToClient(clientB.id);
    expect(await getCurrentTenant()).toBe(clientB.id);
  });
});
```

---

## 10. Conclusion & Recommendations

### Critical Findings

1. **Schema Design Gap:** Missing `type` and `status` enums violate business architecture specification
2. **Security Risk:** No database-level tenant isolation (RLS) enforcement
3. **Missing Lifecycle:** Cannot enforce state-specific business rules
4. **Frontend Gap:** No tenant type awareness for capability-based rendering

### Immediate Actions Required

1. **Schema Migration (P0):** Add `type` and `status` enums to tenants table
2. **Session Enhancement (P0):** Include tenant type and status in JWT
3. **Frontend Update (P0):** Implement tenant type awareness and capability system
4. **Route Guards (P0):** Add tenant type and status validation

### Long-Term Recommendations

1. **Adopt Hierarchy Model:** Refactor to self-referential tenant hierarchy
2. **Implement RLS:** Database-level tenant isolation
3. **Enhance RBAC:** Agency-specific roles and permissions
4. **Add Audit Logging:** Comprehensive tenant action tracking

### Risk Mitigation

- **Migration Risk:** Use feature flags for gradual rollout
- **Data Loss Risk:** Comprehensive backup before migration
- **Downtime Risk:** Zero-downtime migration strategy
- **Compatibility Risk:** Maintain backward compatibility during transition

---

**Next Steps:** See `/prompts/frontend-account-types-remediation-plan-updated.md` for detailed implementation tasks with code examples.

**Review Required:** Architecture team approval needed before schema migration begins.

**Estimated Total Effort:** 25 days (5 weeks with parallel work streams)
