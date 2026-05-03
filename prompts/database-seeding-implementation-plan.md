# Database Seeding Implementation Plan

**Document Version:** 1.0  
**Date:** 2026-04-30  
**Owner:** Platform Engineering

---

## Executive Summary

This document provides a comprehensive implementation plan for populating the AgenticVerdict development database with representative, multi-tenant-safe test data. The plan leverages existing infrastructure while establishing standardized patterns for reproducible development environment setup.

---

## 1. Data Model Analysis

### 1.1 Entity Overview

The AgenticVerdict schema comprises **20+ tables** across two PostgreSQL schemas:

| Schema   | Purpose                           | Tables                                                                             |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| `core`   | Global registry (tenant-agnostic) | `agency_partners`, `data_connectors`, `connector_tags`, `connector_tag_mappings`   |
| `public` | Tenant-scoped data                | `tenants`, `users`, `tenant_connectors`, `insights`, `reports`, `audit_logs`, etc. |

### 1.2 Entity Relationships and Dependencies

```
┌─────────────────────┐
│  agency_partners    │ (optional, global)
└──────────┬──────────┘
           │ SET NULL
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│     tenants         │◄────│  data_connectors    │ (global registry)
└──────────┬──────────┘     └──────────┬──────────┘
           │ CASCADE                   │ CASCADE
           ├───────────────────────────┼────────────────────────────┐
           │                           │                            │
           ▼                           ▼                            ▼
    ┌──────────────┐           ┌──────────────┐            ┌──────────────┐
    │    users     │           │tenant_connectors│           │   insights   │
    └──────────────┘           └──────┬───────┘            └──────┬───────┘
                                      │                           │
                                      ▼                           ▼
                            ┌──────────────────┐        ┌──────────────────┐
                            │connector_sync_   │        │insight_connectors│
                            │    history       │        └──────────────────┘
                            └──────────────────┘

           │ (additional tenant-scoped tables)
           ├────────────────────────────────────────────────────────────┐
           │                           │                                │
           ▼                           ▼                                ▼
    ┌──────────────┐           ┌──────────────┐                ┌──────────────┐
    │   reports    │           │report_       │                │platform_     │
    │              │           │templates     │                │credentials   │
    └──────────────┘           └──────────────┘                └──────────────┘
```

### 1.3 Required Fields by Entity

#### Core Schema (Seed First)

| Table                    | Required Fields                              | Notes             |
| ------------------------ | -------------------------------------------- | ----------------- |
| `data_connectors`        | `id`, `name`, `version`, `credential_schema` | Idempotent upsert |
| `connector_tags`         | `id`, `label`, `category`                    | Idempotent upsert |
| `connector_tag_mappings` | `connector_id`, `connector_tag_id`           | Junction table    |
| `agency_partners`        | `name`, `slug`, `settings`                   | Optional          |

#### Public Schema (Tenant-Scoped)

| Table                  | Required Fields                              | Notes                                         |
| ---------------------- | -------------------------------------------- | --------------------------------------------- |
| `tenants`              | `name`, `slug`, `active`                     | `slug` must be unique                         |
| `users`                | `tenant_id`, `email`                         | Unique `(tenant_id, email)`                   |
| `tenant_connectors`    | `tenant_id`, `platform`, `name`, `status`    | `platform` references connector ID            |
| `platform_credentials` | `tenant_id`, `platform`, `encrypted_payload` | Unique `(tenant_id, platform)`                |
| `insights`             | `tenant_id`, `name`, `enabled`               | JSONB for `schedule`, `delivery`, `ai_config` |
| `reports`              | `tenant_id`, `title`, `status`               | Default status: `draft`                       |
| `report_templates`     | `tenant_id`, `name`, `definition`            | `definition` is JSONB                         |

### 1.4 Constraints and Validation Rules

| Constraint Type             | Tables Affected                                    | Enforcement                 |
| --------------------------- | -------------------------------------------------- | --------------------------- |
| Unique slug                 | `tenants`, `agency_partners`                       | Database unique index       |
| Unique email per tenant     | `users`                                            | Composite unique index      |
| Unique platform credentials | `platform_credentials`                             | Composite unique index      |
| Tenant cascade delete       | All `public` tables                                | FK with `ON DELETE CASCADE` |
| Row-Level Security          | `tenants`, `reports`, `platform_credentials`, etc. | PostgreSQL RLS policies     |
| Not null tenant_id          | All tenant-scoped tables                           | FK constraint               |

---

## 2. Seeding Strategy

### 2.1 Data Volume Recommendations

