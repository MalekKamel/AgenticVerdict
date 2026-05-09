# Implementation Plan 08 — Advanced Features (White-Label + Benchmarking)

**Phase:** P3 (Advanced Features)
**Original Reference:** Comprehensive Plan §2.8 (Tasks 2.8.1 – 2.8.3) + §2.9 (Tasks 2.9.1 – 2.9.2)
**Priority:** P3 — Phase 2 capabilities
**Estimated Effort:** 5 tasks, ~3-4 days

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. All database changes use **destructive approaches**:

- No migration files with up/down — use `make db:push` to apply schema directly
- No backward compatibility concerns — break freely, rename freely, drop freely
- If a schema change is needed mid-development, drop the table and recreate it
- After any schema change, run `make db:reset` to rebuild from scratch

---

## 1. Overview

Implement white-label reporting and cross-client benchmarking — the advanced agency capabilities that differentiate AgenticVerdict in the agency partner market. Per the business architecture, these are Phase 2 features (Section 6.2) that build on the agency dashboard foundation.

### Business Value

- White-label: "Agency branding on client reports" (Section 3.3) — critical for agency partners who resell services
- Benchmarking: "Cross-client benchmarking (aggregated)" (Section 4.2) — enables Analysts to provide strategic insights
- Required for business metric: "2+ agency partners with 5+ clients each" (Section 9.3)

### Key Design Decision

Benchmarking must **never expose raw tenant data** — only anonymized aggregates. This is a non-negotiable tenant isolation requirement (Section 6.1).

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component            | Location                                            | Notes                         |
| -------------------- | --------------------------------------------------- | ----------------------------- |
| Report generator     | `packages/report-generator/`                        | PDF and XLSX generation       |
| Email delivery       | Worker pipeline                                     | Existing delivery mechanism   |
| TenantConfig pattern | Database                                            | Existing tenant configuration |
| Multi-tenant DB      | Database                                            | RLS, tenant-scoped queries    |
| Agency dashboard     | `apps/frontend/src/features/agency/` (from plan-07) | Foundation for both features  |

### Dependencies

| Plan                          | Relationship | Notes                                       |
| ----------------------------- | ------------ | ------------------------------------------- |
| plan-07-agency-dashboard      | Depends on   | Both features require agency infrastructure |
| plan-05-delivery-enhancements | Depends on   | White-label uses report generation pipeline |
| plan-04-domain-mapping        | Depends on   | Benchmarking uses domain-specific groupings |

---

## 3. Tasks — White-Label Reporting

### Task 8.1: Tenant Branding Configuration

**Original:** 2.8.1
**File:** `packages/database/src/schema/tenant-branding.ts` (NEW)

**Implementation:**

1. Create `tenant_branding` table:
   - `id` (UUID, PK)
   - `tenant_id` (UUID, not null, unique)
   - `logo_url` (text, nullable)
   - `primary_color` (text, nullable — hex color)
   - `secondary_color` (text, nullable)
   - `custom_domain` (text, nullable)
   - `footer_text` (text, nullable)
   - `sender_name` (text, nullable — for emails)
   - `sender_email` (text, nullable — for emails)
   - `created_at`, `updated_at` (timestamptz)

