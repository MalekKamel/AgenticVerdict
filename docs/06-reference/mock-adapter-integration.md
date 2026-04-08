# Mock Adapter Integration Plan

## Executive Summary

This document outlines the comprehensive integration strategy for enabling `MockPlatformAdapter` in development mode. The mock adapter provides deterministic, network-free testing of the marketing pipeline by simulating platform responses without requiring live API connections to external services (Meta, GA4, GSC, GBP, TikTok).

**Status**: Implementation ready — design complete, awaiting execution.

---

## 1. Mock Adapter Capabilities

### 1.1 Current Implementation

The `MockPlatformAdapter` class (`packages/platform-adapters/src/mock-adapter.ts`) is a full-featured implementation of the `PlatformAdapter` interface that extends `BasePlatformAdapter` with the following capabilities:

| Feature                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| **Zero Network**           | No outbound HTTP requests — fully deterministic                 |
| **Configurable Responses** | Custom raw responses and normalized records                     |
| **Failure Simulation**     | Configurable authentication and fetch failures                  |
| **Tenant Isolation**       | Supports multi-tenant context propagation                       |
| **Circuit Breaker**        | Respects all infrastructure patterns (cache, DLQ, token bucket) |
| **Deterministic Data**     | Seedable generation via `MockAdapterFactory`                    |

### 1.2 Integration Points

```typescript
// Direct instantiation
const adapter = new MockPlatformAdapter("meta", {
  tenantId: "tenant-123",
  records: [...],           // Optional: override normalized records
  rawResponse: {...},        // Optional: custom raw payload
  authFailureMessage: "...", // Optional: simulate auth failure
  fetchFailureMessage: "...", // Optional: simulate fetch failure
});

// Factory pattern (recommended)
const adapter = MockAdapterFactory.create({
  platform: "meta",
  tenantId: "tenant-123",
  scenario: "normal",         // or "error" for failure simulation
  seed: 42001,                // For deterministic output
});
```

### 1.3 Limitations

- No real platform API contract validation (mock data may not match real API changes)
- Does not test rate limiting, quotas, or API pagination
- OAuth flow is simulated, not tested
- Platform-specific edge cases may not be covered

---

## 2. Environment Variable Schema

### 2.1 Primary Configuration

| Variable                           | Type       | Default   | Description                         |
| ---------------------------------- | ---------- | --------- | ----------------------------------- |
| `AGENTICVERDICT_USE_MOCK_ADAPTERS` | `0` \| `1` | `0`       | Master toggle for all mock adapters |
| `AGENTICVERDICT_MOCK_META`         | `0` \| `1` | (inherit) | Use Meta mock adapter               |
| `AGENTICVERDICT_MOCK_GA4`          | `0` \| `1` | (inherit) | Use GA4 mock adapter                |
| `AGENTICVERDICT_MOCK_GSC`          | `0` \| `1` | (inherit) | Use GSC mock adapter                |
| `AGENTICVERDICT_MOCK_GBP`          | `0` \| `1` | (inherit) | Use GBP mock adapter                |
| `AGENTICVERDICT_MOCK_TIKTOK`       | `0` \| `1` | (inherit) | Use TikTok mock adapter             |

### 2.2 Advanced Configuration

| Variable                           | Type     | Default             | Description                          |
| ---------------------------------- | -------- | ------------------- | ------------------------------------ |
| `AGENTICVERDICT_MOCK_SEED`         | `number` | `42001`             | Seed for deterministic mock data     |
| `AGENTICVERDICT_MOCK_SCENARIO`     | `string` | `normal`            | Scenario: `normal`, `error`, `empty` |
| `AGENTICVERDICT_MOCK_RECORD_COUNT` | `number` | (platform-specific) | Number of records to generate        |

### 2.3 Configuration Precedence

```
Per-platform flag > Master flag > Default (production adapters)
```

Example:

- `USE_MOCK_ADAPTERS=1` → All platforms use mocks
- `USE_MOCK_ADAPTERS=1, MOCK_META=0` → All platforms except Meta use mocks
- No flags set → Production adapters for all platforms

### 2.4 Validation Schema

