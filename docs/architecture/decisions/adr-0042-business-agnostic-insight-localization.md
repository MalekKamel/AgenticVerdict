# Architecture Decision Record: Business-Agnostic Insight Localization

**ADR ID:** ADR-0042  
**Status:** Accepted  
**Date:** 2026-05-03  
**Author:** Engineering Team  
**Reviewers:** Architecture Team, Product Team

---

## Context

The AgenticVerdict platform must support **multi-business-domain intelligence** across marketing, finance, operations, healthcare, e-commerce, and other domains without hardcoding business-specific taxonomy in the platform code.

The original implementation plan (`composable-insight-localization.md` v1.0) proposed a localization system that embedded hardcoded business types (`roi`, `conversion`, `performance`) and domains (`marketing`, `finance`, `seo`), violating core business architecture requirements.

### Requirements

Per `/docs/architecture/business/business-architecture.md`:

1. **Multi-domain support:** Platform must support "marketing, finance, operations, and **other domains**" (open-ended extensibility)
2. **Configurable metrics:** Tenants must select and define their own metrics per connector
3. **Template flexibility:** Templates initialize but never constrain—full customization preserved
4. **Tenant isolation:** Each tenant has independent `TenantConfig` with their business taxonomy
5. **Agency partner model:** Agencies manage heterogeneous clients with different business types

### Problem Statement

How do we design a type-safe localization system for insights that:

- Supports arbitrary business domains without code changes?
- Maintains TypeScript strict mode (zero `any` types)?
- Provides good developer experience with autocomplete and validation?
- Enables tenant-specific business taxonomy?
- Avoids hardcoded enums, unions, or i18n key hierarchies?

---

## Decision

**ADOPT:** Business-Agnostic Insight Localization with Tenant-Configured Taxonomy

### Core Pattern

Replace hardcoded enums with **tenant-configured business taxonomy** stored in `TenantConfig.business.insights`:

```typescript
// ❌ REJECTED: Hardcoded enum
type InsightType = "weekly_performance" | "monthly_roi" | "conversion";

// ✅ ADOPTED: Tenant-configured string with runtime validation
type InsightType = string; // Validated against TenantConfig at runtime

interface TenantConfig {
  business: {
    insights: {
      types: Array<{
        id: string; // e.g., 'weekly_performance'
        name: string; // e.g., 'Weekly Performance'
        description?: string;
      }>;
      metricClasses: Array<{ id: string; name: string; unit?: string }>;
      periods: Array<{ id: string; name: string }>;
      domains: Array<{ id: string; name: string; color?: string }>;
    };
  };
}
```

### Localization Strategy

Multi-level fallback without hardcoded i18n keys:

```typescript
function getTitle(insight: InsightDTO): string {
  // Level 1: Tenant-configured type name
  const typeDef = tenantConfig.business.insights.types.find((t) => t.id === insight.insightType);
  if (typeDef?.name) return typeDef.name;

  // Level 2: Optional i18n key (tenant may have defined custom keys)
  const i18nTitle = t(`insights.types.${insight.insightType}.title`, { returnNull: true });
  if (i18nTitle) return i18nTitle;

  // Level 3: Compose from tenant-configured parts
  const period = periodMap.get(insight.attributes.period);
  const metric = metricClassMap.get(insight.attributes.metricClass);
  if (period && metric) return `${period} ${metric}`;

  // Level 4: Capitalized raw name (always available)
  return capitalizeWords(insight.rawName);
}
```

### API Contract

API returns **raw data + type identifiers** without business inference:

```typescript
interface InsightDTO {
  id: string;
  insightType: string; // Tenant-defined identifier
  attributes: {
    period?: string;
    metricClass?: string;
    severity?: string;
    [key: string]: unknown; // Flexible for any business domain
  };
  domains: string[]; // Derived from connector tags
  rawName: string;
  createdAt: string;
  connectorIds: string[];
}
```

**Key principle:** API does NOT infer business semantics. Domain tags come from connector metadata, not hardcoded `inferDomain()` logic.

---

## Alternatives Considered

### Alternative 1: Generic TypeScript Enums

**Approach:** Use TypeScript generics to parameterize insight types:

```typescript
interface InsightDTO<T extends string = string> {
  insightType: T;
  attributes: Record<string, unknown>;
}
```

**Pros:**

- Type-safe at compile time
- Flexible for different use cases

**Cons:**

- Does not solve runtime validation
- Requires type parameters throughout call chain
- Does not enable tenant-specific customization
- Poor developer experience (verbose type annotations)

