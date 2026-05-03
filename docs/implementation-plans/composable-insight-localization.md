# Implementation Plan: Business-Agnostic Insight Localization

**Version:** 2.0 (Refactored for Business Architecture Compliance)  
**Status:** Proposed  
**Last Updated:** 2026-05-03  
**Compliance:** Aligned with `/docs/architecture/business/business-architecture.md`

---

## Executive Summary

**Refactored Approach:** Replace hardcoded business taxonomy with **tenant-configurable insight descriptors** that support arbitrary business domains, metrics, and localization patterns without code changes.

**Key Changes from v1:**

| v1 Approach (Rejected)        | v2 Approach (Approved)                                              |
| ----------------------------- | ------------------------------------------------------------------- |
| Hardcoded `InsightType` enum  | Tenant-defined `insightType` string with optional schema validation |
| Fixed `metricClass` union     | Configurable `metricClasses` array in `TenantConfig`                |
| Predefined `domain` union     | Dynamic domain tags from connector metadata                         |
| Static i18n key hierarchies   | Composable localization with fallback descriptors                   |
| API infers business semantics | API returns raw data; frontend composes presentation                |

---

## Architecture Principles

### 1. Business-Agnostic Platform

The platform **must not** embed knowledge of specific:

- Business domains (marketing, finance, healthcare, education, etc.)
- Metric types (roi, conversion, patient_readmission, student_attendance, etc.)
- Insight categories (performance, compliance, safety, quality, etc.)

**Implementation:** All business taxonomy is tenant-configured via `TenantConfig`.

### 2. Tenant-Scoped Configuration

Per multi-tenant guardrails:

- Each tenant defines their own insight types, metrics, and domains
- Configuration isolated via `TenantConfig` with RLS enforcement
- Agency partners can configure different taxonomy per client tenant

**Implementation:** `TenantConfig.business.insights` contains tenant-specific definitions.

### 3. Type Safety Without Hardcoding

Use TypeScript generics and mapped types to maintain strict typing without embedding business values:

```typescript
// ✅ Generic descriptor pattern
interface InsightDescriptor<T extends string = string> {
  type: T;
  attributes: Record<string, unknown>;
}

// ✅ Tenant-configured validation
type TenantInsightType = TenantConfig["business"]["insights"]["types"][number]["id"];
```

### 4. Separation of Concerns

| Layer            | Responsibility                                     |
| ---------------- | -------------------------------------------------- |
| **API**          | Return raw insight data + type identifiers         |
| **Frontend**     | Compose localized messages from descriptors        |
| **TenantConfig** | Define business taxonomy and localization mappings |
| **i18n**         | Provide fallback patterns, not hardcoded keys      |

---

## Proposed Architecture

### Phase 1: Schema Redesign

#### New Schema: `InsightDTO` (Business-Agnostic)

```typescript
// packages/types/src/insight.ts
import type { TenantConfig } from "@agenticverdict/config";

// Insight type is defined by tenant, not hardcoded
export type InsightType = string;

// Flexible metadata that accommodates any business domain
export interface InsightAttributes {
  // Optional period (tenant-configured)
  period?: string;

  // Optional metric class (tenant-configured)
  metricClass?: string;

  // Optional severity/urgency (tenant-configured)
  severity?: string;

  // Arbitrary additional attributes
  [key: string]: unknown;
}

// Domain is derived from connector tags, not hardcoded
export type InsightDomain = string;

export interface InsightDTO {
  id: string;

  // Tenant-defined insight type identifier
  insightType: InsightType;

  // Flexible metadata (no hardcoded unions)
  attributes: InsightAttributes;

  // Derived from connector domain tags (not inferred by API)
  domains: InsightDomain[];

  // Raw name for debugging/fallback
  rawName: string;

  // Timestamp
  createdAt: string;

  // Connector IDs that contributed to this insight
  connectorIds: string[];
}
```

