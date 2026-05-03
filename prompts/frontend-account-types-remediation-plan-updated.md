# Multi-Tenant Architecture Implementation Plan

**Created:** 2026-05-02  
**Priority:** P0 - Production Blocker  
**Estimated Effort:** 20 days (4 weeks)  
**Status:** Awaiting Architecture Approval  
**Greenfield:** Destructive approach - no backward compatibility required

---

## Executive Summary

This implementation plan incorporates **industry best practices** for multi-tenant SaaS platforms and ensures **100% alignment** with AgenticVerdict business architecture requirements. The plan implements a clean database schema with proper tenant lifecycle management and enterprise-grade tenant isolation.

### Key Implementation Decisions

1. **Schema-First Approach:** Database schema includes explicit `type` and `status` enums
2. **Lifecycle Management:** Full tenant state machine implementation
3. **RLS Enforcement:** Database-level tenant isolation
4. **Agency Hierarchy:** Self-referential tenant model for better querying
5. **Enhanced RBAC:** Agency-specific roles and permissions

---

## Architecture Decision Record

### ADR-001: Tenant Type Representation

**Decision:** Use explicit database enum for tenant type

**Alternatives Considered:**

1. ❌ Infer from `agencyPartnerId` (current) - Ambiguous, no validation
2. ❌ Separate tables per type - Complex queries, maintenance burden
3. ✅ **Single table with enum** - Clear, queryable, validated

**Rationale:**

- Industry standard (Salesforce, HubSpot, Stripe)
- Database-level validation
- Efficient querying by type
- Clear data integrity

### ADR-002: Tenant Lifecycle Management

**Decision:** Implement explicit status enum with state transitions

**States:** `onboarding` → `active` → `suspended`/`restricted`/`archived` → `deleted`

**Rationale:**

- Enforce business rules per state
- Support soft deletes with purge schedule
- Compliance with data retention policies
- Audit trail for state changes

### ADR-003: Tenant Hierarchy Model

**Decision:** Self-referential tenant table with `parentTenantId`

**Rationale:**

- Unified tenant model (agency partner is a tenant type)
- Simplified RBAC (all users belong to `tenants` table)
- Recursive queries for agency hierarchy
- Consistent foreign key relationships

---

## Phase 1: Database Schema Implementation (Days 1-3)

### Task 1.1: Create Tenant Type Enum

**File:** `packages/database/src/schema/tenants.ts`

```typescript
import {
  pgEnum,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  pgTable,
} from "drizzle-orm/pg-core";

// NEW: Tenant type enum
export const tenantTypeEnum = pgEnum("tenant_type", [
  "direct_business",
  "agency_partner",
  "agency_managed",
]);

// NEW: Tenant status enum
export const tenantStatusEnum = pgEnum("tenant_status", [
  "onboarding",
  "active",
  "suspended",
  "restricted",
  "archived",
  "deleted",
]);

// NEW: Agency partner tier enum
export const agencyPartnerTierEnum = pgEnum("agency_partner_tier", [
  "registered",
  "certified",
  "elite",
]);

export const tenants = pgTable("tenants", {
  // Identity
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),

  // Explicit type and status
  type: tenantTypeEnum("type").notNull().default("direct_business"),
  status: tenantStatusEnum("status").notNull().default("onboarding"),

  // Hierarchy
  parentTenantId: uuid("parent_tenant_id").references(() => tenants.id, { onDelete: "set null" }),
  agencyPartnerId: uuid("agency_partner_id").references(() => agencyPartners.id, {
    onDelete: "set null",
  }),

  // Localization
  language: varchar("language", { length: 2 }).notNull().default("en"),
  region: varchar("region", { length: 2 }).notNull().default("US"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),

  // Feature flags
  enableInsights: boolean("enable_insights").notNull().default(true),
  enableVerdict: boolean("enable_verdict").notNull().default(true),
  enableReports: boolean("enable_reports").notNull().default(true),
  maxInsights: integer("max_insights").notNull().default(10),
  maxUsers: integer("max_users").notNull().default(5),
  whiteLabelEnabled: boolean("white_label_enabled").default(false),

  // AI Configuration
  aiProvider: varchar("ai_provider", { length: 32 }).notNull().default("anthropic"),
  aiModel: varchar("ai_model", { length: 64 }).notNull().default("claude-3-5-sonnet-20241022"),
  aiQualityLevel: varchar("ai_quality_level", { length: 16 }).notNull().default("standard"),
  aiCustomizationLevel: varchar("ai_customization_level", { length: 16 })
    .notNull()
    .default("balanced"),

  // Lifecycle tracking
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspendedReason: text("suspended_reason"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Complex configurations remain in JSONB
export const agencyPartners = coreSchema.table("agency_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),

  // Agency metadata
  tier: agencyPartnerTierEnum("tier").notNull().default("registered"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
  maxClients: integer("max_clients").default(10),
  whiteLabelEnabled: boolean("white_label_enabled").default(false),
  partnerSince: timestamp("partner_since", { withTimezone: true }),
  certifiedAt: timestamp("certified_at", { withTimezone: true }),

  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Acceptance Criteria:**

- [ ] Enums created in database
- [ ] Columns created with proper defaults
- [ ] Indexes created for performance
- [ ] Constraints enforce data integrity
- [ ] Drizzle schema updated
- [ ] Type definitions exported

**Estimated Effort:** 1 day

---

### Task 1.2: Implement Row-Level Security (RLS)

**File:** `packages/database/migrations/001_rls_policies.sql`

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.insight_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Allow users to see their own user record even when switching contexts
CREATE POLICY users_self_read ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id')::uuid);

-- RLS for tenant_connectors
CREATE POLICY tenant_isolation_connectors ON tenant_connectors
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for insights
CREATE POLICY tenant_isolation_insights ON core.insights
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for reports
CREATE POLICY tenant_isolation_reports ON reports
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS for report_templates
CREATE POLICY tenant_isolation_templates ON report_templates
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Agency partner access to client tenants
-- This policy allows agency partners to access their client tenant data
CREATE POLICY agency_client_access_insights ON core.insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = core.insights.tenant_id
        AND t.parent_tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );
```

