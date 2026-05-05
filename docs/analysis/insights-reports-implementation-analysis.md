# Insights & Reports Implementation Analysis

**Date:** 2026-05-03  
**Purpose:** Gap analysis between current implementation and existing documentation (`/docs/architecture/ui/04-pages/insights-reports.md`)  
**Scope:** Insights and Reports features across database, API, worker, and frontend layers

---

## Executive Summary

The existing documentation was written **before current implementation** and contains significant drift from the actual codebase. Key findings:

1. **Database schema differs substantially** from documented data model
2. **Frontend features not yet implemented** (no dedicated insights/reports pages)
3. **API routes implemented differently** than documented patterns
4. **Report generator architecture** is more abstract than documented
5. **Multi-tenant patterns** are consistent with Connectors implementation

**Recommendation:** Rewrite documentation to reflect current implementation state while preserving intended UX patterns.

---

## 1. Database Schema Analysis

### 1.1 Insights Entity

**Documented Schema:**

- 25+ columns including `status`, `domain`, `connectors[]`, `connectorMetrics`, `aiModel`, `aiProvider`, `scheduleFrequency`, `deliveryFormat`, `language`, `currency`
- Enums for status, domain, AI provider, quality levels, schedule frequency, delivery format

**Actual Schema (`packages/database/src/schema/core/insights.ts`):**

```typescript
insights: {
  id, tenantId, name, description, templateId,
  enabled: boolean,
  schedule: jsonb,      // Not normalized fields
  delivery: jsonb,      // Not normalized fields
  aiConfig: jsonb,      // Not normalized fields
  createdAt
}

insight_connectors: {
  id, insightId, connectorId, enabled,
  selectedMetrics: jsonb,
  filters: jsonb
}
```

**Gaps:**
| Aspect | Documented | Actual | Impact |
|--------|-----------|--------|--------|
| Status field | `status` enum (DRAFT, ACTIVE, PAUSED, ARCHIVED) | `enabled` boolean | Simplified lifecycle |
| Domain field | `domain` enum | Not present | Domain extracted from connectors |
| AI config | 7 normalized columns | Single `jsonb` column | More flexible but less validated |
| Schedule | 5 normalized columns | Single `jsonb` column | More flexible but less validated |
| Delivery | 7 normalized columns | Single `jsonb` column | More flexible but less validated |
| Connectors | Array column | Separate junction table | ✅ Correctly normalized |

**Recommendation:** Update documentation to reflect JSONB-based flexible configuration approach. This is actually **more modern and flexible** than documented schema.

### 1.2 Reports Entity

**Documented Schema:**

- 13 columns including `insightId`, `status`, `format`, `language`, `generatedAt`, `dateRangeStart`, `dateRangeEnd`, `fileUrl`, `fileSize`, `pageCount`, `deliveryStatus`

**Actual Schema (`packages/database/src/schema/reports.ts`):**

```typescript
reports: {
  id, tenantId,
  title: varchar(512),
  status: varchar(64).default("draft"),
  metadata: jsonb,
  createdAt, updatedAt
}
```

**Gaps:**
| Aspect | Documented | Actual | Impact |
|--------|-----------|--------|--------|
| Parent relation | `insightId` FK | Not present | Reports are standalone, not insight-linked |
| Format | `format` enum | In `metadata` JSONB | More flexible |
| Language | `language` column | In `metadata` JSONB | More flexible |
| File storage | `fileUrl` column | Blob storage via `report-store.ts` | Better separation |
| Version tracking | Not mentioned | Version snapshots in metadata | ✅ Advanced feature not documented |
| Retention | Not mentioned | `retentionDays` in metadata | ✅ Advanced feature not documented |
| Audit trail | Not mentioned | Separate `report-audit-store.ts` | ✅ Advanced feature not documented |

**Recommendation:** Document reports as **standalone entities** with versioning, blob storage, and audit trail. The actual implementation is **more sophisticated** than documented.

---

## 2. API Routes Analysis

### 2.1 Insights API

**Documented Pattern:** tRPC routes with detailed input/output schemas

