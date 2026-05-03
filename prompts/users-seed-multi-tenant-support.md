# Users Seed Update: Multi-Tenant User Seeding for Direct Business and Agency-Managed Tenants

## Objective

Update `/packages/database/src/seeds/users-seed.ts` to properly support seeding users across the platform's **two-tier tenant model**: direct business tenants and agency-managed client tenants.

## Context & Architecture Alignment

### Current State

The existing seed implementation (`users-seed.ts`) creates users within a single tenant context but lacks:

- Support for seeding users across **agency partner → client tenant** relationships
- Type-specific default role configurations for different tenant types
- Proper alignment with the multi-tenant SSOT architecture

### Business Model (Per SSOT)

The platform has **two tenant types** (`docs/architecture/business/business-architecture.md:49-55`):

| Tenant Type         | Description                     | Users Table Relationship                         |
| ------------------- | ------------------------------- | ------------------------------------------------ |
| **Direct Business** | End consumer (e.g., Masafh)     | `users.tenantId` → `tenants.id`                  |
| **Agency Partner**  | Manages multiple client tenants | `tenants.agencyPartnerId` → `agency_partners.id` |

**Critical Architecture Point:** Users belong to **tenants**, not agency partners directly. Agency partners access client tenants via the `tenants.agencyPartnerId` foreign key relationship.

### Database Schema References

```typescript
// tenants table
{
  id: uuid;
  name: string;
  agencyPartnerId: uuid | null; // null = direct business, set = agency-managed client
}

// users table
{
  id: uuid;
  tenantId: uuid; // References tenants.id (NOT agency_partners)
  email: string;
  displayName: string;
  passwordHash: string;
}

// agency_partners table
{
  id: uuid;
  name: string;
  slug: string;
}
```

## Requirements

### Analysis Phase

1. **Review existing patterns:**
   - `packages/database/src/seeds/users-seed.ts` - Current user seeding implementation
   - `packages/database/src/schema/tenants.ts` - Tenant schema with `agencyPartnerId` FK
   - `packages/database/src/schema/core/tenants.ts` - Agency partners table
   - `packages/types/src/auth.ts:84` - `accountType` field in registration (individual | business)
   - `packages/types/src/rbac.ts:54` - SystemRole definitions (`admin | analyst | editor | viewer`)

2. **Identify seeding scenarios:**
   - Direct business tenant: Single tenant with internal users
   - Agency partner: Agency entity + multiple client tenants, each with their own users
   - Cross-tenant agency users: Agency staff who need access to multiple client tenants

### Implementation Phase

Update `users-seed.ts` to support:

#### 1. Extend Seed Configuration

```typescript
export interface SeedUserConfig {
  email: string;
  displayName?: string;
  passwordHash?: string;
  role?: SystemRole;
  tenantId: string; // Explicit tenant scoping (already present)
}

export interface SeedTenantConfig {
  tenantId: string;
  tenantName: string;
  agencyPartnerId?: string | null; // Link to agency if applicable
  users?: SeedUserConfig[];
}
```

#### 2. Add Agency-Aware Seeding Functions

- `seedAgencyPartner(db, agencyConfig)` - Creates agency partner entity
- `seedClientTenant(db, tenantConfig, agencyPartnerId)` - Creates client tenant linked to agency
- `seedUsersForMultipleTenants(db, tenantConfigs[])` - Batch seeding across tenants

#### 3. Role Assignment Logic

| Tenant Type         | Default First User Role | Subsequent Users                  |
| ------------------- | ----------------------- | --------------------------------- |
| **Direct Business** | `admin`                 | Configurable per use case         |
| **Agency-Managed**  | `admin` (client-side)   | Configurable per use case         |
| **Agency Staff**    | `admin` (agency-level)  | Needs multi-tenant access pattern |

#### 4. Maintain Existing Functionality

- Tenant context propagation via `createTenantContext` and `runWithTenantContext`
- RBAC role assignment through `userRoles` table
- Conflict handling with `.onConflictDoNothing()`
- All operations scoped via `dbScoped`

### Example Seed Scenarios

```typescript
// Scenario 1: Direct business tenant
await seedUsersForTenant(db, "tenant-uuid", [
  { email: "admin@masafh.com", role: "admin", displayName: "Admin User" },
  { email: "analyst@masafh.com", role: "analyst", displayName: "Analyst User" },
]);

// Scenario 2: Agency partner with client tenants
await seedAgencyPartner(db, {
  name: "Digital Marketing Agency",
  slug: "dma-agency",
  clientTenants: [
    {
      tenantId: "client-1-uuid",
      tenantName: "Client Brand A",
      users: [{ email: "admin@clientA.com", role: "admin" }],
    },
    {
      tenantId: "client-2-uuid",
      tenantName: "Client Brand B",
      users: [{ email: "admin@clientB.com", role: "admin" }],
    },
  ],
});
```

## Constraints

- **Greenfield development**: No backward compatibility requirements
- **Multi-tenant safety**: All operations MUST use `runWithTenantContext` with proper tenant isolation
- **Type safety**: No `any` types; use Zod schemas from `packages/types`
- **Security defaults**: Fail-closed validation, no sensitive data in logs
- **SSOT alignment**: Follow tenant entity spec (`docs/architecture/ui/02-system-entities/tenant.md`)

## Deliverables

1. Extended seed configuration interfaces with agency-aware properties
2. New seeding functions for agency partner and client tenant scenarios
3. Role assignment helpers with type-aware defaults
4. Example seed configurations demonstrating:
   - Direct business tenant seeding
   - Agency partner with multiple client tenants
   - Mixed scenario (direct + agency-managed tenants)
5. Inline documentation explaining tenant relationship handling

## References

### Primary SSOT Documents

- **Business Architecture**: `/docs/architecture/business/business-architecture.md` (§2 Core Business Entities, §6 Multi-Tenancy Model)
- **Tenant Entity Spec**: `/docs/architecture/ui/02-system-entities/tenant.md`
- **Multi-Tenant Guardrails**: `/docs/05-reference/multi-tenant-guardrails.md`

### Code References

- **Users Seed**: `packages/database/src/seeds/users-seed.ts`
- **Tenant Schema**: `packages/database/src/schema/tenants.ts`
- **Agency Partners Schema**: `packages/database/src/schema/core/tenants.ts`
- **Auth Types**: `packages/types/src/auth.ts`
- **RBAC Types**: `packages/types/src/rbac.ts`
- **Tenant Config Schema**: `packages/config/src/schemas/tenant.ts`

### Related Workflows

- **Tenant Onboarding**: `/docs/architecture/ui/05-workflows/tenant-onboarding.md` (Step 1: Account Type Selection)
