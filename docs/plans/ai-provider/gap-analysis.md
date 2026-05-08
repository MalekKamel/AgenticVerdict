# AI Provider UI Implementation Plan - Business Alignment Gap Analysis

**Document Version:** 1.0  
**Date:** 2026-05-06  
**Status:** Analysis Complete  
**Prepared By:** AI Architecture Review

---

## Executive Summary

The current AI provider UI implementation plan (`/docs/plans/ai-provider/implementation-plan.md`) is architected for **tenant-level provider configuration** adapted from Lobe Chat patterns. However, the business architecture (`/docs/architecture/business/business-architecture.md`) requires **insight-level AI configuration** with multi-domain intelligence support.

**Critical Finding:** The current plan supports 0% of insight-level configuration requirements and 0% of multi-domain business intelligence requirements.

**Recommendation:** Refactor Phase 2 implementation to support hierarchical configuration (Tenant → Domain → Insight) with template inheritance, usage tracking, and connector-domain awareness.

---

## 1. Current State Analysis

### 1.1 Architecture Pattern

| Aspect                  | Current Implementation                                          |
| ----------------------- | --------------------------------------------------------------- |
| **Configuration Scope** | Tenant-only (`tenantId` in all tables)                          |
| **Database Schema**     | Flat: `aiProviders`, `aiModels` tables                          |
| **API Design**          | tRPC procedures with `ctx.tenantId` only                        |
| **Runtime Resolution**  | `initModelRuntimeFromDB(serverDB, tenantId, providerId)`        |
| **State Management**    | TanStack Query with `['aiProviders', 'list']` keys              |
| **UI Components**       | ProviderGrid, ProviderConfigForm, ModelList (all tenant-scoped) |

### 1.2 Supported Features

✅ **Fully Implemented (Phase 1):**

- Tenant-scoped provider registration
- Provider credential encryption
- Sequential failover with circuit breaker
- Budget tracking per tenant
- Model discovery and caching

✅ **Planned (Phase 2 Current Plan):**

- Provider CRUD UI
- Model management UI
- Connection testing
- Provider/model ordering

❌ **Not Supported:**

- Insight-level configuration
- Multi-domain classification
- Template-based initialization
- Quality/cost tier selection
- Usage tracking per insight
- Connector-domain awareness

---

## 2. Business Requirements Mapping

### 2.1 Insight-Level Configuration Requirements

| Requirement ID     | Business Requirement                                             | Current Support  | Gap Severity |
| ------------------ | ---------------------------------------------------------------- | ---------------- | ------------ |
| **AI-INSIGHT-001** | Each Insight must have configurable AI provider selection        | ❌ Not supported | 🔴 Critical  |
| **AI-INSIGHT-002** | Insights must override tenant-level AI defaults                  | ❌ Not supported | 🔴 Critical  |
| **AI-INSIGHT-003** | AI configuration must be inheritable (Tenant → Domain → Insight) | ❌ Not supported | 🔴 Critical  |
| **AI-INSIGHT-004** | Template-based AI provider initialization                        | ❌ Not supported | 🔴 Critical  |
| **AI-INSIGHT-005** | Per-insight usage tracking and cost attribution                  | ❌ Not supported | 🔴 Critical  |

### 2.2 Multi-Domain Intelligence Requirements

| Requirement ID    | Business Requirement                                               | Current Support  | Gap Severity |
| ----------------- | ------------------------------------------------------------------ | ---------------- | ------------ |
| **AI-DOMAIN-001** | Support Marketing, Finance, Operations, SEO, Social, Local domains | ❌ Not supported | 🔴 Critical  |
| **AI-DOMAIN-002** | Domain-specific provider templates                                 | ❌ Not supported | 🟠 High      |
| **AI-DOMAIN-003** | Domain-aware model recommendations                                 | ❌ Not supported | 🟠 High      |
| **AI-DOMAIN-004** | Cross-domain cost allocation                                       | ❌ Not supported | 🟠 High      |
| **AI-DOMAIN-005** | Connector-domain mapping (GA4→Marketing, QuickBooks→Finance)       | ❌ Not supported | 🟠 High      |