#### TenantConfig Extension

```typescript
// packages/config/src/schemas/tenant.ts (extension)
export const tenantBusinessConfigSchema = z.object({
  // Tenant-defined insight types
  insights: z.object({
    // Available insight types for this tenant
    types: z.array(
      z.object({
        id: z.string(), // e.g., 'weekly_performance'
        name: z.string(), // e.g., 'Weekly Performance'
        description: z.string().optional(), // e.g., 'Performance metrics and trends'
        category: z.string().optional(), // e.g., 'performance'
        defaultPeriod: z.string().optional(), // e.g., 'weekly'
      }),
    ),

    // Configurable metric classes
    metricClasses: z.array(
      z.object({
        id: z.string(), // e.g., 'roi'
        name: z.string(), // e.g., 'Return on Investment'
        unit: z.string().optional(), // e.g., 'percentage'
      }),
    ),

    // Configurable periods
    periods: z.array(
      z.object({
        id: z.string(), // e.g., 'weekly'
        name: z.string(), // e.g., 'Weekly'
        durationDays: z.number().optional(),
      }),
    ),

    // Configurable domains (can differ from connector tags)
    domains: z.array(
      z.object({
        id: z.string(), // e.g., 'marketing'
        name: z.string(), // e.g., 'Marketing'
        color: z.string().optional(), // For UI badges
      }),
    ),
  }),
});
```

### Phase 2: API Contract (No Business Inference)

#### Updated Router Response

```typescript
// apps/api/src/trpc/routers/dashboard.ts
import { type InsightDTO } from "@agenticverdict/types";

const insightsData: InsightDTO[] = insightRows.map((insight) => ({
  id: insight.id,

  // Use raw insight name as type identifier (tenant will map this)
  insightType: normalizeIdentifier(insight.name),

  // Extract generic attributes (no business assumptions)
  attributes: {
    period: extractPeriod(insight.name), // May be undefined
    metricClass: extractMetricClass(insight), // From connector metadata
    severity: insight.severity ?? undefined,
  },

  // Derive domains from connector tags (not hardcoded inference)
  domains: insight.connectors.flatMap((c) => c.domainTags ?? []),

  rawName: insight.name,
  createdAt: insight.createdAt.toISOString(),
  connectorIds: insight.connectors.map((c) => c.id),
}));
```

#### Pure Helper Functions (No Business Logic)

```typescript
// apps/api/src/lib/insight-extraction.ts

/**
 * Normalize string to identifier (lowercase, underscores)
 * Does NOT validate against hardcoded enum
 */
export function normalizeIdentifier(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Extract period from insight name if present
 * Returns undefined if no period detected (tenant handles fallback)
 */
export function extractPeriod(name: string): string | undefined {
  const periodPatterns = [
    /^(daily|weekly|monthly|quarterly|yearly)\b/i,
    /\b(daily|weekly|monthly|quarterly|yearly)\b/i,
  ];

  for (const pattern of periodPatterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return undefined; // Tenant will use default or fallback
}

/**
 * Extract metric class from connector metadata
 * Does NOT hardcode metric class values
 */
export function extractMetricClass(insight: InsightRow): string | undefined {
  // Use first connector's primary metric class if available
  const connector = insight.connectors[0];
  return connector?.metadata?.primaryMetricClass;
}
```

### Phase 3: Frontend Composition Layer

#### New Hook: `useInsightLocalization` (Tenant-Aware)