**Actual Implementation (`apps/api/src/routes/v1/insights.ts`):**

```typescript
GET /api/v1/insights
  Query params: type, minConfidence, minRelevance, sort, limit, offset
  Response: { insights, total, limit, offset }

Features:
- JWT authentication
- Tenant context binding
- Rate limiting (100 req/min)
- Redis caching (5 min TTL)
- Filtering by type, confidence, relevance
- Sorting by relevance, confidence, created
```

**Gaps:**
| Endpoint | Documented | Actual | Status |
|----------|-----------|--------|--------|
| List insights | tRPC | REST `GET /insights` | ✅ Implemented (different pattern) |
| Create insight | tRPC | ❌ Missing | Not implemented |
| Get insight | tRPC | ❌ Missing | Not implemented |
| Update insight | tRPC | ❌ Missing | Not implemented |
| Delete insight | tRPC | ❌ Missing | Not implemented |
| Generate now | tRPC | ❌ Missing | Not implemented |
| Activate/Pause | tRPC | ❌ Missing | Not implemented |

**Assessment:** Only **list insights** is implemented. CRUD operations and actions are missing.

### 2.2 Reports API

**Documented Pattern:** Simple CRUD with generation triggers

**Actual Implementation (`apps/api/src/routes/v1/reports.ts`):**

```typescript
Advanced features implemented:
- Full CRUD (Create, Read, Update via content upload)
- Version management (list versions, get version content, compare versions)
- Blob storage (PUT /reports/:id/content)
- Sharing system (create share links, download via token)
- Delivery system (enqueue email delivery via BullMQ)
- Audit trail (compliance audit, summary)
- Retention management (set retention, sweep past retention)
- Archive/unarchive
- Webhook ingestion (Resend, SendGrid delivery events)
```

**Endpoints:**

- `GET /reports` - List reports
- `POST /reports` - Create report
- `GET /reports/:id` - Get report metadata
- `PUT /reports/:id/content` - Upload report bytes
- `GET /reports/:id/content` - Download report
- `POST /reports/:id/delivery` - Enqueue email delivery
- `POST /reports/:id/share-links` - Create share link
- `GET /reports/shared/:token/content` - Download via share token
- `GET /reports/:id/versions` - List versions
- `GET /reports/:id/versions/:version/content` - Get version content
- `POST /reports/:id/compare-versions` - Compare versions
- `PATCH /reports/:id/archive` - Archive report
- `PATCH /reports/:id/unarchive` - Unarchive report
- `PATCH /reports/:id/retention` - Set retention
- `POST /reports/retention/sweep` - Sweep past retention
- `GET /reports/compliance/audit` - Audit trail
- `GET /reports/compliance/summary` - Compliance summary
- `POST /reports/delivery-events/webhook` - Ingest delivery webhooks

**Assessment:** Reports API is **far more advanced** than documented. Includes enterprise features like versioning, sharing, audit trails, and compliance.

---

## 3. Frontend Implementation Analysis

### 3.1 Current State

**Documented Pages:**

- `/insights` - Insight list
- `/insights/new` - Create insight wizard
- `/insights/:id` - Insight detail
- `/insights/:id/edit` - Edit insight
- `/insights/:id/reports` - Report list
- `/reports/:id` - Report viewer
- `/insights/:id/export` - Export page

**Actual Frontend:**

```bash
apps/frontend/src/features/insights/     # ❌ DOES NOT EXIST
apps/frontend/src/features/reports/      # ❌ DOES NOT EXIST
```

**Insights Integration:**

- Dashboard home shows insights section (`HomeDashboardSurface.tsx`)
- Uses `use-insight-localization.ts` hook for i18n
- Insights displayed as cards with status, domains, timestamps
- No dedicated insight management pages

**Connectors Pattern (Reference):**

```bash
apps/frontend/src/features/connectors/
├── pages/
│   ├── ConnectorListPage.tsx
│   ├── ConnectorDetailPage.tsx
│   ├── ConnectorAddPage.tsx
│   ├── ConnectorConfigurePage.tsx
│   └── ConnectorRemovePage.tsx
├── api/
│   └── connector-api.ts
└── hooks/
    └── useConnectorPermissions.ts
```

