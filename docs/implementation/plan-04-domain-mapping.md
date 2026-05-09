# Implementation Plan 04 — Domain Mapping Service

**Phase:** P2 (Multi-Tenant & Agency Features)
**Original Reference:** Comprehensive Plan §2.7 (Tasks 2.7.1 – 2.7.2)
**Priority:** P2 — Prerequisite for agency features and detail page polish
**Estimated Effort:** 2 tasks, ~1 day

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. All database changes use **destructive approaches**:

- No migration files with up/down — use `make db:push` to apply schema directly
- No backward compatibility concerns — break freely, rename freely, drop freely
- If a schema change is needed mid-development, drop the table and recreate it
- After any schema change, run `make db:reset` to rebuild from scratch

---

## 1. Overview

Create a domain-to-connector mapping service that enables filtering insights and templates by business domain (Marketing, Finance, SEO, Social, Local). Per the business architecture (Section 2.3), connectors have domain tags (e.g., GA4 → Marketing, Analytics, Web), and the Business Metrics Framework (Section 5) organizes metrics by domain.

### Business Value

- Enables domain-based filtering across template browser, insight list, and agency dashboard
- Supports cross-domain intelligence ("Unified Intelligence" — Section 1.2)
- Prerequisite for domain badges on insight cards (plan-06, Task 6.4)

### Key Design Decision

The domain mapper reads from the connector registry as the **source of truth**, not duplicating domain mappings. This prevents drift between connector definitions and domain assignments.

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component                  | Location                                                          | Notes                               |
| -------------------------- | ----------------------------------------------------------------- | ----------------------------------- |
| Connector Registry         | `packages/core/src/connectors/`                                   | Source of truth for connectors      |
| `useConnectorDomains` hook | Frontend                                                          | Partially implemented; needs wiring |
| Template registry domains  | `packages/core/src/templates/template-registry.ts` (from plan-01) | Templates define domains inline     |
| Insight list page          | `apps/frontend/src/features/insights/pages/InsightListPage.tsx`   | Target for domain filtering         |

### Dependencies

| Plan                       | Relationship | Notes                                               |
| -------------------------- | ------------ | --------------------------------------------------- |
| plan-01-insight-templates  | Reads from   | Template registry defines domains per template      |
| plan-06-detail-page-polish | Provides     | Detail plan 2.5.4 (domain badges) uses this service |

---

## 3. Tasks

### Task 4.1: Domain-to-Connector Mapping Service

**Original:** 2.7.1
**File:** `packages/core/src/domains/domain-mapper.ts` (NEW)

**Implementation:**

1. Create `DomainMapper` class/service that reads from connector registry:

   ```typescript
   interface ConnectorDomainMapping {
     connectorId: string;
     primaryDomain: string;
     secondaryDomains: string[];
     allDomains: string[]; // primary + secondary
   }
   ```

2. Define mappings per business architecture Section 2.3:

   | Connector  | Primary Domain | Secondary Domains |
   | ---------- | -------------- | ----------------- |
   | GA4        | Marketing      | Analytics, Web    |
   | Meta       | Marketing      | Social            |
   | GSC        | Analytics      | SEO, Web          |
   | GBP        | Analytics      | Local, Marketing  |
   | TikTok     | Marketing      | Social, Video     |
   | QuickBooks | Finance        | Accounting        |
   | Stripe     | Finance        | Payments          |

3. Provide API methods:
   - `getDomainsForConnector(connectorId)` → string[]
   - `getConnectorsForDomain(domain)` → string[]
   - `getAllDomains()` → string[] (canonical list)
   - `filterInsightsByDomain(insights, domain)` → filtered insights

4. Support multi-domain connectors (most connectors have 2-3 domains).

5. Domain list is canonical: Marketing, Finance, SEO, Social, Local, Analytics, Executive.

**Testing:** Unit tests for all mapping methods; verify no drift from connector registry.

---

### Task 4.2: Domain Filtering in List Page

**Original:** 2.7.2
**Files:**

- `apps/frontend/src/features/insights/pages/InsightListPage.tsx` (MODIFY)
- `apps/frontend/src/features/insights/hooks/useConnectorDomains.ts` (MODIFY)

**Implementation:**

1. Wire `useConnectorDomains` hook to use `DomainMapper` service:
   - Fetch domains from API (new endpoint or extend existing)
   - Cache domains client-side
   - Provide `filterByDomain(domain)` method

2. Add domain filter to insight list page:
   - Domain pill/chip selector in filter bar
   - Show domain badges on insight cards (derived from insight's connectors)
   - Enable filtering insights by domain

3. Domain filter should compose with existing filters (status, search, date range).

4. If `useConnectorDomains` already exists, extend it rather than replace.

**Testing:** Component tests for domain filter; verify filtering logic composes with other filters.

---

## 4. File Change Summary

| File                                                               | Action     | Type                                     |
| ------------------------------------------------------------------ | ---------- | ---------------------------------------- |
| `packages/core/src/domains/domain-mapper.ts`                       | **Create** | Core service                             |
| `apps/frontend/src/features/insights/hooks/useConnectorDomains.ts` | **Modify** | Wire to domain mapper                    |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx`    | **Modify** | Add domain filter                        |
| `apps/api/src/trpc/routers/insights.ts`                            | **Modify** | Add domain filter param (if not present) |

---

## 5. Testing Requirements

| Test Type   | Scope                           | Coverage Target |
| ----------- | ------------------------------- | --------------- |
| Unit        | DomainMapper (all methods)      | 90%+            |
| Unit        | Multi-domain connector handling | 100%            |
| Integration | Domain filter API endpoint      | 85%+            |
| Component   | Domain filter UI                | 80%+            |
| E2E         | Filter insights by domain       | Full flow       |

---

## 6. Success Criteria

- [ ] `DomainMapper` service correctly maps all connectors to domains
- [ ] `getConnectorsForDomain()` returns correct connectors for each domain
- [ ] Domain filter works on insight list page
- [ ] Domain badges display on insight cards
- [ ] Domain filter composes with existing filters
- [ ] All tests pass

---

## 7. Dependencies on Other Plans

| Plan                       | Relationship | Notes                                            |
| -------------------------- | ------------ | ------------------------------------------------ |
| plan-01-insight-templates  | Reads from   | Uses template domain data                        |
| plan-06-detail-page-polish | Provides     | Task 6.4 (domain badges in ConfigurationSummary) |
| plan-07-agency-dashboard   | Provides     | Agency features use domain filtering             |
| plan-08-advanced-features  | Provides     | Benchmarking uses domain-specific groupings      |

---

## 8. Risk Mitigation

| Risk                                        | Mitigation                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| Domain mapper drift from connector registry | DomainMapper reads from connector registry at runtime, not hardcoded    |
| New connectors added without domains        | Add validation: all connectors must have at least one domain            |
| Domain list inconsistency                   | Canonical domain list defined in one place, exported for all consumers  |
| Schema changes mid-development              | Use `make db:reset` to drop and recreate — no migration rollback needed |
