# Phase 1 Migration Notes

**Document Version:** 1.0  
**Date:** 2026-05-06  
**Status:** Ready for Implementation  
**Breaking Changes:** None (backward-compatible)

---

## Overview

This document provides migration guidance for transitioning from the original Phase 1 implementation (tenant-only AI configuration) to the business-aligned hierarchical model (Tenant → Domain → Insight).

**Key Principle:** All changes are **backward-compatible**. Existing tenant-level configurations continue to work without modification.

---

## Migration Summary

| Component          | Change Type                  | Effort | Risk   |
| ------------------ | ---------------------------- | ------ | ------ |
| Database Schema    | Additive (nullable columns)  | Low    | Low    |
| API Layer          | Extended (new endpoints)     | Low    | Low    |
| Runtime Resolution | Enhanced (hierarchy support) | Medium | Medium |
| Frontend           | New features only            | Low    | Low    |
| Data Migration     | None required                | None   | None   |

---

## Database Migration

### Step 1: Add Nullable Columns to `ai_providers`

```sql
-- Add hierarchy support columns (all nullable)
ALTER TABLE ai_providers
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'tenant',
  ADD COLUMN IF NOT EXISTS insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES business_domains(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES ai_provider_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_config_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS connector_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for hierarchy resolution performance
CREATE INDEX IF NOT EXISTS ai_providers_scope_idx
  ON ai_providers(tenant_id, scope, insight_id, domain_id);
```

**Why nullable?** Existing tenant-level configs don't have insight/domain associations. They continue to work with `NULL` values.

### Step 2: Create New Tables

```sql
-- Business Domains table
CREATE TABLE IF NOT EXISTS business_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  provider_ids UUID[] DEFAULT '{}',
  budget_limit DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Tenant isolation
CREATE POLICY tenant_isolation ON business_domains
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Index for tenant lookups
CREATE INDEX business_domains_tenant_idx ON business_domains(tenant_id);

-- AI Usage Logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  insight_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  model_id UUID NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  request_id UUID NOT NULL,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Tenant isolation
CREATE POLICY tenant_isolation ON ai_usage_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes for aggregation queries
CREATE INDEX ai_usage_logs_insight_idx ON ai_usage_logs(insight_id, created_at);
CREATE INDEX ai_usage_logs_tenant_idx ON ai_usage_logs(tenant_id, created_at);

-- AI Provider Templates table
CREATE TABLE IF NOT EXISTS ai_provider_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  description TEXT,
  provider_config JSONB NOT NULL,
  model_config JSONB NOT NULL,
  tier VARCHAR(20) DEFAULT 'standard',
  is_system BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Tenant isolation (except system templates)
CREATE POLICY tenant_isolation ON ai_provider_templates
  FOR ALL
  USING (
    is_system = true
    OR tenant_id = current_setting('app.current_tenant')::uuid
  );

-- Index for template lookups
CREATE INDEX ai_provider_templates_domain_idx ON ai_provider_templates(domain, is_system);
```

### Step 3: Seed System Templates

```sql
-- Insert system templates (available to all tenants)
INSERT INTO ai_provider_templates (name, domain, description, provider_config, model_config, tier, is_system)
VALUES
  ('Marketing Insight (Standard)', 'marketing',
   'Balanced cost/quality for marketing analysis',
   '{"providers": ["openai", "anthropic"], "failover": true}',
   '{"chat": "gpt-4o", "analysis": "claude-3-5-sonnet"}',
   'standard', true),

  ('Finance Insight (Premium)', 'finance',
   'Highest accuracy for financial reporting',
   '{"providers": ["anthropic", "openai"], "failover": true}',
   '{"chat": "claude-3-opus", "analysis": "gpt-4o"}',
   'premium', true),

  ('SEO Insight (Economy)', 'seo',
   'Cost-optimized for high-volume SEO analysis',
   '{"providers": ["openai"], "failover": false}',
   '{"chat": "gpt-3.5-turbo", "analysis": "gpt-4o-mini"}',
   'economy', true),

  ('Social Media Insight (Standard)', 'social',
   'Balanced for social media analytics',
   '{"providers": ["openai", "google"], "failover": true}',
   '{"chat": "gpt-4o", "analysis": "gemini-1.5-pro"}',
   'standard', true),

  ('Executive Summary (Premium)', 'executive',
   'Highest quality for executive reporting',
   '{"providers": ["anthropic", "openai"], "failover": true}',
   '{"chat": "claude-3-opus", "analysis": "gpt-4o"}',
   'premium', true);
```

### Step 4: Update Drizzle Schema Files

Update `packages/database/src/schema/ai-providers.ts`:

```typescript
// Add new columns to schema definition
export const aiProviders = pgTable("ai_providers", {
  // ... existing fields ...

  // NEW: Hierarchy support
  scope: varchar("scope", {
    enum: ["tenant", "domain", "insight"],
  }).default("tenant"),

  insightId: uuid("insight_id").references(() => insights.id, { onDelete: "cascade" }),

  domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }),

  templateId: uuid("template_id").references(() => aiProviderTemplates.id, {
    onDelete: "set null",
  }),

  parentConfigId: uuid("parent_config_id").references(() => aiProviders.id, {
    onDelete: "cascade",
  }),

  // NEW: Cost tier
  tier: varchar("tier", {
    enum: ["premium", "standard", "economy"],
  }).default("standard"),

  // NEW: Connector linkage
  connectorIds: uuid("connector_ids").array(),

  // Audit
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## API Layer Changes

### No Breaking Changes

All existing tRPC procedures remain functional. New procedures are added:

```typescript
// Existing procedures (unchanged)
createAiProvider
getAiProviderById
getAiProviderList
getAiProviderRuntimeState
removeAiProvider
toggleProviderEnabled
updateAiProvider
updateAiProviderConfig
updateAiProviderOrder
checkProviderConnectivity

// NEW procedures (additive)
getAiProviderForInsight
getAiProviderHierarchy
createFromTemplate
setProviderTier

// NEW routers
aiDomains.*
aiTemplates.*
aiUsage.*
```

### Migration Steps

1. **Deploy new routers** alongside existing routers
2. **Update existing procedures** to handle nullable columns
3. **Add new procedures** without modifying existing ones
4. **Test backward compatibility** with existing clients

---

## Runtime Resolution Changes

### Before (Phase 1)

```typescript
export const initModelRuntimeFromDB = async (
  serverDB: Database,
  tenantId: string,
  providerId: string,
) => {
  const provider = await getProviderConfig(serverDB, tenantId, providerId);
  const decryptedConfig = gateKeeper.decrypt(provider.config);

  return AgentRuntime.createRuntime(provider, decryptedConfig);
};
```

### After (Phase 2)

```typescript
export const initModelRuntimeFromDB = async (
  serverDB: Database,
  tenantId: string,
  providerId: string,
  insightId?: string, // NEW: optional insight context
) => {
  let config;

  // NEW: Hierarchy resolution
  if (insightId) {
    config = await ConfigHierarchyResolver.resolve(tenantId, insightId);
  } else {
    // Fall back to Phase 1 behavior
    config = await getProviderConfig(serverDB, tenantId, providerId);
  }

  const decryptedConfig = gateKeeper.decrypt(config.config);

  return AgentRuntime.createRuntime(config, decryptedConfig);
};
```

### Migration Steps

1. **Add optional `insightId` parameter** to function signature
2. **Implement `ConfigHierarchyResolver`** class
3. **Add conditional logic** to use hierarchy when insightId provided
4. **Fall back to Phase 1 behavior** when insightId is undefined
5. **Update call sites** gradually (no rush, backward-compatible)

---

## Frontend Changes

### No Breaking Changes to Existing UI

Existing tenant-level provider configuration UI continues to work. New UI components are added:

```
apps/frontend/src/features/
├── settings/
│   ├── providers/
│   │   └── TenantProvidersPage.tsx  # Existing (unchanged)
│   ├── domains/
│   │   └── DomainProvidersPage.tsx  # NEW
│   ├── templates/
│   │   └── ProviderTemplatesLibrary.tsx  # NEW
│   └── usage/
│       └── UsageDashboard.tsx  # NEW
└── insights/
    └── AIConfigSection.tsx  # NEW
```

### Migration Steps

1. **Keep existing UI unchanged** during Phase 2A
2. **Add new UI components** in parallel
3. **Update navigation** to include new pages
4. **Add insight AI config section** to insight editor
5. **Test all flows** independently

---

## Data Migration

### No Data Migration Required

**Why?** All schema changes are additive:

- New columns are nullable with defaults
- Existing records remain valid
- No data transformation needed

### Optional: Backfill Connector IDs

If you want to populate `connector_ids` for existing providers:

```sql
-- Example: Link GA4 connectors to marketing providers
UPDATE ai_providers
SET connector_ids = ARRAY(
  SELECT id FROM connectors
  WHERE connector_type = 'ga4'
  AND tenant_id = ai_providers.tenant_id
)
WHERE scope = 'tenant'
AND connector_ids IS NULL;
```

---

## Testing Strategy

### Phase 1 Regression Tests

Before deploying changes, verify:

```bash
# Run existing Phase 1 tests
pnpm run test:unit -- ai-provider
pnpm run test:integration -- ai-provider