### 2.3 Template Integration Requirements

| Requirement ID      | Business Requirement                             | Current Support  | Gap Severity |
| ------------------- | ------------------------------------------------ | ---------------- | ------------ |
| **AI-TEMPLATE-001** | Pre-built AI provider templates per insight type | ❌ Not supported | 🔴 Critical  |
| **AI-TEMPLATE-002** | Template inheritance with full customization     | ❌ Not supported | 🔴 Critical  |
| **AI-TEMPLATE-003** | One-click template deployment                    | ❌ Not supported | 🟠 High      |
| **AI-TEMPLATE-004** | Template versioning                              | ❌ Not supported | 🟡 Medium    |

### 2.4 Quality & Cost Control Requirements

| Requirement ID  | Business Requirement                              | Current Support                  | Gap Severity |
| --------------- | ------------------------------------------------- | -------------------------------- | ------------ |
| **AI-COST-001** | Quality tier selection (Premium/Standard/Economy) | ❌ Not supported                 | 🔴 Critical  |
| **AI-COST-002** | Cost-per-token tracking                           | ⚠️ Partially (tenant-level only) | 🟠 High      |
| **AI-COST-003** | Tier-based routing                                | ❌ Not supported                 | 🟠 High      |
| **AI-COST-004** | Budget limits per insight                         | ❌ Not supported                 | 🟠 High      |

### 2.5 Multi-Tenancy Requirements

| Requirement ID    | Business Requirement                         | Current Support                     | Gap Severity |
| ----------------- | -------------------------------------------- | ----------------------------------- | ------------ |
| **AI-TENANT-001** | Complete tenant isolation for AI credentials | ✅ Fully supported                  | ✅ Compliant |
| **AI-TENANT-002** | Tenant-scoped usage tracking                 | ⚠️ Partially (no insight breakdown) | 🟡 Medium    |
| **AI-TENANT-003** | Agency partner multi-tenant management       | ✅ Fully supported                  | ✅ Compliant |

### 2.6 Connector Awareness Requirements

| Requirement ID  | Business Requirement                                     | Current Support  | Gap Severity |
| --------------- | -------------------------------------------------------- | ---------------- | ------------ |
| **AI-CONN-001** | Link AI config to data connectors (GA4, Meta, GSC, etc.) | ❌ Not supported | 🟠 High      |
| **AI-CONN-002** | Auto-infer domain from connector type                    | ❌ Not supported | 🟡 Medium    |
| **AI-CONN-003** | Connector-specific prompts                               | ❌ Not supported | 🟡 Medium    |
| **AI-CONN-004** | Cross-connector insight support                          | ❌ Not supported | 🟠 High      |

---

## 3. Gap Analysis Summary

### 3.1 Gap Distribution by Severity

| Severity     | Count | Percentage |
| ------------ | ----- | ---------- |
| 🔴 Critical  | 11    | 52%        |
| 🟠 High      | 10    | 48%        |
| 🟡 Medium    | 3     | 14%        |
| ✅ Compliant | 3     | 14%        |

**Total Requirements:** 21  
**Fully Supported:** 3 (14%)  
**Partially Supported:** 2 (10%)  
**Not Supported:** 16 (76%)

### 3.2 Root Cause Analysis

| Root Cause                   | Impact                                 | Affected Requirements                             |
| ---------------------------- | -------------------------------------- | ------------------------------------------------- |
| **Flat schema design**       | Cannot represent hierarchy             | AI-INSIGHT-001, AI-INSIGHT-003, AI-TEMPLATE-002   |
| **Tenant-only scope**        | No insight-level config                | AI-INSIGHT-001, AI-INSIGHT-002, AI-COST-004       |
| **No domain taxonomy**       | Cannot classify by business domain     | AI-DOMAIN-001, AI-DOMAIN-002, AI-DOMAIN-003       |
| **No template system**       | Cannot support template initialization | AI-TEMPLATE-001, AI-TEMPLATE-002, AI-TEMPLATE-003 |
| **No tier classification**   | Cannot support quality/cost tiers      | AI-COST-001, AI-COST-003                          |
| **No usage instrumentation** | Cannot track per-insight usage         | AI-INSIGHT-005, AI-COST-002, AI-COST-004          |
| **No connector linkage**     | Cannot map connectors to domains       | AI-CONN-001, AI-CONN-002, AI-CONN-004             |