**File:** `packages/database/src/lib/rls-context.ts`

```typescript
import { Database } from "../client";

/**
 * Sets tenant context for RLS policies
 * Must be called at the start of each request
 */
export async function setTenantContext(
  db: Database,
  tenantId: string,
  userId?: string,
): Promise<void> {
  await db.execute(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);

  if (userId) {
    await db.execute(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
  }
}

/**
 * Clear tenant context after request completes
 */
export async function clearTenantContext(db: Database): Promise<void> {
  await db.execute(`SELECT set_config('app.current_tenant_id', NULL, true)`);
  await db.execute(`SELECT set_config('app.current_user_id', NULL, true)`);
}
```

**Acceptance Criteria:**

- [ ] RLS enabled on all tenant-scoped tables
- [ ] Policies created for each table
- [ ] Agency access policies implemented
- [ ] Context setting functions implemented
- [ ] Integration with tenant context system
- [ ] Tests for RLS enforcement

**Estimated Effort:** 1 day

---

### Task 1.3: Create Type Definitions

**File:** `packages/types/src/tenant.ts`

```typescript
import { z } from "zod";

// Tenant type enum
export const tenantTypeSchema = z.enum(["direct_business", "agency_partner", "agency_managed"]);
export type TenantType = z.infer<typeof tenantTypeSchema>;

// Tenant status enum
export const tenantStatusSchema = z.enum([
  "onboarding",
  "active",
  "suspended",
  "restricted",
  "archived",
  "deleted",
]);
export type TenantStatus = z.infer<typeof tenantStatusSchema>;

// Agency partner tier
export const agencyPartnerTierSchema = z.enum(["registered", "certified", "elite"]);
export type AgencyPartnerTier = z.infer<typeof agencyPartnerTierSchema>;

// Localization config
export const tenantLocalizationSchema = z.object({
  language: z.string().length(2),
  region: z.string().length(2),
  timezone: z.string(),
  currency: z.string().length(3),
});
export type TenantLocalization = z.infer<typeof tenantLocalizationSchema>;

// Feature flags
export const tenantFeaturesSchema = z.object({
  enableInsights: z.boolean(),
  enableVerdict: z.boolean(),
  enableReports: z.boolean(),
  maxInsights: z.number().int().positive(),
  maxUsers: z.number().int().positive(),
  whiteLabelEnabled: z.boolean(),
});
export type TenantFeatures = z.infer<typeof tenantFeaturesSchema>;

// AI configuration
export const tenantAIConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string(),
  qualityLevel: z.enum(["standard", "premium"]),
  customizationLevel: z.enum(["balanced", "creative", "precise"]),
});
export type TenantAIConfig = z.infer<typeof tenantAIConfigSchema>;

// Complete tenant schema
export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(256),
  slug: z.string().min(1).max(128),
  type: tenantTypeSchema,
  status: tenantStatusSchema,
  parentTenantId: z.string().uuid().nullable().optional(),
  agencyPartnerId: z.string().uuid().nullable().optional(),
  localization: tenantLocalizationSchema,
  features: tenantFeaturesSchema,
  aiConfig: tenantAIConfigSchema,
  suspendedAt: z.string().datetime().nullable().optional(),
  suspendedReason: z.string().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Tenant = z.infer<typeof tenantSchema>;

// Agency partner schema
export const agencyPartnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  tier: agencyPartnerTierSchema,
  commissionRate: z.number().positive().max(100),
  maxClients: z.number().int().positive(),
  whiteLabelEnabled: z.boolean(),
  partnerSince: z.string().datetime().nullable().optional(),
  certifiedAt: z.string().datetime().nullable().optional(),
  settings: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type AgencyPartner = z.infer<typeof agencyPartnerSchema>;

// Tenant capabilities (computed)
export const tenantCapabilitiesSchema = z.object({
  canAccessAgencyDashboard: z.boolean(),
  canManageClientTenants: z.boolean(),
  canCreateInsights: z.boolean(),
  canManageConnectors: z.boolean(),
  canViewReports: z.boolean(),
  canWhiteLabelReports: z.boolean(),
  canSwitchClientContext: z.boolean(),
});
export type TenantCapabilities = z.infer<typeof tenantCapabilitiesSchema>;
```