| Dataset Type         | Tenants | Users/Tenant | Connectors/Tenant | Insights/Tenant | Use Case               |
| -------------------- | ------- | ------------ | ----------------- | --------------- | ---------------------- |
| **Minimum Viable**   | 2       | 1            | 1                 | 0               | Local dev, quick start |
| **Standard Dev**     | 3-5     | 2-3          | 2-4               | 1-2             | Feature development    |
| **Integration Test** | 5-10    | 3-5          | 3-5               | 2-4             | E2E testing            |
| **Stress Test**      | 20-50   | 5-10         | 5-10              | 5-10            | Performance testing    |
| **Load Test**        | 100+    | 10-20        | 10-20             | 10-20           | Scalability validation |

### 2.2 Data Realism Requirements

#### PII-Safe Mock Data Conventions

| Data Type           | Pattern                       | Example                           |
| ------------------- | ----------------------------- | --------------------------------- |
| **Email**           | `user+{tenant}@{domain}.test` | `admin+masafh@test.local`         |
| **Display Name**    | `{Role} - {Tenant}`           | `Admin - Masafh`                  |
| **Tenant Slug**     | `{company}-{env}`             | `masafh-dev`, `northwind-staging` |
| **Report Titles**   | `{Type} Report - {Date}`      | `Monthly Performance - 2026-04`   |
| **Connector Names** | `{Platform} - {Domain}`       | `GA4 - example.com`               |

**Critical Rules:**

1. Use `.test` or `.local` TLDs (RFC 2606 reserved)
2. Never use real customer names, domains, or emails
3. Use `@faker-js/faker` for deterministic generation with fixed seeds
4. Document seed values for reproducibility

#### Multi-Tenant Data Isolation

All seed data **MUST** respect tenant boundaries:

```typescript
// ✅ CORRECT: Isolated tenant seeding
const TENANTS = [
  { id: "11111111-1111-4111-8111-111111111111", slug: "masafh-dev" },
  { id: "22222222-2222-4222-8222-222222222222", slug: "northwind-dev" },
];

for (const tenant of TENANTS) {
  await runWithTenantContext(createContext(tenant.id), async () => {
    await dbScoped(db, async (tx) => {
      // All operations scoped to this tenant
    });
  });
}

// ❌ WRONG: Mixing tenant data without context switching
await db.insert(users).values([
  { tenantId: TENANT_A, email: "a@test.local" },
  { tenantId: TENANT_B, email: "b@test.local" },
]); // Bypasses RLS, context propagation
```

### 2.3 Existing Seed Infrastructure

#### Current Scripts

| Script         | Location                     | Purpose                                            |
| -------------- | ---------------------------- | -------------------------------------------------- |
| `seed.ts`      | `packages/database/scripts/` | Seeds connectors + tenants from `configs/tenants/` |
| `seed-test.ts` | `packages/database/scripts/` | Seeds from `tests/fixtures/base/tenants/`          |
| `reset-db.ts`  | `packages/database/scripts/` | Full reset: drop → migrate → seed                  |

#### Existing Fixtures

| Directory                      | Content                                |
| ------------------------------ | -------------------------------------- |
| `configs/tenants/`             | Production tenant configs (UUID-based) |
| `tests/fixtures/base/tenants/` | Base test tenant fixtures              |
| `tests/fixtures/companies/`    | Scenario-specific tenant configs       |
| `tests/factories/`             | Faker-backed data factories            |

### 2.4 Environment-Specific Configurations

| Environment     | Seed Source                    | Auto-Seed               | Cleanup            |
| --------------- | ------------------------------ | ----------------------- | ------------------ |
| **Local Dev**   | `configs/tenants/` + custom    | Manual (`pnpm db:seed`) | `pnpm db:reset`    |
| **CI/CD**       | `tests/fixtures/base/tenants/` | Pre-test hook           | Post-test teardown |
| **Staging**     | Production mirror (anonymized) | Deploy hook             | Manual             |
| **Performance** | Generated stress dataset       | Pre-benchmark           | Post-benchmark     |

---

## 3. Implementation Specification

### 3.1 Directory Structure