```typescript
// apps/frontend/src/features/dashboard/hooks/use-insight-localization.ts
import { useTranslations } from "@/i18n/react";
import { useTenantConfig } from "@/features/tenant/hooks/use-tenant-config";
import type { InsightDTO } from "@agenticverdict/types";

interface UseInsightLocalizationReturn {
  getTitle: (insight: InsightDTO) => string;
  getBody: (insight: InsightDTO) => string;
  getDomainLabels: (domains: string[]) => string[];
  getAriaLabel: (insight: InsightDTO) => string;
}

export function useInsightLocalization(): UseInsightLocalizationReturn {
  const t = useTranslations("dashboard");
  const { config: tenantConfig } = useTenantConfig();

  // Build lookup maps from tenant config
  const insightTypeMap = new Map(
    tenantConfig.business.insights.types.map((type) => [type.id, type]),
  );

  const metricClassMap = new Map(
    tenantConfig.business.insights.metricClasses.map((mc) => [mc.id, mc.name]),
  );

  const periodMap = new Map(tenantConfig.business.insights.periods.map((p) => [p.id, p.name]));

  const domainMap = new Map(tenantConfig.business.insights.domains.map((d) => [d.id, d.name]));

  const getTitle = (insight: InsightDTO) => {
    // Primary: Try tenant-configured insight type definition
    const typeDef = insightTypeMap.get(insight.insightType);
    if (typeDef?.name) {
      return typeDef.name;
    }

    // Fallback 1: Try i18n key (tenant may have defined custom keys)
    const i18nKey = `insights.types.${insight.insightType}.title`;
    const i18nTitle = t(i18nKey, { returnNull: true });
    if (i18nTitle) {
      return i18nTitle;
    }

    // Fallback 2: Compose from tenant-configured parts
    const periodName = insight.attributes.period
      ? (periodMap.get(insight.attributes.period) ?? insight.attributes.period)
      : "";
    const metricName = insight.attributes.metricClass
      ? (metricClassMap.get(insight.attributes.metricClass) ?? insight.attributes.metricClass)
      : "";

    if (periodName && metricName) {
      return `${periodName} ${metricName}`;
    }

    // Fallback 3: Use raw name (capitalized)
    return capitalizeWords(insight.rawName);
  };

  const getBody = (insight: InsightDTO) => {
    // Primary: Try tenant-configured description
    const typeDef = insightTypeMap.get(insight.insightType);
    if (typeDef?.description) {
      return typeDef.description;
    }

    // Fallback 1: Try i18n key
    const i18nKey = `insights.types.${insight.insightType}.body`;
    const i18nBody = t(i18nKey, { returnNull: true });
    if (i18nBody) {
      return i18nBody;
    }

    // Fallback 2: Generic template with interpolation
    const periodName = insight.attributes.period
      ? (periodMap.get(insight.attributes.period) ?? insight.attributes.period)
      : "Periodic";

    return t("insights.body.default", {
      period: periodName,
      defaultValue: `${periodName} metrics and analysis`,
    });
  };

  const getDomainLabels = (domains: string[]) => {
    return domains.map((domain) => {
      // Try tenant-configured domain name
      const domainDef = domainMap.get(domain);
      if (domainDef) {
        return domainDef;
      }

      // Try i18n
      const i18nDomain = t(`domains.${domain}`, { returnNull: true });
      if (i18nDomain) {
        return i18nDomain;
      }

      // Fallback to raw domain name
      return capitalizeWords(domain);
    });
  };

  const getAriaLabel = (insight: InsightDTO) => {
    const title = getTitle(insight);
    const domainLabels = getDomainLabels(insight.domains);
    const domains = domainLabels.length > 0 ? `, ${domainLabels.join(", ")}` : "";

    return `${title}${domains}`;
  };

  return { getTitle, getBody, getDomainLabels, getAriaLabel };
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
```

#### Updated UI Component

