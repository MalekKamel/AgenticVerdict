# Mock Adapter Integration Plan

## Executive Summary

This document outlines the comprehensive integration strategy for enabling `MockConnectorAdapter` in development mode. The mock adapter provides deterministic, network-free testing of the marketing pipeline by simulating platform responses without requiring live API connections to external services (Meta, GA4, GSC, GBP, TikTok).

**Status**: Implementation ready — design complete, awaiting execution.

---

## 1. Mock Adapter Capabilities

### 1.1 Current Implementation

The `MockConnectorAdapter` class (`packages/data-connectors/src/mock-adapter.ts`) is a full-featured implementation of the `ConnectorAdapter` interface that extends `BaseConnectorAdapter` with the following capabilities:

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
const adapter = new MockConnectorAdapter("meta", {
  tenantId: "tenant-123",
  records: [...],           // Optional: override normalized records
  rawResponse: {...},        // Optional: custom raw payload
  authFailureMessage: "...", // Optional: simulate auth failure
  fetchFailureMessage: "...", // Optional: simulate fetch failure
});

// Factory pattern (recommended)
const adapter = MockAdapterFactory.create({
  connector: "meta",
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

**Implementation note:** Enablement is evaluated by **`isMockEnabledForConnector`** in **`@agenticverdict/config/configuration`** (also exported from **`@agenticverdict/data-connectors`**). **`createConnectorAdapter`** uses **`IS_PRODUCTION`** from **`build-constants`** so **production processes** never select mocks from env; **`useMock: true`** is ignored in production processes (production adapters only). See [Manual testing guide](../../tests/docs/manual-testing-guide.md) §2.6–2.7 and **`docs/docker/getting-started.md`**.

Example:

- `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` → All platforms use mocks (unless a per-platform var overrides)
- `AGENTICVERDICT_USE_MOCK_ADAPTERS=1` and `AGENTICVERDICT_MOCK_META=0` → All platforms except Meta use mocks
- No flags set → Production adapters for all platforms (in non-production processes)

### 2.4 Validation and typed runtime view

Binary mock env vars are parsed and validated in **`packages/config/src/configuration.ts`** (`parseBinaryFlag`, `isMockEnabledForConnector`, `ConfigurationService.load`). The aggregated, Zod-validated shape is **`RuntimeConfig`** in **`packages/config/src/schemas/runtime-config.ts`** (`adapters.mocks.enabled`, `adapters.mocks.connectors`, optional `scenarios`). Use `ConfigurationService` / `config.runtime()` rather than a separate env-only Zod object.

---

## 3. Adapter Selection Logic

### 3.1 Factory Pattern

Canonical implementation: **`packages/data-connectors/src/adapter-factory.ts`**. Public entry **`createConnectorAdapter({ connector, tenantId, useMock?, mockSeed?, mockScenario?, ... })`** chooses **`MockAdapterFactory`** vs production **`MetaConnectorAdapter`**, **`Ga4ConnectorAdapter`**, etc., using **`isMockEnabledForConnector(connector)`** from **`@agenticverdict/config/configuration`**.

```typescript
import { createConnectorAdapter } from "@agenticverdict/data-connectors";

const adapter = createConnectorAdapter({
  connector: "meta",
  tenantId: "tenant-123",
  mockScenario: "normal",
  mockSeed: 42_001,
});
```

### 3.2 Registry Integration

Use **`createAdapterRegistry`** from **`packages/data-connectors/src/registry.ts`** (per-connector factories; no global singleton required in production code).

```typescript
import { createAdapterRegistry, createConnectorAdapter } from "@agenticverdict/data-connectors";

type AdapterContext = { tenantId: string };

const registry = createAdapterRegistry<AdapterContext>();

registry.register("meta", (ctx) => createConnectorAdapter({ ...ctx, connector: "meta" }));
registry.register("ga4", (ctx) => createConnectorAdapter({ ...ctx, connector: "ga4" }));

const adapter = registry.resolve("meta", { tenantId: "tenant-123" });
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
// Illustrative: real wiring is in apps/web/src/lib/adapter-infrastructure.ts
import {
  connectorAdapterTypes,
  createDefaultAdapterInfrastructure,
  isMockEnabledForConnector,
} from "@agenticverdict/data-connectors";

const globalKey = "__agenticverdict_adapterInfrastructure__" as const;

export function getSharedAdapterInfrastructure(): AdapterInfrastructureBundle {
  const g = globalThis as unknown as Record<string, AdapterInfrastructureBundle | undefined>;
  if (!g[globalKey]) {
    g[globalKey] = createDefaultAdapterInfrastructure();

    if (process.env.NODE_ENV === "development") {
      const mockConnectors = connectorAdapterTypes.filter((c) => isMockEnabledForConnector(c));
      if (mockConnectors.length > 0) {
        console.warn(`[Mock adapters] Enabled for: ${mockConnectors.join(", ")}`);
      }
    }
  }
  return g[globalKey]!;
}
```

### 4.3 Health Check Indicators

The health endpoint **`apps/web/src/app/api/health/adapters/route.ts`** merges infrastructure health with mock metadata (`mockMode`, `mockConnectors`, per-row `adapterType`). Shape follows **`getSharedAdapterInfrastructure().getHealth()`** plus those fields.

---

## 5. Security Controls

### 5.1 Production Guard

**CRITICAL**: Mock adapters must NEVER be activatable in production or staging environments.

Authoritative logic: **`isMockEnabledForConnector`** in **`packages/config/src/configuration.ts`** (throws when mock flags are set under **`production`** / **`staging`**; see error text **`Mock adapters cannot be enabled`**).

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
  event: "connector.fetch",
  connector: "meta",
  adapterType: "mock", // "mock" | "production"
  duration: ms,
  mockSeed: 42001,
});
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

