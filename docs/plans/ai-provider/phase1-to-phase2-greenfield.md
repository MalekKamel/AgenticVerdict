# Phase 1 to Phase 2 Transition (Greenfield)

**Document Version:** 1.0  
**Date:** 2026-05-06  
**Status:** Active  
**Approach:** Destructive Schema Updates, No Migrations

---

## Overview

This is a **greenfield pre-production implementation**. Transition from Phase 1 to Phase 2 uses destructive schema updates with no backward compatibility requirements.

### Key Principles

| Principle                | Implementation                                   |
| ------------------------ | ------------------------------------------------ |
| **No migrations**        | `drizzle-kit push` applies schema directly       |
| **Destructive updates**  | Tables can be dropped and recreated              |
| **No data preservation** | Test/dev data wiped during updates               |
| **Fast iteration**       | Schema evolves without migration overhead        |
| **Production later**     | Migration files created before production launch |

---

## Transition Steps

### Step 1: Update Schema Files

```bash
# Update schema definitions
edit packages/database/src/schema/ai-providers.ts
edit packages/database/src/schema/business-domains.ts
edit packages/database/src/schema/ai-usage.ts
edit packages/database/src/schema/ai-templates.ts
```

### Step 2: Push Schema Changes

```bash
# Apply schema directly to database (destructive)
pnpm --filter @agenticverdict/database db:push
```

**What this does:**

- Compares schema files to database
- Generates ALTER/CREATE/DROP statements
- Applies changes directly
- **Warning:** May drop columns/tables

### Step 3: Verify Schema

```bash
# Check database schema
psql $DATABASE_URL -c "\d ai_providers"
psql $DATABASE_URL -c "\d business_domains"
psql $DATABASE_URL -c "\d ai_usage_logs"
psql $DATABASE_URL -c "\d ai_provider_templates"
```

### Step 4: Seed Test Data

```bash
# Reset and seed
pnpm --filter @agenticverdict/database db:reset
pnpm db:seed:test
```

---

## Schema Changes Summary

### New Tables

| Table                   | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `business_domains`      | Domain classification (Marketing, Finance, etc.) |
| `ai_usage_logs`         | Usage tracking per insight                       |
| `ai_provider_templates` | Template library                                 |

### Modified Tables

| Table          | Changes                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `ai_providers` | Added: `scope`, `insight_id`, `domain_id`, `template_id`, `parent_config_id`, `tier`, `connector_ids` |

### Dropped Tables

None (Phase 1 tables extended, not replaced)

---

## Testing After Transition

### Run Tests

```bash
# Unit tests
pnpm run test:unit -- ai-provider

# Integration tests
pnpm run test:integration -- ai-provider

# E2E tests
pnpm run test:e2e -- ai-provider
```

### Manual Testing

```bash
# Start dev server
pnpm dev

# Test tenant-level config
curl http://localhost:3000/api/trpc/aiProviders.getAiProviderList

# Test hierarchy resolution
curl http://localhost:3000/api/trpc/aiProviders.getAiProviderForInsight?insightId=test-123

# Test templates
curl http://localhost:3000/api/trpc/aiTemplates.listTemplates

# Test usage tracking
curl http://localhost:3000/api/trpc/aiUsage.getTenantUsage
```

---

## Troubleshooting

### Schema Push Fails

```bash
# Error: cannot drop table because used by other objects
# Solution: Drop dependent objects first
pnpm --filter @agenticverdict/database db:reset

# Error: relation already exists
# Solution: Force push
drizzle-kit push --force
```

### Test Data Issues

```bash
# Clear all data
pnpm --filter @agenticverdict/database db:reset

# Re-seed
pnpm db:seed:dev-full
```

### Type Errors

```bash
# Regenerate types from schema
pnpm --filter @agenticverdict/database db:generate

# Rebuild packages
pnpm run build
```

---

## Rollback (If Needed)

```bash
# Revert schema files to Phase 1
git checkout HEAD -- packages/database/src/schema/

# Reset database to Phase 1 state
pnpm --filter @agenticverdict/database db:reset

# Re-apply Phase 1 schema
pnpm --filter @agenticverdict/database db:push
```

---

## Production Preparation

### Before Production Deployment

When ready for production:

1. **Generate migration files:**

   ```bash
   pnpm --filter @agenticverdict/database db:generate
   ```

2. **Review generated SQL:**

   ```bash
   ls -la packages/database/drizzle/
   cat packages/database/drizzle/*.sql
   ```

3. **Test on staging:**

   ```bash
   # Staging environment
   DATABASE_URL=postgres://staging... pnpm --filter @agenticverdict/database db:migrate
   ```

4. **Deploy to production:**
   ```bash
   # Production deployment
   DATABASE_URL=postgres://production... pnpm --filter @agenticverdict/database db:migrate
   ```

---

## Timeline

| Activity            | Duration   |
| ------------------- | ---------- |
| Update schema files | 2 hours    |
| Push schema changes | 10 minutes |
| Verify schema       | 10 minutes |
| Seed test data      | 10 minutes |
| Run tests           | 30 minutes |
| Fix issues          | 2-4 hours  |
| **Total**           | **~1 day** |

---

## Related Documents

- Greenfield Schema Guide: `/docs/plans/ai-provider/greenfield-schema.md`
- Implementation Plan: `/docs/plans/ai-provider/implementation-plan-refined.md`
- Gap Analysis: `/docs/plans/ai-provider/gap-analysis.md`

---

**Document Status:** ✅ Active  
**Approach:** Greenfield (Destructive)  
**Production Ready:** No (migration files needed before production)