```typescript
// packages/config/src/schemas/mock-adapters.ts
import { z } from "zod";

export const MockAdapterEnvSchema = z.object({
  AGENTICVERDICT_USE_MOCK_ADAPTERS: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
  AGENTICVERDICT_MOCK_META: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
  AGENTICVERDICT_MOCK_GA4: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
  AGENTICVERDICT_MOCK_GSC: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
  AGENTICVERDICT_MOCK_GBP: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
  AGENTICVERDICT_MOCK_TIKTOK: z
    .enum(["0", "1"])
    .optional()
    .transform((v) => v === "1"),
  AGENTICVERDICT_MOCK_SEED: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : undefined)),
  AGENTICVERDICT_MOCK_SCENARIO: z.enum(["normal", "error", "empty"]).optional(),
});
```

---

## 3. Adapter Selection Logic

### 3.1 Factory Pattern

Create a unified adapter factory that respects environment configuration:

```typescript
// packages/platform-adapters/src/adapter-factory.ts
import type { PlatformType } from "@agenticverdict/types";
import { MockAdapterFactory } from "./mock-adapter-factory";
import { MetaAdapter } from "./meta/meta-adapter";
import { Ga4Adapter } from "./ga4/ga4-adapter";
import { GscAdapter } from "./gsc/gsc-adapter";
import { GbpAdapter } from "./gbp/gbp-adapter";
import { TikTokAdapter } from "./tiktok/tiktok-adapter";
import type { BasePlatformAdapterOptions } from "./adapter";

export interface AdapterFactoryConfig {
  tenantId: string;
  platform: PlatformType;
  useMock?: boolean;
  mockSeed?: number;
  mockScenario?: "normal" | "error" | "empty";
}

export function createPlatformAdapter(
  config: AdapterFactoryConfig & BasePlatformAdapterOptions,
): PlatformAdapter {
  const shouldUseMock = config.useMock ?? isMockEnabledForPlatform(config.platform);

  if (shouldUseMock) {
    return MockAdapterFactory.create({
      platform: config.platform,
      tenantId: config.tenantId,
      seed: config.mockSeed,
      scenario: config.mockScenario ?? "normal",
    });
  }

  // Production adapters
  switch (config.platform) {
    case "meta":
      return new MetaAdapter(config);
    case "ga4":
      return new Ga4Adapter(config);
    case "gsc":
      return new GscAdapter(config);
    case "gbp":
      return new GbpAdapter(config);
    case "tiktok":
      return new TikTokAdapter(config);
    default:
      throw new Error(`Unsupported platform: ${config.platform}`);
  }
}

function isMockEnabledForPlatform(platform: PlatformType): boolean {
  const masterFlag = process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS === "1";
  const platformFlag = process.env[`AGENTICVERDICT_MOCK_${platform.toUpperCase()}`] === "1";

  // Platform-specific flag overrides master flag
  if (platformFlag !== undefined) return platformFlag;
  return masterFlag;
}
```

### 3.2 Registry Integration

Leverage the existing registry pattern for adapter resolution:

```typescript
// packages/platform-adapters/src/registry.ts (enhanced)
import { createAdapterRegistry } from "./registry";
import { createPlatformAdapter } from "./adapter-factory";

export interface AdapterContext {
  tenantId: string;
}

export const globalAdapterRegistry = createAdapterRegistry<AdapterContext>();

// Register factories that respect environment configuration
globalAdapterRegistry.register("meta", (ctx) =>
  createPlatformAdapter({ ...ctx, platform: "meta" }),
);
globalAdapterRegistry.register("ga4", (ctx) => createPlatformAdapter({ ...ctx, platform: "ga4" }));
// ... other platforms

// Usage
const adapter = globalAdapterRegistry.resolve("meta", { tenantId: "tenant-123" });
```

---

## 4. Integration Points

### 4.1 Application Startup

| Application   | Integration Point                            | Action Required                         |
| ------------- | -------------------------------------------- | --------------------------------------- |
| `apps/web`    | `apps/web/src/lib/adapter-infrastructure.ts` | Update to use environment-aware factory |
| `apps/api`    | `apps/api/src/index.ts`                      | Register mock-aware factories           |
| `apps/worker` | `apps/worker/src/index.ts`                   | Register mock-aware factories           |

### 4.2 Example: Web App Integration