**Verdict:** REJECTED—Does not address core requirement of tenant-configured taxonomy.

### Alternative 2: Discriminated Unions with Registry Pattern

**Approach:** Maintain a runtime registry of insight type definitions:

```typescript
type InsightRegistry = Map<string, InsightTypeDefinition>;

const globalRegistry: InsightRegistry = new Map([
  ['weekly_performance', { name: 'Weekly Performance', ... }],
  ['monthly_roi', { name: 'Monthly ROI', ... }],
]);
```

**Pros:**

- Runtime validation
- Centralized type definitions
- Good IDE support

**Cons:**

- Still requires code changes for new types
- Registry must be populated at build time
- Does not support per-tenant customization
- Violates "no hardcoding" requirement

**Verdict:** REJECTED—Hardcodes business types in application code.

### Alternative 3: Schema-less Dynamic Approach

**Approach:** Use `Record<string, unknown>` for all insight properties:

```typescript
interface InsightDTO {
  type: string;
  metadata: Record<string, unknown>;
}
```

**Pros:**

- Maximum flexibility
- No code changes needed for new types
- Simple implementation

**Cons:**

- Zero type safety
- Runtime errors only
- Poor developer experience
- Violates "strict mode enforced" requirement

**Verdict:** REJECTED—Violates TypeScript strict mode requirement (zero `any` types).

### Alternative 4: Database-Driven Type Definitions (ADOPTED)

**Approach:** Store insight type definitions in `TenantConfig` with Zod validation:

```typescript
const tenantConfigSchema = z.object({
  business: {
    insights: {
      types: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
        }),
      ),
      // ...
    },
  },
});
```

**Pros:**

- ✅ Tenant-specific customization
- ✅ No code changes for new types
- ✅ Runtime validation with Zod
- ✅ Type-safe access patterns
- ✅ Agency partners can configure per client
- ✅ Aligns with business architecture requirements

**Cons:**

- Requires tenant configuration setup
- Slightly more complex lookup logic
- Need default seeding for new tenants

**Verdict:** ADOPTED—Best balance of flexibility, type safety, and business alignment.

---

## Consequences

### Positive

1. **Business-Agnostic Platform**
   - Supports marketing, healthcare, e-commerce, education, and any other domain
   - No code changes required for new business types
   - True multi-tenant SaaS architecture

2. **Tenant Empowerment**
   - Tenants define their own business taxonomy
   - Agency partners configure different types per client
   - Full customization without IT dependency

3. **Type Safety Maintained**
   - Zero `any` types
   - Zod runtime validation
   - TypeScript strict mode compliance

4. **Separation of Concerns**
   - API returns data, not business semantics
   - Frontend composes presentation from tenant config
   - Clean architecture boundaries

5. **Future-Proof**
   - New business domains supported immediately
   - No technical debt from hardcoded types
   - Scalable to 100+ insight types per tenant

### Negative

1. **Configuration Overhead**
   - Tenants must configure their business taxonomy
   - Requires admin UI for configuration (Phase 2)
   - Default seeding needed for new tenants

2. **Slightly More Complex Code**
   - Multi-level fallback logic
   - Map lookups instead of direct enum access
   - Additional runtime validation

3. **Testing Complexity**
   - Must test with multiple tenant configurations
   - Cannot rely on hardcoded test data
   - Need mock tenant configs for unit tests

### Mitigations

| Concern                  | Mitigation                                        |
| ------------------------ | ------------------------------------------------- |
| Configuration complexity | Default seeding with common business types        |
| Admin UI requirement     | Phase 2: Admin dashboard for tenant configuration |
| Testing overhead         | Reusable test fixtures with sample tenant configs |
| Performance impact       | Memoize config maps (O(1) lookup)                 |

---

## Compliance Validation

### Business Architecture Requirements

| Requirement            | Compliance | Evidence                                       |
| ---------------------- | ---------- | ---------------------------------------------- |
| Multi-domain support   | ✅         | Generic `domains` array from connector tags    |
| Configurable metrics   | ✅         | `TenantConfig.business.insights.metricClasses` |
| No hardcoding          | ✅         | Zero business-specific enums or unions         |
| Tenant isolation       | ✅         | Per-tenant `TenantConfig` with RLS             |
| Agency partner support | ✅         | Different configs per client tenant            |
| Template flexibility   | ✅         | Types are tenant-defined, not template-locked  |

### Multi-Tenant Guardrails