**Gaps:**
| Feature | Documented | Actual | Priority |
|---------|-----------|--------|----------|
| Insight list page | `/insights` | Dashboard widget only | HIGH |
| Insight create wizard | Multi-step | ❌ Missing | HIGH |
| Insight detail page | Full dashboard | ❌ Missing | HIGH |
| Insight edit page | Form | ❌ Missing | MEDIUM |
| Report viewer | PDF/Excel viewer | ❌ Missing | HIGH |
| Report list | Table view | ❌ Missing | MEDIUM |
| Export page | Export config | ❌ Missing | LOW |

**Recommendation:** Implement insight/report pages following Connectors pattern for consistency.

---

## 4. Report Generator Analysis

### 4.1 Architecture

**Documented Pattern:** Direct generation with template → PDF/Excel

**Actual Implementation (`packages/report-generator/`):**

```typescript
BaseReportGenerator (abstract)
  ↓
DefaultReportGenerator
  ↓
FormatGeneratorRegistry
  ├── PDF generator (PDFKit)
  ├── Excel generator (SheetJS)
  └── Docx generator

Template Engine (abstract)
  ↓
Custom implementations
```

**Key Features:**

- Abstract base class for extensibility
- Format registry pattern for plugin architecture
- Template engine abstraction
- Context-based generation with tenant scoping
- Multi-step generation pipeline (before/after hooks)

**Assessment:** Architecture is **more sophisticated** than documented. Uses modern patterns (registry, strategy, template method).

---

## 5. Worker Integration Analysis

### 5.1 Report Queues

**Documented Pattern:** Simple job queue

**Actual Implementation (`apps/worker/src/queues/report-queues.ts`):**

```typescript
Report queues:
- report.delivery: Email delivery processing
- report.schedule: Scheduled report generation
- report.generation: Report content generation

Features:
- BullMQ with Redis
- Tenant-scoped queues
- Retry logic with backoff
- Dead letter queue
- Progress tracking
```

**Assessment:** ✅ Well-implemented, matches documented intent with better execution.

---

## 6. Multi-Tenancy & Security Analysis

### 6.1 Tenant Scoping

**Documented Pattern:** Tenant ID on all entities

**Actual Implementation:**

```typescript
// ✅ All entities have tenantId
insights.tenantId → tenants.id (cascade delete)
reports.tenantId → tenants.id (cascade delete)

// ✅ Tenant context propagation
JWT → AsyncLocalStorage → dbScoped() queries

// ✅ RLS alignment
All queries filtered by tenantId from context
```

**Assessment:** ✅ Perfectly aligned with multi-tenant guardrails.

### 6.2 Permissions

**Documented Pattern:** Role-based access

**Actual Implementation (Reports):**

```typescript
readRoles = ["analyst", "reports:read", "admin"];
writeRoles = ["reports:write", "admin"];
shareRoles = ["admin", "reports:share", "reports:write"];
```

**Assessment:** ✅ More granular than documented.

---

## 7. Advanced Features (Undocumented)

### 7.1 Report Versioning

**Implementation:**

- Immutable version snapshots with SHA-256 hashes
- Version comparison (hash equality, size delta)
- Historical version download
- Retention-based blob sweeping

**Status:** ✅ Implemented, ❌ Not documented

### 7.2 Audit Trail

**Implementation:**

- Immutable audit log (`report-audit-store.ts`)
- Events: created, content_uploaded, archived, retention_updated, compliance_viewed
- Compliance summary with event counts
- Request ID correlation

**Status:** ✅ Implemented, ❌ Not documented

### 7.3 Sharing System

**Implementation:**

- Time-limited share tokens
- Token-based download (no JWT required)
- Expiration tracking
- Share event logging

**Status:** ✅ Implemented, ❌ Not documented

### 7.4 Delivery Analytics

**Implementation:**

- Delivery event tracking (queued, sent, failed, bounced, complaint)
- Webhook ingestion (Resend, SendGrid)
- Recipient suppression on bounce/complaint
- Summary statistics

