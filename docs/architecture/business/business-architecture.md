# Business Architecture

**Document Version:** 1.0
**Last Updated:** 2026-04-11
**Status:** Active
**Audience:** Business Stakeholders, Product Managers, Architects

---

## Executive Summary

AgenticVerdict is a **multi-business-domain intelligence platform** that transforms how organizations understand their performance across marketing, finance, operations, and other domains. The platform automates the collection, analysis, and reporting of business metrics through:

- **Unified Data Integration:** Connect to multiple platforms and data sources through reusable connectors
- **AI-Powered Analysis:** Generate actionable insights and recommendations using advanced LLMs
- **Automated Delivery:** Schedule and deliver reports to stakeholders via multiple channels
- **Multi-Tenant Architecture:** Serve both direct businesses and agency partners with complete data isolation

---

## 1. Business Domain

### 1.1 Problem Statement

Modern businesses face three critical challenges in data-driven decision-making:

| Challenge                    | Impact                                | Current Solution                                |
| ---------------------------- | ------------------------------------- | ----------------------------------------------- |
| **Data Fragmentation**       | Metrics scattered across 5+ platforms | Manual data compilation (10+ hours/month)       |
| **Single-Platform Analysis** | Missed cross-domain patterns          | Siloed insights without correlation             |
| **Generic Reporting**        | One-size-fits-all doesn't fit         | Context-free dashboards without recommendations |

### 1.2 Value Proposition

AgenticVerdict delivers:

- **Unified Intelligence:** Single platform for marketing, finance, operations, and other domains
- **AI-Generated Insights:** Automated analysis with actionable recommendations, not just data
- **Self-Service Configuration:** Business users create Insights without IT dependency
- **Flexible Deployment:** Desktop, Web, Cloud, or self-hosted options
- **Agency Partner Support:** Manage multiple client companies with tenant isolation

---

## 2. Core Business Entities

### 2.1 Company Model

The platform supports two company types:

| Company Type        | Description                                 | Primary Use Case                         |
| ------------------- | ------------------------------------------- | ---------------------------------------- |
| **Direct Business** | End consumer running their own intelligence | Masafh (GPS fleet tracking)              |
| **Agency Partner**  | Managing multiple client companies          | Marketing agencies overseeing 20+ brands |

### 2.2 Entity Relationships

```
Company (1)
├── Insights (0-N)
│   ├── Connectors (1-N)
│   ├── Metrics (0-N per connector)
│   ├── Schedule (1)
│   └── Delivery Configuration (1)
│
├── Templates (0-N)
│
└── Users (0-N)
    └── Permissions (Role-Based Access Control)
```

### 2.3 Data Connectors

Data connectors are **reusable business assets** with domain tags and embedded metrics:

| Connector                | Domains                     | Key Metrics                    | Insight Types                           |
| ------------------------ | --------------------------- | ------------------------------ | --------------------------------------- |
| **GA4**                  | Marketing, Analytics, Web   | Sessions, Conversions, Revenue | Marketing Dashboard, Finance Insight    |
| **Meta**                 | Marketing, Social           | Reach, Impressions, ROAS       | Social Media Insight, Campaign Analysis |
| **GSC**                  | Analytics, SEO, Web         | Impressions, Clicks, CTR       | SEO Insight, Marketing Dashboard        |
| **GBP**                  | Analytics, Local, Marketing | Calls, Directions, Reviews     | Local Marketing Insight                 |
| **TikTok**               | Marketing, Social, Video    | Views, Engagement, Followers   | Social Media Insight                    |
| **QuickBooks** (planned) | Finance, Accounting         | Revenue, Expenses, Profit      | Finance Insight                         |
| **Stripe** (planned)     | Finance, Payments           | Transactions, MRR, Churn       | Finance Insight                         |

### 2.4 Insight Configuration

Insights are fully configurable business entities that define:

- **Data Sources:** Which connectors to include
- **Metric Selection:** Which metrics to track from each connector
- **AI Configuration:** Model selection, quality level, detail level
- **Schedule:** When and how often to run
- **Delivery:** Format, recipients, channels

**Template-Based Initialization:** All properties can be initialized from templates, with **full customization** preserved.

---

## 3. Business Processes

### 3.1 Intelligence Pipeline

Every business report follows this lifecycle:

```
COLLECT DATA → ANALYZE METRICS → GENERATE INTELLIGENCE → DELIVER INSIGHT
```