| Constraint              | Compliance | Evidence                          |
| ----------------------- | ---------- | --------------------------------- |
| Tenant-scoped config    | ✅         | `TenantConfig.business.insights`  |
| Context propagation     | ✅         | Hook uses `useTenantConfig()`     |
| Type safety             | ✅         | Zod validation, strict TypeScript |
| No hardcoded tenant IDs | ✅         | Config loaded from context        |
| RLS alignment           | ✅         | TenantConfig via scoped queries   |

### TypeScript Guidelines

| Requirement          | Compliance | Evidence                               |
| -------------------- | ---------- | -------------------------------------- |
| Strict mode          | ✅         | Zero `any` types                       |
| Runtime validation   | ✅         | Zod schemas for TenantConfig           |
| Type guards          | ✅         | `validateInsightType()` function       |
| Generics over unions | ✅         | Flexible `InsightAttributes` interface |

---

## Implementation Examples

### Example 1: Marketing Agency

```json
{
  "business": {
    "insights": {
      "types": [
        { "id": "weekly_performance", "name": "Weekly Performance" },
        { "id": "monthly_roi", "name": "Monthly ROI" }
      ],
      "metricClasses": [
        { "id": "roi", "name": "Return on Investment", "unit": "percentage" },
        { "id": "conversion", "name": "Conversion Rate", "unit": "percentage" }
      ],
      "domains": [{ "id": "marketing", "name": "Marketing", "color": "blue" }]
    }
  }
}
```

### Example 2: Healthcare Provider

```json
{
  "business": {
    "insights": {
      "types": [
        { "id": "patient_readmission_risk", "name": "Patient Readmission Risk" },
        { "id": "bed_utilization", "name": "Bed Utilization" }
      ],
      "metricClasses": [
        { "id": "readmission_rate", "name": "Readmission Rate", "unit": "percentage" },
        { "id": "los", "name": "Length of Stay", "unit": "days" }
      ],
      "domains": [
        { "id": "clinical", "name": "Clinical", "color": "red" },
        { "id": "operations", "name": "Operations", "color": "blue" }
      ]
    }
  }
}
```

### Example 3: E-commerce

```json
{
  "business": {
    "insights": {
      "types": [
        { "id": "inventory_turnover", "name": "Inventory Turnover" },
        { "id": "customer_lifetime_value", "name": "Customer Lifetime Value" }
      ],
      "metricClasses": [
        { "id": "turnover", "name": "Turnover Rate", "unit": "ratio" },
        { "id": "ltv", "name": "Lifetime Value", "unit": "currency" }
      ],
      "domains": [
        { "id": "inventory", "name": "Inventory", "color": "orange" },
        { "id": "sales", "name": "Sales", "color": "green" }
      ]
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe("useInsightLocalization", () => {
  it("uses tenant-configured insight type name", () => {
    // Test with marketing tenant config
  });

  it("falls back to composed parts when type not configured", () => {
    // Test with empty tenant config
  });

  it("uses raw name as final fallback", () => {
    // Test with minimal insight data
  });

  it("handles multiple business domains", () => {
    // Test with healthcare tenant config
  });
});
```

### Integration Tests

```typescript
test("displays insight titles based on tenant configuration", async ({ page }) => {
  // Tenant A: Marketing - "Weekly Performance"
  // Tenant B: Healthcare - "Patient Readmission Risk"
  // Tenant C: E-commerce - "Inventory Turnover"
});
```

---

## Migration Notes

**Greenfield Development:** This is pre-production with no backward compatibility requirements. Destructive updates allowed.

**Implementation Order:**

1. Extend `TenantConfig` schema
2. Update `InsightDTO` type definition
3. Update API to use new DTO
4. Update frontend hook
5. Seed default configurations

---

## Related Documents

- **Implementation Plan:** `/docs/implementation-plans/composable-insight-localization.md`
- **Business Architecture:** `/docs/architecture/business/business-architecture.md`
- **TenantConfig Schema:** `/packages/config/src/schemas/tenant.ts`
- **Multi-Tenant Guardrails:** `/docs/05-reference/multi-tenant-guardrails.md`
- **Tenant Requirements SSOT:** `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`

---

## Approval

| Role         | Name | Date | Status  |
| ------------ | ---- | ---- | ------- |
| Architecture | TBD  | TBD  | Pending |
| Product      | TBD  | TBD  | Pending |
| Engineering  | TBD  | TBD  | Pending |

---

**Document Status:** ✅ Accepted  
**Next Review:** After Phase 1 implementation  
**Maintainer:** Engineering Team