```
packages/database/
├── scripts/
│   ├── seed.ts              # Existing: connector + tenant seed
│   ├── seed-test.ts         # Existing: test fixture seed
│   ├── reset-db.ts          # Existing: full reset
│   └── seed-dev.ts          # NEW: comprehensive dev data seed
│
├── src/
│   ├── seeds/
│   │   ├── tenant-config-seed.ts  # Existing: tenant upsert
│   │   ├── connector-seed.ts      # Existing: connector registry
│   │   ├── users-seed.ts          # NEW: user generation
│   │   ├── connectors-seed.ts     # NEW: tenant connector instances
│   │   ├── insights-seed.ts       # NEW: insight definitions
│   │   └── reports-seed.ts        # NEW: report templates + reports
│   │
│   └── factories/
│       ├── user-factory.ts        # NEW: deterministic user generation
│       ├── connector-factory.ts   # NEW: connector instance generation
│       └── insight-factory.ts     # NEW: insight generation
│
tests/fixtures/
├── dev-seed-configs/
│   ├── tenant-alpha.json          # NEW: dev tenant config
│   ├── tenant-beta.json
│   └── tenant-gamma.json
└── scenarios/
    └── normal-operations/
        └── seed-overrides.json    # Scenario-specific data
```

### 3.2 Seed Script Architecture

#### Core Seed Function Pattern

```typescript
// packages/database/src/seeds/users-seed.ts
import { dbScoped } from "../db-scoped";
import { runWithTenantContext, createTenantContext } from "@agenticverdict/core";
import { users } from "../schema";

interface SeedUser {
  email: string;
  displayName?: string;
  passwordHash?: string;
  role?: "admin" | "viewer" | "editor";
}

export async function seedUsersForTenant(
  db: Database,
  tenantId: string,
  userConfigs: SeedUser[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    requestId: `seed-users-${Date.now()}`,
    config: await loadTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(users)
        .values(
          userConfigs.map((cfg) => ({
            tenantId,
            email: cfg.email,
            displayName: cfg.displayName,
            passwordHash: cfg.passwordHash ?? (await hashPassword("DevPassword123!")),
            emailVerified: true,
          })),
        )
        .onConflictDoNothing();
    });
  });
}
```

#### Main Seed Orchestrator

```typescript
// packages/database/scripts/seed-dev.ts
import { db } from "@agenticverdict/database";
import { seedTenantsFromJsonDir } from "../src/seeds/tenant-config-seed";
import { seedUsersForTenant } from "../src/seeds/users-seed";
import { seedTenantConnectors } from "../src/seeds/connectors-seed";
import { seedInsightsForTenant } from "../src/seeds/insights-seed";

const DEV_TENANT_CONFIGS_DIR = "tests/fixtures/dev-seed-configs";

async function main() {
  console.log("🌱 Starting development database seed...");

  // Step 1: Seed global registry (idempotent)
  console.log("  → Seeding connector registry...");
  await seedConnectorRegistry(db);

  // Step 2: Seed tenants from configs
  console.log("  → Seeding tenants...");
  const tenants = await seedTenantsFromJsonDir(db, DEV_TENANT_CONFIGS_DIR);

  // Step 3: Seed tenant-scoped data
  for (const tenant of tenants) {
    console.log(`  → Seeding data for tenant: ${tenant.slug}`);

    await seedUsersForTenant(db, tenant.id, [
      { email: `admin+${tenant.slug}@test.local`, displayName: "Admin User", role: "admin" },
      { email: `viewer+${tenant.slug}@test.local`, displayName: "Viewer User", role: "viewer" },
    ]);

    await seedTenantConnectors(db, tenant.id, [
      { platform: "ga4", name: "GA4 - Primary", domain: `${tenant.slug}.test.local` },
      { platform: "meta", name: "Meta Ads", domain: `${tenant.slug}.test.local` },
    ]);

    await seedInsightsForTenant(db, tenant.id, [{ name: "Weekly Performance", enabled: true }]);
  }

  console.log("✅ Development seed complete!");
}

main().catch(console.error);
```

### 3.3 Execution Workflow

#### Idempotency Pattern

All seed operations use `onConflictDoNothing()` or `onConflictDoUpdate()`:

```typescript
// For global registry (connectors, tags)
await tx
  .insert(dataConnectors)
  .values(connectorData)
  .onConflictDoUpdate({
    target: dataConnectors.id,
    set: { version: connectorData.version, updatedAt: new Date() },
  });

// For tenant data (idempotent re-runs)
await tx.insert(users).values(userData).onConflictDoNothing();
```

#### Reset Procedures

```bash
# Full reset (drop → migrate → seed)
pnpm db:reset

# Seed only (idempotent, preserves existing data)
pnpm db:seed

# Seed dev-specific data (additive)
pnpm db:seed:dev

# Clean tenant data only (preserves global registry)
pnpm db:clean:tenants
```

#### Package.json Scripts