```typescript
// apps/frontend/src/features/dashboard/ui/surfaces/HomeDashboardSurface.tsx
import { useInsightLocalization } from '@/features/dashboard/hooks/use-insight-localization';
import { useTenantConfig } from '@/features/tenant/hooks/use-tenant-config';

export function HomeDashboardSurface({ user, scopedClientId }) {
  const { getTitle, getBody, getDomainLabels } = useInsightLocalization();
  const { config: tenantConfig } = useTenantConfig();
  const t = useTranslations('dashboard');

  // ... queries ...

  return (
    <DashboardAsyncSection ...>
      <Stack gap="md">
        {(insightsQuery.data ?? []).map((row) => {
          const domainLabels = getDomainLabels(row.domains);
          const primaryDomain = domainLabels[0];

          // Get domain color from tenant config
          const domainDef = tenantConfig.business.insights.domains.find(
            d => d.id === row.domains[0]
          );

          return (
            <Card key={row.id}>
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{getTitle(row)}</Text>
                  <Text size="sm" c="dimmed">
                    {getBody(row)}
                  </Text>
                </div>
                {primaryDomain && (
                  <Badge
                    variant="light"
                    color={domainDef?.color}
                  >
                    {primaryDomain}
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                {t('insights.relativeTime.updatedRecently')}
              </Text>
            </Card>
          );
        })}
      </Stack>
    </DashboardAsyncSection>
  );
}
```

### Phase 4: i18n Structure (Generic Patterns)

#### New Key Hierarchy (No Hardcoded Types)

```json
{
  "insights": {
    "types": {
      "//": "Tenant may define custom keys per insight type",
      "//": "Example: weekly_performance.title, monthly_roi.body, etc.",
      "//": "These are OPTIONAL - tenant config takes precedence"
    },
    "body": {
      "default": "{period} metrics and analysis",
      "generic": "Insight details and recommendations"
    },
    "relativeTime": {
      "updatedRecently": "Updated recently",
      "justNow": "Just now",
      "minutesAgo": "{minutes} minutes ago",
      "hoursAgo": "{hours} hours ago",
      "daysAgo": "{days} days ago"
    },
    "ariaLabels": {
      "insightCard": "{title} insight for {domains}",
      "default": "Business insight"
    }
  },
  "domains": {
    "//": "Tenant may define custom domain names",
    "//": "Fallback: capitalize raw domain identifier"
  },
  "dashboard": {
    "insights": {
      "title": "Your Insights",
      "empty": "No insights available",
      "loading": "Loading insights..."
    }
  }
}
```

---

## Implementation Tasks

### Task 1: Extend TenantConfig Schema

- [ ] Add `business.insights` schema to `packages/config/src/schemas/tenant.ts`
- [ ] Add Zod validation for insight types, metric classes, periods, domains
- [ ] Update TenantConfig defaults/seeding
- [ ] Run typecheck
- **Files:** `packages/config/src/schemas/tenant.ts`, `packages/database/src/seeds/`
- **Estimate:** 2 hours

### Task 2: Define Generic Insight Types

- [ ] Create `InsightDTO` in `packages/types/src/insight.ts`
- [ ] Define `InsightAttributes` interface (flexible, no hardcoded unions)
- [ ] Export from `packages/types` barrel
- [ ] Run typecheck
- **Files:** `packages/types/src/insight.ts`, `packages/types/src/index.ts`
- **Estimate:** 1 hour

### Task 3: Implement API Extraction Functions

- [ ] Create `normalizeIdentifier()` (pure string manipulation)
- [ ] Create `extractPeriod()` (pattern matching, returns undefined if not found)
- [ ] Create `extractMetricClass()` (from connector metadata)
- [ ] Add unit tests for edge cases
- **Files:** `apps/api/src/lib/insight-extraction.ts`, `apps/api/src/lib/insight-extraction.test.ts`
- **Estimate:** 2 hours

### Task 4: Update tRPC Router

- [ ] Import new `InsightDTO` type
- [ ] Replace hardcoded domain inference with connector tag extraction
- [ ] Update response mapping to use new schema
- [ ] Remove legacy `titleKey`/`bodyKey` fields
- [ ] Run typecheck
- **Files:** `apps/api/src/trpc/routers/dashboard.ts`
- **Estimate:** 2 hours

### Task 5: Create Tenant-Aware Localization Hook

