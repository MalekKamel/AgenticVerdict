# Static Data Injection Best Practices for AgenticVerdict Testing

**Version:** 1.0  
**Date:** 2026-04-06  
**Scope:** Industry best practices for static data injection in testing systems

---

## Executive Summary

This document provides comprehensive guidance on implementing static data injection patterns for testing the AgenticVerdict multi-platform marketing analytics system. It covers mock adapters, fixture management, data factories, database seeding, contract testing, and snapshot testing—tailored specifically to the AgenticVerdict architecture with ConnectorAdapter interfaces, multi-tenant configuration, and report generation workflows.

**Key Recommendations:**

1. **Mock Adapter Pattern**: Use the existing `MockConnectorAdapter` as the foundation for all platform mocking
2. **Fixture Hierarchy**: Organize fixtures by tenant → platform → scenario with clear separation
3. **Data Factories**: Implement builder pattern for complex test data objects
4. **Deterministic Seeding**: Use idempotent database seeds with tenant isolation
5. **Contract Testing**: Validate adapter interfaces stay in sync with real APIs
6. **Visual Regression**: Implement snapshot testing for report generation outputs

---

## Table of Contents

1. [Mock Adapter Patterns](#1-mock-adapter-patterns)
2. [Fixture Management Strategies](#2-fixture-management-strategies)
3. [Data Factories and Builders](#3-data-factories-and-builders)
4. [Database Seeding Patterns](#4-database-seeding-patterns)
5. [Contract Testing](#5-contract-testing)
6. [Snapshot Testing](#6-snapshot-testing)
7. [Test Data Builders](#7-test-data-builders)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Mock Adapter Patterns

### 1.1 Current Implementation Analysis

AgenticVerdict already has a solid foundation with `MockConnectorAdapter` in `/packages/data-connectors/src/mock-adapter.ts`:

```typescript
export class MockConnectorAdapter extends BaseConnectorAdapter {
  readonly platform: ConnectorType;
  private credentials: ConnectorCredentials | null = null;
  private readonly rawResponse: unknown;
  private readonly authFailureMessage?: string;
  private readonly records?: NormalizedMetricRecord[];

  constructor(platform: ConnectorType, options: MockConnectorAdapterOptions) {
    // Implements full ConnectorAdapter interface
    // Supports authentication, data fetching, normalization
  }
}
```

**Strengths:**

- ✅ Implements complete `ConnectorAdapter` interface
- ✅ Inherits resilience patterns from `BaseConnectorAdapter` (circuit breaker, backoff, caching)
- ✅ Supports configurable auth failures
- ✅ Allows raw response injection
- ✅ Supports normalized record overrides

**Gaps to Address:**

- ❌ No preset scenarios (e.g., "high-traffic week", "zero-conversions day")
- ❌ Limited time-series data generation
- ❌ No webhook event simulation
- ❌ Missing rate limit simulation
- ❌ No paginated response handling

### 1.2 Enhanced Mock Adapter Pattern

#### Pattern: Scenario-Based Mock Factories

Create scenario-based mock adapters that encapsulate common test scenarios:

```typescript
// packages/data-connectors/src/mock-adapter-scenarios.ts
export interface MockAdapterScenario {
  name: string;
  description: string;
  platform: ConnectorType;
  setup: () => MockConnectorAdapterOptions;
}

export const mockAdapterScenarios: Record<ConnectorType, MockAdapterScenario[]> = {
  meta: [
    {
      name: "high-spike-week",
      description: "Simulates a week with 3x normal traffic spike",
      platform: "meta",
      setup: () => ({
        rawResponse: generateMetaHighSpikeData(),
        records: generateMetaHighSpikeRecords(),
      }),
    },
    {
      name: "zero-conversions",
      description: "Validates handling of zero-conversion periods",
      platform: "meta",
      setup: () => ({
        rawResponse: { campaigns: [] },
        records: [],
      }),
    },
    {
      name: "rate-limited",
      description: "Simulates Meta rate limiting behavior",
      platform: "meta",
      setup: () => ({
        // Use circuit breaker options to simulate rate limits
        circuitBreakerOptions: {
          failureThreshold: 2,
          halfOpenAttempts: 1,
        },
      }),
    },
  ],
  ga4: [
    {
      name: "normal-traffic-week",
      description: "Standard week with realistic GA4 metrics",
      platform: "ga4",
      setup: () => ({
        rawResponse: generateGA4NormalWeekData(),
      }),
    },
  ],
  // ... scenarios for gsc, gbp, tiktok
};

// Usage in tests:
const scenario = mockAdapterScenarios.meta[0]; // high-spike-week
const adapter = new MockConnectorAdapter("meta", {
  tenantId: "test-tenant-001",
  ...scenario.setup(),
});
```

#### Pattern: Time-Series Data Generators

Implement deterministic time-series generators for realistic data:

```typescript
// packages/data-connectors/src/mock-time-series.ts
export interface TimeSeriesConfig {
  startDate: Date;
  endDate: Date;
  baseValue: number;
  trend: "flat" | "upward" | "downward" | "seasonal";
  volatility: number; // 0-1, standard deviation as percentage of mean
  outliers?: Array<{ date: Date; multiplier: number }>;
}

export function generateTimeSeries(config: TimeSeriesConfig): number[] {
  const { startDate, endDate, baseValue, trend, volatility, outliers } = config;
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const values: number[] = [];

  // Use seeded random for determinism
  let seed = baseValue; // Simple seed for demo

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Apply trend
    let trendMultiplier = 1;
    if (trend === "upward") trendMultiplier = 1 + (i / days) * 0.5; // +50% over period
    if (trend === "downward") trendMultiplier = 1 - (i / days) * 0.3; // -30% over period
    if (trend === "seasonal") {
      // Weekly seasonality
      const dayOfWeek = date.getDay();
      trendMultiplier = 1 + Math.sin((dayOfWeek / 7) * Math.PI * 2) * 0.2;
    }

    // Apply outlier if present
    const outlier = outliers?.find((o) => o.date.getTime() === date.getTime());
    const outlierMultiplier = outlier?.multiplier ?? 1;

    // Generate value with noise
    const noise = (pseudoRandom(seed + i) - 0.5) * 2 * volatility; // -volatility to +volatility
    const value = baseValue * trendMultiplier * outlierMultiplier * (1 + noise);

    values.push(Math.max(0, Math.round(value)));
  }

  return values;
}

// Simple deterministic pseudo-random generator
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Usage:
const spendSeries = generateTimeSeries({
  startDate: new Date("2026-03-01"),
  endDate: new Date("2026-03-31"),
  baseValue: 1000,
  trend: "upward",
  volatility: 0.15,
  outliers: [
    { date: new Date("2026-03-15"), multiplier: 3.5 }, // Spike on March 15
  ],
});
// Result: [1000, 1050, 1080, ..., 3500, ..., 1500] deterministic values
```

#### Pattern: Webhook Event Simulation

For testing webhook handlers and event-driven workflows:

```typescript
// packages/data-connectors/src/mock-webhook.ts
export interface MockWebhookEvent {
  platform: ConnectorType;
  eventType: string;
  timestamp: Date;
  payload: unknown;
  signature?: string; // For signature validation tests
}

export class MockWebhookGenerator {
  constructor(private readonly platform: ConnectorType) {}

  generateCampaignUpdatedEvent(
    campaignId: string,
    changes: Record<string, unknown>,
  ): MockWebhookEvent {
    return {
      platform: this.platform,
      eventType: "campaign.updated",
      timestamp: new Date(),
      payload: {
        campaign_id: campaignId,
        changes,
        updated_at: new Date().toISOString(),
      },
    };
  }

  generateBudgetExhaustedEvent(campaignId: string, budget: number): MockWebhookEvent {
    return {
      platform: this.platform,
      eventType: "campaign.budget_exhausted",
      timestamp: new Date(),
      payload: {
        campaign_id: campaignId,
        budget_spent: budget,
        budget_limit: budget,
      },
    };
  }

  // Generate signed webhook for signature validation tests
  generateSignedEvent(event: MockWebhookEvent, secret: string): MockWebhookEvent {
    const payload = JSON.stringify(event.payload);
    const signature = this.computeSignature(payload, secret);
    return { ...event, signature };
  }

  private computeSignature(payload: string, secret: string): string {
    // HMAC-SHA256 for most platforms
    const crypto = require("crypto");
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }
}

// Usage in webhook handler tests:
const webhookGen = new MockWebhookGenerator("meta");
const event = webhookGen.generateCampaignUpdatedEvent("camp_123", {
  status: "active",
  daily_budget: 5000,
});
await webhookHandler.handle(event);
```

### 1.3 Ensuring Mocks Stay in Sync with Real Adapters

#### Strategy: Interface Compliance Tests

Create automated tests that validate mock adapters conform to the same interface as real adapters:

```typescript
// packages/data-connectors/src/interface-compliance.test.ts
import { describe, it, expect } from "vitest";
import type { ConnectorAdapter } from "./adapter";
import { MockConnectorAdapter } from "./mock-adapter";
import { MetaAdapter } from "./meta/meta-adapter";

interface AdapterComplianceTest {
  name: string;
  test: (adapter: ConnectorAdapter) => Promise<void>;
}

const complianceTests: AdapterComplianceTest[] = [
  {
    name: "authenticate accepts valid credentials",
    test: async (adapter) => {
      await adapter.authenticate({ accessToken: "valid-token" });
      // Should not throw
    },
  },
  {
    name: "fetchMetrics returns structured data",
    test: async (adapter) => {
      await adapter.authenticate({ accessToken: "valid-token" });
      const data = await adapter.fetchMetrics({
        start: "2026-03-01",
        end: "2026-03-31",
      });
      expect(data).toBeDefined();
      expect(typeof data).toBe("object");
    },
  },
  {
    name: "normalizeData returns valid snapshot",
    test: async (adapter) => {
      await adapter.authenticate({ accessToken: "valid-token" });
      const raw = await adapter.fetchMetrics({
        start: "2026-03-01",
        end: "2026-03-31",
      });
      const normalized = adapter.normalizeData(raw, {
        start: "2026-03-01",
        end: "2026-03-31",
      });
      expect(normalized).toHaveProperty("platform");
      expect(normalized).toHaveProperty("dateRange");
      expect(normalized).toHaveProperty("records");
      expect(Array.isArray(normalized.records)).toBe(true);
    },
  },
  {
    name: "isHealthy returns boolean",
    test: async (adapter) => {
      const healthy = await adapter.isHealthy();
      expect(typeof healthy).toBe("boolean");
    },
  },
];

describe("ConnectorAdapter Interface Compliance", () => {
  describe("MockConnectorAdapter", () => {
    const mockAdapter = new MockConnectorAdapter("meta", {
      tenantId: "test-tenant",
    });

    for (const complianceTest of complianceTests) {
      it(complianceTest.name, () => complianceTest.test(mockAdapter));
    }
  });

  describe("MetaAdapter (real adapter)", () => {
    // Only run if credentials available
    const runRealAdapterTests = process.env.TEST_REAL_ADAPTERS === "1";

    const testCondition = runRealAdapterTests ? it : it.skip;

    testCondition("should comply with interface", async () => {
      const metaAdapter = new MetaAdapter({
        tenantId: "test-tenant",
        // Add real credentials if testing
      });

      for (const complianceTest of complianceTests) {
        await complianceTest.test(metaAdapter);
      }
    });
  });
});
```

#### Strategy: Schema Validation Tests

Validate that mock data matches the schema expected by real adapters:

```typescript
// packages/data-connectors/src/schema-validation.test.ts
import { describe, it, expect } from "vitest";
import { MockConnectorAdapter } from "./mock-adapter";
import { metaResponseSchema } from "./meta/meta-response-schema";
import { ga4ResponseSchema } from "./ga4/ga4-response-schema";

describe("Mock Adapter Schema Validation", () => {
  it("Meta mock responses match Meta schema", async () => {
    const adapter = new MockConnectorAdapter("meta", {
      tenantId: "test-tenant",
    });
    await adapter.authenticate({ accessToken: "test" });
    const data = await adapter.fetchMetrics({
      start: "2026-03-01",
      end: "2026-03-31",
    });

    const result = metaResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("GA4 mock responses match GA4 schema", async () => {
    const adapter = new MockConnectorAdapter("ga4", {
      tenantId: "test-tenant",
    });
    await adapter.authenticate({ accessToken: "test" });
    const data = await adapter.fetchMetrics({
      start: "2026-03-01",
      end: "2026-03-31",
    });

    const result = ga4ResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
```

---

## 2. Fixture Management Strategies

### 2.1 Current Fixture Organization

AgenticVerdict currently uses:

```
tests/
├── fixtures/
│   ├── companies/
│   │   ├── test-tenant-001.json
│   │   ├── test-tenant-arabic.json
│   │   └── test-tenant-multilingual.json
│   └── templates/
│       └── scenario-templates.json
└── scenarios/
    ├── R01-pdf-generation-en-ltr/
    │   ├── fixtures/
    │   │   ├── company-config.json
    │   │   └── report-data.json
    │   └── validation/
    │       └── expected-output.json
    └── R05-multi-platform-report/
        └── fixtures/
            ├── meta-data.json
            ├── ga4-data.json
            ├── gsc-data.json
            ├── gbp-data.json
            └── tiktok-data.json
```

**Strengths:**

- ✅ Clear separation between company fixtures and scenario fixtures
- ✅ Scenario-based organization aligns with testing methodology
- ✅ Validation expectations stored alongside fixtures

**Gaps:**

- ❌ No fixture versioning or change tracking
- ❌ Limited fixture composition (can't easily combine fixtures)
- ❌ No fixture relationships or dependencies
- ❌ Missing edge case fixtures
- ❌ No fixture documentation

### 2.2 Enhanced Fixture Management

#### Pattern: Hierarchical Fixture Organization

```
tests/
├── fixtures/
│   ├── base/                    # Base configurations
│   │   ├── tenants/
│   │   │   ├── default-tenant.json
│   │   │   ├── enterprise-tenant.json
│   │   │   └── startup-tenant.json
│   │   └── platforms/
│   │       ├── meta-default.json
│   │       ├── ga4-default.json
│   │       └── gsc-default.json
│   ├── scenarios/               # Scenario-specific overrides
│   │   ├── high-traffic-week/
│   │   │   ├── meta-override.json
│   │   │   └── ga4-override.json
│   │   ├── zero-conversions/
│   │   └── rate-limited/
│   ├── edge-cases/              # Boundary conditions
│   │   ├── empty-responses/
│   │   ├── malformed-data/
│   │   └── time-boundary-cases/
│   └── templates/               # Report templates
│       └── ...
├── fixture-loaders/             # Fixture loading utilities
│   ├── tenant-fixture-loader.ts
│   ├── platform-fixture-loader.ts
│   └── composite-fixture-loader.ts
└── schemas/                     # Fixture schema validation
    ├── tenant-fixture.schema.ts
    └── platform-fixture.schema.ts
```

#### Pattern: Fixture Composition

Enable combining multiple fixtures with overrides:

```typescript
// tests/fixture-loaders/composite-fixture-loader.ts
export interface FixtureLayer {
  type: "base" | "scenario" | "override";
  path: string;
  priority: number; // Higher priority overrides lower
}

export class CompositeFixtureLoader {
  async loadTenantFixture(layers: FixtureLayer[]): Promise<TenantConfig> {
    // Start with empty config
    let merged: any = {};

    // Sort by priority (lowest to highest)
    const sorted = [...layers].sort((a, b) => a.priority - b.priority);

    for (const layer of sorted) {
      const layerData = await this.loadFixture(layer.path);
      merged = this.deepMerge(merged, layerData);
    }

    // Validate final schema
    return TenantConfigSchema.parse(merged);
  }

  private async loadFixture(path: string): Promise<any> {
    const fullPath = join(process.cwd(), "tests", "fixtures", path);
    const content = await readFile(fullPath, "utf-8");
    return JSON.parse(content);
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }
}

// Usage:
const loader = new CompositeFixtureLoader();
const config = await loader.loadTenantFixture([
  { type: "base", path: "base/tenants/default-tenant.json", priority: 1 },
  { type: "scenario", path: "scenarios/high-traffic-week/tenant-override.json", priority: 2 },
  { type: "override", path: "test-specific/tenant.json", priority: 3 },
]);
```

#### Pattern: Fixture Versioning and Migration

Track fixture versions and migrate when schemas change:

```typescript
// tests/fixture-loaders/fixture-version-manager.ts
export interface FixtureMetadata {
  version: string;
  createdAt: Date;
  schema: string;
  migrations: string[];
}

export class FixtureVersionManager {
  private readonly fixtureVersions = new Map<string, FixtureMetadata>();

  async loadFixture<T>(path: string): Promise<T> {
    const content = await readFile(path, "utf-8");
    const data = JSON.parse(content);

    // Check for metadata
    if (data.__fixtureMetadata) {
      const metadata: FixtureMetadata = data.__fixtureMetadata;
      this.fixtureVersions.set(path, metadata);

      // Check if migration needed
      if (this.needsMigration(metadata)) {
        return this.migrateFixture(data, metadata);
      }

      // Remove metadata before returning
      delete data.__fixtureMetadata;
    }

    return data as T;
  }

  private needsMigration(metadata: FixtureMetadata): boolean {
    const currentSchema = this.getCurrentSchemaVersion(metadata.schema);
    return metadata.version !== currentSchema;
  }

  private migrateFixture(data: any, metadata: FixtureMetadata): any {
    let migrated = { ...data };

    for (const migration of metadata.migrations) {
      const migrator = this.getMigrator(migration);
      migrated = migrator(migrated);
    }

    // Update version
    migrated.__fixtureMetadata.version = this.getCurrentSchemaVersion(metadata.schema);

    return migrated;
  }

  private getCurrentSchemaVersion(schema: string): string {
    // Return current version for schema
    const versions: Record<string, string> = {
      "tenant-config": "2.0.0",
      "platform-data": "1.5.0",
    };
    return versions[schema] || "1.0.0";
  }
}

// Fixture file with metadata:
{
  "__fixtureMetadata": {
    "version": "1.0.0",
    "createdAt": "2026-03-01T00:00:00Z",
    "schema": "tenant-config",
    "migrations": ["add-localization-defaults", "add-feature-flags"]
  },
  "companyId": "...",
  "companyName": "...",
  "localization": { ... }
}
```

#### Pattern: Fixture Documentation

Include README files in fixture directories:

```markdown
<!-- tests/fixtures/scenarios/high-traffic-week/README.md -->

# High Traffic Week Scenario

## Purpose

Tests system behavior under traffic 3x above normal levels.

## Use Cases

- Validate performance under load
- Test rate limiting behavior
- Verify caching effectiveness
- Check alert thresholds

## Fixtures Included

### meta-override.json

- **Campaigns**: 50 active campaigns (vs 10 normal)
- **Daily Budget**: $10,000 total (vs $3,000 normal)
- **Impressions**: 1M/day (vs 300k/day normal)

### ga4-override.json

- **Sessions**: 50k/day (vs 15k/day normal)
- **Events**: 500k/day (vs 150k/day normal)

## Expected Behavior

When this scenario is active:

1. Cache hit rate should increase > 80%
2. API rate limit should trigger within 5 minutes
3. Circuit breaker should open after threshold
4. Alerts should fire for high traffic

## Related Tests

- `tests/scenarios/R05-multi-platform-report/multi-platform-report.test.ts`
- `tests/phase01-platform-integration/src/performance/adapter-sla.integration.test.ts`

## Maintenance

- Created: 2026-03-15
- Last Updated: 2026-03-20
- Maintainer: Platform Team
```

### 2.3 Fixture Loading Best Practices

#### Pattern: Lazy Fixture Loading

Load fixtures on-demand to reduce memory usage:

```typescript
// tests/fixture-loaders/lazy-fixture-loader.ts
export class LazyFixtureLoader {
  private cache = new Map<string, Promise<any>>();

  load<T>(path: string): Promise<T> {
    if (!this.cache.has(path)) {
      this.cache.set(path, this.loadFile<T>(path));
    }
    return this.cache.get(path) as Promise<T>;
  }

  private async loadFile<T>(path: string): Promise<T> {
    const fullPath = join(process.cwd(), "tests", "fixtures", path);
    const content = await readFile(fullPath, "utf-8");
    return JSON.parse(content) as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Usage in tests:
const loader = new LazyFixtureLoader();
beforeEach(() => {
  loader.clear(); // Clear cache between tests
});

test("uses lazy loaded fixture", async () => {
  const tenantConfig = await loader.load("base/tenants/default-tenant.json");
  // Test logic...
});
```

---

## 3. Data Factories and Builders

### 3.1 Recommended Libraries

Based on AgenticVerdict's TypeScript stack and requirements:

| Library             | Purpose                                      | Recommendation                                      |
| ------------------- | -------------------------------------------- | --------------------------------------------------- |
| **@faker-js/faker** | Realistic fake data generation               | ✅ **Recommended** - Pure TypeScript, comprehensive |
| **@nangohq/faker**  | Industry-specific fake data                  | ✅ Good for marketing/advertising data              |
| **test-data-bot**   | Test data generation with TypeScript support | ⚠️ Consider for simple cases                        |
| **factory-bot**     | Classic factory pattern                      | ❌ Not actively maintained for TypeScript           |
| **casual**          | Alternative fake data generator              | ⚠️ Less comprehensive than faker                    |

**Primary Recommendation:** `@faker-js/faker`

```bash
pnpm add -D @faker-js/faker
```

### 3.2 Implementing Data Factories

#### Pattern: Tenant Factory

Generate realistic tenant configurations:

```typescript
// tests/factories/tenant-factory.ts
import { faker } from "@faker-js/faker";
import type { CompanyConfig } from "@agenticverdict/config";

export class TenantFactory {
  /**
   * Generate a tenant with realistic defaults
   */
  static build(overrides: Partial<CompanyConfig> = {}): CompanyConfig {
    const locale = faker.helpers.arrayElement(["en", "ar", "fr"]);
    const region = locale === "ar" ? "SA" : locale === "fr" ? "FR" : "US";

    return {
      companyId: faker.string.uuid(),
      companyName: faker.company.name(),
      localization: {
        language: locale,
        region,
        timezone: this.getTimezoneForRegion(region),
        currency: this.getCurrencyForRegion(region),
      },
      marketing: {
        channels: this.generateChannels(),
      },
      ai: {
        primaryModel: "claude-3-5-haiku-20241022",
        provider: "anthropic",
      },
      features: {
        enableInsights: faker.datatype.boolean(),
        enableVerdict: faker.datatype.boolean(),
      },
      ...overrides,
    };
  }

  /**
   * Generate multiple tenants with variety
   */
  static buildBatch(count: number): CompanyConfig[] {
    return Array.from({ length: count }, (_, i) =>
      this.build({
        // Ensure unique names
        companyName: `Test Company ${i + 1}`,
      }),
    );
  }

  /**
   * Generate an Arabic-speaking tenant (for RTL testing)
   */
  static buildArabicTenant(overrides: Partial<CompanyConfig> = {}): CompanyConfig {
    return this.build({
      localization: {
        language: "ar",
        region: "SA",
        timezone: "Asia/Riyadh",
        currency: "SAR",
      },
      companyName: "شركة اختبار", // "Test Company" in Arabic
      ...overrides,
    });
  }

  /**
   * Generate an enterprise tenant
   */
  static buildEnterpriseTenant(overrides: Partial<CompanyConfig> = {}): CompanyConfig {
    return this.build({
      companyName: `${faker.company.name()} (Enterprise)`,
      features: {
        enableInsights: true,
        enableVerdict: true,
      },
      marketing: {
        channels: ["meta", "ga4", "gsc", "gbp", "tiktok"],
      },
      ...overrides,
    });
  }

  private static getTimezoneForRegion(region: string): string {
    const timezones: Record<string, string> = {
      US: "America/New_York",
      SA: "Asia/Riyadh",
      FR: "Europe/Paris",
      GB: "Europe/London",
      DE: "Europe/Berlin",
    };
    return timezones[region] || "UTC";
  }

  private static getCurrencyForRegion(region: string): string {
    const currencies: Record<string, string> = {
      US: "USD",
      SA: "SAR",
      FR: "EUR",
      GB: "GBP",
      DE: "EUR",
    };
    return currencies[region] || "USD";
  }

  private static generateChannels(): Array<"meta" | "ga4" | "gsc" | "gbp" | "tiktok"> {
    const allChannels = ["meta", "ga4", "gsc", "gbp", "tiktok"] as const;
    const count = faker.number.int({ min: 1, max: allChannels.length });
    return faker.helpers.arrayElements(allChannels, { count });
  }
}

// Usage:
const tenant = TenantFactory.build();
const arabicTenant = TenantFactory.buildArabicTenant();
const enterpriseTenant = TenantFactory.buildEnterpriseTenant();
const tenants = TenantFactory.buildBatch(10);
```

#### Pattern: Platform Data Factory

Generate realistic platform-specific data:

```typescript
// tests/factories/platform-data-factory.ts
import { faker } from "@faker-js/faker";

export class MetaDataFactory {
  /**
   * Generate realistic Meta campaign data
   */
  static buildCampaign(overrides: Partial<MetaCampaign> = {}): MetaCampaign {
    const startDate = faker.date.past({ years: 1 });
    const endDate = faker.date.future({ years: 1, refDate: startDate });

    return {
      id: `act_${faker.string.alphanumeric({ length: 16 })}`,
      name: faker.company.catchPhrase() + " Campaign",
      status: faker.helpers.arrayElement(["active", "paused", "completed"]),
      daily_budget: faker.number.int({ min: 100, max: 10000 }),
      lifetime_budget: faker.number.int({ min: 5000, max: 500000 }),
      start_time: startDate.toISOString(),
      stop_time: endDate.toISOString(),
      insights: {
        impressions: faker.number.int({ min: 10000, max: 10000000 }),
        clicks: faker.number.int({ min: 100, max: 100000 }),
        spend: faker.number.float({ min: 10, max: 10000, precision: 0.01 }),
        conversions: faker.number.int({ min: 0, max: 1000 }),
        conversion_value: faker.number.float({ min: 0, max: 50000, precision: 0.01 }),
      },
      ...overrides,
    };
  }

  /**
   * Generate multiple campaigns
   */
  static buildCampaigns(count: number): MetaCampaign[] {
    return Array.from({ length: count }, () => this.buildCampaign());
  }

  /**
   * Generate time-series data for a campaign
   */
  static buildCampaignTimeSeries(
    campaignId: string,
    days: number = 30,
  ): Array<{ date: string; metrics: MetaCampaignMetrics }> {
    const data: Array<{ date: string; metrics: MetaCampaignMetrics }> = [];
    const baseImpressions = faker.number.int({ min: 1000, max: 10000 });
    const baseCTR = faker.number.float({ min: 0.01, max: 0.05, precision: 0.001 });
    const baseCPC = faker.number.float({ min: 0.5, max: 5.0, precision: 0.01 });

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));

      // Add realistic variation
      const dayMultiplier = 1 + (Math.random() - 0.5) * 0.4; // ±20% variation
      const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.7 : 1.0;

      const impressions = Math.round(baseImpressions * dayMultiplier * weekendMultiplier);
      const clicks = Math.round(impressions * baseCTR * (1 + (Math.random() - 0.5) * 0.2));
      const spend = clicks * baseCPC * (1 + (Math.random() - 0.5) * 0.1);
      const conversions = Math.round(
        clicks * faker.number.float({ min: 0.01, max: 0.1, precision: 0.001 }),
      );

      data.push({
        date: date.toISOString().split("T")[0],
        metrics: {
          impressions,
          clicks,
          spend: parseFloat(spend.toFixed(2)),
          conversions,
        },
      });
    }

    return data;
  }
}

export class GA4DataFactory {
  /**
   * Generate realistic GA4 session data
   */
  static buildSessionData(days: number = 30): GA4SessionData {
    const sessions = faker.number.int({ min: 10000, max: 100000 });
    const engagedSessions = Math.round(sessions * faker.number.float({ min: 0.3, max: 0.7 }));
    const conversions = Math.round(sessions * faker.number.float({ min: 0.01, max: 0.05 }));

    return {
      propertyId: `properties/${faker.string.numeric(9)}`,
      dateRange: {
        startDate: faker.date.recent({ days }).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      },
      metrics: {
        sessions,
        engagedSessions,
        engagementRate: engagedSessions / sessions,
        conversions,
        conversionRate: conversions / sessions,
        totalRevenue: faker.number.float({ min: 1000, max: 100000, precision: 0.01 }),
      },
      breakdown: this.buildDailyBreakdown(days),
    };
  }

  /**
   * Generate daily breakdown with realistic patterns
   */
  private static buildDailyBreakdown(days: number) {
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));

      const isWeekend = [0, 6].includes(date.getDay());
      const weekendMultiplier = isWeekend ? 0.8 : 1.0;

      return {
        date: date.toISOString().split("T")[0],
        sessions: Math.round(1000 * weekendMultiplier * (1 + (Math.random() - 0.5) * 0.3)),
        conversions: Math.round(50 * weekendMultiplier * (1 + (Math.random() - 0.5) * 0.4)),
      };
    });
  }
}

// Usage:
const campaign = MetaDataFactory.buildCampaign();
const campaigns = MetaDataFactory.buildCampaigns(10);
const timeSeries = MetaDataFactory.buildCampaignTimeSeries(campaign.id, 30);

const ga4Data = GA4DataFactory.buildSessionData(30);
```

### 3.3 Builder Pattern for Complex Objects

For complex test data that requires step-by-step construction:

```typescript
// tests/factories/report-model-builder.ts
import type { ReportModel } from "@agenticverdict/report-generator";

export class ReportModelBuilder {
  private model: Partial<ReportModel> = {
    reportId: faker.string.uuid(),
    generatedAt: new Date().toISOString(),
    companyInfo: {},
    platformData: [],
    verdictScorecard: undefined,
    insightHighlights: [],
  };

  withReportId(id: string): this {
    this.model.reportId = id;
    return this;
  }

  withCompanyInfo(info: CompanyInfo): this {
    this.model.companyInfo = info;
    return this;
  }

  withPlatformData(data: PlatformData[]): this {
    this.model.platformData = data;
    return this;
  }

  withVerdict(verdict: VerdictScorecard): this {
    this.model.verdictScorecard = verdict;
    return this;
  }

  withInsights(insights: InsightHighlight[]): this {
    this.model.insightHighlights = insights;
    return this;
  }

  withLocalization(locale: LocalizationConfig): this {
    this.model.localization = locale;
    return this;
  }

  build(): ReportModel {
    if (!this.model.companyInfo || !this.model.platformData) {
      throw new Error("ReportModel requires companyInfo and platformData");
    }
    return this.model as ReportModel;
  }
}

// Usage in tests:
const report = new ReportModelBuilder()
  .withReportId("test-report-001")
  .withCompanyInfo(TenantFactory.build())
  .withPlatformData([MetaDataFactory.buildCampaign(), GA4DataFactory.buildSessionData()])
  .withVerdict(VerdictFactory.buildVerdict())
  .withInsights(InsightFactory.buildInsights(5))
  .withLocalization({
    language: "en",
    direction: "ltr",
    timezone: "America/New_York",
  })
  .build();
```

---

## 4. Database Seeding Patterns

### 4.1 Current Seeding Implementation

AgenticVerdict has a basic seed script in `/packages/database/scripts/seed.ts` that:

- Reads company JSON files from `configs/companies/`
- Inserts or updates companies in the database
- Handles slug generation
- Supports idempotent runs

**Strengths:**

- ✅ Idempotent (updates if exists)
- ✅ Simple and focused
- ✅ No external dependencies

**Gaps:**

- ❌ No support for related data (platform credentials, templates, etc.)
- ❌ No test-specific seeds
- ❌ No seed composition
- ❌ Limited to companies table

### 4.2 Enhanced Database Seeding

#### Pattern: Layered Seeding

Separate base seeds from test-specific seeds:

```
packages/database/
├── seeds/
│   ├── base/
│   │   ├── companies.seed.ts
│   │   ├── templates.seed.ts
│   │   └── permissions.seed.ts
│   ├── test/
│   │   ├── test-companies.seed.ts
│   │   ├── test-platform-credentials.seed.ts
│   │   └── test-reports.seed.ts
│   └── scenarios/
│       ├── high-traffic-week.seed.ts
│       └── multi-platform-report.seed.ts
└── seed-runner.ts
```

#### Pattern: Deterministic Test Seeds

Create test-specific seeds with deterministic data:

```typescript
// packages/database/seeds/test/test-companies.seed.ts
import { faker } from "@faker-js/faker";
import { db } from "../src/db";
import { companies } from "../src/schema/companies";

export async function seedTestCompanies(count: number = 10) {
  const testCompanies = [];

  for (let i = 0; i < count; i++) {
    const companyId = `test-tenant-${String(i + 1).padStart(3, "0")}`;
    const companyName = `Test Company ${i + 1}`;
    const slug = `test-company-${i + 1}`;

    testCompanies.push({
      id: companyId,
      name: companyName,
      slug,
      createdAt: new Date("2026-01-01T00:00:00Z"), // Fixed date for determinism
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
  }

  await db.insert(companies).values(testCompanies).onConflictDoNothing();

  return testCompanies;
}

export async function seedTestTenant(type: "default" | "arabic" | "multilingual") {
  const configs: Record<string, any> = {
    default: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Scenario Tenant EN",
      slug: "scenario-tenant-en",
    },
    arabic: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Scenario Tenant AR",
      slug: "scenario-tenant-ar",
    },
    multilingual: {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      name: "Scenario Tenant Multi",
      slug: "scenario-tenant-multi",
    },
  };

  const config = configs[type];

  await db
    .insert(companies)
    .values({
      id: config.id,
      name: config.name,
      slug: config.slug,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    })
    .onConflictDoNothing();

  return config;
}
```

#### Pattern: Seed Composition

Combine multiple seeds for complete test scenarios:

```typescript
// packages/database/seeds/scenarios/multi-platform-report.seed.ts
import { seedTestTenant } from "../test/test-companies.seed";
import { seedConnectorCredentials } from "../test/test-platform-credentials.seed";
import { seedReportTemplates } from "../base/templates.seed";

export async function seedMultiPlatformReportScenario() {
  // 1. Create test tenant
  const tenant = await seedTestTenant("default");

  // 2. Add platform credentials for all platforms
  await seedConnectorCredentials(tenant.id, ["meta", "ga4", "gsc", "gbp", "tiktok"]);

  // 3. Seed report templates
  await seedReportTemplates(tenant.id, ["marketing-performance", "cross-platform-analysis"]);

  return {
    tenantId: tenant.id,
    platforms: ["meta", "ga4", "gsc", "gbp", "tiktok"],
  };
}

// Usage in tests:
beforeEach(async () => {
  await seedMultiPlatformReportScenario();
});
```

#### Pattern: Seed Cleanup

Ensure clean state between tests:

```typescript
// packages/database/seeds/cleanup.ts
import { db } from "../src/db";
import { sql } from "drizzle-orm";

export async function cleanupTestDatabase() {
  // Delete in reverse dependency order
  await db.execute(sql`DELETE FROM report_snapshots WHERE tenant_id LIKE 'test-%'`);
  await db.execute(sql`DELETE FROM reports WHERE tenant_id LIKE 'test-%'`);
  await db.execute(sql`DELETE FROM platform_credentials WHERE tenant_id LIKE 'test-%'`);
  await db.execute(sql`DELETE FROM templates WHERE tenant_id LIKE 'test-%'`);
  await db.execute(sql`DELETE FROM companies WHERE id LIKE 'test-%'`);
}

// Usage in test setup:
beforeEach(async () => {
  await cleanupTestDatabase();
  await seedTestScenario();
});

afterAll(async () => {
  await cleanupTestDatabase();
});
```

### 4.3 Isolation Strategies

#### Pattern: Tenant-Scoped Seeds

Use tenant IDs for isolation:

```typescript
// packages/database/seeds/test/tenant-scoped-seed.ts
export async function seedIsolatedTenant(suffix: string) {
  const tenantId = `test-tenant-${suffix}-${Date.now()}`;

  await db.insert(companies).values({
    id: tenantId,
    name: `Isolated Test Tenant ${suffix}`,
    slug: `isolated-test-tenant-${suffix}`,
  });

  return tenantId;
}

// Usage: Each test gets unique tenant
test("test1", async () => {
  const tenantId = await seedIsolatedTenant("test1");
  // Test logic...
});

test("test2", async () => {
  const tenantId = await seedIsolatedTenant("test2"); // Different tenant
  // Test logic...
});
```

#### Pattern: Transaction-Based Isolation

Use database transactions for automatic cleanup:

```typescript
// packages/database/seeds/transactional-seed.ts
export class SeedTransaction {
  private client: any;

  async begin() {
    this.client = await db.getTransactionClient();
    await this.client.query("BEGIN");
  }

  async seed(data: any) {
    // Run seed within transaction
    await seedTestCompanies(data.count, this.client);
  }

  async commit() {
    await this.client.query("COMMIT");
  }

  async rollback() {
    await this.client.query("ROLLBACK");
  }
}

// Usage in tests:
test("with transaction rollback", async () => {
  const tx = new SeedTransaction();
  await tx.begin();
  try {
    await tx.seed({ count: 10 });
    // Test logic...
    await tx.rollback(); // Rollback instead of commit
  } catch (error) {
    await tx.rollback();
    throw error;
  }
});
```

---

## 5. Contract Testing

### 5.1 Why Contract Testing Matters

Contract testing ensures that:

1. Mock adapters return data matching real adapter schemas
2. Schema changes in real adapters don't break tests using mocks
3. API changes are detected early in development

### 5.2 Implementing Contract Tests

#### Pattern: Schema-Based Contract Tests

Define explicit schemas for each platform's responses:

```typescript
// packages/data-connectors/src/meta/meta-response-schema.ts
import { z } from "zod";

export const MetaCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED", "DELETED"]),
  daily_budget: z.number(),
  insights: z.object({
    impressions: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    spend: z.number().nonnegative(),
    conversions: z.number().int().nonnegative(),
  }),
});

export const MetaResponseSchema = z.object({
  campaigns: z.array(MetaCampaignSchema),
  paging: z
    .object({
      cursors: z
        .object({
          before: z.string().optional(),
          after: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

// Contract test
import { MetaResponseSchema } from "./meta/meta-response-schema";
import { MockConnectorAdapter } from "./mock-adapter";

describe("Meta Adapter Contract Tests", () => {
  it("mock adapter produces valid Meta response schema", async () => {
    const adapter = new MockConnectorAdapter("meta", {
      tenantId: "test-tenant",
    });
    await adapter.authenticate({ accessToken: "test" });
    const data = await adapter.fetchMetrics({
      start: "2026-03-01",
      end: "2026-03-31",
    });

    const result = MetaResponseSchema.safeParse(data);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error("Schema errors:", result.error.issues);
    }
  });
});
```

#### Pattern: API Snapshot Tests

Capture real API responses for comparison:

```typescript
// packages/data-connectors/src/meta/meta-snapshot.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MetaAdapter } from "./meta-adapter";

describe("Meta Adapter Snapshot Tests", () => {
  let realAdapter: MetaAdapter;

  beforeAll(() => {
    if (!process.env.META_TEST_CREDENTIALS) {
      return;
    }

    const credentials = JSON.parse(process.env.META_TEST_CREDENTIALS);
    realAdapter = new MetaAdapter({
      tenantId: "test-tenant",
    });
    await realAdapter.authenticate(credentials);
  });

  it("captures real API response structure", async () => {
    if (!process.env.META_TEST_CREDENTIALS) {
      console.warn("Skipping: META_TEST_CREDENTIALS not set");
      return;
    }

    const data = await realAdapter.fetchMetrics({
      start: "2026-03-01",
      end: "2026-03-31",
    });

    // Save as snapshot
    expect(data).toMatchSnapshot("meta-real-response");
  });

  afterAll(async () => {
    if (realAdapter) {
      // Clean up
    }
  });
});

// Update snapshot when contract changes:
// 1. Run tests with META_TEST_CREDENTIALS set
// 2. Review snapshot changes
// 3. Update mock adapter if needed
```

#### Pattern: Automated Contract Validation

Run contract tests in CI to catch drift:

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  pull_request:
    paths:
      - "packages/data-connectors/src/**"
  schedule:
    - cron: "0 0 * *" # Daily

jobs:
  meta-contract:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Run contract tests
        env:
          META_TEST_CREDENTIALS: ${{ secrets.META_TEST_CREDENTIALS }}
        run: |
          pnpm install
          pnpm test packages/data-connectors/src/meta/*.contract.test.ts

  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Validate schemas
        run: |
          pnpm install
          pnpm test packages/data-connectors/src/**/*.schema.test.ts
```

### 5.3 Contract Testing Tools

| Tool                | Purpose                               | Recommendation                                  |
| ------------------- | ------------------------------------- | ----------------------------------------------- |
| **Zod schemas**     | Runtime schema validation             | ✅ **Primary** - Already used in AgenticVerdict |
| **Pact**            | Consumer-driven contract testing      | ⚠️ Overkill for internal adapters               |
| **OpenAPI/Swagger** | API contract definition               | ✅ Good for external API docs                   |
| **Jest snapshots**  | Visual regression for data structures | ✅ Useful for API responses                     |

**Recommendation:** Use Zod schemas for contract validation with Vitest.

---

## 6. Snapshot Testing

### 6.1 Snapshot Testing for Report Generation

Snapshot testing is particularly valuable for report generation to catch unintended changes:

```typescript
// packages/report-generator/src/snapshot-tests/report-snapshot.test.ts
import { describe, expect, it } from "vitest";
import { generatePDFReport } from "./pdf-generator";
import { TenantFactory } from "../../../tests/factories/tenant-factory";

describe("Report Generation Snapshots", () => {
  it("generates consistent PDF structure", async () => {
    const tenant = TenantFactory.build();
    const reportData = generateReportData();

    const pdfBuffer = await generatePDFReport(tenant, reportData);

    // Snapshot the PDF metadata and structure
    expect({
      size: pdfBuffer.length,
      header: pdfBuffer.slice(0, 4).toString(),
      hasPdfMarker: pdfBuffer.includes("%PDF"),
    }).toMatchSnapshot("pdf-structure");
  });

  it("generates consistent HTML for reports", async () => {
    const tenant = TenantFactory.build();
    const reportData = generateReportData();

    const html = await generateHTMLReport(tenant, reportData);

    // Snapshot the HTML structure (normalized)
    const normalized = normalizeHTML(html);
    expect(normalized).toMatchSnapshot("html-structure");
  });

  it("generates consistent Excel structure", async () => {
    const tenant = TenantFactory.build();
    const reportData = generateReportData();

    const excelBuffer = await generateExcelReport(tenant, reportData);

    // Snapshot Excel metadata
    expect({
      size: excelBuffer.length,
      hasZipMarker: excelBuffer.slice(0, 2).toString("hex") === "504b", // PK header
    }).toMatchSnapshot("excel-structure");
  });
});

function normalizeHTML(html: string): string {
  // Remove dynamic content
  return html
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z/g, "[TIMESTAMP]")
    .replace(/[a-f0-9-]{36}/gi, "[UUID]")
    .replace(/\d+\.\d{2}/g, "[CURRENCY]")
    .replace(/\s+/g, " ")
    .trim();
}
```

### 6.2 Visual Regression Testing

For PDF and visual outputs, use pixel-based comparison:

```typescript
// packages/report-generator/src/visual-regression.test.ts
import { describe, expect, it } from "vitest";
import { generatePDFReport } from "./pdf-generator";
import { comparePDFs } from "./pdf-comparison";

describe("Visual Regression Tests", () => {
  it("PDF visual output matches baseline", async () => {
    const tenant = TenantFactory.build();
    const reportData = generateReportData();

    const pdfBuffer = await generatePDFReport(tenant, reportData);

    // Compare with baseline
    const comparison = await comparePDFs(pdfBuffer, "./tests/baselines/reports/default-report.pdf");

    expect(comparison.different).toBe(false);
    expect(comparison.differencePercentage).toBeLessThan(0.01); // < 1% difference
  });

  it("Arabic PDF RTL layout matches baseline", async () => {
    const tenant = TenantFactory.buildArabicTenant();
    const reportData = generateReportData();

    const pdfBuffer = await generatePDFReport(tenant, reportData);

    const comparison = await comparePDFs(
      pdfBuffer,
      "./tests/baselines/reports/arabic-rtl-report.pdf",
    );

    expect(comparison.different).toBe(false);
  });
});
```

### 6.3 Snapshot Management Best Practices

1. **Store snapshots in version control**

   ```bash
   tests/
   └── __snapshots__/
       ├── pdf-structure.snap.ts
       ├── html-structure.snap.ts
       └── excel-structure.snap.ts
   ```

2. **Review snapshot changes in PRs**

   ```yaml
   # .github/workflows/snapshot-review.yml
   jobs:
     snapshot-review:
       steps:
         - name: Check snapshot changes
           run: |
             git diff origin/main --name-only | grep "__snapshots__" && echo "Snapshot changes detected"
   ```

3. **Update snapshots deliberately**

   ```bash
   # Update all snapshots
   pnpm test -u

   # Update specific snapshot
   pnpm test -t "PDF structure" -u
   ```

4. **Ignore dynamic values in snapshots**
   ```typescript
   // Use property matchers
   expect(report).toMatchSnapshot({
     generatedAt: expect.any(String),
     reportId: expect.any(String),
   });
   ```

---

## 7. Test Data Builders

### 7.1 Builder Pattern Implementation

The Builder pattern provides fluent interfaces for constructing complex test objects:

```typescript
// tests/builders/verdict-builder.ts
import type { VerdictScorecard } from "@agenticverdict/types";
import { faker } from "@faker-js/faker";

export class VerdictBuilder {
  private verdict: Partial<VerdictScorecard> = {
    score: 75,
    confidence: "high",
    period: {
      start: "2026-03-01",
      end: "2026-03-31",
    },
    keyFindings: [],
    recommendations: [],
    platformScores: {},
  };

  withScore(score: number): this {
    this.verdict.score = Math.max(0, Math.min(100, score));
    return this;
  }

  withHighConfidence(): this {
    this.verdict.confidence = "high";
    return this;
  }

  withMediumConfidence(): this {
    this.verdict.confidence = "medium";
    return this;
  }

  withLowConfidence(): this {
    this.verdict.confidence = "low";
    return this;
  }

  withPeriod(start: string, end: string): this {
    this.verdict.period = { start, end };
    return this;
  }

  addKeyFinding(finding: string): this {
    this.verdict.keyFindings!.push(finding);
    return this;
  }

  addRecommendation(rec: string): this {
    this.verdict.recommendations!.push(rec);
    return this;
  }

  withPlatformScore(platform: string, score: number): this {
    this.verdict.platformScores![platform] = score;
    return this;
  }

  build(): VerdictScorecard {
    if (!this.verdict.keyFindings || this.verdict.keyFindings.length === 0) {
      this.addKeyFinding("Default finding");
    }
    if (!this.verdict.recommendations || this.verdict.recommendations.length === 0) {
      this.addRecommendation("Default recommendation");
    }
    return this.verdict as VerdictScorecard;
  }
}

// Usage:
const verdict = new VerdictBuilder()
  .withScore(85)
  .withHighConfidence()
  .withPeriod("2026-03-01", "2026-03-31")
  .addKeyFinding("Strong ROAS on Meta campaigns")
  .addKeyFinding("GA4 conversion rate improved")
  .addRecommendation("Increase Meta ad spend by 20%")
  .withPlatformScore("meta", 90)
  .withPlatformScore("ga4", 85)
  .build();
```

### 7.2 Preset Builders

Create builder presets for common scenarios:

```typescript
// tests/builders/preset-builders.ts
import { VerdictBuilder } from "./verdict-builder";
import { ReportModelBuilder } from "./report-model-builder";

export class PresetBuilders {
  /**
   * Positive verdict - everything performing well
   */
  static positiveVerdict() {
    return new VerdictBuilder()
      .withScore(90)
      .withHighConfidence()
      .addKeyFinding("All channels exceeding targets")
      .addKeyFinding("ROAS above industry benchmark")
      .addRecommendation("Maintain current strategy")
      .withPlatformScore("meta", 95)
      .withPlatformScore("ga4", 88)
      .withPlatformScore("gsc", 92);
  }

  /**
   * Negative verdict - performance issues
   */
  static negativeVerdict() {
    return new VerdictBuilder()
      .withScore(35)
      .withLowConfidence()
      .addKeyFinding("Meta campaigns underperforming")
      .addKeyFinding("High CPA across all channels")
      .addKeyFinding("Conversion rate declined")
      .addRecommendation("Pause underperforming campaigns")
      .addRecommendation("Review ad creative")
      .addRecommendation("Adjust targeting parameters")
      .withPlatformScore("meta", 40)
      .withPlatformScore("ga4", 45)
      .withPlatformScore("gsc", 50);
  }

  /**
   * Mixed verdict - some good, some bad
   */
  static mixedVerdict() {
    return new VerdictBuilder()
      .withScore(65)
      .withMediumConfidence()
      .addKeyFinding("Meta performing well")
      .addKeyFinding("GA4 shows declining trend")
      .addKeyFinding("GSC impressions stable")
      .addRecommendation("Shift budget from GA4 to Meta")
      .withPlatformScore("meta", 85)
      .withPlatformScore("ga4", 55)
      .withPlatformScore("gsc", 70);
  }

  /**
   * Complete report with all components
   */
  static completeReport() {
    return new ReportModelBuilder()
      .withReportId("test-report-complete")
      .withCompanyInfo(TenantFactory.build())
      .withVerdict(this.positiveVerdict().build())
      .withPlatformData([MetaDataFactory.buildCampaign(), GA4DataFactory.buildSessionData()])
      .withInsights(InsightFactory.buildInsights(5))
      .withLocalization({
        language: "en",
        direction: "ltr",
        timezone: "America/New_York",
      });
  }
}

// Usage in tests:
test("positive verdict display", () => {
  const verdict = PresetBuilders.positiveVerdict().build();
  // Test positive verdict UI/rendering...
});

test("negative verdict recommendations", () => {
  const verdict = PresetBuilders.negativeVerdict().build();
  // Test that recommendations are displayed...
});
```

### 7.3 Builder Composition

Combine multiple builders for complex scenarios:

```typescript
// tests/builders/composite-builder.ts
export class MultiPlatformReportBuilder {
  private metaBuilder = new MetaDataBuilder();
  private ga4Builder = new GA4DataBuilder();
  private gscBuilder = new GSCDataBuilder();
  private gbpBuilder = new GBPDataBuilder();
  private tiktokBuilder = new TikTokDataBuilder();

  withHighPerformingMeta(): this {
    this.metaBuilder.withHighSpend().withHighROAS().withManyConversions();
    return this;
  }

  withDecliningGA4(): this {
    this.ga4Builder.withDecliningSessions().withLowConversionRate();
    return this;
  }

  withStableGSC(): this {
    this.gscBuilder.withStableImpressions().withStableCTR();
    return this;
  }

  build(): ReportData {
    return {
      meta: this.metaBuilder.build(),
      ga4: this.ga4Builder.build(),
      gsc: this.gscBuilder.build(),
      gbp: this.gbpBuilder.build(),
      tiktok: this.tiktokBuilder.build(),
    };
  }
}

// Usage:
const reportData = new MultiPlatformReportBuilder()
  .withHighPerformingMeta()
  .withDecliningGA4()
  .withStableGSC()
  .build();
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Tasks:**

1. Install `@faker-js/faker` as dev dependency
2. Create factory base classes in `tests/factories/`
3. Implement `TenantFactory` with basic tenant generation
4. Create `MetaDataFactory` and `GA4DataFactory`
5. Add schema definitions for platform responses

**Acceptance Criteria:**

- ✅ Can generate 10 unique tenants
- ✅ Can generate platform-specific test data
- ✅ Factory tests pass with 90%+ coverage
- ✅ Documentation in factory files

### Phase 2: Mock Adapter Enhancement (Week 2)

**Tasks:**

1. Extend `MockConnectorAdapter` with scenario support
2. Implement time-series data generator
3. Add webhook event simulation
4. Create interface compliance tests
5. Add schema validation tests

**Acceptance Criteria:**

- ✅ 5+ preset scenarios per platform
- ✅ Deterministic time-series generation
- ✅ Webhook events for all major platform events
- ✅ Compliance tests catch interface mismatches

### Phase 3: Fixture Management (Week 3)

**Tasks:**

1. Reorganize fixture directory structure
2. Implement composite fixture loader
3. Add fixture versioning support
4. Create fixture documentation templates
5. Set up lazy fixture loading

**Acceptance Criteria:**

- ✅ Fixtures organized by base/scenario/override
- ✅ Can compose multiple fixtures
- ✅ Fixture versions tracked and migrated
- ✅ README in each fixture directory

### Phase 4: Database Seeding (Week 4)

**Tasks:**

1. Refactor seed script into modular functions
2. Create test-specific seeds
3. Implement scenario-based seeds
4. Add transaction-based isolation
5. Create seed cleanup utilities

**Acceptance Criteria:**

- ✅ Can seed complete test scenarios
- ✅ Seeds are idempotent
- ✅ Transaction rollback works
- ✅ Cleanup removes all test data

### Phase 5: Contract & Snapshot Testing (Week 5)

**Tasks:**

1. Define Zod schemas for all platform responses
2. Implement contract tests for all adapters
3. Set up snapshot testing for reports
4. Create baseline PDF/HTML snapshots
5. Add visual regression tests

**Acceptance Criteria:**

- ✅ All platform responses have schemas
- ✅ Contract tests catch API changes
- ✅ Snapshots detect unintended changes
- ✅ Visual regression tests pass

### Phase 6: Builder Pattern (Week 6)

**Tasks:**

1. Implement `VerdictBuilder`
2. Implement `ReportModelBuilder`
3. Create preset builders for common scenarios
4. Add composite builders for multi-platform
5. Document builder patterns

**Acceptance Criteria:**

- ✅ Fluent API for all builders
- ✅ 5+ preset builders
- ✅ Builders compose correctly
- ✅ Builder tests cover edge cases

### Phase 7: Integration & Documentation (Week 7)

**Tasks:**

1. Integrate all patterns into existing tests
2. Update testing documentation
3. Create examples and tutorials
4. Add CI/CD integration
5. Train team on new patterns

**Acceptance Criteria:**

- ✅ All tests use new patterns
- ✅ Documentation is comprehensive
- ✅ CI/CD runs contract tests
- ✅ Team training completed

---

## Appendix A: Code Structure Examples

### Complete Test Example Using All Patterns

```typescript
// tests/scenarios/multi-platform-report/multi-platform-report.integration.test.ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { seedMultiPlatformReportScenario } from "@agenticverdict/database/seeds";
import { cleanupTestDatabase } from "@agenticverdict/database/seeds/cleanup";
import { PresetBuilders } from "../../builders/preset-builders";
import { TenantFactory } from "../../factories/tenant-factory";
import { CompositeFixtureLoader } from "../../fixture-loaders/composite-fixture-loader";

describe("Multi-Platform Report Generation", () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
    await seedMultiPlatformReportScenario();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it("generates report with all platforms", async () => {
    // Arrange: Use preset builder for complete report
    const report = PresetBuilders.completeReport().withCompanyInfo(TenantFactory.build()).build();

    // Act: Generate report
    const generated = await generateReport(report);

    // Assert: Validate structure
    expect(generated).toHaveProperty("verdictScorecard");
    expect(generated).toHaveProperty("platformData");
    expect(generated.platformData).toHaveLength(5); // All platforms
  });

  it("handles mixed performance scenarios", async () => {
    // Arrange: Use composite builder for mixed scenario
    const reportData = new MultiPlatformReportBuilder()
      .withHighPerformingMeta()
      .withDecliningGA4()
      .withStableGSC()
      .build();

    const verdict = PresetBuilders.mixedVerdict().build();

    // Act: Generate report
    const report = await generateReport({ ...reportData, verdict });

    // Assert: Validate recommendations
    expect(report.verdictScorecard.recommendations).toContain(expect.stringContaining("Meta"));
    expect(report.verdictScorecard.recommendations).toContain(expect.stringContaining("GA4"));
  });

  it("uses composite fixtures for tenant config", async () => {
    // Arrange: Load layered fixtures
    const loader = new CompositeFixtureLoader();
    const tenantConfig = await loader.loadTenantFixture([
      { type: "base", path: "base/tenants/default-tenant.json", priority: 1 },
      { type: "scenario", path: "scenarios/high-traffic-week/tenant-override.json", priority: 2 },
    ]);

    // Act: Generate report with custom config
    const report = await generateReport(tenantConfig);

    // Assert: Config applied correctly
    expect(report.companyInfo).toMatchObject({
      localization: {
        language: "en",
        // ... merged properties
      },
    });
  });
});
```

---

## Appendix B: Tool Comparison Matrix

| Tool/Library                  | Use Case            | Pros                                        | Cons                                 | Recommendation |
| ----------------------------- | ------------------- | ------------------------------------------- | ------------------------------------ | -------------- |
| **@faker-js/faker**           | Realistic test data | Pure TS, comprehensive, actively maintained | Learning curve for advanced features | ⭐⭐⭐⭐⭐     |
| **MSW (Mock Service Worker)** | API mocking         | Network-level mocking, framework-agnostic   | Setup complexity                     | ⭐⭐⭐⭐       |
| **Nock**                      | HTTP mocking        | Simple, focused                             | Node-only, intercepts HTTP           | ⭐⭐⭐         |
| **Pact**                      | Contract testing    | Consumer-driven contracts                   | Complex setup, overkill for internal | ⭐⭐           |
| **Zod**                       | Schema validation   | Type-safe, runtime validation               | Manual schema definition             | ⭐⭐⭐⭐⭐     |
| **Vitest snapshots**          | Snapshot testing    | Built-in, fast                              | Manual review required               | ⭐⭐⭐⭐⭐     |
| **Puppeteer/Playwright**      | Visual regression   | Real browser rendering                      | Slower, resource-intensive           | ⭐⭐⭐⭐       |
| **Factory-boy**               | Data factories      | Mature (Python)                             | Not TypeScript-native                | ⭐⭐           |

---

## Appendix C: Quick Reference Commands

```bash
# Install faker
pnpm add -D @faker-js/faker

# Run factory tests
pnpm test tests/factories/

# Run contract tests
pnpm test packages/data-connectors/src/**/*.contract.test.ts

# Run snapshot tests
pnpm test --reporter=verbose

# Update snapshots
pnpm test -u

# Run specific scenario
pnpm test tests/scenarios/R05-multi-platform-report/

# Seed test database
pnpm db:seed

# Cleanup test database
pnpm db:seed:cleanup
```

---

## Document Status

**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-04-06  
**Maintainer:** Development Team  
**Review Cycle:** Monthly  
**Related Documents:**

- `/docs/02-planning-and-methodology/testing-strategy.md`
- `/docs/02-planning-and-methodology/scenario-testing-guide.md`
- `/docs/02-planning-and-methodology/local-testing-guide.md`

---

**Next Steps:**

1. Review and approve this document
2. Prioritize implementation phases
3. Assign development resources
4. Set up tracking for implementation progress
5. Schedule weekly check-ins during implementation