2. Add RLS policies for tenant isolation:
   - `SELECT`: Tenant-scoped (own branding) + agency users (their clients' branding)
   - `INSERT/UPDATE/DELETE`: Tenant owners + agency admins

3. Link to existing `TenantConfig` pattern (Section 6.1).

4. Add API endpoints for branding CRUD (extend existing tenant config API or create new).

**Testing:** Unit tests for schema; integration tests for CRUD API; RLS policy tests.

---

### Task 8.2: Branded Report Generation

**Original:** 2.8.2
**Files:**

- `packages/report-generator/src/pdf-generator.ts` (MODIFY)
- `packages/report-generator/src/xlsx-format-generator.ts` (MODIFY)

**Implementation:**

1. PDF reports:
   - Apply tenant branding to header: agency logo, custom colors
   - Apply tenant branding to footer: custom footer text, agency name
   - Use `primary_color` for section headers and accents
   - Default to AgenticVerdict branding if no tenant branding configured

2. XLSX reports:
   - Apply tenant colors to sheet styling
   - Add agency logo to header row (if supported by XLSX library)
   - Custom sheet names with agency prefix

3. Branding resolution:
   - Fetch tenant branding from DB at report generation time
   - Cache branding config to avoid repeated DB queries
   - Fall back to defaults if branding is incomplete

4. Integrate with existing report generation pipeline — branding is an additional step after content generation.

**Testing:** Unit tests for branding application; visual regression tests for branded PDFs.

---

### Task 8.3: Branded Email Delivery

**Original:** 2.8.3
**File:** `apps/worker/src/services/email-delivery.ts` (MODIFY)

**Implementation:**

1. Custom email templates with agency branding:
   - Header: agency logo and name
   - Colors: tenant `primary_color` for links and accents
   - Footer: custom footer text, agency contact info

2. Custom sender name/address:
   - Use `sender_name` and `sender_email` from tenant branding
   - Fall back to default AgenticVerdict sender if not configured

3. Email template variants:
   - Insight ready notification
   - Report delivery notification
   - Schedule failure notification

4. Integrate with existing email delivery service — branding is applied during template rendering.

**Testing:** Unit tests for email template rendering; integration tests for sender configuration.

---

## 4. Tasks — Cross-Client Benchmarking

### Task 8.4: Aggregated Metrics Service

**Original:** 2.9.1
**File:** `packages/core/src/benchmarking/aggregator.ts` (NEW)

**Implementation:**

1. Create `BenchmarkAggregator` service:

   ```typescript
   interface BenchmarkResult {
     metric: string;
     domain: string;
     clientValue: number;
     percentile: number; // Client's percentile ranking
     aggregateMean: number; // Anonymized mean across all clients
     aggregateMedian: number; // Anonymized median
     aggregateP25: number; // 25th percentile
     aggregateP75: number; // 75th percentile
     sampleSize: number; // Number of clients in aggregate
   }
   ```

2. Compute anonymized aggregate metrics across tenants:
   - Group by domain (Marketing, Finance, SEO, Social, Local)
   - Calculate percentiles, mean, median, P25, P75
   - **Critical:** Never expose raw tenant data — only anonymized aggregates
   - Minimum sample size: 3 tenants before showing benchmarks (prevents de-anonymization)

3. Percentile ranking: Where does a specific client fall relative to the aggregate?

4. Industry benchmarks: Pre-computed benchmarks per domain (can be seeded or computed dynamically).

5. Data freshness: Aggregates computed on a schedule (daily or weekly), not real-time.

**Testing:** Unit tests for aggregation logic; verify no raw data exposure; test minimum sample size enforcement.

---

### Task 8.5: Benchmarking UI

**Original:** 2.9.2
**File:** `apps/frontend/src/features/agency/ui/BenchmarkDashboard.tsx` (NEW)

**Implementation:**

1. Dashboard component showing:
   - Charts comparing client performance vs aggregate (bar charts, radar charts)
   - Domain-specific benchmarks (marketing, finance, etc.) per Section 5
   - Percentile rankings per metric
   - Trend over time (how client's percentile changes)

2. Access control: Only visible to Agency Partner users with Analyst role (Section 4.2).

3. Features:
   - Select client tenant to benchmark
   - Select domain for benchmarking
   - Select time range
   - Export benchmark report (PDF/XLSX)

4. Visual design:
   - Client performance highlighted
   - Aggregate shown as reference band/line
   - Percentile shown as badge (e.g., "Top 25%", "Above Average")

5. Integrate into agency dashboard as a sub-page or tab.

**Testing:** Component tests for chart rendering; E2E test: select tenant → view benchmarks → export.

---

## 5. File Change Summary

| File                                                          | Action     | Type                                  |
| ------------------------------------------------------------- | ---------- | ------------------------------------- |
| `packages/database/src/schema/tenant-branding.ts`             | **Create** | DB schema                             |
| `packages/report-generator/src/pdf-generator.ts`              | **Modify** | Apply branding                        |
| `packages/report-generator/src/xlsx-format-generator.ts`      | **Modify** | Apply branding                        |
| `apps/worker/src/services/email-delivery.ts`                  | **Modify** | Branded emails                        |
| `packages/core/src/benchmarking/aggregator.ts`                | **Create** | Aggregation service                   |
| `apps/frontend/src/features/agency/ui/BenchmarkDashboard.tsx` | **Create** | UI component                          |
| `apps/api/src/trpc/routers/`                                  | **Modify** | Add branding + benchmarking endpoints |

---

## 6. Testing Requirements

| Test Type   | Scope                                  | Coverage Target |
| ----------- | -------------------------------------- | --------------- |
| Unit        | Tenant branding CRUD                   | 90%+            |
| Unit        | Branding application to reports        | 85%+            |
| Unit        | BenchmarkAggregator (all calculations) | 90%+            |
| Unit        | Minimum sample size enforcement        | 100%            |
| Integration | Branded report generation              | 85%+            |
| Integration | Branded email delivery                 | 80%+            |
| Integration | Benchmarking API                       | 85%+            |
| Component   | BenchmarkDashboard                     | 80%+            |
| Security    | No raw tenant data in benchmarks       | 100%            |

---

## 7. Success Criteria

- [ ] Tenant branding configuration CRUD works
- [ ] PDF reports display agency branding (logo, colors, footer)
- [ ] XLSX reports display agency branding
- [ ] Email templates use agency branding and custom sender
- [ ] BenchmarkAggregator computes anonymized aggregates
- [ ] Minimum sample size enforced (3+ tenants)
- [ ] BenchmarkDashboard shows charts and percentile rankings
- [ ] Only Analyst role can access benchmarking
- [ ] No raw tenant data exposed in any benchmark output
- [ ] All tests pass

---

## 8. Dependencies on Other Plans

| Plan                          | Relationship | Notes                                                |
| ----------------------------- | ------------ | ---------------------------------------------------- |
| plan-07-agency-dashboard      | Depends on   | Requires agency infrastructure and tenant management |
| plan-05-delivery-enhancements | Depends on   | Uses report generation pipeline                      |
| plan-04-domain-mapping        | Depends on   | Benchmarking groups by domain                        |

---

## 9. Risk Mitigation

| Risk                                      | Mitigation                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| Agency cross-tenant data exposure         | **Critical** — Only anonymized aggregates; minimum sample size of 3          |
| Benchmarking reveals tenant identity      | Use statistical disclosure control; suppress results with small sample sizes |
| White-label branding breaks report layout | Visual regression tests; graceful fallback to default branding               |
| Email deliverability with custom sender   | Validate sender domain; SPF/DKIM configuration needed for custom domains     |
| Schema changes mid-development            | Use `make db:reset` to drop and recreate — no migration rollback needed      |