```typescript
// apps/web/src/lib/adapter-infrastructure.ts (updated)
import { createDefaultAdapterInfrastructure } from "@agenticverdict/platform-adapters";
import { globalAdapterRegistry } from "@agenticverdict/platform-adapters/src/registry";

const globalKey = "__agenticverdict_adapterInfrastructure__" as const;

export function getSharedAdapterInfrastructure(): AdapterInfrastructureBundle {
  const g = globalThis as unknown as Record<string, AdapterInfrastructureBundle | undefined>;
  if (!g[globalKey]) {
    g[globalKey] = createDefaultAdapterInfrastructure();

    // Log mock mode status
    if (process.env.NODE_ENV === "development") {
      const mockPlatforms = globalAdapterRegistry
        .platforms()
        .filter((p) => isMockEnabledForPlatform(p as PlatformType));
      if (mockPlatforms.length > 0) {
        console.warn(`[Mock Adapters] Enabled for: ${mockPlatforms.join(", ")}`);
      }
    }
  }
  return g[globalKey];
}
```

### 4.3 Health Check Indicators

The existing health endpoint (`apps/web/src/app/api/health/adapters/route.ts`) should indicate mock mode:

```typescript
// Response when mock adapters are enabled
{
  "status": "ok",
  "mockMode": true,
  "mockPlatforms": ["meta", "ga4", "gsc", "gbp", "tiktok"],
  "platforms": {
    "meta": { "healthy": true, "adapter": "mock" },
    "ga4": { "healthy": true, "adapter": "mock" }
  }
}
```

---

## 5. Security Controls

### 5.1 Production Guard

**CRITICAL**: Mock adapters must NEVER be activatable in production or staging environments.

```typescript
// packages/platform-adapters/src/adapter-factory.ts
function isMockEnabledForPlatform(platform: PlatformType): boolean {
  // Hard block in production/staging
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === "production" || nodeEnv === "staging") {
    if (
      process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS === "1" ||
      process.env[`AGENTICVERDICT_MOCK_${platform.toUpperCase()}`] === "1"
    ) {
      throw new Error(
        `[SECURITY] Mock adapters cannot be enabled in ${nodeEnv} environment. ` +
          `This is a critical security violation.`,
      );
    }
    return false;
  }

  // Only allow in development/test
  const masterFlag = process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS === "1";
  const platformFlag = process.env[`AGENTICVERDICT_MOCK_${platform.toUpperCase()}`] === "1";

  return platformFlag ?? masterFlag ?? false;
}
```

### 5.2 Runtime Validation

Add validation at application startup:

```typescript
// apps/web/src/middleware.ts or startup check
export function validateMockAdapterConfig() {
  if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
    const mockVars = Object.keys(process.env).filter(
      (k) => k.startsWith("AGENTICVERDICT_MOCK_") || k === "AGENTICVERDICT_USE_MOCK_ADAPTERS",
    );

    if (mockVars.length > 0) {
      throw new Error(
        `[SECURITY] Mock adapter configuration detected in ${process.env.NODE_ENV}. ` +
          `Variables: ${mockVars.join(", ")}. ` +
          `Remove these variables before deploying.`,
      );
    }
  }
}
```

### 5.3 Observability

Distinct logging/metrics for mock vs. real data:

```typescript
// Structured logging
logger.info({
  tenantId: context.tenantId,
  requestId: context.requestId,
  event: "platform.fetch",
  platform: "meta",
  adapterType: "mock", // "mock" | "production"
  duration: ms,
  mockSeed: 42001,
});
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

Existing unit tests already use `MockPlatformAdapter`. No changes required.

### 6.2 Integration Tests

Integration tests should explicitly enable mock mode:

```typescript
// tests/phase01-platform-integration/mock-mode.test.ts
import { describe, it, expect } from "vitest";

describe("Mock Adapter Integration", () => {
  it("should use mock adapters when enabled", async () => {
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";
    const adapter = createPlatformAdapter({
      tenantId: "test-tenant",
      platform: "meta",
    });

    await adapter.authenticate({ accessToken: "dummy" });
    const data = await adapter.fetchMetrics({ start: "2024-01-01", end: "2024-01-07" });

    expect(data).toEqual({ mock: true, platform: "meta" });
  });
});
```

### 6.3 CI/CD Configuration

```yaml
# .github/workflows/test-mock-mode.yml
name: Mock Mode Tests

on: [push, pull_request]

jobs:
  test-mock-mode:
    runs-on: ubuntu-latest
    env:
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "1"
      AGENTICVERDICT_MOCK_SEED: "42001"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test --workspace=@agenticverdict/platform-adapters
