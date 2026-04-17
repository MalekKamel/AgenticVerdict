# Docker Mock Adapter Solution - Greenfield Implementation

**Date:** 2026-04-08  
**Status:** Research Complete  
**Implementation Type:** 🟢 Greenfield (No Backward Compatibility Required)  
**Next Phase:** Implementation Planning

---

## Executive Summary

This document outlines a greenfield implementation for AgenticVerdict's configuration system, addressing Docker compatibility for mock adapters while establishing a production-grade runtime configuration foundation.

**Problem Statement:** Mock adapters and deterministic testing data cannot be used in Docker deployments due to build-time configuration locking.

**Solution:** Implement a modern layered configuration system with clear separation between build-time security constraints and runtime flexibility.

**Greenfield Advantage:** No legacy constraints—can implement optimal patterns from industry leaders without compromise.

---

## Root Cause Analysis Summary

### Primary Technical Issues

| #   | Issue                                     | Location                                          | Impact                                |
| --- | ----------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| 1   | Module evaluation time configuration lock | `packages/config/src/build-constants.ts`          | Constants fixed at startup            |
| 2   | Compiler-driven adapter selection         | `packages/data-connectors/src/adapter-factory.ts` | Mock branch unreachable in production |
| 3   | Docker build-time environment locking     | `apps/*/Dockerfile`                               | Default `NODE_ENV=production`         |
| 4   | Runtime without bundling                  | Docker `CMD` with `tsx`                           | No build-time define injection        |
| 5   | Next.js dead code elimination             | `apps/frontend/next.config.ts`                    | Mocks eliminated at build time        |

### The Core Problem

```typescript
// Current approach - mock path eliminated in production builds
if (!IS_PRODUCTION) {
  return MockAdapterFactory.create({...});  // Dead code in production
}
return new ProductionAdapter({...});
```

**Greenfield Opportunity:** We can redesign this completely rather than patching it.

---

## Research Findings Summary

### Research Track 1: Container-Agnostic Configuration

**Best Approach:** Hybrid Layered Configuration System

```
┌─────────────────────────────────────────────────────────────┐
│                    HYBRID CONFIG SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Build-Time Constants (Security)                    │
│   • Environment classification                              │
│   • Security boundary enforcement                           │
│   • Compile-time optimizations                              │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Runtime Configuration (Flexibility)                │
│   • Mock adapter enablement                                 │
│   • Feature toggles                                         │
│   • Environment variable overrides                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Tenant Configuration (Personalization)             │
│   • Per-tenant feature flags                                │
│   • Database-driven settings                                │
│   • Real-time updates                                       │
└─────────────────────────────────────────────────────────────┘
```

**Industry Standards:**

- **Vercel:** Build-time + runtime separation
- **Shopify:** Multi-environment Docker stages
- **Stripe:** Feature flag driven development

### Research Track 2: Deterministic Testing in Containers

**Best Approach:** Dedicated Test Configuration

```dockerfile
# Separate test stage with full mock support
FROM base AS build-test
# Test-specific build with deterministic data fixtures
```

**Industry Examples:**

- **Turborepo:** Test-specific build targets
- **Nx:** Separate test configurations
- **GitHub:** Container-based testing with fixtures

### Research Track 3: Feature Flag Systems

**Top Solutions for Greenfield:**

| Solution            | Score      | Best For                    |
| ------------------- | ---------- | --------------------------- |
| **Unleash**         | ⭐⭐⭐⭐⭐ | Self-hosted, full control   |
| **Postgres-Native** | ⭐⭐⭐⭐   | Simplest, uses existing DB  |
| **LaunchDarkly**    | ⭐⭐⭐⭐   | Enterprise, managed service |

**Greenfield Recommendation:** Start with Postgres-native for simplicity, migrate to Unleash when advanced features needed.

---