**Acceptance Criteria:**

- [ ] All tenant types exported from `@agenticverdict/types`
- [ ] Zod schemas for validation
- [ ] TypeScript types for type safety
- [ ] Auth types updated with tenant metadata
- [ ] Documentation for each type

**Estimated Effort:** 1 day

---

## Phase 2: Backend Implementation (Days 4-8)

### Task 2.1: Create Tenant Context System

**File:** `packages/core/src/tenant-context.ts`

```typescript
import { Tenant, TenantType, TenantStatus, TenantCapabilities } from "@agenticverdict/types";

export interface TenantContext {
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  requestId: string;
  userId?: string;
  config: TenantConfig;
}

/**
 * Validate tenant context before allowing operations
 */
export function validateTenantContext(context: TenantContext): void {
  // Check tenant status
  if (context.tenantStatus === "deleted") {
    throw new TenantDeletedError(context.tenantId);
  }

  if (context.tenantStatus === "suspended") {
    throw new TenantSuspendedError(context.tenantId);
  }

  // Validate tenant type matches expected type for operation
  // (can be called with expected type from service layer)
}

/**
 * Get tenant capabilities based on type and status
 */
export function getTenantCapabilities(tenant: Tenant): TenantCapabilities {
  const isActive = tenant.status === "active";

  switch (tenant.type) {
    case "agency_partner":
      return {
        canAccessAgencyDashboard: isActive,
        canManageClientTenants: isActive,
        canCreateInsights: isActive && tenant.features.enableInsights,
        canManageConnectors: isActive,
        canViewReports: isActive && tenant.features.enableReports,
        canWhiteLabelReports: isActive && tenant.features.whiteLabelEnabled,
        canSwitchClientContext: isActive,
      };

    case "agency_managed":
    case "direct_business":
    default:
      return {
        canAccessAgencyDashboard: false,
        canManageClientTenants: false,
        canCreateInsights: isActive && tenant.features.enableInsights,
        canManageConnectors: isActive,
        canViewReports: isActive && tenant.features.enableReports,
        canWhiteLabelReports: false,
        canSwitchClientContext: false,
      };
  }
}

/**
 * Error classes for tenant state violations
 */
export class TenantSuspendedError extends Error {
  constructor(tenantId: string) {
    super(`Tenant ${tenantId} is suspended`);
    this.name = "TenantSuspendedError";
  }
}

export class TenantDeletedError extends Error {
  constructor(tenantId: string) {
    super(`Tenant ${tenantId} has been deleted`);
    this.name = "TenantDeletedError";
  }
}

export class TenantTypeMismatchError extends Error {
  constructor(expected: TenantType, actual: TenantType) {
    super(`Expected tenant type ${expected} but got ${actual}`);
    this.name = "TenantTypeMismatchError";
  }
}
```

**Acceptance Criteria:**

- [ ] Tenant context includes type and status
- [ ] Validation function implemented
- [ ] Capability resolution implemented
- [ ] Error classes for state violations
- [ ] Unit tests for all scenarios

**Estimated Effort:** 1 day

---

### Task 2.2: Create Authentication System

**File:** `apps/api/src/lib/auth-session-jwt.ts`

```typescript
import { TenantType, TenantStatus } from "@agenticverdict/types";

export async function signSessionAccessToken(params: {
  userId: string;
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  rememberMe: boolean;
  secret: string;
  roles: string[];
  permissions?: string[];
}): Promise<{ token: string; maxAgeSeconds: number }> {
  const maxAgeSeconds = params.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day

  const payload = {
    sub: params.userId,
    tenant_id: params.tenantId,
    tenant_type: params.tenantType,
    tenant_status: params.tenantStatus,
    roles: params.roles,
    permissions: params.permissions ?? [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));

  return { token, maxAgeSeconds };
}
```