- [ ] Implement `useInsightLocalization` with tenant config lookup
- [ ] Implement multi-level fallback strategy
- [ ] Add `getDomainLabels` for domain name resolution
- [ ] Write unit tests with mock tenant configs
- **Files:** `apps/frontend/src/features/dashboard/hooks/use-insight-localization.ts`, `.test.ts`
- **Estimate:** 3 hours

### Task 6: Update i18n Files

- [ ] Remove hardcoded insight type keys from `en.json`, `ar.json`, `fr.json`
- [ ] Add generic fallback patterns
- [ ] Add relative time variations (seconds, hours, days)
- [ ] Add aria label patterns
- [ ] Run translation parity check
- **Files:** `packages/i18n/src/locales/*.json`
- **Estimate:** 2 hours

### Task 7: Update UI Components

- [ ] Update `HomeDashboardSurface.tsx` to use new hook
- [ ] Update domain badge rendering with tenant-configured colors
- [ ] Verify RTL rendering for Arabic
- [ ] Test with various tenant configurations
- **Files:** `apps/frontend/src/features/dashboard/ui/**/*.tsx`
- **Estimate:** 2 hours

### Task 8: TenantConfig Seeding & Migration

- [ ] Create seed script to populate default insight types/metrics/domains
- [ ] Support tenant-specific customization via admin UI
- [ ] Document TenantConfig structure for agencies
- **Files:** `packages/database/src/seeds/`, `apps/frontend/src/features/admin/`
- **Estimate:** 3 hours

### Task 9: Testing & Validation

- [ ] Run full typecheck
- [ ] Run lint
- [ ] Run unit tests
- [ ] Manual QA: English, Arabic, French
- [ ] Verify accessibility (screen readers)
- [ ] Test with multiple tenant configurations
- **Estimate:** 3 hours

**Total Estimate:** 20 hours (~2.5 days with review cycles)

---

## Type Safety Strategy

### Generics Over Enums

```typescript
// ❌ Avoid: Hardcoded enum
type InsightType = "weekly_performance" | "monthly_roi" | string;

// ✅ Prefer: Generic with tenant constraint
type TenantInsightType = TenantConfig["business"]["insights"]["types"][number]["id"];

// ✅ Also valid: String with runtime validation
interface InsightDescriptor {
  type: string; // Validated against TenantConfig at runtime
  attributes: InsightAttributes;
}
```

### Runtime Validation

```typescript
// apps/api/src/lib/insight-validation.ts
import { tenantConfigSchema } from "@agenticverdict/config";

export function validateInsightType(
  insightType: string,
  tenantConfig: z.infer<typeof tenantConfigSchema>,
): boolean {
  const validTypes = tenantConfig.business.insights.types.map((t) => t.id);
  return validTypes.includes(insightType);
}

export function assertValidInsightType(
  insightType: string,
  tenantConfig: z.infer<typeof tenantConfigSchema>,
): void {
  if (!validateInsightType(insightType, tenantConfig)) {
    throw new ValidationError(
      "INVALID_INSIGHT_TYPE",
      `Insight type "${insightType}" not configured for tenant`,
      400,
    );
  }
}
```

---

## Tenant Configuration Examples

### Example 1: Marketing Agency (Default)

```json
{
  "business": {
    "insights": {
      "types": [
        {
          "id": "weekly_performance",
          "name": "Weekly Performance",
          "description": "Performance metrics and trends",
          "category": "performance",
          "defaultPeriod": "weekly"
        },
        {
          "id": "monthly_roi",
          "name": "Monthly ROI",
          "description": "Return on investment analysis",
          "category": "efficiency",
          "defaultPeriod": "monthly"
        }
      ],
      "metricClasses": [
        { "id": "performance", "name": "Performance" },
        { "id": "roi", "name": "Return on Investment", "unit": "percentage" },
        { "id": "engagement", "name": "Engagement" },
        { "id": "conversion", "name": "Conversion Rate", "unit": "percentage" }
      ],
      "periods": [
        { "id": "daily", "name": "Daily" },
        { "id": "weekly", "name": "Weekly" },
        { "id": "monthly", "name": "Monthly" },
        { "id": "quarterly", "name": "Quarterly" }
      ],
      "domains": [
        { "id": "marketing", "name": "Marketing", "color": "blue" },
        { "id": "social", "name": "Social Media", "color": "purple" },
        { "id": "seo", "name": "SEO", "color": "green" }
      ]
    }
  }
}
```