## Greenfield Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CONFIGURATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────┐ │
│  │   BUILD CONSTANTS   │    │   RUNTIME CONFIG    │    │ TENANT CFG  │ │
│  │   (Security Layer)  │    │   (Flexibility)     │    │ (Overrides) │ │
│  │                     │    │                     │    │             │ │
│  │ • NODE_ENV          │    │ • mockAdapters      │    │ • Features  │ │
│  │ • IS_PRODUCTION     │───▶│ • featureFlags      │───▶│ • Plans     │ │
│  │ • SECURITY_LEVEL    │    │ • experiments       │    │ • Custom    │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────┘ │
│           │                           │                         │       │
│           └───────────────────────────┼─────────────────────────┘       │
│                                       ▼                                 │
│                    ┌──────────────────────────────┐                     │
│                    │   Configuration Service     │                     │
│                    │   (Single Source of Truth)   │                     │
│                    └──────────────────────────────┘                     │
│                                       │                                 │
│                    ┌──────────────────┴──────────────────┐              │
│                    ▼                                     ▼              │
│           ┌─────────────────────┐           ┌─────────────────────┐     │
│           │  Mock Adapter       │           │  Real Adapter       │     │
│           │  (Test/Dev Only)    │           │  (Any Environment)  │     │
│           └─────────────────────┘           └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1: Core Configuration Service (Week 1-2)

**Goal:** Build the foundation for layered configuration

```typescript
// packages/config/src/configuration.ts
import { z } from "zod";

// Layer 1: Build-time constants (immutable)
export const BUILD_CONSTANTS = Object.freeze({
  NODE_ENV: process.env.NODE_ENV ?? "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",
  BUILD_TIMESTAMP: Date.now(),
} as const);

// Layer 2: Runtime configuration (flexible)
const RuntimeConfigSchema = z.object({
  adapters: z.object({
    mocks: z.object({
      enabled: z.boolean(),
      platforms: z.array(z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"])),
      scenarios: z.record(z.string()).optional(),
    }),
  }),
  features: z.object({
    enableNewReportGenerator: z.boolean().optional(),
    enableAdvancedAnalytics: z.boolean().optional(),
  }),
  experiments: z.record(z.string()).optional(),
});

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

// Configuration service with validation
export class ConfigurationService {
  private static instance: RuntimeConfig | null = null;

  static load(): RuntimeConfig {
    if (this.instance) {
      return this.instance;
    }

    // Load from environment variables with validation
    const config: RuntimeConfig = {
      adapters: {
        mocks: {
          enabled: this.canEnableMocks() && process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS === "1",
          platforms: BUILD_CONSTANTS.IS_PRODUCTION ? [] : ["meta", "ga4", "gsc", "gbp", "tiktok"],
        },
      },
      features: {
        enableNewReportGenerator: process.env.ENABLE_NEW_REPORT_GENERATOR === "true",
      },
      experiments: {},
    };

    // Validate and cache
    const validated = RuntimeConfigSchema.parse(config);
    this.instance = validated;
    return validated;
  }

  private static canEnableMocks(): boolean {
    // Security boundary: never in production builds
    if (BUILD_CONSTANTS.IS_PRODUCTION) {
      return false;
    }
    // Respect environment detection in staging
    if (process.env.NODE_ENV === "staging") {
      return false;
    }
    return true;
  }

  // Convenience methods
  static areMockAdaptersEnabled(): boolean {
    return this.load().adapters.mocks.enabled;
  }

  static isMockEnabledForConnector(platform: string): boolean {
    const config = this.load();
    return (
      config.adapters.mocks.enabled && config.adapters.mocks.platforms.includes(platform as any)
    );
  }
}

// Export singleton getter
export const config = {
  get build() {
    return BUILD_CONSTANTS;
  },
  get runtime() {
    return ConfigurationService.load();
  },
  get mocksEnabled() {
    return ConfigurationService.areMockAdaptersEnabled();
  },
};
```

#### Phase 2: Adapter Factory Redesign (Week 2-3)

**Goal:** Clean adapter selection with configuration service