| Stage                            | Business Output          | Owner                |
| -------------------------------- | ------------------------ | -------------------- |
| **Collect Data from Connectors** | Raw business data        | Platform (automated) |
| **Analyze and Normalize**        | Calculated metrics       | Platform (automated) |
| **Generate Actionable Insights** | Business recommendations | AI Agent             |
| **Deliver to Stakeholders**      | Decision-ready reports   | Platform (automated) |

### 3.2 Insight Creation Workflow

```
1. User accesses Admin Dashboard
2. Browses available Data Connectors (filtered by domain)
3. Creates Insight from Template or from scratch
4. Selects Data Connectors
5. Chooses Business Metrics per connector
6. Configures AI Settings (optional, uses smart defaults)
7. Sets Schedule and Delivery preferences
8. Insight is activated
```

### 3.3 Agency Partner Workflow

Agency partners manage multiple clients through:

- **Multi-Tenant Dashboard:** Switch between companies instantly
- **Client Onboarding:** Rapid provisioning with templates
- **White-Label Reporting:** Agency branding on client reports
- **Aggregate Oversight:** Monitor all client Insights from one interface

---

## 4. Stakeholder Requirements

### 4.1 Direct Business Users

| Role                      | Requirements                            | Value Delivered                                     |
| ------------------------- | --------------------------------------- | --------------------------------------------------- |
| **Business Owners**       | High-level overview, strategic insights | Executive summaries with actionable recommendations |
| **Marketing Managers**    | Campaign performance, ROI analysis      | Cross-platform marketing intelligence               |
| **Financial Controllers** | Revenue tracking, expense monitoring    | Automated financial reports with alerts             |
| **Operations Leads**      | KPI tracking, performance monitoring    | Operational dashboards with trend analysis          |

### 4.2 Agency Partner Users

| Role                 | Requirements                         | Value Delivered                                    |
| -------------------- | ------------------------------------ | -------------------------------------------------- |
| **Agency Owners**    | Multi-client management, scalability | Centralized oversight, client billing transparency |
| **Account Managers** | Client reporting efficiency          | White-label reports, bulk delivery                 |
| **Analysts**         | Data access across clients           | Cross-client benchmarking (aggregated)             |

### 4.3 Platform Operators

| Role               | Requirements                       | Value Delivered                             |
| ------------------ | ---------------------------------- | ------------------------------------------- |
| **Administrators** | User management, access control    | Role-based permissions, audit logs          |
| **Support Staff**  | Troubleshooting, health monitoring | Connector health dashboards, error tracking |
| **Developers**     | Extensibility, integration         | Plugin architecture, API access (Phase 3)   |

---

## 5. Business Metrics Framework

### 5.1 Marketing Domain

| Metric      | Category    | Business Question                    |
| ----------- | ----------- | ------------------------------------ |
| Sessions    | Traffic     | How many people visited?             |
| Conversions | Performance | How many completed desired actions?  |
| ROAS        | Efficiency  | What's the return on ad spend?       |
| CPA         | Efficiency  | How much does each acquisition cost? |
| CTR         | Engagement  | How compelling is the creative?      |

### 5.2 Finance Domain

| Metric   | Category      | Business Question         |
| -------- | ------------- | ------------------------- |
| Revenue  | Income        | How much money coming in? |
| Expenses | Cost          | How much money going out? |
| Profit   | Profitability | What's the bottom line?   |
| CAC      | Efficiency    | Cost to acquire customer  |
| LTV:CAC  | Efficiency    | Unit economics health     |

### 5.3 SEO Domain

| Metric          | Category   | Business Question           |
| --------------- | ---------- | --------------------------- |
| Organic Traffic | Traffic    | SEO-driven visitors         |
| Rankings        | Visibility | Where do we rank?           |
| Impressions     | Visibility | Search visibility           |
| CTR             | Engagement | How compelling are results? |

### 5.4 Social Media Domain

| Metric          | Category   | Business Question        |
| --------------- | ---------- | ------------------------ |
| Followers       | Audience   | Audience size            |
| Reach           | Exposure   | Content exposure         |
| Engagement Rate | Engagement | How engaging is content? |
| Shares          | Virality   | Content amplification    |

### 5.5 Local Business Domain

| Metric     | Category   | Business Question     |
| ---------- | ---------- | --------------------- |
| Calls      | Actions    | Lead generation       |
| Directions | Actions    | Foot traffic driver   |
| Reviews    | Reputation | Customer feedback     |
| Rating     | Reputation | Customer satisfaction |

---

## 6. Multi-Tenancy Model

### 6.1 Tenant Isolation

The platform implements complete tenant isolation through:

