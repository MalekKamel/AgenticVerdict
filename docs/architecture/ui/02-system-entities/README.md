# System Entities Catalog

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md)
- [UI System Overview](/docs/architecture/ui/00-overview.md)

---

## Overview

This catalog provides comprehensive documentation for all entities in the AgenticVerdict UI system. Each entity specification includes properties, relationships, lifecycle states, actions, accessibility requirements, internationalization considerations, and related components.

**Entity documentation is platform-agnostic** — these specifications apply to web, mobile, and CLI clients consuming the unified tRPC API.

---

## Entity Index

### Core Platform Entities

| Entity                | Documentation                                  | Description                                                             | Domains |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| **Tenant/Company**    | [tenant-company.md](./tenant-company.md)       | Multi-tenant organization container with localization and configuration | All     |
| **Users/Permissions** | [users-permissions.md](./users-permissions.md) | User accounts with role-based access control across tenants             | All     |

### Data Integration Entities

| Entity             | Documentation                            | Description                                                  | Domains                       |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| **Connectors**     | [connectors.md](./connectors.md)         | External platform integrations (Meta, GA4, GSC, GBP, TikTok) | Marketing, SEO, Social, Local |
| **Data Snapshots** | [data-snapshots.md](./data-snapshots.md) | Normalized metric data with multi-domain organization        | All                           |

### Intelligence & Reporting Entities