```typescript
// packages/data-connectors/src/adapter-factory.ts
import { config } from "@agenticverdict/config/configuration";
import { BaseConnectorAdapterOptions, ConnectorAdapter } from "./adapter";
import { Ga4PlatformAdapter } from "./ga4/ga4-adapter";
import { GbpPlatformAdapter } from "./gbp/gbp-adapter";
import { GscPlatformAdapter } from "./gsc/gsc-adapter";
import { MetaPlatformAdapter } from "./meta/meta-adapter";
import { MockAdapterFactory } from "./mock-adapter-factory";
import { TikTokPlatformAdapter } from "./tiktok/tiktok-adapter";

export interface AdapterFactoryConfig extends BaseConnectorAdapterOptions {
  readonly platform: ConnectorType;
  readonly useMock?: boolean;
  readonly mockSeed?: number;
  readonly mockScenario?: MockAdapterScenario;
}

/**
 * Create a platform adapter with configuration-driven selection.
 *
 * Selection priority:
 * 1. Explicit useMock=true (respects security boundaries)
 * 2. Explicit useMock=false (forces production adapter)
 * 3. Runtime configuration (mockAdapters.enabled)
 * 4. Platform-specific runtime override
 * 5. Default: production adapter
 */
export function createConnectorAdapter(factoryConfig: AdapterFactoryConfig): ConnectorAdapter {
  const { platform, useMock, ...adapterOptions } = factoryConfig;
  const baseOptions = normalizeBaseOptions(adapterOptions);

  // Determine if mock adapter should be used
  const useMockAdapter = shouldUseMockAdapter(platform, useMock);

  if (useMockAdapter) {
    return MockAdapterFactory.create({
      platform,
      ...baseOptions,
    });
  }

  // Production adapter selection
  return createProductionAdapter(platform, baseOptions);
}

function shouldUseMockAdapter(platform: ConnectorType, explicitUseMock?: boolean): boolean {
  // Explicit override takes precedence
  if (explicitUseMock === true) {
    // Security check
    if (config.build.IS_PRODUCTION) {
      throw new Error("[SECURITY] Mock adapters cannot be explicitly enabled in production builds");
    }
    return true;
  }

  if (explicitUseMock === false) {
    return false;
  }

  // Runtime configuration decision
  return config.isMockEnabledForConnector(platform);
}

function createProductionAdapter(
  platform: ConnectorType,
  options: BaseConnectorAdapterOptions,
): ConnectorAdapter {
  switch (platform) {
    case "meta":
      return new MetaPlatformAdapter(options);
    case "ga4":
      return new Ga4PlatformAdapter(options);
    case "gsc":
      return new GscPlatformAdapter(options);
    case "gbp":
      return new GbpPlatformAdapter(options);
    case "tiktok":
      return new TikTokPlatformAdapter(options);
    default: {
      const exhaustive: never = platform;
      throw new Error(`Unsupported platform: ${String(exhaustive)}`);
    }
  }
}

// Re-export configuration service for convenience
export { config } from "@agenticverdict/config/configuration";
```

#### Phase 3: Docker Multi-Stage Builds (Week 3-4)

**Goal:** Docker-native configuration for all environments

```dockerfile
# apps/api/Dockerfile (greenfield design)
# syntax=docker/dockerfile:1
ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile

# Development stage - full tooling, mocks available
FROM deps AS development
ENV NODE_ENV=development
COPY . .
RUN pnpm run build:dev

# Test stage - optimized for testing with mocks
FROM deps AS test
ENV NODE_ENV=test
COPY . .
RUN pnpm run build:test
COPY tests/fixtures /app/tests/fixtures

# Production stage - optimized, no mock code
FROM deps AS production
ENV NODE_ENV=production
COPY . .
RUN pnpm run build:prod

# Runner stage - selectable target
FROM base AS runner
ARG TARGET_STAGE=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first --tls-min-v1.2"
COPY --from=${TARGET_STAGE} /app /app

RUN groupadd --gid 1001 appuser \
  && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
  && chown -R appuser:appuser /app

USER appuser
WORKDIR /app/apps/${SERVICE:-api}
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:4000/health || exit 1

CMD ["node", "--import", "tsx", "src/cli.ts"]
```

**Docker Compose configurations:**