**File:** `apps/api/src/middleware/auth.ts`

```typescript
import { TenantType, TenantStatus } from "@agenticverdict/types";

export interface AuthPayload {
  userId: string;
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  roles: string[];
  permissions: string[];
}

export async function verifyBearerSessionFromRequest(
  request: FastifyRequest,
): Promise<{ auth: AuthPayload; sessionExpiresAt: string | null } | null> {
  // ... existing token extraction logic ...

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    const payload = verified.payload as Record<string, unknown>;

    const sub = typeof payload.sub === "string" ? payload.sub : undefined;
    const tenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
    const tenantType =
      typeof payload.tenant_type === "string" ? (payload.tenant_type as TenantType) : undefined;
    const tenantStatus =
      typeof payload.tenant_status === "string"
        ? (payload.tenant_status as TenantStatus)
        : undefined;
    const rolesRaw = payload.roles;
    const permissionsRaw = payload.permissions;

    const roles = Array.isArray(rolesRaw)
      ? rolesRaw.filter((r): r is string => typeof r === "string")
      : [];
    const permissions = Array.isArray(permissionsRaw)
      ? permissionsRaw.filter((p): p is string => typeof p === "string")
      : [];

    if (!sub || !tenantId || !tenantType || !tenantStatus) {
      return null;
    }

    const sessionExpiresAt =
      typeof verified.payload.exp === "number"
        ? new Date(verified.payload.exp * 1000).toISOString()
        : null;

    return {
      auth: {
        userId: sub,
        tenantId,
        tenantType,
        tenantStatus,
        roles,
        permissions,
      },
      sessionExpiresAt,
    };
  } catch {
    return null;
  }
}
```

**Acceptance Criteria:**

- [ ] JWT includes tenant type and status
- [ ] Middleware extracts and validates new claims
- [ ] Auth payload updated with new fields
- [ ] Unit tests for JWT signing and verification

**Estimated Effort:** 1 day

---

### Task 2.3: Create Auth Router

**File:** `apps/api/src/trpc/routers/auth.ts`

```typescript
import { TenantType } from "@agenticverdict/types";
import { tenants, agencyPartners } from "@agenticverdict/database";

// mapUserRow function
async function mapUserRow(
  row: typeof users.$inferSelect,
  db: ReturnType<typeof getTrpcDatabase>,
): Promise<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: string;
  roles: string[];
  permissions: Permission[];
}> {
  // Get tenant with type and status
  const tenantRows = await db
    .select({
      tenant: tenants,
      agencyPartner: agencyPartners,
    })
    .from(tenants)
    .leftJoin(agencyPartners, eq(tenants.agencyPartnerId, agencyPartners.id))
    .where(eq(tenants.id, row.tenantId))
    .limit(1);

  const tenantData = tenantRows[0];
  if (!tenantData) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tenant not found",
    });
  }

  const tenantType: TenantType = tenantData.tenant.type;

  const roles = await resolveUserRoles(row.id, row.tenantId);
  const permissions = await resolveUserPermissions(row.id, row.tenantId);

  return {
    id: row.id,
    email: row.email,
    firstName: row.displayName?.split(" ")[0] ?? "User",
    lastName: row.displayName?.split(" ").slice(1).join(" ") ?? "",
    emailVerified: row.emailVerified,
    tenantId: row.tenantId,
    tenantType,
    tenantStatus: tenantData.tenant.status,
    roles,
    permissions: permissions as Permission[],
  };
}

// Update getSession procedure
export const authRouter = t.router({
  getSession: publicProcedure.output(getSessionOutputSchema).query(async ({ ctx }) => {
    const session = await verifyBearerSessionFromRequest(ctx.req);
    if (!session) {
      return { user: null, sessionExpiresAt: null };
    }

    const db = getTrpcDatabase();
    if (db) {
      return dbScoped(db, async (tx) => {
        const rows = await tx
          .select()
          .from(users)
          .where(and(eq(users.id, session.auth.userId), eq(users.tenantId, session.auth.tenantId)))
          .limit(1);

        const row = rows[0];
        if (!row) {
          return { user: null, sessionExpiresAt: null };
        }

        return {
          user: await mapUserRow(row, db),
          sessionExpiresAt: session.sessionExpiresAt,
        };
      });
    }

    // Fallback when database unavailable
    return {
      user: {
        id: session.auth.userId,
        email: "unknown@tenant.local",
        firstName: "User",
        lastName: "",
        emailVerified: true,
        tenantId: session.auth.tenantId,
        tenantType: session.auth.tenantType,
        tenantStatus: session.auth.tenantStatus,
        roles: session.auth.roles,
        permissions: session.auth.permissions,
      },
      sessionExpiresAt: session.sessionExpiresAt,
    };
  }),

  // ... rest of auth router
});
```