| Entity        | Documentation                                              | Description                                                       | Domains |
| ------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| **Insights**  | [insights-reports.md](./insights-reports.md)               | AI-generated analysis with configurable data sources and delivery | All     |
| **Reports**   | [insights-reports.md](./insights-reports.md#report-entity) | Generated output documents with multi-language support            | All     |
| **Templates** | [templates.md](./templates.md)                             | Pre-built configurations for rapid insight creation               | All     |

---

## Entity Relationships

### Primary Relationship Graph

```
Tenant/Company (1)
├── Users (0-N)
│   └── Permissions (Role-Based)
│
├── Connectors (0-N)
│   └── Data Snapshots (0-N per connector)
│
├── Insights (0-N)
│   ├── Connectors (1-N)
│   ├── Templates (0-1, optional initialization)
│   ├── Schedule (1)
│   └── Delivery Configuration (1)
│       └── Reports (0-N, generated over time)
│
└── Templates (0-N)
    └── Insights (0-N, initialized from template)
```

### Cross-Domain Data Flow

```
Data Connectors (Multi-Domain)
    ↓
Normalized Data Snapshots
    ↓
Insight Configuration (per Business Domain)
    ↓
AI Agent Analysis
    ↓
Report Generation (Multi-Language)
    ↓
Delivery (Email, Dashboard, Export)
```

---

## Domain Coverage

The AgenticVerdict platform supports **multiple business domains** through a unified connector and insight architecture:

| Domain             | Key Connectors               | Insight Types                          | Business Questions                    |
| ------------------ | ---------------------------- | -------------------------------------- | ------------------------------------- |
| **Marketing**      | GA4, Meta, TikTok            | Campaign Performance, ROI Analysis     | How effective is our marketing spend? |
| **SEO**            | GA4, GSC                     | Search Visibility, Keyword Performance | How visible are we in search results? |
| **Social Media**   | Meta, TikTok                 | Engagement, Reach, Followers           | How is our social content performing? |
| **Local Business** | GBP                          | Calls, Directions, Reviews             | How are customers finding us locally? |
| **Finance**        | QuickBooks, Stripe (planned) | Revenue, Expenses, Profit              | What is our financial health?         |
| **Operations**     | Custom connectors (planned)  | KPIs, Performance Metrics              | How efficiently are we operating?     |

**Connector Reuse:** The same connector can serve multiple business domains. For example, GA4 provides data for both Marketing and SEO insights, demonstrating the **multi-domain connector architecture**.

---

## Multi-Tenant Architecture

### Tenant Isolation

All entities operate within strict tenant boundaries:

- **Data Isolation:** Row-level security at database level
- **Configuration Isolation:** Each tenant has independent `CompanyConfig`
- **Visual Isolation:** Agency partners switch between tenants without data mixing
- **Resource Isolation:** Per-tenant rate limiting and quotas

### Agency Partner Model

Agency partners have enhanced capabilities:

| Capability              | Direct Business | Agency Partner |
| ----------------------- | --------------- | -------------- |
| Manage own insights     | ✅              | ✅             |
| Manage connectors       | ✅              | ✅             |
| View own reports        | ✅              | ✅             |
| Access client companies | ❌              | ✅             |
| Create client insights  | ❌              | ✅             |
| View client reports     | ❌              | ✅             |
| White-label reporting   | ❌              | ✅ (Phase 2)   |

---

## Entity Lifecycle Patterns

### Standard Lifecycle States

Most entities follow this lifecycle pattern:

```
CREATED → ACTIVE → SUSPENDED/ARCHIVED → DELETED
```

**State-Specific Behaviors:**

| State         | Description                              | UI Representation           | Allowed Actions   |
| ------------- | ---------------------------------------- | --------------------------- | ----------------- |
| **CREATED**   | Initial state, configuration incomplete  | Badge: "Setup"              | Edit properties   |
| **ACTIVE**    | Fully operational, visible in dashboards | Badge: "Active" (green)     | All operations    |
| **SUSPENDED** | Temporarily disabled, data preserved     | Badge: "Suspended" (orange) | Resume, Edit      |
| **ARCHIVED**  | Read-only, not in active use             | Badge: "Archived" (gray)    | View, Restore     |
| **DELETED**   | Soft delete, purged after retention      | Hidden                      | Purge permanently |

### Connector-Specific States

Connectors have additional health states:

```
DISCONNECTED → AUTHENTICATING → CONNECTED → ERROR
```

---

## Accessibility Compliance

All entities meet **WCAG 2.1 Level AA** requirements with **Level AAA for critical paths**:

### Universal Requirements

- **Keyboard Navigation:** All interactive elements accessible via Tab/Enter/Space
- **Screen Reader Support:** Semantic HTML, ARIA labels, live regions
- **Color Contrast:** Minimum 4.5:1 for text, 3:1 for large text
- **Touch Targets:** Minimum 44×44px for mobile
- **Focus Indicators:** Visible focus rings on all interactive elements
- **Error Identification:** Clear error messages with suggested corrections

### Entity-Specific Requirements

Each entity documentation includes:

- Keyboard navigation patterns
- Screen reader announcements
- High-contrast mode considerations
- Error handling and recovery
- Responsive design breakpoints

---

## Internationalization (i18n)

### Language Support

| Language | Code | Direction | Status                 |
| -------- | ---- | --------- | ---------------------- |
| Arabic   | `ar` | RTL       | ✅ First-class support |
| English  | `en` | LTR       | ✅ First-class support |

### RTL/LTR Considerations

- **Logical Properties:** Use `margin-inline-start` instead of `margin-left`
- **Layout Mirroring:** Flexbox/grid automatically reverse direction
- **Icon Mirroring:** Directional icons flip automatically
- **Text Alignment:** Use `text-align: start` instead of `text-align: left`
- **UI Testing:** All components tested in both RTL and LTR

### Locale Formatting

- **Dates:** Formatted per tenant timezone (`2026-04-13` → `13 أبريل 2026`)
- **Currency:** Localized symbols and formatting (`SAR`, `USD`, `EUR`)
- **Numbers:** Locale-specific separators (`1,234.56` vs `1.234,56`)
- **Timezones:** Display times in tenant's configured timezone

---

## Design System Integration

All entity UI implementations follow the [AgenticVerdict UI System](/docs/architecture/ui/00-overview.md):

### Component Hierarchy

```
Templates (Page Layouts)
└── Organisms (Complex Sections)
    └── Molecules (Simple Combinations)
        └── Atoms (Basic Building Blocks)
```

### Design Token System

```css
/* Global tokens (brand-agnostic) */
--global-color-primary: #228be6;
--global-spacing-md: 1rem;

/* Brand tokens (tenant-specific) */
--brand-color-primary: #ff6b35; /* Masafh orange */

/* Component tokens (composed) */
--button-primary-bg: var(--brand-color-primary, var(--global-color-primary));
```

---

## API Integration

All entity operations use the **unified tRPC API** serving multiple client types:

| Client Type               | Type Safety           | API Access  |
| ------------------------- | --------------------- | ----------- |
| **Web** (TanStack Start)  | ✅ Full end-to-end    | tRPC client |
| **Mobile** (React Native) | ✅ Full end-to-end    | tRPC client |
| **CLI** (Node.js)         | ⚠️ Runtime validation | HTTP client |

### tRPC Router Organization

```
api/
├── tenants/         # Tenant/company management
├── users/           # User and permission management
├── connectors/      # Data connector operations
├── insights/        # Insight configuration and management
├── reports/         # Report generation and retrieval
└── templates/       # Template management
```

---

## Related Documentation

### Architecture

- [Business Architecture](/docs/architecture/business/business-architecture.md) - Domain entities and relationships
- [Technical Architecture](/docs/architecture/business/technical-architecture.md) - System architecture and components
- [Implementation Guide](/docs/architecture/business/implementation-guide.md) - Patterns and conventions

### UI System

- [UI System Overview](/docs/architecture/ui/00-overview.md) - Design system and technology stack
- [Design System Research](/docs/architecture/ui/01-research-findings/) - Comprehensive design research

### Project Management

- [Requirements](/docs/05-project-management/requirements.md) - Functional and non-functional requirements
- [Project Charter](/docs/05-project-management/project-charter.md) - Project goals and scope

### Specifications

- [Core Platform: Foundation](/specs/00-core/00-foundation/) - Infrastructure and setup
- [Core Platform: Connectors](/specs/00-core/01-connectors/) - Data integration specifications

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 1 completion
**Maintainer:** UI/UX Team

**Change History:**

- 2026-04-13: Initial entity catalog creation with comprehensive cross-references