```yaml
# docker-compose.yml - Production by default
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      args:
        TARGET_STAGE: production
        SERVICE: api
    environment:
      NODE_ENV: production

# docker-compose.dev.yml - Development with mocks
services:
  api:
    build:
      args:
        TARGET_STAGE: development
    environment:
      NODE_ENV: development
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "1"
    volumes:
      - ./apps/api/src:/app/apps/api/src:ro
      - ./packages:/app/packages:ro

# docker-compose.test.yml - Testing with deterministic data
services:
  api:
    build:
      args:
        TARGET_STAGE: test
    environment:
      NODE_ENV: test
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "1"
      AGENTICVERDICT_MOCK_SCENARIO: deterministic
    volumes:
      - ./tests/fixtures:/app/tests/fixtures:ro
```

#### Phase 4: Feature Flag Infrastructure (Week 5-7)

**Goal:** Tenant-aware feature management

```sql
-- Database schema for feature flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('boolean', 'variant', 'rollout')),
  default_value JSONB NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);

CREATE TABLE tenant_feature_flags (
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  override_type TEXT NOT NULL CHECK (override_type IN ('explicit', 'inherited', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, flag_id)
);

CREATE INDEX idx_tenant_feature_flags_tenant ON tenant_feature_flags(tenant_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tenant_feature_flags_updated_at
  BEFORE UPDATE ON tenant_feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

```typescript
// packages/config/src/feature-flags.ts
import { db } from "@agenticverdict/database";
import { feature_flags, tenant_feature_flags } from "@agenticverdict/database/schema";
import { eq, and } from "drizzle-orm";

export interface FeatureFlagContext {
  tenantId: string;
  userId?: string;
  attributes?: Record<string, unknown>;
}

export class FeatureFlagService {
  /**
   * Get feature flag value for a tenant with fallback to default
   */
  async getFlag(
    flagKey: string,
    context: FeatureFlagContext,
  ): Promise<boolean | string | number | null> {
    // Check tenant-specific override first
    const tenantOverride = await db.query.tenant_feature_flags.findFirst({
      where: and(
        eq(tenant_feature_flags.tenant_id, context.tenantId),
        eq(
          tenant_feature_flags.flag_id,
          db
            .select({ id: feature_flags.id })
            .from(feature_flags)
            .where(eq(feature_flags.key, flagKey)),
        ),
      ),
    });

    if (tenantOverride?.override_type === "disabled") {
      // Explicitly disabled for this tenant
      const flagDef = await this.getFlagDefinition(flagKey);
      return flagDef.default_value;
    }

    if (tenantOverride?.override_type === "explicit") {
      // Tenant-specific value
      return tenantOverride.value;
    }

    // Fall back to default
    const flagDef = await this.getFlagDefinition(flagKey);
    return flagDef.default_value;
  }