### Example 2: Healthcare Provider (Custom)

```json
{
  "business": {
    "insights": {
      "types": [
        {
          "id": "patient_readmission_risk",
          "name": "Patient Readmission Risk",
          "description": "Risk assessment for 30-day readmissions",
          "category": "quality",
          "defaultPeriod": "monthly"
        },
        {
          "id": "bed_utilization",
          "name": "Bed Utilization",
          "description": "Hospital bed occupancy analysis",
          "category": "operations",
          "defaultPeriod": "daily"
        }
      ],
      "metricClasses": [
        { "id": "readmission_rate", "name": "Readmission Rate", "unit": "percentage" },
        { "id": "los", "name": "Length of Stay", "unit": "days" },
        { "id": "utilization", "name": "Utilization Rate", "unit": "percentage" }
      ],
      "periods": [
        { "id": "daily", "name": "Daily" },
        { "id": "weekly", "name": "Weekly" },
        { "id": "monthly", "name": "Monthly" },
        { "id": "shift", "name": "Per Shift" }
      ],
      "domains": [
        { "id": "clinical", "name": "Clinical", "color": "red" },
        { "id": "operations", "name": "Operations", "color": "blue" },
        { "id": "quality", "name": "Quality", "color": "green" }
      ]
    }
  }
}
```

### Example 3: E-commerce (Custom)

```json
{
  "business": {
    "insights": {
      "types": [
        {
          "id": "inventory_turnover",
          "name": "Inventory Turnover",
          "description": "Stock movement and reorder alerts",
          "category": "operations",
          "defaultPeriod": "weekly"
        },
        {
          "id": "customer_lifetime_value",
          "name": "Customer Lifetime Value",
          "description": "LTV trends and segmentation",
          "category": "finance",
          "defaultPeriod": "monthly"
        }
      ],
      "metricClasses": [
        { "id": "turnover", "name": "Turnover Rate", "unit": "ratio" },
        { "id": "ltv", "name": "Lifetime Value", "unit": "currency" },
        { "id": "cac", "name": "Customer Acquisition Cost", "unit": "currency" }
      ],
      "periods": [
        { "id": "daily", "name": "Daily" },
        { "id": "weekly", "name": "Weekly" },
        { "id": "monthly", "name": "Monthly" },
        { "id": "seasonal", "name": "Seasonal" }
      ],
      "domains": [
        { "id": "inventory", "name": "Inventory", "color": "orange" },
        { "id": "sales", "name": "Sales", "color": "green" },
        { "id": "marketing", "name": "Marketing", "color": "blue" }
      ]
    }
  }
}
```

---

## Migration Strategy (Greenfield Only)

### No Backward Compatibility Required

Per project constraints: **This is greenfield pre-production development without backward compatibility or database migrations.**

**Approach:** Destructive updates allowed. No legacy code support needed.

### Implementation Order

1. **Update schemas first** (`packages/config`, `packages/types`)
2. **Update API** to use new DTO (no legacy fields)
3. **Update frontend** to use new hook
4. **Seed default configurations** for initial tenants

---

## Testing Strategy

### Unit Tests