```

---

## 7. Development Workflow

### 7.1 Local Development Setup

1. Copy `.env.example` to `.env.local`
2. Set desired mock flags:

```bash
# .env.local
NODE_ENV=development
AGENTICVERDICT_USE_MOCK_ADAPTERS=1
AGENTICVERDICT_MOCK_SEED=42001
```

3. Start development server:

```bash
pnpm dev
```

4. Verify mock mode is active:

```bash
curl http://localhost:3000/api/health/adapters
# Should show "mockMode": true
```

### 7.2 Selective Platform Mocking

```bash
# Mock only Meta, use real GA4
AGENTICVERDICT_MOCK_META=1
```

### 7.3 Toggle Between Mock and Real

```bash
# Start with mocks
AGENTICVERDICT_USE_MOCK_ADAPTERS=1 pnpm dev

# Later, switch to real adapters
# unset AGENTICVERDICT_USE_MOCK_ADAPTERS or set to 0
```

---

## 8. Implementation Tasks

### Phase 1: Core Implementation (Priority 1)

| Task | File                                                | Description                              |
| ---- | --------------------------------------------------- | ---------------------------------------- |
| 1.1  | `packages/platform-adapters/src/adapter-factory.ts` | Create environment-aware adapter factory |
| 1.2  | `packages/config/src/schemas/mock-adapters.ts`      | Add environment validation schema        |
| 1.3  | `packages/config/src/index.ts`                      | Export mock adapter configuration        |
| 1.4  | `packages/platform-adapters/src/index.ts`           | Export `createPlatformAdapter`           |

### Phase 2: Application Integration (Priority 1)

| Task | File                                            | Description                      |
| ---- | ----------------------------------------------- | -------------------------------- |
| 2.1  | `apps/web/src/lib/adapter-infrastructure.ts`    | Use mock-aware factory           |
| 2.2  | `apps/web/src/app/api/health/adapters/route.ts` | Add mock mode status to response |
| 2.3  | `apps/api/src/index.ts`                         | Register mock-aware factories    |
| 2.4  | `apps/worker/src/index.ts`                      | Register mock-aware factories    |

### Phase 3: Documentation & Examples (Priority 2)

| Task | File                                            | Description                           |
| ---- | ----------------------------------------------- | ------------------------------------- |
| 3.1  | `.env.example`                                  | Add mock adapter variables            |
| 3.2  | `docs/06-reference/mock-adapter-integration.md` | This document                         |
| 3.3  | `README.md`                                     | Add quick start section for mock mode |

### Phase 4: Testing & Validation (Priority 1)

| Task | File                                                               | Description            |
| ---- | ------------------------------------------------------------------ | ---------------------- |
| 4.1  | `packages/platform-adapters/src/adapter-factory.test.ts`           | Unit tests for factory |
| 4.2  | `packages/platform-adapters/src/security.test.ts`                  | Production guard tests |
| 4.3  | `tests/phase01-platform-integration/mock-mode.integration.test.ts` | Integration tests      |

---

## 9. Rollout Plan

### Step 1: Implement Core Factory

- Create `adapter-factory.ts` with production guards
- Add comprehensive unit tests
- Code review required

### Step 2: Security Validation

- Implement production environment checks
- Add startup validation
- Test security guard scenarios

### Step 3: Application Integration

- Update web app adapter infrastructure
- Update API and worker registries
- Add health check indicators

### Step 4: Documentation

- Update `.env.example`
- Create developer guide
- Add troubleshooting section

### Step 5: Testing

- Run full test suite with mock mode enabled
- Verify no production deployments possible
- Validate deterministic data generation

---

## 10. Troubleshooting

### Issue: Mock adapter not activating

**Check:**

```bash
echo $AGENTICVERDICT_USE_MOCK_ADAPTERS  # Should be "1"
echo $NODE_ENV  # Should be "development" or "test"
```

### Issue: Security error in production

**Solution:** Remove all `AGENTICVERDICT_MOCK_*` variables from production environment.

### Issue: Non-deterministic test data

**Solution:** Set `AGENTICVERDICT_MOCK_SEED` to a fixed value.

---

## 11. References

- Mock adapter implementation: `packages/platform-adapters/src/mock-adapter.ts`
- Mock factory: `packages/platform-adapters/src/mock-adapter-factory.ts`
- Test utilities: `packages/platform-adapters/src/test-utils.ts`
- Base adapter: `packages/platform-adapters/src/adapter.ts`
- Registry pattern: `packages/platform-adapters/src/registry.ts`
- Environment configuration: `.env.example`

---

**Document Version:** 1.0
**Last Updated:** 2025-01-07
**Author:** AgenticVerdict Development Team
**Status:** Ready for Implementation