**Acceptance Criteria:**

- [ ] getSession returns tenant type and status
- [ ] mapUserRow queries tenant with type/status
- [ ] Type-safe tenant type handling
- [ ] Integration tests for session endpoint

**Estimated Effort:** 1 day

---

### Task 2.4: Create Agency Router

**File:** `apps/api/src/trpc/routers/agency.ts`

```typescript
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { tenants, agencyPartners } from "@agenticverdict/database";
import { t } from "../init";
import { getTrpcDatabase } from "../database";

// Middleware to require agency partner tenant
export const requireAgencyPartner = t.middleware(async ({ ctx, next }) => {
  if (!ctx.req.auth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (ctx.req.auth.tenantType !== "agency_partner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only agency partners can access this resource",
    });
  }

  if (ctx.req.auth.tenantStatus !== "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Agency partner account is not active",
    });
  }

  return next({
    ctx: { ...ctx, agencyPartnerId: ctx.req.auth.tenantId },
  });
});

// Middleware to validate client tenant access
export const validateClientAccess = t.middleware(async ({ ctx, input, next }) => {
  const db = getTrpcDatabase();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database unavailable",
    });
  }

  const { clientId } = input as { clientId: string };
  const agencyPartnerId = ctx.req.auth?.tenantId;

  // Verify client belongs to agency
  const client = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.id, clientId), eq(tenants.agencyPartnerId, agencyPartnerId)))
    .limit(1);

  if (client.length === 0) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied to this client tenant",
    });
  }

  return next({
    ctx: { ...ctx, clientId },
  });
});

export const agencyRouter = t.router({
  /**
   * Get list of permitted client tenants for agency partner
   */
  getPermittedClients: t.procedure.use(requireAgencyPartner).query(async ({ ctx }) => {
    const db = getTrpcDatabase();
    if (!db) return [];

    const clients = await db
      .select({
        clientId: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
        insightCount: db.$count(core.insights, eq(core.insights.tenantId, tenants.id)),
        connectorCount: db.$count(tenant_connectors, eq(tenant_connectors.tenantId, tenants.id)),
      })
      .from(tenants)
      .where(eq(tenants.agencyPartnerId, ctx.agencyPartnerId))
      .orderBy(tenants.name);

    return clients;
  }),

  /**
   * Get aggregate metrics across all client tenants
   */
  getAggregateMetrics: t.procedure
    .use(requireAgencyPartner)
    .input(
      z.object({
        dateRange: z.object({
          start: z.string().datetime(),
          end: z.string().datetime(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getTrpcDatabase();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      // Get all client tenant IDs
      const clientTenants = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.agencyPartnerId, ctx.agencyPartnerId));

      const clientIds = clientTenants.map((c) => c.id);

      // Aggregate metrics
      const totalInsights = await db.$count(
        core.insights,
        and(
          eq(core.insights.tenantId, clientIds[0]), // Simplified - would use IN clause
          eq(core.insights.enabled, true),
        ),
      );

      const totalConnectors = await db.$count(
        tenant_connectors,
        eq(tenant_connectors.tenantId, clientIds[0]),
      );

      return {
        clientCount: clientTenants.length,
        totalInsights,
        totalConnectors,
        activeInsights: totalInsights, // Would filter by active
      };
    }),

  /**
   * Switch context to a client tenant
   */
  switchClientContext: t.procedure
    .use(requireAgencyPartner)
    .input(
      z.object({
        clientId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getTrpcDatabase();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      // Validate client belongs to agency
      const client = await db
        .select()
        .from(tenants)
        .where(
          and(eq(tenants.id, input.clientId), eq(tenants.agencyPartnerId, ctx.agencyPartnerId)),
        )
        .limit(1);

      if (client.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied to this client tenant",
        });
      }

      // Return client tenant context
      return {
        tenantId: input.clientId,
        tenantName: client[0].name,
        tenantSlug: client[0].slug,
      };
    }),

  /**
   * Create a new client tenant (agency owners only)
   */
  createClientTenant: t.procedure
    .use(requireAgencyPartner)
    .input(
      z.object({
        name: z.string().min(2).max(256),
        slug: z.string().min(1).max(128),
        adminEmail: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getTrpcDatabase();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      // Check agency client limit
      const agency = await db
        .select()
        .from(agencyPartners)
        .where(eq(agencyPartners.id, ctx.agencyPartnerId))
        .limit(1);

      const currentClientCount = await db
        .select({ count: db.$count(tenants) })
        .from(tenants)
        .where(eq(tenants.agencyPartnerId, ctx.agencyPartnerId));

      if (currentClientCount[0].count >= (agency[0]?.maxClients ?? 10)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Maximum client limit reached",
        });
      }

      // Create client tenant
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: input.name,
          slug: input.slug,
          type: "agency_managed",
          status: "onboarding",
          agencyPartnerId: ctx.agencyPartnerId,
        })
        .returning();

      return {
        tenantId: newTenant.id,
        slug: newTenant.slug,
        status: newTenant.status,
      };
    }),
});
```