---

## 4. Technical Gap Details

### 4.1 Database Schema Gaps

**Current Schema:**

```typescript
// aiProviders table
{
  id: string;
  tenant_id: string; // ❌ Only tenant scope
  name: string;
  source: "builtin" | "custom" | "remote";
  enabled: boolean;
  config: encrypted_json;
  sort: number;
}

// aiModels table
{
  id: string;
  provider_id: string;
  tenant_id: string; // ❌ Only tenant scope
  type: AiModelType;
  enabled: boolean;
  abilities: json;
  context_window_tokens: number;
}
```

**Required Schema:**

```typescript
// aiProviders table (extended)
{
  id: string;
  tenant_id: string;
  insight_id: string | null;      // ✅ NEW: insight-level config
  domain_id: string | null;        // ✅ NEW: domain-level config
  template_id: string | null;      // ✅ NEW: template inheritance
  tier: 'premium' | 'standard' | 'economy';  // ✅ NEW: cost tier
  parent_id: string | null;        // ✅ NEW: inheritance chain
  connector_ids: string[];         // ✅ NEW: connector linkage
  sort: number;
}

// aiUsageLogs table (NEW)
{
  id: string;
  tenant_id: string;
  insight_id: string;
  provider_id: string;
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: Date;
  request_id: string;
}

// aiProviderTemplates table (NEW)
{
  id: string;
  name: string;
  domain: BusinessDomain;
  description: string;
  provider_config: json;
  model_config: json;
  tier: CostTier;
  is_system: boolean;  // system vs custom templates
}

// businessDomains table (NEW)
{
  id: string;
  tenant_id: string;
  name: 'marketing' | 'finance' | 'operations' | 'seo' | 'social' | 'local';
  provider_ids: string[];
  budget_limit: number;
}
```

### 4.2 API Design Gaps

**Current tRPC Procedures:**

```typescript
// ai-providers router
createAiProvider: (params) => string;
getAiProviderById: (id) => AiProviderDetailItem;
getAiProviderList: () => AiProviderListItem[];
updateAiProviderConfig: (id, config) => void;
// ❌ No insight context, no domain context, no template support
```

**Required tRPC Procedures:**

```typescript
// ai-providers router (extended)
createAiProvider: (params: { tenantId, insightId?, domainId?, ... }) => string;
getAiProviderForInsight: (insightId) => AiProviderConfig;  // ✅ NEW
getAiProviderHierarchy: (tenantId) => HierarchyConfig;     // ✅ NEW
createFromTemplate: (templateId, insightId) => string;     // ✅ NEW
setProviderTier: (id, tier) => void;                       // ✅ NEW

// ai-usage router (NEW)
getUsageByInsight: (insightId, dateRange) => UsageReport;
getUsageByDomain: (domainId, dateRange) => UsageReport;
getCostProjection: (insightId) => CostProjection;
setBudgetAlert: (insightId, threshold) => void;

// ai-templates router (NEW)
listTemplates: (domain?) => AiProviderTemplate[];
getTemplateById: (id) => AiProviderTemplateDetail;
createCustomTemplate: (params) => string;
applyTemplate: (templateId, insightId) => void;

// business-domains router (NEW)
listDomains: () => BusinessDomain[];
getDomainProviders: (domainId) => ProviderList;
setDomainBudget: (domainId, limit) => void;
```

### 4.3 Runtime Resolution Gaps

**Current Implementation:**

