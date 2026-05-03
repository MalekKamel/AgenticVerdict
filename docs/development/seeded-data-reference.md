# Development Database Seed Data Reference

**Last Updated:** 2026-05-02  
**Version:** 2.1.0

This document provides comprehensive details about the development database seed data created by running `make db-seed-dev` or `pnpm db:seed:dev`.

**What's New in v2.1.0:**

- Email naming convention reflects tenant types (`direct_*`, `agency_*`, `client_*`)
- Explicit tenant type and status fields in seed configs
- Updated `getDefaultRoleForTenantType` to use enum values (`direct_business`, `agency_managed`)

**What's New in v2.0.0:**

- Multi-tenant seeding with agency partner support
- Direct business and agency-managed tenant scenarios
- Enhanced RBAC role seeding with system roles
- New seed examples for testing different tenant architectures

---

## Table of Contents

1. [Overview](#overview)
2. [Tenants](#tenants)
3. [Users](#users)
4. [Connectors](#connectors)
5. [Insights](#insights)
6. [Report Templates](#report-templates)
7. [Reports](#reports)
8. [Data Relationships](#data-relationships)
9. [Seed Commands](#seed-commands)
10. [Query Examples](#query-examples)

---

## Overview

The development seed creates tenants in two categories: **direct business tenants** and **agency-managed client tenants**, plus one **agency partner** entity.

### Tenant Architecture

| Tenant Type         | Count | Purpose                                     |
| ------------------- | ----- | ------------------------------------------- |
| **Direct Business** | 4     | Standalone tenants not managed by agencies  |
| **Agency-Managed**  | 3     | Client tenants managed by an agency partner |
| **Agency Partner**  | 1     | Manages multiple client tenants             |

### Tenants Summary

| Tenant                            | Type           | Purpose                                   | Users | Connectors | Insights |
| --------------------------------- | -------------- | ----------------------------------------- | ----- | ---------- | -------- |
| `alpha-test-company`              | Direct         | Primary US-based test tenant              | 3     | 3          | 2        |
| `beta-industries`                 | Direct         | UK-based test tenant                      | 3     | 3          | 2        |
| `gamma-startup`                   | Direct         | Startup test tenant                       | 3     | 3          | 2        |
| `masafh`                          | Direct         | Existing test tenant (GPS fleet tracking) | 3     | 3          | 2        |
| `northwind-analytics-demo-tenant` | Direct         | Demo tenant                               | 3     | 3          | 2        |
| `client-brand-a`                  | Agency-Managed | Agency client A                           | 2     | 3          | 2        |
| `client-brand-b`                  | Agency-Managed | Agency client B                           | 2     | 3          | 2        |
| `client-brand-c`                  | Agency-Managed | Agency client C                           | 1     | 3          | 2        |

**Agency Partner:** `Digital Marketing Agency` (`dma-agency`)

- Manages 3 client tenants
- Agency partner entity exists in `agency_partners` table
- Client tenants linked via `tenants.agency_partner_id` FK

**Per Tenant:**

- Users with RBAC roles (admin, analyst, editor, viewer)
- 3 connectors (GA4, Meta, GSC)
- 2 insights (Weekly Performance, Monthly ROI)
- 1 report template (Standard Performance Template)
- 2 reports (1 published, 1 draft)

---

## Tenants

### Tenant Configuration Files

Location: `tests/fixtures/dev-seed-configs/`

#### 1. Alpha Test Company (`tenant-alpha.json`)

```json
{
  "tenantId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "tenantName": "Alpha Test Company",
  "slug": "alpha-test-company",
  "localization": {
    "language": "en",
    "region": "US",
    "timezone": "America/New_York",
    "currency": "USD"
  },
  "marketing": {
    "channels": ["paid_search", "paid_social", "organic_social"],
    "kpis": ["roas", "cpa", "ctr", "conversion_rate"]
  },
  "ai": {
    "primaryModel": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "features": {
    "enableInsights": true,
    "enableVerdict": true,
    "enableForecasting": true
  },
  "branding": {
    "primaryColor": "#3B82F6",
    "logoUrl": "https://example.com/alpha-logo.png"
  }
}
```

#### 2. Beta Industries (`tenant-beta.json`)

```json
{
  "tenantId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "tenantName": "Beta Industries",
  "slug": "beta-industries",
  "localization": {
    "language": "en",
    "region": "GB",
    "timezone": "Europe/London",
    "currency": "GBP"
  },
  "marketing": {
    "channels": ["paid_search", "email", "affiliate"],
    "kpis": ["roas", "ltv", "retention_rate"]
  },
  "ai": {
    "primaryModel": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "features": {
    "enableInsights": true,
    "enableVerdict": true,
    "enableForecasting": false
  }
}
```

#### 3. Gamma Startup (`tenant-gamma.json`)

```json
{
  "tenantId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "tenantName": "Gamma Startup",
  "slug": "gamma-startup",
  "localization": {
    "language": "en",
    "region": "US",
    "timezone": "America/Los_Angeles",
    "currency": "USD"
  },
  "marketing": {
    "channels": ["paid_social", "organic_social", "content"],
    "kpis": ["cac", "activation_rate", "viral_coefficient"]
  },
  "ai": {
    "primaryModel": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "features": {
    "enableInsights": true,
    "enableVerdict": false,
    "enableForecasting": true
  }
}
```

#### 4. Masafh (`tenant-masafh.json`)

```json
{
  "tenantId": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "tenantName": "Masafh",
  "slug": "masafh",
  "localization": {
    "language": "en",
    "region": "SA",
    "timezone": "Asia/Riyadh",
    "currency": "SAR"
  },
  "marketing": {
    "channels": ["paid_search", "paid_social"],
    "kpis": ["roas", "cpa", "conversions"]
  },
  "ai": {
    "primaryModel": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "features": {
    "enableInsights": true,
    "enableVerdict": true,
    "enableForecasting": false
  }
}
```

#### 5. Northwind Analytics Demo (`tenant-northwind.json`)

```json
{
  "tenantId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "tenantName": "Northwind Analytics Demo",
  "slug": "northwind-analytics-demo-tenant",
  "localization": {
    "language": "en",
    "region": "US",
    "timezone": "America/New_York",
    "currency": "USD"
  },
  "marketing": {
    "channels": ["paid_search", "email"],
    "kpis": ["roas", "revenue", "conversion_rate"]
  },
  "ai": {
    "primaryModel": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "features": {
    "enableInsights": true,
    "enableVerdict": true,
    "enableForecasting": true
  }
}
```

### Agency Partner

#### Digital Marketing Agency (`agency-dma.json`)

The agency partner entity manages multiple client tenants:

```json
{
  "agencyPartnerId": "11111111-1111-4111-8111-111111111111",
  "name": "Digital Marketing Agency",
  "slug": "dma-agency",
  "settings": {
    "whiteLabel": true,
    "maxClients": 10
  },
  "clientTenants": [
    {
      "tenantId": "22222222-2222-4222-8222-222222222222",
      "tenantName": "Client Brand A",
      "slug": "client-brand-a"
    },
    {
      "tenantId": "33333333-3333-4333-8333-333333333333",
      "tenantName": "Client Brand B",
      "slug": "client-brand-b"
    },
    {
      "tenantId": "44444444-4444-4444-8444-444444444444",
      "tenantName": "Client Brand C",
      "slug": "client-brand-c"
    }
  ]
}
```

### Agency-Managed Client Tenants

Client tenants are linked to the agency partner via `tenants.agency_partner_id`:

| Tenant ID                              | Name           | Slug             | Agency Partner ID                      |
| -------------------------------------- | -------------- | ---------------- | -------------------------------------- |
| `22222222-2222-4222-8222-222222222222` | Client Brand A | `client-brand-a` | `11111111-1111-4111-8111-111111111111` |
| `33333333-3333-4333-8333-333333333333` | Client Brand B | `client-brand-b` | `11111111-1111-4111-8111-111111111111` |
| `44444444-4444-4444-8444-444444444444` | Client Brand C | `client-brand-c` | `11111111-1111-4111-8111-111111111111` |

---

## Users

### User Factory Pattern

All users are generated using `UserFactory` with:

- **Deterministic seed:** `faker.seed(12345)` for reproducibility
- **Email pattern:** Varies by tenant type (see table above)
- **Password:** `DevPassword123!` (hashed with scrypt)
- **Email verified:** `true`

### RBAC Roles

System roles are seeded for each tenant before user creation:

| Role      | Description                  | Default Permissions                                    |
| --------- | ---------------------------- | ------------------------------------------------------ |
| `admin`   | Full system access           | All permissions                                        |
| `analyst` | Read + analysis capabilities | `reports:*`, `translations:read`, `connectors:read`    |
| `editor`  | Content editing access       | `reports:*`, `translations:*`, `connectors:read`       |
| `viewer`  | Read-only access             | `reports:read`, `translations:read`, `connectors:read` |

### Users Per Tenant Type

**Direct Business Tenants:**
| Role | Email Pattern | Display Name |
|------|---------------|--------------|
| Admin | `admin@direct-{slug}.example.com` | `Admin - {slug}` |
| Analyst | `analyst@direct-{slug}.example.com` | `Analyst - {slug}` |
| Viewer | `viewer@direct-{slug}.example.com` | `Viewer - {slug}` |

**Agency Partner Tenants:**
| Role | Email Pattern | Display Name |
|------|---------------|--------------|
| Admin | `admin@agency-{slug}.example.com` | `Agency Admin - {slug}` |
| Manager | `manager@agency-{slug}.example.com` | `Agency Manager - {slug}` |

**Agency-Managed Tenants:**
| Role | Email Pattern | Display Name |
|------|---------------|--------------|
| Admin | `admin@client-{slug}.example.com` | `Client Admin - {slug}` |
| Editor | `editor@client-{slug}.example.com` | `Client Editor - {slug}` |
| Analyst | `analyst@client-{slug}.example.com` | `Client Analyst - {slug}` |

### Example Users (Alpha Test Company - Direct Business)

```sql
SELECT u.id, u.email, u.display_name, u.email_verified, u.created_at, r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
ORDER BY u.email;
```

| Email                                           | Display Name                   | Role    | Verified |
| ----------------------------------------------- | ------------------------------ | ------- | -------- |
| `admin@direct-alpha-test-company.example.com`   | `Admin - alpha-test-company`   | admin   | ✅       |
| `analyst@direct-alpha-test-company.example.com` | `Analyst - alpha-test-company` | analyst | ✅       |
| `viewer@direct-alpha-test-company.example.com`  | `Viewer - alpha-test-company`  | viewer  | ✅       |

### Example Users (Client Brand A - Agency-Managed)

```sql
SELECT u.id, u.email, u.display_name, u.email_verified, r.name as role, t.name as tenant, ap.name as agency
FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN agency_partners ap ON t.agency_partner_id = ap.id
WHERE u.tenant_id = '22222222-2222-4222-8222-222222222222'
ORDER BY u.email;
```

| Email                              | Display Name      | Role   | Tenant         | Agency                   |
| ---------------------------------- | ----------------- | ------ | -------------- | ------------------------ |
| `admin@client-branda.example.com`  | `Client A Admin`  | admin  | Client Brand A | Digital Marketing Agency |
| `editor@client-branda.example.com` | `Client A Editor` | editor | Client Brand A | Digital Marketing Agency |

**Note:** User IDs are UUIDs generated by `gen_random_uuid()`.

---

## Connectors

### Connector Factory Pattern

Connectors are generated using `ConnectorFactory` with:

- **Naming:** `{PLATFORM} - {tenant-slug}`
- **Domain:** `{tenant-slug}.test.local`
- **Status:** `inactive` (requires configuration)
- **Sync Frequency:** `daily`
- **Retention Days:** `90`

### Connectors Per Tenant

| Platform | Name            | Domain              | Status   | Sync Frequency |
| -------- | --------------- | ------------------- | -------- | -------------- |
| GA4      | `GA4 - {slug}`  | `{slug}.test.local` | inactive | daily          |
| Meta     | `META - {slug}` | `{slug}.test.local` | inactive | daily          |
| GSC      | `GSC - {slug}`  | `{slug}.test.local` | inactive | daily          |

### Example Connectors (Alpha Test Company)

```sql
SELECT id, platform, name, domain, status, sync_frequency, created_at
FROM tenant_connectors
WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
ORDER BY platform;
```

| Platform | Name                        | Domain                          | Status   | Sync Freq |
| -------- | --------------------------- | ------------------------------- | -------- | --------- |
| ga4      | `GA4 - alpha-test-company`  | `alpha-test-company.test.local` | inactive | daily     |
| gsc      | `GSC - alpha-test-company`  | `alpha-test-company.test.local` | inactive | daily     |
| meta     | `META - alpha-test-company` | `alpha-test-company.test.local` | inactive | daily     |

### Connector Configuration (JSONB)

Each connector has default config:

```json
{
  "config": {},
  "metrics": [],
  "notifications": {},
  "advancedOptions": {}
}
```

---

## Insights

### Insight Factory Pattern

Insights are generated using `InsightFactory` with:

- **Template-based:** Predefined insight templates
- **Enabled:** `true` by default
- **Schedule:** JSONB configuration
- **Delivery:** JSONB configuration
- **AI Config:** JSONB configuration

### Insights Per Tenant

| Name               | Template             | Enabled | Schedule                |
| ------------------ | -------------------- | ------- | ----------------------- |
| Weekly Performance | `weekly-performance` | ✅      | Weekly (Monday 9AM)     |
| Monthly ROI        | `monthly-roi`        | ✅      | Monthly (1st day, 10AM) |

### Example Insights (Alpha Test Company)

```sql
SELECT id, name, description, enabled, template_id, schedule, created_at
FROM core.insights
WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
ORDER BY name;
```

#### 1. Weekly Performance

```json
{
  "id": "uuid-generated",
  "name": "Weekly Performance",
  "description": "Weekly performance analysis across all marketing channels",
  "enabled": true,
  "templateId": "weekly-performance",
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": "monday",
    "hour": 9,
    "timezone": "America/New_York"
  },
  "delivery": {
    "email": {
      "enabled": true,
      "recipients": ["admin+alpha-test-company@test.local"]
    },
    "slack": {
      "enabled": false
    }
  },
  "aiConfig": {
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

#### 2. Monthly ROI

```json
{
  "id": "uuid-generated",
  "name": "Monthly ROI",
  "description": "Monthly ROI analysis and attribution modeling",
  "enabled": true,
  "templateId": "monthly-roi",
  "schedule": {
    "frequency": "monthly",
    "dayOfMonth": 1,
    "hour": 10,
    "timezone": "America/New_York"
  },
  "delivery": {
    "email": {
      "enabled": true,
      "recipients": ["admin+alpha-test-company@test.local"]
    },
    "slack": {
      "enabled": false
    }
  },
  "aiConfig": {
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.5,
    "maxTokens": 2000
  }
}
```

---

## Report Templates

### Report Templates Per Tenant

| Name                          | Definition                                            |
| ----------------------------- | ----------------------------------------------------- |
| Standard Performance Template | Version 1.0 with overview, metrics, insights sections |

### Example Template (Alpha Test Company)

```sql
SELECT id, name, definition, created_at
FROM report_templates
WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
```

```json
{
  "id": "uuid-generated",
  "name": "Standard Performance Template",
  "definition": {
    "version": "1.0",
    "sections": ["overview", "metrics", "insights"],
    "layout": {
      "orientation": "portrait",
      "pageSize": "A4",
      "margins": {
        "top": 20,
        "bottom": 20,
        "left": 15,
        "right": 15
      }
    },
    "styling": {
      "primaryColor": "#3B82F6",
      "fontFamily": "Inter",
      "fontSize": {
        "heading": 18,
        "body": 12
      }
    }
  }
}
```

---

## Reports

### Reports Per Tenant

| Title                              | Status    | Template                      |
| ---------------------------------- | --------- | ----------------------------- |
| Monthly Performance - {Month Year} | published | Standard Performance Template |
| Draft Report - {Month Year}        | draft     | Standard Performance Template |

### Example Reports (Alpha Test Company)

```sql
SELECT id, title, status, metadata, created_at, updated_at
FROM reports
WHERE tenant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
ORDER BY created_at DESC;
```

#### 1. Published Report

```json
{
  "id": "uuid-generated",
  "title": "Monthly Performance - Mar 2026",
  "status": "published",
  "metadata": {
    "templateId": "uuid-of-standard-template",
    "generatedAt": "2026-03-31T23:59:59Z",
    "dataRange": {
      "start": "2026-03-01",
      "end": "2026-03-31"
    },
    "sections": ["overview", "metrics", "insights"],
    "metrics": {
      "totalSpend": 15000,
      "totalRevenue": 45000,
      "roas": 3.0,
      "conversions": 450
    }
  },
  "createdAt": "2026-03-31T23:59:59Z",
  "updatedAt": "2026-04-01T00:00:00Z"
}
```

#### 2. Draft Report

```json
{
  "id": "uuid-generated",
  "title": "Draft Report - Apr 2026",
  "status": "draft",
  "metadata": {
    "templateId": "uuid-of-standard-template",
    "generatedAt": "2026-04-30T12:00:00Z",
    "dataRange": {
      "start": "2026-04-01",
      "end": "2026-04-30"
    },
    "sections": ["overview"],
    "metrics": {}
  },
  "createdAt": "2026-04-30T12:00:00Z",
  "updatedAt": "2026-04-30T12:00:00Z"
}
```

---

## Data Relationships

### Entity Relationship Diagram

```
agency_partners (1) ── (N) tenants (agency-managed clients)
                           │
tenants (1) ───────────────┼── (N) users
                           ├── (N) tenant_connectors
                           ├── (N) core.insights
                           ├── (N) report_templates
                           └── (N) reports

tenant_connectors (1) ── (N) core.insight_connectors ── (N) core.insights

report_templates (1) ── (N) reports

roles (1) ── (N) user_roles ── (N) users
```

### New: Agency Partner Relationships

| Table                       | Relationship                    | Description                    |
| --------------------------- | ------------------------------- | ------------------------------ |
| `agency_partners`           | Parent entity                   | Agency partner accounts        |
| `tenants.agency_partner_id` | FK to agency_partners           | Links client tenants to agency |
| Direct business tenants     | `agency_partner_id IS NULL`     | Not managed by agency          |
| Agency-managed tenants      | `agency_partner_id IS NOT NULL` | Managed by agency              |

### Foreign Key Relationships

| Child Table               | Parent Table        | Foreign Key    | On Delete |
| ------------------------- | ------------------- | -------------- | --------- |
| `users`                   | `tenants`           | `tenant_id`    | CASCADE   |
| `tenant_connectors`       | `tenants`           | `tenant_id`    | CASCADE   |
| `core.insights`           | `tenants`           | `tenant_id`    | CASCADE   |
| `report_templates`        | `tenants`           | `tenant_id`    | CASCADE   |
| `reports`                 | `tenants`           | `tenant_id`    | CASCADE   |
| `core.insight_connectors` | `core.insights`     | `insight_id`   | CASCADE   |
| `core.insight_connectors` | `tenant_connectors` | `connector_id` | CASCADE   |

### Unique Constraints

| Table               | Constraint                                      | Columns                     |
| ------------------- | ----------------------------------------------- | --------------------------- |
| `tenant_connectors` | `tenant_connectors_tenant_platform_name_unique` | `tenant_id, platform, name` |
| `core.insights`     | `insights_tenant_name_unique`                   | `tenant_id, name`           |
| `reports`           | `reports_tenant_title_unique`                   | `tenant_id, title`          |
| `report_templates`  | `report_templates_tenant_name_unique`           | `tenant_id, name`           |
| `users`             | `users_tenant_id_email_unique`                  | `tenant_id, email`          |

---

## Seed Commands

### Quick Start

```bash
# Seed development data (idempotent)
make db-seed-dev

# Full reset + seed (destructive)
make db-seed-dev-full

# Via pnpm
pnpm --filter @agenticverdict/database db:seed:dev
```

### Seed Functions

The seed implementation provides multiple functions for different scenarios:

| Function                                | Purpose                                 | Usage             |
| --------------------------------------- | --------------------------------------- | ----------------- |
| `seedDirectTenant()`                    | Seed standalone business tenant         | Direct businesses |
| `seedAgencyPartner()`                   | Seed agency partner with client tenants | Agency partners   |
| `seedClientTenant()`                    | Seed tenant with optional agency link   | Both types        |
| `seedUsersForTenant()`                  | Seed users for existing tenant          | User seeding      |
| `seedUsersForMultipleTenants()`         | Batch seed across tenants               | Multi-tenant      |
| `seedSystemRolesForTenantIfNotExists()` | Ensure RBAC roles exist                 | Pre-seeding setup |

### Example: Seed Direct Business Tenant

```typescript
import {
  seedDirectTenant,
  seedSystemRolesForTenantIfNotExists,
} from "@agenticverdict/database/seeds/users-seed";

await seedSystemRolesForTenantIfNotExists(db, "tenant-uuid");
await seedDirectTenant(db, {
  tenantId: "tenant-uuid",
  tenantName: "My Business",
  users: [
    { email: "admin@mybusiness.com", role: "admin" },
    { email: "analyst@mybusiness.com", role: "analyst" },
  ],
});
```

### Example: Seed Agency Partner with Clients

```typescript
import { seedAgencyPartner } from "@agenticverdict/database/seeds/users-seed";

await seedAgencyPartner(db, {
  name: "Marketing Agency",
  slug: "marketing-agency",
  clientTenants: [
    {
      tenantId: "client-1-uuid",
      tenantName: "Client A",
      users: [{ email: "admin@clientA.com", role: "admin" }],
    },
    {
      tenantId: "client-2-uuid",
      tenantName: "Client B",
      users: [{ email: "admin@clientB.com", role: "admin" }],
    },
  ],
});
```

### Example: Default Role Assignment

```typescript
import { getDefaultRoleForTenantType } from "@agenticverdict/database/seeds/users-seed";

// First user is always admin
getDefaultRoleForTenantType("direct_business", 0); // 'admin'
getDefaultRoleForTenantType("agency_managed", 0); // 'admin'

// Subsequent users vary by tenant type
getDefaultRoleForTenantType("direct_business", 1); // 'analyst'
getDefaultRoleForTenantType("agency_managed", 1); // 'editor'
```

### Complete Examples

See `packages/database/src/seeds/users-seed.examples.ts` for complete examples:

- **Example 1:** Direct Business Tenant
- **Example 2:** Agency Partner with Multiple Client Tenants
- **Example 3:** Mixed Environment (Direct + Agency-Managed)
- **Example 4:** Minimal Tenant with Default Roles
- **Example 5:** Using Default Role Assignment Logic
- **Example 6:** Complete Development Environment

### Environment Variables

```bash
DATABASE_URL=postgresql://localhost:5432/agenticverdict
NODE_ENV=development  # Required (blocks production)
```

### Production Safety

The seed script includes multiple safety guards:

```typescript
// Blocks execution in production
if (process.env.NODE_ENV === "production") {
  throw new Error("❌ Seeding is not allowed in production!");
}

// Blocks connection to production database
if (process.env.DATABASE_URL?.includes("prod")) {
  throw new Error("❌ Seeding detected on production database!");
}
```

---

## Query Examples

### Count All Seeded Data (Including Agency Relationships)

```sql
SELECT
  t.slug,
  t.name,
  CASE WHEN t.agency_partner_id IS NULL THEN 'Direct' ELSE 'Agency-Managed' END as tenant_type,
  ap.name as agency_partner,
  (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as users,
  (SELECT COUNT(*) FROM tenant_connectors WHERE tenant_id = t.id) as connectors,
  (SELECT COUNT(*) FROM core.insights WHERE tenant_id = t.id) as insights,
  (SELECT COUNT(*) FROM report_templates WHERE tenant_id = t.id) as templates,
  (SELECT COUNT(*) FROM reports WHERE tenant_id = t.id) as reports
FROM tenants t
LEFT JOIN agency_partners ap ON t.agency_partner_id = ap.id
ORDER BY tenant_type DESC, t.slug;
```

### List Agency Partners and Their Clients

```sql
SELECT
  ap.name as agency_partner,
  ap.slug as agency_slug,
  COUNT(t.id) as client_count,
  STRING_AGG(t.name, ', ') as clients
FROM agency_partners ap
LEFT JOIN tenants t ON t.agency_partner_id = ap.id
GROUP BY ap.id, ap.name, ap.slug
ORDER BY client_count DESC;
```

### List All Users with Roles and Agency Info

```sql
SELECT
  t.slug as tenant,
  CASE WHEN t.agency_partner_id IS NULL THEN 'Direct' ELSE 'Agency' END as type,
  ap.name as agency_partner,
  u.email,
  u.display_name,
  r.name as role,
  u.email_verified,
  u.created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN agency_partners ap ON t.agency_partner_id = ap.id
ORDER BY type DESC, t.slug, u.email;
```

### List All Connectors

```sql
SELECT
  t.slug as tenant,
  tc.platform,
  tc.name,
  tc.domain,
  tc.status,
  tc.sync_frequency
FROM tenant_connectors tc
JOIN tenants t ON tc.tenant_id = t.id
ORDER BY t.slug, tc.platform;
```

### List All Insights with Schedule

```sql
SELECT
  t.slug as tenant,
  i.name,
  i.enabled,
  i.schedule->>'frequency' as frequency,
  i.delivery->'email'->>'enabled' as email_enabled
FROM core.insights i
JOIN tenants t ON i.tenant_id = t.id
ORDER BY t.slug, i.name;
```

### List All Reports

```sql
SELECT
  t.slug as tenant,
  r.title,
  r.status,
  r.metadata->'dataRange'->>'start' as data_start,
  r.metadata->'dataRange'->>'end' as data_end,
  r.created_at
FROM reports r
JOIN tenants t ON r.tenant_id = t.id
ORDER BY t.slug, r.created_at DESC;
```

### Find Duplicate Prevention

```sql
-- Check for duplicate connectors (should return 0)
SELECT tenant_id, platform, name, COUNT(*)
FROM tenant_connectors
GROUP BY tenant_id, platform, name
HAVING COUNT(*) > 1;

-- Check for duplicate insights (should return 0)
SELECT tenant_id, name, COUNT(*)
FROM core.insights
GROUP BY tenant_id, name
HAVING COUNT(*) > 1;

-- Check for duplicate reports (should return 0)
SELECT tenant_id, title, COUNT(*)
FROM reports
GROUP BY tenant_id, title
HAVING COUNT(*) > 1;
```

---

## Data Customization

### Adding New Tenants

1. Create JSON config in `tests/fixtures/dev-seed-configs/`:

```json
{
  "tenantId": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "tenantName": "Delta Corp",
  "slug": "delta-corp",
  "localization": {
    "language": "en",
    "region": "US",
    "timezone": "America/Chicago",
    "currency": "USD"
  },
  "marketing": {
    "channels": ["paid_search"],
    "kpis": ["roas"]
  },
  "ai": {
    "primaryModel": "claude-3-5-sonnet-20241022",
    "provider": "anthropic"
  },
  "features": {
    "enableInsights": true,
    "enableVerdict": true
  }
}
```

2. Re-run seed:

```bash
make db-seed-dev
```

### Customizing User Data

Edit `packages/database/src/factories/user-factory.ts`:

```typescript
export class UserFactory {
  static create(tenantSlug: string, role: "admin" | "viewer" | "editor" = "viewer"): SeedUser {
    return {
      email: `${role}+${tenantSlug}@test.local`,
      displayName: `${role.charAt(0).toUpperCase() + role.slice(1)} - ${tenantSlug}`,
      passwordHash: "<scrypt-hash>", // Hashed with scrypt
      emailVerified: true,
    };
  }
}
```

### Customizing Connectors

Edit `packages/database/src/factories/connector-factory.ts`:

```typescript
export class ConnectorFactory {
  static create(tenantSlug: string, platform: string): SeedTenantConnector {
    return {
      platform,
      name: `${platform.toUpperCase()} - ${tenantSlug}`,
      domain: `${tenantSlug}.test.local`,
      status: "inactive",
      syncFrequency: "daily",
    };
  }
}
```

---

## Troubleshooting

### Duplicate Data

If you see duplicate data, run:

```bash
make db-seed-dev-full
```

This will drop and recreate all schemas, ensuring a clean state.

### Missing Data

Check if seed completed successfully:

```bash
make db-seed-dev 2>&1 | grep "Development seed complete"
```

Expected output:

```
✅ Development seed complete!
   - Seeded 5 tenants
   - Each tenant has: 3 users, 3 connectors, 2 insights, 1 template, 2 reports
```

### Connection Issues

Verify PostgreSQL is running:

```bash
make health
```

Or check connection:

```bash
make shell-db <<<'\dt'
```

---

## Related Documentation

- [Database README](../packages/database/README.md)
- [Implementation Summary](./DATABASE_SEEDING_IMPLEMENTATION_SUMMARY.md)
- [Seed Script Source](../packages/database/scripts/seed-dev.ts)
- [Factory Source](../packages/database/src/factories/)
- [Seed Modules](../packages/database/src/seeds/)
- [Multi-Tenant Seed Support](../prompts/users-seed-multi-tenant-support.md)
- [Seed Examples](../packages/database/src/seeds/users-seed.examples.ts)
- [Business Architecture](../docs/architecture/business/business-architecture.md) - Multi-tenancy model
- [Tenant Entity Spec](../docs/architecture/ui/02-system-entities/tenant.md) - Tenant types and relationships