```json
{
  "scripts": {
    "db:seed": "tsx scripts/seed.ts",
    "db:seed:test": "tsx scripts/seed-test.ts",
    "db:seed:dev": "tsx scripts/seed-dev.ts",
    "db:reset": "tsx scripts/reset-db.ts",
    "db:clean:tenants": "tsx scripts/clean-tenants.ts"
  }
}
```

### 3.4 Integration with Development Workflows

#### Local Development Setup

```bash
# Initial setup
git clone <repo>
pnpm install
pnpm db:reset              # Full reset with seed
pnpm dev                  # Start dev servers

# Refresh seed data
pnpm db:reset              # Or idempotent: pnpm db:seed:dev
```

#### CI/CD Integration

```yaml
# .github/workflows/test.yml
jobs:
  test:
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test_agenticverdict
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm db:reset
      - run: pnpm test
```

#### Pre-commit Hook (Optional)

```json
// .husky/pre-commit
#!/bin/sh
pnpm db:seed:test 2>/dev/null || echo "⚠️  Test seed failed - run 'pnpm db:reset'"
```

---

## 4. Risk Mitigation

### 4.1 Production Data Contamination Prevention

| Risk                                   | Mitigation                                     |
| -------------------------------------- | ---------------------------------------------- |
| **Accidental production seed**         | Seed scripts check `NODE_ENV !== 'production'` |
| **Hardcoded production IDs**           | Use environment variables for tenant IDs       |
| **Shared database credentials**        | Separate `DATABASE_URL` per environment        |
| **Seed script in deployment pipeline** | Exclude seed scripts from production builds    |

```typescript
// Safety check in all seed scripts
if (process.env.NODE_ENV === "production") {
  throw new Error("❌ Seeding is not allowed in production!");
}

if (process.env.DATABASE_URL?.includes("prod")) {
  throw new Error("❌ Seeding detected on production database!");
}
```

### 4.2 Sensitive Data Handling Guidelines

| Data Type           | Handling                                                 |
| ------------------- | -------------------------------------------------------- |
| **Passwords**       | Use `@node-rs/scrypt` hash with fixed dev salt           |
| **API Credentials** | Use mock/placeholder encrypted payloads                  |
| **PII**             | Never seed real names, emails, or domains                |
| **Tokens**          | Use deterministic mock tokens (e.g., `dev_token_<type>`) |

```typescript
// Mock credential encryption for dev
import { encrypt } from "@agenticverdict/crypto";

const DEV_ENCRYPTION_KEY = "dev-key-do-not-use-in-production";

export function createMockCredential(platform: string): string {
  const mockPayload = {
    access_token: `mock_${platform}_token`,
    refresh_token: `mock_${platform}_refresh`,
    expires_at: Date.now() + 86400000,
  };
  return encrypt(JSON.stringify(mockPayload), DEV_ENCRYPTION_KEY);
}
```

### 4.3 Rollback and Cleanup Procedures

#### Tenant-Level Cleanup

```typescript
// packages/database/scripts/clean-tenants.ts
import { tenants } from "../src/schema";

export async function cleanTenants(db: Database, tenantIds: string[]): Promise<void> {
  await db.delete(tenants).where(inArray(tenants.id, tenantIds));
  console.log(`✅ Cleaned ${tenantIds.length} tenants`);
}
```

#### Full Database Reset

```bash
# Drop all schemas and recreate
pnpm db:reset

# Or manually via SQL
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; DROP SCHEMA core CASCADE;"
psql $DATABASE_URL -c "CREATE SCHEMA public; CREATE SCHEMA core;"
pnpm db:generate
pnpm db:push
pnpm db:seed
```

#### Selective Cleanup

```typescript
// Clean specific entity types
await db.delete(users).where(eq(users.tenantId, tenantId));
await db.delete(reports).where(eq(reports.tenantId, tenantId));
// ... cascade handled by FK constraints
```

---

## 5. Testing Strategy

### 5.1 Seed Script Tests

```typescript
// packages/database/src/seeds/__tests__/users-seed.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { getTestDatabase } from "@agenticverdict/testing";
import { seedUsersForTenant } from "../users-seed";

describe("seedUsersForTenant", () => {
  let db: Database;
  const TEST_TENANT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

  beforeEach(async () => {
    db = await getTestDatabase();
  });

  it("creates users with correct tenant scoping", async () => {
    await seedUsersForTenant(db, TEST_TENANT_ID, [
      { email: "test@test.local", displayName: "Test User" },
    ]);

    const users = await db.query.users.findMany({
      where: eq(users.tenantId, TEST_TENANT_ID),
    });

    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("test@test.local");
  });

  it("is idempotent (no duplicates on re-run)", async () => {
    await seedUsersForTenant(db, TEST_TENANT_ID, [{ email: "test@test.local" }]);
    await seedUsersForTenant(db, TEST_TENANT_ID, [{ email: "test@test.local" }]);

    const count = await db.$count(users, eq(users.tenantId, TEST_TENANT_ID));
    expect(count).toBe(1);
  });
});
```