```typescript
// apps/frontend/src/features/dashboard/hooks/use-insight-localization.test.ts
describe("useInsightLocalization", () => {
  it("uses tenant-configured insight type name", () => {
    const insight: InsightDTO = {
      id: "1",
      insightType: "weekly_performance",
      attributes: { period: "weekly" },
      domains: ["marketing"],
      rawName: "Weekly Performance",
      createdAt: new Date().toISOString(),
      connectorIds: ["ga4-1"],
    };

    const mockTenantConfig = {
      business: {
        insights: {
          types: [{ id: "weekly_performance", name: "Weekly Performance" }],
          metricClasses: [],
          periods: [],
          domains: [],
        },
      },
    };

    const { getTitle } = renderHook(() => useInsightLocalization(), {
      wrapper: createTenantConfigWrapper(mockTenantConfig),
    });

    expect(getTitle(insight)).toBe("Weekly Performance");
  });

  it("falls back to composed parts when type not configured", () => {
    const insight: InsightDTO = {
      id: "1",
      insightType: "unknown_type",
      attributes: { period: "weekly", metricClass: "performance" },
      domains: [],
      rawName: "Unknown",
      createdAt: new Date().toISOString(),
      connectorIds: [],
    };

    const mockTenantConfig = {
      business: {
        insights: {
          types: [],
          metricClasses: [{ id: "performance", name: "Performance" }],
          periods: [{ id: "weekly", name: "Weekly" }],
          domains: [],
        },
      },
    };

    const { getTitle } = renderHook(() => useInsightLocalization(), {
      wrapper: createTenantConfigWrapper(mockTenantConfig),
    });

    expect(getTitle(insight)).toBe("Weekly Performance");
  });

  it("uses raw name as final fallback", () => {
    const insight: InsightDTO = {
      id: "1",
      insightType: "unknown",
      attributes: {},
      domains: [],
      rawName: "custom insight",
      createdAt: new Date().toISOString(),
      connectorIds: [],
    };

    const { getTitle } = renderHook(() => useInsightLocalization(), {
      wrapper: createTenantConfigWrapper({
        business: { insights: { types: [], metricClasses: [], periods: [], domains: [] } },
      }),
    });

    expect(getTitle(insight)).toBe("Custom Insight");
  });
});
```

### Integration Tests

```typescript
// tests/e2e/dashboard/insights-tenant-config.spec.ts
test("displays insight titles based on tenant configuration", async ({ page }) => {
  // Tenant A: Marketing agency
  await page.goto("/dashboard?tenant=tenant-a");
  await expect(page.getByText("Weekly Performance")).toBeVisible();

  // Tenant B: Healthcare provider
  await page.goto("/dashboard?tenant=tenant-b");
  await expect(page.getByText("Patient Readmission Risk")).toBeVisible();

  // Verify different metric classes
  await expect(page.getByText("Readmission Rate")).toBeVisible();
});

test("handles missing tenant configuration gracefully", async ({ page }) => {
  await page.goto("/dashboard?tenant=tenant-no-config");

  // Should fall back to raw insight names
  await expect(page.getByText(/^[A-Z]/)).toBeVisible(); // Capitalized names
});
```

---

## Success Metrics

| Metric                     | Target                               | Measurement                |
| -------------------------- | ------------------------------------ | -------------------------- |
| **Zero Hardcoded Types**   | 0 business-specific enums            | Code review, grep patterns |
| **Tenant Config Coverage** | 100% of insight types from config    | Runtime validation         |
| **Fallback Rate**          | <5% fallback to raw name             | Production logging         |
| **Type Safety**            | 0 `any` types                        | TypeScript strict mode     |
| **Coverage**               | 90%+ hook coverage                   | Vitest coverage report     |
| **Multi-Domain Support**   | 3+ different business domains tested | E2E test scenarios         |

---

## Risks & Mitigations