```typescript
export const initModelRuntimeFromDB = async (serverDB, tenantId, providerId) => {
  const provider = await getProviderConfig(serverDB, tenantId, providerId);
  const decryptedConfig = gateKeeper.decrypt(provider.config);
  return AgentRuntime.createRuntime(provider, decryptedConfig);
};
```

**Required Implementation:**

```typescript
export const resolveAiConfigForInsight = async (serverDB, tenantId, insightId) => {
  // 1. Check insight-level config
  const insightConfig = await getProviderConfig(serverDB, tenantId, insightId);
  if (insightConfig) return insightConfig;

  // 2. Check domain-level config
  const domain = await getInsightDomain(serverDB, insightId);
  const domainConfig = await getProviderConfig(serverDB, tenantId, domain.id);
  if (domainConfig) return domainConfig;

  // 3. Fall back to tenant-level config
  const tenantConfig = await getProviderConfig(serverDB, tenantId);
  return tenantConfig;
};

export const trackUsage = async (params: UsageParams) => {
  await db.insert(aiUsageLogs).values({
    tenant_id: params.tenantId,
    insight_id: params.insightId,
    provider_id: params.providerId,
    model_id: params.modelId,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    cost_usd: calculateCost(params),
    request_id: params.requestId,
  });
};
```

### 4.4 UI Component Gaps

**Current Components:**

```
apps/frontend/src/features/settings/providers/
├── ProvidersPage.tsx          # Tenant-level provider list
├── ProviderGrid.tsx           # Grid of tenant providers
├── ProviderCard.tsx           # Provider card with enable toggle
├── ProviderConfigForm.tsx     # Configure provider credentials
└── ModelList.tsx              # Model management
```

**Required Components:**

```
apps/frontend/src/features/settings/providers/
├── ProvidersPage.tsx                    # ✅ Existing (rename to TenantProvidersPage)
├── InsightProvidersPage.tsx             # ✅ NEW: Insight-level config
├── DomainProvidersPage.tsx              # ✅ NEW: Domain-level config
├── ProviderTemplatesLibrary.tsx         # ✅ NEW: Template browser
├── UsageDashboard.tsx                   # ✅ NEW: Usage monitoring
└── CostTiersSelector.tsx                # ✅ NEW: Tier selection

apps/frontend/src/features/insights/
└── AIConfigSection.tsx                  # ✅ NEW: AI config in insight editor
```

---

## 5. Recommendations

### 5.1 Immediate Actions (Before Phase 2 Implementation)

1. **Schema Redesign:** Extend database schema to support hierarchy
2. **API Extension:** Add insight-level and domain-level procedures
3. **Runtime Enhancement:** Implement cascading config resolution
4. **Usage Instrumentation:** Add token counting and cost tracking

### 5.2 Phase 2 Refactoring

**Original Phase 2 Scope:**

- Tenant-level provider UI (22 person-days)

**Revised Phase 2 Scope:**

- Hierarchical configuration UI (Tenant → Domain → Insight)
- Template library and deployment
- Usage dashboard and cost tracking
- Domain classification and connector mapping
- **Estimated: 35 person-days** (+13 days)

### 5.3 Phase 3 Adjustments

**Original Phase 3:** Agent integration  
**Revised Phase 3:** Agent integration with insight-level config resolution

### 5.4 New Phase 5: Advanced Analytics

**Proposed Phase 5:**

- Cost optimization recommendations
- Provider performance analytics
- Usage trend forecasting
- Budget optimization AI

---

## 6. Migration Path (Greenfield)

**This is a greenfield pre-production implementation.** No backward compatibility or data migration required.

### Schema Transition

```bash
# Update schema files
edit packages/database/src/schema/ai-providers.ts

# Apply schema directly (destructive)
pnpm --filter @agenticverdict/database db:push

# Seed test data
pnpm db:seed:test
```

### No Migration Complexity

Since this is pre-production greenfield:

- **No migration scripts needed**
- **No data preservation required**
- **No backward compatibility concerns**
- **Schema evolves rapidly via `drizzle-kit push`**

