## Why

The current AI provider configuration system lacks a unified management interface for tenants to configure AI providers, define business domains, manage templates, and monitor usage. This change implements a comprehensive UI for AI provider management with hierarchical configuration (tenant → domain → connector), usage tracking, and budget controls.

## What Changes

- **New**: Tenant-level AI provider management page with provider selection and configuration
- **New**: Domain-level provider override system with inheritance visualization
- **New**: Business domain management interface for organizing connectors by business function
- **New**: AI templates library for reusable prompt and configuration templates
- **New**: Insight AI configuration section for customizing AI-generated insights
- **New**: Usage dashboard with cost tracking, charts, and budget alert configuration
- **New**: Cost tier selector (premium/standard/economy) with impact estimation
- **New**: Domain mapper UI for assigning connectors to business domains
- **Modified**: Database schema with 6 new/updated tables and complete RLS policies
- **Modified**: tRPC API with 35+ new endpoints for AI provider operations
- **Modified**: Agent runtime with ConfigHierarchyResolver and usage tracking

## Capabilities

### New Capabilities

- `ai-provider-management`: Tenant and domain-level AI provider configuration with hierarchical inheritance
- `business-domains`: User-defined business domains for organizing connectors and providers
- `ai-templates`: Reusable AI configuration and prompt templates with deployment workflow
- `ai-usage-tracking`: Usage reporting, cost calculation, and visualization dashboard
- `budget-alerts`: Budget threshold configuration with email/webhook notifications
- `cost-tier-selection`: Provider cost tier selection (premium/standard/economy) with impact estimation
- `domain-mapping`: Connector-to-domain assignment interface with inheritance indicators
- `insight-ai-config`: AI-generated insight customization within insights feature

### Modified Capabilities

- `tenant-configuration`: Extended to include AI provider settings and domain overrides
- `connector-configuration`: Now supports domain-level provider assignment and inheritance

## Impact

**Frontend:**

- New pages under `apps/frontend/src/features/settings/` (providers, domains, templates, usage)
- New components in `apps/frontend/src/components/` (CostTierSelector, DomainMapper, etc.)
- New TanStack Query hooks for AI provider state management
- New frontend services for tRPC client integration

**Backend:**

- Extended tRPC routers with 35+ new endpoints
- New service layer for AI providers, domains, templates, usage, and budget alerts
- Extended database schema with RLS policies and indexes
- Agent runtime integration with ConfigHierarchyResolver and usage tracking

**Database:**

- 6 new/updated tables: ai_providers, business_domains, ai_templates, ai_usage_reports, budget_alerts, tenants (extended)
- Materialized view for usage aggregation
- 8 new indexes for query performance
- Complete RLS policies for tenant isolation

**Agent Runtime:**

- ConfigHierarchyResolver with L1+L2 caching (<10ms p95)
- Atomic usage tracking with race condition prevention
- Budget alert integration with threshold monitoring