### 5.2 Tenant Isolation Tests

```typescript
// Verify seed data respects tenant boundaries
it("prevents cross-tenant data leakage", async () => {
  const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  await seedUsersForTenant(db, TENANT_A, [{ email: "a@test.local" }]);
  await seedUsersForTenant(db, TENANT_B, [{ email: "b@test.local" }]);

  const tenantAUsers = await db.query.users.findMany({
    where: eq(users.tenantId, TENANT_A),
  });
  const tenantBUsers = await db.query.users.findMany({
    where: eq(users.tenantId, TENANT_B),
  });

  expect(tenantAUsers.every((u) => u.tenantId === TENANT_A)).toBe(true);
  expect(tenantBUsers.every((u) => u.tenantId === TENANT_B)).toBe(true);
});
```

---

## 6. Success Criteria Checklist

- [ ] **Reproducible Setup**: `pnpm db:reset` creates identical dev environment across machines
- [ ] **Multi-Tenant Safety**: All seed operations use `dbScoped()` + `runWithTenantContext()`
- [ ] **Idempotency**: Re-running seed scripts does not create duplicates
- [ ] **PII Compliance**: No real customer data in seed fixtures
- [ ] **Test Coverage**: Seed scripts have unit tests for idempotency and isolation
- [ ] **Documentation**: Seed process documented in `README.md` and onboarding guide
- [ ] **CI Integration**: Test suite runs with seeded data in CI pipeline
- [ ] **Rollback Support**: `pnpm db:clean:tenants` provides selective cleanup

---

## 7. Implementation Timeline

| Phase                      | Tasks                                         | Duration |
| -------------------------- | --------------------------------------------- | -------- |
| **Phase 1: Foundation**    | Create seed script templates, factory pattern | 2-3 days |
| **Phase 2: Core Entities** | Implement users, connectors, insights seeds   | 3-4 days |
| **Phase 3: Testing**       | Write seed script tests, isolation tests      | 2 days   |
| **Phase 4: Documentation** | Update README, create seeding guide           | 1 day    |
| **Phase 5: Integration**   | CI/CD integration, workflow hooks             | 1-2 days |

**Total Estimated Effort:** 9-12 days

---

## 8. Appendix

### A. Sample Tenant Config File

```json
{
  "$schema": "../../../packages/database/src/seeds/tenant-config.schema.json",
  "tenantId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "tenantName": "Alpha Test Company",
  "slug": "alpha-test",
  "active": true,
  "localization": {
    "language": "en",
    "region": "US",
    "timezone": "America/New_York",
    "currency": "USD"
  },
  "seedOptions": {
    "users": [
      { "email": "admin+alpha@test.local", "role": "admin" },
      { "email": "viewer+alpha@test.local", "role": "viewer" }
    ],
    "connectors": [
      { "platform": "ga4", "name": "GA4 Primary", "domain": "alpha.test.local" },
      { "platform": "meta", "name": "Meta Ads" }
    ],
    "insights": [{ "name": "Weekly Performance", "enabled": true }]
  }
}
```

### B. Factory Pattern Example

```typescript
// packages/database/src/factories/user-factory.ts
import { faker } from "@faker-js/faker";

// Deterministic seed for reproducibility
faker.seed(12345);

export class UserFactory {
  static create(tenantSlug: string, role: "admin" | "viewer" = "viewer") {
    return {
      email: `${role}+${tenantSlug}@test.local`,
      displayName: `${role.charAt(0).toUpperCase() + role.slice(1)} - ${tenantSlug}`,
      passwordHash: hashPassword("DevPassword123!"),
      emailVerified: true,
    };
  }

  static createList(tenantSlug: string, count: number) {
    return Array.from({ length: count }, (_, i) =>
      this.create(tenantSlug, i === 0 ? "admin" : "viewer"),
    );
  }
}
```

### C. Related Documentation

- `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
- `/.agents/skills/multi-tenant-guardrails/SKILL.md`
- `/docs/05-reference/checklists/tenant-change-pr-checklist.md`
- `/packages/database/README.md`

---

**End of Document**