See: `/docs/plans/ai-provider/phase1-to-phase2-greenfield.md`
provider_id UUID NOT NULL,
model_id UUID NOT NULL,
input_tokens INTEGER NOT NULL,
output_tokens INTEGER NOT NULL,
cost_usd DECIMAL(10,6) NOT NULL,
request_id UUID NOT NULL,
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_provider_templates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name VARCHAR(255) NOT NULL,
domain VARCHAR(50) NOT NULL,
description TEXT,
provider_config JSONB NOT NULL,
model_config JSONB NOT NULL,
tier VARCHAR(20) DEFAULT 'standard',
is_system BOOLEAN DEFAULT false,
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE business_domains (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id UUID NOT NULL,
name VARCHAR(50) NOT NULL,
provider_ids UUID[] DEFAULT '{}',
budget_limit DECIMAL(10,2),
created_at TIMESTAMP DEFAULT NOW()
);

```

**Note:** In greenfield mode, these tables are created directly via `drizzle-kit push`. No manual SQL execution needed.

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema changes break tests | Low | High | Run tests after each schema push |
| Increased Phase 2 complexity | High | Medium | Split Phase 2 into 2A (tenant) and 2B (hierarchy) |
| Performance impact from hierarchy resolution | Medium | Medium | Cache resolved configs with 5-minute TTL |
| Usage tracking adds latency | Medium | Low | Async logging with batch inserts |
| UI complexity overwhelms users | Medium | Medium | Progressive disclosure (advanced settings collapsed) |

---

## 8. Success Metrics

### 8.1 Business Alignment Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Insight-level config coverage | 100% | All insights can configure AI |
| Template adoption rate | 70%+ | % of insights created from templates |
| Multi-domain support | 6 domains | Marketing, Finance, Ops, SEO, Social, Local |
| Cost tier selection | 3 tiers | Premium, Standard, Economy |

### 8.2 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Config resolution latency | <10ms | p95 latency for hierarchy resolution |
| Usage tracking overhead | <5ms | Async logging latency |
| Schema push time | <30 sec | drizzle-kit push execution time |
| Zero manual migration | 100% | All changes via drizzle-kit |

---

## 9. Next Steps

1. **Approve Gap Analysis:** Review and approve this document
2. **Update Implementation Plan:** Refine `/docs/plans/ai-provider/implementation-plan-refined.md` with business-aligned features
3. **Schema Push:** Execute `pnpm --filter @agenticverdict/database db:push`
4. **Phase 2 Refactoring:** Implement hierarchical configuration UI
5. **Testing:** Add hierarchy resolution tests, usage tracking tests
6. **Documentation:** Update tenant AI config guide with insight-level examples

---

## Appendix A: Requirements Traceability Matrix

| Business Requirement | Implementation Task | Status |
|---------------------|---------------------|--------|
| AI-INSIGHT-001 | Task 2.1: Extend schema with insight_id | 📋 Pending |
| AI-INSIGHT-002 | Task 2.3: Add hierarchy resolution API | 📋 Pending |
| AI-INSIGHT-003 | Task 2.5: Implement cascading config | 📋 Pending |
| AI-DOMAIN-001 | Task 2.2: Create business_domains table | 📋 Pending |
| AI-TEMPLATE-001 | Task 2.8: Build template library | 📋 Pending |
| AI-COST-001 | Task 2.1: Add tier column to schema | 📋 Pending |
| AI-INSIGHT-005 | Task 2.9: Implement usage tracking | 📋 Pending |

---

## Appendix B: Related Documents

- `/docs/plans/ai-provider/implementation-plan.md` - Current implementation plan
- `/docs/architecture/business/business-architecture.md` - Business requirements
- `/docs/tenant-ai-config-guide.md` - Tenant AI configuration
- `/docs/provider-failover-config.md` - Failover configuration
- `/packages/agent-runtime/README.md` - Agent runtime documentation

---

**Document Status:** ✅ Analysis Complete
**Next Review:** After implementation plan refinement
**Maintainer:** AI Architecture Team
```