| Risk                                 | Likelihood | Impact | Mitigation                                   |
| ------------------------------------ | ---------- | ------ | -------------------------------------------- |
| Tenant config missing insight types  | Medium     | Medium | Default seeding + fallback to raw names      |
| Performance impact of config lookups | Low        | Low    | Memoize config maps, use Map for O(1) lookup |
| Complex tenant customization         | High       | Low    | Admin UI for configuration (Phase 2)         |
| Translation gaps for new domains     | Medium     | High   | Generic fallback patterns, no hardcoded keys |
| Agency partner confusion             | Medium     | Medium | Documentation + example configs              |

---

## Files to Create/Modify

### Create

- `packages/types/src/insight.ts`
- `apps/api/src/lib/insight-extraction.ts`
- `apps/api/src/lib/insight-extraction.test.ts`
- `apps/api/src/lib/insight-validation.ts`
- `apps/frontend/src/features/dashboard/hooks/use-insight-localization.ts`
- `apps/frontend/src/features/dashboard/hooks/use-insight-localization.test.ts`

### Modify

- `packages/config/src/schemas/tenant.ts` (extend with `business.insights`)
- `packages/types/src/index.ts` (exports)
- `apps/api/src/trpc/routers/dashboard.ts` (use new DTO)
- `apps/frontend/src/features/dashboard/ui/surfaces/HomeDashboardSurface.tsx`
- `packages/i18n/src/locales/en.json`
- `packages/i18n/src/locales/ar.json`
- `packages/i18n/src/locales/fr.json`
- `packages/database/src/seeds/` (default tenant configs)

---

## Acceptance Criteria

- ✅ **Zero hardcoded business types** in API or platform code
- ✅ **TenantConfig contains all business taxonomy** (types, metrics, domains, periods)
- ✅ **Type-safe implementation** without `any` types or hardcoded enums
- ✅ **Multi-level fallback strategy** (config → i18n → composition → raw name)
- ✅ **All three locales** (EN, AR, FR) with RTL compatibility
- ✅ **Support for 3+ different business domains** (marketing, healthcare, e-commerce)
- ✅ **Agency partner ready** (different configs per client tenant)
- ✅ **90%+ test coverage** for localization hook
- ✅ **Zero TypeScript errors**, lint passes
- ✅ **Documentation** for tenant configuration

---

## Architecture Compliance

### Business Architecture Alignment

| Requirement           | Compliance | Evidence                                        |
| --------------------- | ---------- | ----------------------------------------------- |
| Multi-domain support  | ✅         | Generic `domains` array from connector tags     |
| Configurable metrics  | ✅         | `TenantConfig.business.insights.metricClasses`  |
| Template flexibility  | ✅         | Insight types are tenant-defined, not hardcoded |
| Connector reusability | ✅         | Domains derived from connector metadata         |
| Tenant isolation      | ✅         | Per-tenant `TenantConfig` with RLS              |
| No hardcoding         | ✅         | Zero business-specific enums or unions          |

### Multi-Tenant Guardrails Alignment

| Constraint              | Compliance | Evidence                                 |
| ----------------------- | ---------- | ---------------------------------------- |
| Tenant-scoped config    | ✅         | `TenantConfig.business.insights`         |
| Context propagation     | ✅         | Hook uses `useTenantConfig()`            |
| Type safety             | ✅         | Zod validation, TypeScript generics      |
| No hardcoded tenant IDs | ✅         | Config loaded from context               |
| RLS alignment           | ✅         | TenantConfig accessed via scoped queries |

---

## References

- **Business Architecture:** `/docs/architecture/business/business-architecture.md`
- **Multi-Tenant Guardrails:** `/docs/05-reference/multi-tenant-guardrails.md`
- **Tenant Requirements SSOT:** `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
- **TenantConfig Schema:** `/packages/config/src/schemas/tenant.ts`
- **TypeScript Guidelines:** `/docs/05-reference/typescript-guidelines.md`
- **i18n Guidelines:** `/docs/05-reference/i18n-guidelines.md`

---

**Document Status:** ✅ Proposed  
**Next Steps:** Implementation per task list  
**Maintainer:** Engineering Team