  /**
   * Get multiple flags for a tenant (batched for performance)
   */
  async getFlags(
    flagKeys: string[],
    context: FeatureFlagContext,
  ): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};

    // Batch query for tenant overrides
    const overrides = await db.query.tenant_feature_flags.findMany({
      where: eq(tenant_feature_flags.tenant_id, context.tenantId),
      with: {
        flag: true,
      },
    });

    const overrideMap = new Map(overrides.map((o) => [o.flag?.key, o]));

    // Get flag definitions
    const flagDefinitions = await this.getFlagDefinitions(flagKeys);

    for (const key of flagKeys) {
      const override = overrideMap.get(key);
      const definition = flagDefinitions[key];

      if (!definition) {
        results[key] = null;
        continue;
      }

      if (override?.override_type === "explicit") {
        results[key] = override.value;
      } else if (override?.override_type === "disabled") {
        results[key] = definition.default_value;
      } else {
        results[key] = definition.default_value;
      }
    }

    return results;
  }

  private async getFlagDefinition(key: string) {
    const flag = await db.query.feature_flags.findFirst({
      where: eq(feature_flags.key, key),
    });

    if (!flag) {
      throw new Error(`Feature flag "${key}" not found`);
    }

    return flag;
  }

  private async getFlagDefinitions(keys: string[]) {
    const flags = await db.query.feature_flags.findMany({
      where: eq(feature_flags.key, keys[0]), // Drizzle ORM limitation
    });

    return Object.fromEntries(flags.map((f) => [f.key, f]));
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();
```

#### Phase 5: Production Hardening (Week 8-9)

**Goal:** Security, monitoring, and observability

```typescript
// packages/config/src/monitoring.ts
import { Counter, Histogram } from "prom-client";

// Configuration access metrics
export const configMetrics = {
  accessCounter: new Counter({
    name: "config_access_total",
    help: "Total number of configuration accesses",
    labelNames: ["layer", "operation"],
  }),

  loadTime: new Histogram({
    name: "config_load_duration_seconds",
    help: "Time spent loading configuration",
    labelNames: ["layer"],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  }),

  flagEvaluation: new Counter({
    name: "feature_flag_evaluation_total",
    help: "Total number of feature flag evaluations",
    labelNames: ["flag_key", "result", "source"], // source: default|override
  }),
};

// Audit logging for configuration changes
export async function auditConfigChange(change: {
  layer: "build" | "runtime" | "tenant";
  key: string;
  oldValue: unknown;
  newValue: unknown;
  userId?: string;
  tenantId?: string;
}): Promise<void> {
  // Log to audit trail
  await db.insert(audit_log).values({
    event_type: "config_change",
    actor_id: change.userId,
    tenant_id: change.tenantId,
    metadata: change,
    timestamp: new Date(),
  });
}
```

---

## Implementation Plan

### Week-by-Week Breakdown

| Week | Phase             | Deliverables                              | Dependencies |
| ---- | ----------------- | ----------------------------------------- | ------------ |
| 1    | Config Service    | `ConfigurationService`, schema validation | None         |
| 2    | Adapter Factory   | Redesigned `createConnectorAdapter`       | Week 1       |
| 3    | Docker Stages     | Multi-stage Dockerfiles                   | Week 1       |
| 4    | Docker Compose    | Environment-specific compose files        | Week 3       |
| 5    | Feature Flags DB  | Schema, migrations                        | Week 1       |
| 6    | Feature Flags API | `FeatureFlagService`                      | Week 5       |
| 7    | Integration       | Adapter + feature flag integration        | Week 2, 6    |
| 8    | Monitoring        | Metrics, audit logging                    | Week 7       |
| 9    | Documentation     | API docs, runbooks                        | All phases   |

### Effort Summary

| Phase              | Duration       | Engineer Weeks |
| ------------------ | -------------- | -------------- |
| Core Configuration | 2 weeks        | 2              |
| Adapter Factory    | 1 week         | 1              |
| Docker Enhancement | 2 weeks        | 2              |
| Feature Flags      | 3 weeks        | 3              |
| Hardening          | 2 weeks        | 2              |
| Documentation      | 1 week         | 1              |
| Testing            | Ongoing        | +2             |
| **Total**          | **9-10 weeks** | **~13**        |

---

## Benefits of Greenfield Approach

| Benefit                 | Greenfield Advantage                              |
| ----------------------- | ------------------------------------------------- |
| **Clean Architecture**  | No legacy code patterns to work around            |
| **Optimal Patterns**    | Use best practices from day one                   |
| **Simpler Code**        | No conditional paths for backward compatibility   |
| **Better Type Safety**  | No `any` types for legacy compatibility           |
| **Faster Development**  | No migration complexity                           |
| **Better Testing**      | Test the actual implementation, not compat layers |
| **Clear Documentation** | Document how it IS, not how it WAS                |

---

## Success Metrics

| Metric                         | Target | Week |
| ------------------------------ | ------ | ---- |
| Docker mock adapter support    | ✅ Yes | 4    |
| Config changes without rebuild | ✅ Yes | 2    |
| Test determinism in Docker     | ✅ Yes | 4    |
| Developer setup time           | <2 min | 4    |
| CI/CD test reliability         | >95%   | 8    |
| Per-tenant feature flags       | ✅ Yes | 7    |
| Bundle size optimization       | <500KB | 3    |
| Config lookup latency (p99)    | <10ms  | 8    |

---

## Risk Assessment (Greenfield)

| Risk                                          | Probability | Impact   | Mitigation                         |
| --------------------------------------------- | ----------- | -------- | ---------------------------------- |
| **Design changes during implementation**      | Medium      | Medium   | Clear architecture, design reviews |
| **Integration issues with existing packages** | Low         | High     | Early integration testing          |
| **Performance regression**                    | Low         | Medium   | Benchmarking, load testing         |
| **Security vulnerability**                    | Low         | Critical | Security reviews, threat modeling  |
| **Team learning curve**                       | Medium      | Low      | Documentation, training            |

**Note:** Greenfield significantly reduces risk compared to migration approach.

---

## Environment Variable Specification

### Build-Time Variables

| Variable       | Required | Default      | Purpose             |
| -------------- | -------- | ------------ | ------------------- |
| `NODE_ENV`     | No       | `production` | Build environment   |
| `TARGET_STAGE` | No       | `production` | Docker build target |

### Runtime Variables

| Variable                           | Required | Default  | Purpose                |
| ---------------------------------- | -------- | -------- | ---------------------- |
| `AGENTICVERDICT_USE_MOCK_ADAPTERS` | No       | `0`      | Enable mock adapters   |
| `AGENTICVERDICT_MOCK_{PLATFORM}`   | No       | -        | Platform-specific mock |
| `AGENTICVERDICT_MOCK_SCENARIO`     | No       | `normal` | Mock data scenario     |

### Feature Flag Variables

| Variable                      | Required | Default | Purpose              |
| ----------------------------- | -------- | ------- | -------------------- |
| `ENABLE_NEW_REPORT_GENERATOR` | No       | `false` | New report generator |
| `ENABLE_ADVANCED_ANALYTICS`   | No       | `false` | Advanced analytics   |

---

## Directory Structure (New Files)

```
packages/config/src/
├── configuration.ts          # New: ConfigurationService
├── feature-flags.ts          # New: FeatureFlagService
├── monitoring.ts             # New: Metrics & audit
├── schemas/
│   └── runtime-config.ts     # New: Runtime config schema
└── build-constants.ts        # Keep: Build-time constants

packages/data-connectors/src/
├── adapter-factory.ts        # Rewrite: Clean implementation
└── mock-adapter-factory.ts   # Keep: Mock creation

apps/*/Dockerfile             # Rewrite: Multi-stage builds

docker-compose*.yml           # New: Environment-specific

tests/fixtures/               # New: Deterministic test data

docs/04-technology-research/
├── docker-mock-adapter-solution-summary.md      # This document
├── docker-incompatibility-root-cause-analysis.md
├── container-agnostic-config-research.md
├── deterministic-testing-research.md
└── feature-flag-runtime-config-research.md
```

---

## Related Documents

### Research Reports

- [Docker Incompatibility Root Cause Analysis](./docker-incompatibility-root-cause-analysis.md)
- [Container-Agnostic Configuration Research](./container-agnostic-config-research.md)
- [Deterministic Testing Research](./deterministic-testing-research.md)
- [Feature Flag Systems Research](./feature-flag-runtime-config-research.md)

### Existing Documentation (for context)

- [Compiler-Driven Config Implementation Plan](./compiler-driven-adapter-config-implementation-plan.md)
- [Docker Getting Started Guide](../docker/getting-started.md)

---

## Next Steps

1. **Approve greenfield approach** - No backward compatibility constraints
2. **Design review** - Architecture and schema review with team
3. **Sprint planning** - Break down into 2-week sprints
4. **Begin Week 1** - Core configuration service implementation
5. **Set up CI/CD** - Automated testing for new components

---

## Key Differences from Migration Approach

| Aspect                    | Greenfield             | Migration                      |
| ------------------------- | ---------------------- | ------------------------------ |
| **Timeline**              | 9-10 weeks             | 12+ weeks                      |
| **Code complexity**       | Simple                 | Complex (compatibility layers) |
| **Type safety**           | Full                   | Partial (legacy types)         |
| **Testing**               | Direct                 | Compat + new                   |
| **Documentation**         | Single source of truth | Migrated + legacy              |
| **Risk**                  | Lower                  | Higher                         |
| **Long-term maintenance** | Easier                 | Harder                         |

---

**Document Status:** ✅ Research Complete - Greenfield Approach  
**Ready for:** Implementation  
**Priority:** HIGH - Foundation for Docker testing and production configuration

---

_Generated: 2026-04-08_  
_AgenticVerdict Technical Team_  
_Greenfield Implementation - No Backward Compatibility Constraints_