**Acceptance Criteria:**

- [ ] Agency router with all endpoints
- [ ] Middleware for agency partner validation
- [ ] Client access validation
- [ ] Aggregate metrics endpoint
- [ ] Client tenant creation
- [ ] Integration tests for all endpoints

**Estimated Effort:** 3 days

---

## Phase 3: Frontend Implementation (Days 9-15)

### Task 3.1: Create Frontend Type Definitions

**File:** `apps/frontend/src/types/tenant.ts`

```typescript
export type TenantType = "direct_business" | "agency_partner" | "agency_managed";
export type TenantStatus =
  | "onboarding"
  | "active"
  | "suspended"
  | "restricted"
  | "archived"
  | "deleted";

export interface TenantCapabilities {
  canAccessAgencyDashboard: boolean;
  canManageClientTenants: boolean;
  canCreateInsights: boolean;
  canManageConnectors: boolean;
  canViewReports: boolean;
  canWhiteLabelReports: boolean;
  canSwitchClientContext: boolean;
}

export interface TenantContext {
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  capabilities: TenantCapabilities;
}
```

**Acceptance Criteria:**

- [ ] Type definitions match backend
- [ ] Capabilities interface defined
- [ ] Exported for use throughout app

**Estimated Effort:** 0.5 days

---

### Task 3.2: Create Auth Store

**File:** `apps/frontend/src/stores/auth-store.ts`

```typescript
import type { Permission, TenantType, TenantStatus } from "@agenticverdict/types";

export type UserInfo = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  emailVerified: boolean;
  roles: string[];
  permissions: Permission[];
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
};

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  tenantId: string | null;
  tenantType: TenantType | null;
  tenantStatus: TenantStatus | null;
  isLoading: boolean;
  error: AuthError | null;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  tenantId: null,
  tenantType: null,
  tenantStatus: null,
  isLoading: false,
  error: null,
};

// setAuth action
export const authActions = {
  setAuth: (
    isAuthenticated: boolean,
    user?: UserInfo,
    tenantId?: string,
    tenantType?: TenantType,
    tenantStatus?: TenantStatus,
  ) => {
    authStore.setState((prev: AuthState) => ({
      ...prev,
      isAuthenticated,
      user: user ?? null,
      tenantId: tenantId ?? null,
      tenantType: tenantType ?? null,
      tenantStatus: tenantStatus ?? null,
      error: null,
    }));
  },

  // ... rest of actions
};
```

**Acceptance Criteria:**

- [ ] Auth store tracks tenant type and status
- [ ] setAuth updated with new parameters
- [ ] Initial state includes new fields
- [ ] Type-safe throughout

**Estimated Effort:** 0.5 days

---

### Task 3.3: Create Tenant Type Hook

**File:** `apps/frontend/src/hooks/useTenantType.ts`

```typescript
import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import type { TenantType, TenantStatus, TenantCapabilities } from "@/types/tenant";

/**
 * Compute tenant capabilities based on type and status
 */
function computeCapabilities(
  tenantType: TenantType | null,
  tenantStatus: TenantStatus | null,
): TenantCapabilities {
  const isActive = tenantStatus === "active";

  switch (tenantType) {
    case "agency_partner":
      return {
        canAccessAgencyDashboard: isActive,
        canManageClientTenants: isActive,
        canCreateInsights: isActive,
        canManageConnectors: isActive,
        canViewReports: isActive,
        canWhiteLabelReports: isActive,
        canSwitchClientContext: isActive,
      };

    case "agency_managed":
    case "direct_business":
    default:
      return {
        canAccessAgencyDashboard: false,
        canManageClientTenants: false,
        canCreateInsights: isActive,
        canManageConnectors: isActive,
        canViewReports: isActive,
        canWhiteLabelReports: false,
        canSwitchClientContext: false,
      };
  }
}

export function useTenantType() {
  const auth = useAuthStore();

  return useMemo(() => {
    const tenantType = auth.tenantType;
    const tenantStatus = auth.tenantStatus;
    const capabilities = computeCapabilities(tenantType, tenantStatus);

    return {
      tenantType,
      tenantStatus,
      capabilities,
      isDirect: tenantType === "direct_business",
      isAgencyPartner: tenantType === "agency_partner",
      isAgencyManaged: tenantType === "agency_managed",
      isActive: tenantStatus === "active",
      isOnboarding: tenantStatus === "onboarding",
      isSuspended: tenantStatus === "suspended",
      isLoading: auth.isLoading,
    };
  }, [auth.tenantType, auth.tenantStatus, auth.isLoading]);
}
```