Existing unit tests already use `MockConnectorAdapter`. No changes required.

### 6.2 Integration Tests

Integration tests should explicitly enable mock mode:

```typescript
// tests/phase01-platform-integration/src/integration/mock-mode.integration.test.ts (pattern)
import { createConnectorAdapter } from "@agenticverdict/data-connectors";
import { describe, expect, it } from "vitest";

describe("mock mode", () => {
  it("uses mock adapters when env flag is enabled", async () => {
    process.env.NODE_ENV = "test";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";

    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "test-tenant",
      mockScenario: "normal",
      mockSeed: 42_001,
    });

    await adapter.authenticate({ accessToken: "dummy" });
    const range = { startInclusive: "2024-01-01", endInclusive: "2024-01-07" };
    const data = await adapter.fetchMetrics(range);

    expect(data).toEqual({ mock: true, connector: "meta" });
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
      - run: pnpm test --workspace=@agenticverdict/data-connectors
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

| Task | File                                              | Description                               |
| ---- | ------------------------------------------------- | ----------------------------------------- |
| 1.1  | `packages/data-connectors/src/adapter-factory.ts` | Create environment-aware adapter factory  |
| 1.2  | `packages/config/src/configuration.ts`            | Env parsing + `RuntimeConfig` aggregation |
| 1.3  | `packages/config/src/index.ts`                    | Export mock adapter configuration         |
| 1.4  | `packages/data-connectors/src/index.ts`           | Export `createConnectorAdapter`           |

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
| 3.2  | `docs/05-reference/mock-adapter-integration.md` | This document                         |
| 3.3  | `README.md`                                     | Add quick start section for mock mode |

### Phase 4: Testing & Validation (Priority 1)

| Task | File                                                               | Description            |
| ---- | ------------------------------------------------------------------ | ---------------------- |
| 4.1  | `packages/data-connectors/src/adapter-factory.test.ts`             | Unit tests for factory |
| 4.2  | `packages/data-connectors/src/security.test.ts`                    | Production guard tests |
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

- Mock adapter implementation: `packages/data-connectors/src/mock-adapter.ts`
- Mock factory: `packages/data-connectors/src/mock-adapter-factory.ts`
- Test utilities: `packages/data-connectors/src/test-utils.ts`
- Base adapter: `packages/data-connectors/src/adapter.ts`
- Registry pattern: `packages/data-connectors/src/registry.ts`
- Environment configuration: `.env.example`

---

**Document Version:** 1.0
**Last Updated:** 2025-01-07
**Author:** AgenticVerdict Development Team
**Status:** Ready for Implementation