**Status:** ✅ Implemented, ❌ Not documented

---

## 8. Gaps Summary

### 8.1 Critical Gaps (Must Fix)

| Gap                        | Impact                           | Effort |
| -------------------------- | -------------------------------- | ------ |
| No frontend insight pages  | Users cannot manage insights     | HIGH   |
| No frontend report pages   | Users cannot view reports        | HIGH   |
| Insight CRUD API missing   | Cannot create/configure insights | HIGH   |
| Schema documentation wrong | Developers confused              | MEDIUM |

### 8.2 Documentation Gaps (Should Fix)

| Gap                               | Impact                        | Effort |
| --------------------------------- | ----------------------------- | ------ |
| Versioning not documented         | Feature unknown               | LOW    |
| Audit trail not documented        | Compliance feature hidden     | LOW    |
| Sharing system not documented     | Feature unknown               | LOW    |
| Delivery analytics not documented | Feature unknown               | LOW    |
| JSONB configuration pattern       | Flexible design not explained | MEDIUM |

### 8.3 Implementation Gaps (Could Fix)

| Gap                    | Impact                                  | Effort |
| ---------------------- | --------------------------------------- | ------ |
| No insight status enum | Simplified lifecycle                    | MEDIUM |
| No domain field        | Domain extraction from connectors       | LOW    |
| No tRPC routes         | Inconsistent API pattern                | MEDIUM |
| No insight templates   | Templates mentioned but not implemented | HIGH   |

---

## 9. Recommendations

### 9.1 Documentation Updates (Immediate)

1. **Rewrite `/docs/architecture/ui/04-pages/insights-reports.md`** to reflect:
   - JSONB-based configuration (schedule, delivery, aiConfig)
   - Standalone reports (not insight-linked)
   - Version management system
   - Audit trail and compliance features
   - Sharing and delivery analytics

2. **Update `/docs/architecture/ui/02-system-entities/insights-reports.md`** to reflect:
   - Actual database schema
   - Report versioning model
   - Blob storage pattern
   - Retention management

3. **Add new documentation:**
   - Report versioning guide
   - Audit trail and compliance
   - Sharing system design
   - Delivery analytics

### 9.2 Implementation Priorities

**Phase 1 (High Priority):**

- Implement insight CRUD API routes
- Create insight list page (follows ConnectorListPage pattern)
- Create insight detail page
- Create report viewer page

**Phase 2 (Medium Priority):**

- Implement insight create wizard
- Implement report list page
- Add insight status enum
- Add domain field or extraction logic

**Phase 3 (Low Priority):**

- Migrate to tRPC (if desired for consistency)
- Implement insight templates
- Add advanced filtering/sorting

### 9.3 Architecture Decisions

**Keep As-Is:**

- ✅ JSONB configuration columns (flexible, modern)
- ✅ Standalone reports (more flexible than insight-linked)
- ✅ Version management (enterprise feature)
- ✅ Audit trail (compliance requirement)
- ✅ Blob storage separation (clean architecture)

**Consider Refactoring:**

- 🔶 Add insight status enum (clearer lifecycle)
- 🔶 Add domain extraction/indexing (better filtering)
- 🔶 Consider tRPC for consistency (if frontend adopts)

---

## 10. Conclusion

The current implementation is **more sophisticated** than documented in several areas (reports, versioning, audit, sharing) but **less complete** in others (insight CRUD, frontend pages).

**Key Insight:** The architecture has evolved toward **flexibility** (JSONB columns, standalone reports) and **enterprise features** (versioning, audit, compliance) that weren't in the original design.

**Next Steps:**

1. Update documentation to match current implementation
2. Implement missing frontend pages (following Connectors pattern)
3. Complete insight CRUD API
4. Consider adding status/domain fields for better UX

**Estimated Effort:**

- Documentation update: 1-2 days
- Frontend pages: 3-5 days
- Insight CRUD API: 1-2 days
- **Total: 5-9 days**

---

**Analysis Completed:** 2026-05-03  
**Analyst:** AI Agent  
**Review Status:** Pending human review