- **Data Isolation:** Row-level security ensures tenants only access their own data
- **Configuration Isolation:** Each tenant has independent CompanyConfig
- **Resource Isolation:** Per-tenant rate limiting and quotas
- **Visual Isolation:** Agencies can switch between clients without data mixing

### 6.2 Agency Partner Capabilities

| Capability               | Direct Business | Agency Partner |
| ------------------------ | --------------- | -------------- |
| Create/edit own Insights | ✓               | ✓              |
| Manage data connectors   | ✓               | ✓              |
| View own reports         | ✓               | ✓              |
| Access client companies  | —               | ✓              |
| Create client Insights   | —               | ✓              |
| View client reports      | —               | ✓              |
| White-label reporting    | —               | ✓ (Phase 2)    |

---

## 7. Business Benefits

### 7.1 For Business Users

- **Self-Service Intelligence:** Create Insights without IT dependency
- **Template Acceleration:** Start from pre-built configurations, then customize fully
- **Multi-Domain Intelligence:** Connect marketing, finance, operations data
- **Flexible Configuration:** Choose exactly which metrics matter
- **AI Customization:** Use system defaults or tailor AI settings for quality/cost control
- **Automated Delivery:** Insights arrive when needed, no manual effort
- **Scalable Platform:** Add new data connectors as business grows

### 7.2 For Agency Partners

- **Multi-Tenant Management:** Oversee all client companies from one dashboard
- **Tenant Isolation:** Each client's data remains completely separate
- **Client Onboarding:** Quickly provision new companies with templates
- **Centralized Oversight:** Monitor all client Insights from one interface
- **Self-Hosted Control:** Deploy on own infrastructure for data sovereignty

---

## 8. Deployment Flexibility

AgenticVerdict offers multiple deployment options to suit different business needs:

| Deployment Option        | Best For                    | Description                                  |
| ------------------------ | --------------------------- | -------------------------------------------- |
| **Desktop (Electron)**   | Privacy-focused teams       | Run locally with full data control           |
| **Web**                  | Quick access, collaboration | Browser-based interface with instant updates |
| **Cloud (Hosted)**       | Hands-off operation         | Fully managed service                        |
| **Self-Hosted (Docker)** | Enterprise compliance       | Deploy on own servers                        |

All deployment options share the same codebase and feature set — teams can switch between them as needs evolve.

---

## 9. Success Criteria

### 9.1 Business Capabilities

- Multi-domain intelligence (Marketing, Finance, Operations)
- Self-service configuration without developer assistance
- Template-based customization with full property override
- Connector reuse across multiple Insight types
- Flexible metrics selection per connector
- Automated delivery on schedule
- Agency Partner support with tenant isolation

### 9.2 Product Metrics

- 70%+ of Insights created from templates
- 50%+ of companies using 2+ connector types
- 90%+ of users customize template properties
- <5 minutes average Insight creation time

### 9.3 Business Metrics

- 10 paying customers within 3 months of launch
- 2+ agency partners with 5+ clients each
- <$1 CAC through product-led growth
- > $500 MRR within 6 months

---

## Appendix A: Insight Templates

The platform includes pre-built templates for common business needs:

| Template                    | Business Purpose            | Data Connectors         | Key Metrics                            |
| --------------------------- | --------------------------- | ----------------------- | -------------------------------------- |
| **Marketing Insight**       | Track marketing performance | GA4, Meta, TikTok       | Sessions, Conversions, Spend, ROI      |
| **Finance Insight**         | Monitor financial health    | GA4, QuickBooks, Stripe | Revenue, Expenses, Profit Margin       |
| **SEO Performance Insight** | Analyze search visibility   | GA4, GSC                | Organic Traffic, Clicks, CTR, Position |
| **Social Media Insight**    | Evaluate social engagement  | Meta, TikTok            | Reach, Engagement, Followers           |
| **Executive Summary**       | Cross-domain overview       | All enabled             | Strategic KPIs across domains          |

**Full Customization:** Every template property remains editable after creation — connectors, metrics, AI settings, schedules, delivery methods, and filters.

---

## Appendix B: Related Documents

- **Technical Architecture:** `/docs/architecture/business/technical-architecture.md`
- **Implementation Guide:** `/docs/architecture/business/implementation-guide.md`
- **System Overview:** `/docs/00-overview/system-overview.md`
- **Requirements:** `/docs/04-project-management/requirements.md`
- **Project Charter:** `/docs/04-project-management/project-charter.md`

---

**Document Status:** ✅ Active
**Next Review:** After Phase 1 completion
**Maintainer:** Product Team