**Acceptance Criteria:**

- [ ] Hook returns tenant type and status
- [ ] Capabilities computed correctly
- [ ] Boolean flags for easy conditionals
- [ ] Loading state handled
- [ ] Unit tests for all scenarios

**Estimated Effort:** 1 day

---

### Task 3.4: Create Tenant Provider

**File:** `apps/frontend/src/providers/TenantProvider.tsx`

```typescript
export interface TenantContextValue {
  /** Resolved tenant UUID for the current client session, when known. */
  tenantId: string | undefined;
  /** Tenant type for capability-based rendering */
  tenantType: "direct_business" | "agency_partner" | "agency_managed" | undefined;
  /** Tenant status for state-based rendering */
  tenantStatus:
    | "onboarding"
    | "active"
    | "suspended"
    | "restricted"
    | "archived"
    | "deleted"
    | undefined;
  /** Computed capabilities based on type and status */
  capabilities: {
    canAccessAgencyDashboard: boolean;
    canManageClientTenants: boolean;
    canCreateInsights: boolean;
    canManageConnectors: boolean;
    canViewReports: boolean;
    canWhiteLabelReports: boolean;
    canSwitchClientContext: boolean;
  };
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();

  const value = useMemo(
    (): TenantContextValue => ({
      tenantId: auth.tenantId ?? undefined,
      tenantType: auth.tenantType ?? undefined,
      tenantStatus: auth.tenantStatus ?? undefined,
      capabilities: computeCapabilities(auth.tenantType, auth.tenantStatus),
    }),
    [auth.tenantId, auth.tenantType, auth.tenantStatus],
  );

  // ... rest of provider
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}
```

**Acceptance Criteria:**

- [ ] Context includes type and status
- [ ] Capabilities computed in provider
- [ ] Memoized for performance
- [ ] useTenant hook returns full context

**Estimated Effort:** 1 day

---

### Task 3.5: Create Enhanced Route Guards

**File:** `apps/frontend/src/features/dashboard/route-guards/create-agency-dashboard-before-load.ts`

```typescript
import { redirect } from "@tanstack/react-router";
import type { RouteGuardBeforeLoadFn } from "@/lib/auth/route-guards/guard-types";

export function createAgencyDashboardBeforeLoad(): RouteGuardBeforeLoadFn {
  return async function agencyDashboardBeforeLoad(ctx: unknown) {
    const { context } = ctx as { context: { auth: any } };
    const auth = context.auth;
    const { params } = ctx as { params: { locale: string } };

    // Check authentication
    if (!auth.isAuthenticated) {
      throw redirect({
        to: "/$locale/auth/login",
        search: { redirect: window.location.pathname },
        params: { locale: params.locale },
      });
    }

    // Check tenant type - ONLY agency partners can access
    if (auth.tenantType !== "agency_partner") {
      throw redirect({
        to: "/$locale/dashboard",
        params: { locale: params.locale },
        replace: true,
      });
    }

    // Check tenant status
    if (auth.tenantStatus !== "active") {
      throw redirect({
        to: "/$locale/account/suspended",
        params: { locale: params.locale },
      });
    }

    // Check specific permission (if using permission system)
    if (!auth.permissions?.includes("agency:access_dashboard")) {
      throw redirect({
        to: "/$locale/dashboard",
        params: { locale: params.locale },
      });
    }
  };
}
```

**File:** `apps/frontend/src/routes/$locale/dashboard/agency.tsx`

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { createAgencyDashboardBeforeLoad } from "@/features/dashboard/route-guards/create-agency-dashboard-before-load";

export const Route = createFileRoute("/$locale/dashboard/agency")({
  beforeLoad: createAgencyDashboardBeforeLoad(),
  component: () => import("@/features/dashboard/pages/agency/AgencyDashboardPage"),
});
```

**Acceptance Criteria:**

- [ ] Agency route protected by tenant type
- [ ] Status validation implemented
- [ ] Permission check included
- [ ] Proper redirects on failure
- [ ] Tests for all redirect scenarios

**Estimated Effort:** 1.5 days

---

### Task 3.6: Create Navigation with Capability Checks

**File:** `apps/frontend/src/components/layout/app-shell-navigation.tsx`

```typescript
import { useTenantType } from "@/hooks/useTenantType";