# Verify tenant-level config still works
curl http://localhost:3000/api/trpc/aiProviders.getAiProviderList

# Verify runtime initialization unchanged
curl http://localhost:3000/api/trpc/aiProviders.getAiProviderRuntimeState
```

### New Feature Tests

After deploying changes:

```bash
# Test hierarchy resolution
pnpm run test:unit -- ConfigHierarchyResolver

# Test template deployment
pnpm run test:unit -- aiTemplates

# Test usage tracking
pnpm run test:unit -- aiUsage

# Test domain assignment
pnpm run test:unit -- aiDomains
```

### Integration Tests

```bash
# Full flow: Create insight from template
pnpm run test:integration -- insight-from-template

# Full flow: Configure insight-level AI
pnpm run test:integration -- insight-ai-config

# Full flow: Usage tracking
pnpm run test:integration -- usage-tracking
```

---

## Rollback Plan

### If Issues Arise

**Database Rollback:**

```sql
-- Drop new columns (safe, data preserved in new tables)
ALTER TABLE ai_providers
  DROP COLUMN IF EXISTS scope,
  DROP COLUMN IF EXISTS insight_id,
  DROP COLUMN IF EXISTS domain_id,
  DROP COLUMN IF EXISTS template_id,
  DROP COLUMN IF EXISTS parent_config_id,
  DROP COLUMN IF EXISTS tier,
  DROP COLUMN IF EXISTS connector_ids;

-- Drop new tables (if needed)
DROP TABLE IF EXISTS business_domains;
DROP TABLE IF EXISTS ai_usage_logs;
DROP TABLE IF EXISTS ai_provider_templates;
```

**API Rollback:**

- Revert to previous commit
- New routers are additive, safe to remove

**Runtime Rollback:**

- Revert `initModelRuntimeFromDB` to Phase 1 implementation
- Hierarchy resolution is opt-in (requires insightId)

**Frontend Rollback:**

- New UI components are isolated
- Remove new pages from navigation
- Existing UI unchanged

---

## Deployment Checklist

### Pre-Deployment

- [ ] Review database migration script
- [ ] Test migration on staging database
- [ ] Backup production database
- [ ] Review API changes for breaking changes (should be none)
- [ ] Test backward compatibility locally

### Deployment

- [ ] Deploy database migration
- [ ] Deploy API changes
- [ ] Deploy runtime changes
- [ ] Deploy frontend changes
- [ ] Monitor error logs for 1 hour

### Post-Deployment

- [ ] Verify existing tenant configs work
- [ ] Test new hierarchy features
- [ ] Monitor usage tracking performance
- [ ] Check template library availability
- [ ] Verify RLS policies working

### Monitoring

```bash
# Check for errors
curl http://localhost:3000/api/health

# Verify hierarchy resolution latency
curl http://localhost:3000/api/trpc/aiProviders.getAiProviderForInsight?insightId=test

# Check usage tracking
curl http://localhost:3000/api/trpc/aiUsage.getTenantUsage
```

---

## Timeline

| Phase                   | Duration   | Activities                      |
| ----------------------- | ---------- | ------------------------------- |
| **Preparation**         | 1 day      | Review, test on staging, backup |
| **Database Migration**  | 2 hours    | Execute migration, verify       |
| **API Deployment**      | 2 hours    | Deploy, test endpoints          |
| **Runtime Deployment**  | 2 hours    | Deploy, test resolution         |
| **Frontend Deployment** | 2 hours    | Deploy, test UI                 |
| **Monitoring**          | 1 day      | Watch for issues                |
| **Total**               | **2 days** | Full migration                  |

---

## Support Contacts

| Issue Type           | Contact          | Escalation         |
| -------------------- | ---------------- | ------------------ |
| Database issues      | Database Team    | DBA On-Call        |
| API issues           | Backend Team     | Tech Lead          |
| Runtime issues       | AI Team          | Architecture       |
| Frontend issues      | Frontend Team    | Tech Lead          |
| Production incidents | On-Call Engineer | Incident Commander |

---

## Related Documents

- Gap Analysis: `/docs/plans/ai-provider/gap-analysis.md`
- Refined Implementation Plan: `/docs/plans/ai-provider/implementation-plan-refined.md`
- Original Implementation Plan: `/docs/plans/ai-provider/implementation-plan.md`
- Tenant AI Config Guide: `/docs/tenant-ai-config-guide.md`
- Provider Failover Config: `/docs/provider-failover-config.md`

---

**Document Status:** ✅ Ready for Implementation  
**Approved By:** Architecture Team  
**Next Review:** After Phase 2A deployment