export function AppShellNavigation() {
  const { capabilities, isLoading } = useTenantType();
  const t = useTranslations("navigation");

  return (
    <nav aria-label={t("mainNavigation")}>
      {/* Standard navigation for all tenants */}
      <NavLink
        href="/dashboard"
        label={t("dashboard")}
      />
      <NavLink
        href="/dashboard/connectors"
        label={t("connectors")}
      />
      <NavLink
        href="/dashboard/insights"
        label={t("insights")}
      />
      <NavLink
        href="/dashboard/reports"
        label={t("reports")}
      />

      {/* Agency-only navigation */}
      {capabilities.canAccessAgencyDashboard && (
        <NavLink
          href="/dashboard/agency"
          label={t("agency.title")}
          icon={<IconBuildingCommunity />}
        />
      )}

      {/* Settings */}
      <NavLink
        href="/settings"
        label={t("settings")}
      />
    </nav>
  );
}
```

**Acceptance Criteria:**

- [ ] Navigation adapts to capabilities
- [ ] Agency link hidden for non-agency tenants
- [ ] Loading state handled gracefully
- [ ] Accessibility maintained

**Estimated Effort:** 1 day

---

## Phase 4: Testing & Validation (Days 16-20)

### Task 4.1: Unit Tests

**Coverage Requirements:**

- [ ] Tenant type enum validation
- [ ] Tenant status state machine
- [ ] Capability computation
- [ ] RLS policy enforcement
- [ ] JWT claims validation
- [ ] Route guard redirects
- [ ] Agency middleware validation

**Estimated Effort:** 3 days

---

### Task 4.2: Integration Tests

**Test Scenarios:**

- [ ] Tenant isolation (cross-tenant access blocked)
- [ ] Agency partner can access clients
- [ ] Direct tenant cannot access agency features
- [ ] Suspended tenant blocked from operations
- [ ] RLS policies enforced at database level
- [ ] JWT includes correct tenant metadata

**Estimated Effort:** 2 days

---

### Task 4.3: E2E Tests

**Test Flows:**

- [ ] Agency partner onboarding
- [ ] Client tenant creation
- [ ] Client context switching
- [ ] Agency dashboard access
- [ ] Tenant lifecycle transitions
- [ ] Multi-tenant data isolation

**Estimated Effort:** 2 days

---

## Rollout Plan

### Week 1: Database Schema Implementation

- Days 1-2: Create enums and schema
- Days 3: RLS policies
- Days 4-5: Validate and test

### Week 2: Backend Implementation

- Days 6-7: Core services
- Days 8-9: API endpoints
- Day 10: Integration testing

### Week 3: Frontend Implementation

- Days 11-12: Core updates (store, hooks, provider)
- Days 13-14: Route guards and navigation
- Day 15: Integration testing

### Week 4: Testing

- Days 16-17: Unit and integration tests
- Days 18-19: E2E tests
- Day 20: Final validation

### Week 5: Deployment

- Days 21-22: Staging deployment
- Days 23-24: Production deployment
- Day 25: Monitoring and bug fixes

---

## Success Metrics

| Metric                        | Target  | Measurement            |
| ----------------------------- | ------- | ---------------------- |
| Zero cross-tenant data access | 100%    | Security audit         |
| Route guard effectiveness     | 100%    | Test coverage          |
| API response time             | < 200ms | Performance monitoring |
| Tenant type accuracy          | 100%    | Data validation        |
| RLS policy enforcement        | 100%    | Database tests         |

---

## Risk Mitigation

| Risk                      | Probability | Impact | Mitigation                                 |
| ------------------------- | ----------- | ------ | ------------------------------------------ |
| Schema design errors      | Low         | High   | Architecture review, comprehensive testing |
| JWT validation failures   | Low         | High   | Extensive unit tests                       |
| RLS performance impact    | Low         | Medium | Index optimization, query analysis         |
| Frontend redirect loops   | Medium      | Medium | Extensive testing, monitoring              |
| Agency partner disruption | Low         | High   | Clear documentation, gradual rollout       |

---

## Conclusion

This implementation plan ensures **100% alignment** with business architecture requirements and **industry best practices** for multi-tenant SaaS platforms. The plan prioritizes security, data integrity, and tenant isolation with a clean greenfield implementation approach.

**Total Estimated Effort:** 20 days (4 weeks)
**Critical Path:** Database schema → Backend API → Frontend → Testing
**Production Ready:** After Week 4 deployment

**Approval Required:** Architecture team sign-off before Week 1 begins.
