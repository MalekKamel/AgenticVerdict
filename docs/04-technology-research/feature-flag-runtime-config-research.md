# Feature Flag and Runtime Configuration Systems Research

**Document Version:** 1.0  
**Date:** 2026-04-08  
**Author:** AgenticVerdict Technical Research Team  
**Status:** Research Complete

---

## Executive Summary

This research document evaluates battle-tested feature flag and runtime configuration systems for Node.js/TypeScript SaaS platforms, specifically addressing AgenticVerdict's need to move beyond compiler-driven configuration that requires container rebuilds.

**Key Finding:** While AgenticVerdict currently uses compiler-driven configuration (eliminating mock adapters via build-time constants), modern SaaS platforms require **hybrid configuration** combining build-time constants for core infrastructure with runtime feature flags for business logic and tenant-specific customization.

**Primary Recommendation:** Implement **LaunchDarkly** for enterprise-grade feature flagging with **database-driven configuration** for multi-tenant customization, while maintaining compiler-driven constants for infrastructure-level concerns (mock adapters, debug modes).

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Feature Flag Platform Comparison](#2-feature-flag-platform-comparison)
3. [Runtime Configuration Libraries](#3-runtime-configuration-libraries)
4. [Multi-Tenant Configuration Patterns](#4-multi-tenant-configuration-patterns)
5. [Docker-Native Solutions](#5-docker-native-solutions)
6. [Implementation Recommendations](#6-implementation-recommendations)
7. [Migration Strategy](#7-migration-strategy)

---

## 1. Current Architecture Analysis

### 1.1 Existing Compiler-Driven Configuration

AgenticVerdict currently implements build-time constant injection:

```typescript
// packages/config/src/build-constants.ts
export const NODE_ENV = process.env.NODE_ENV as "development" | "production" | "test";
export const IS_PRODUCTION = NODE_ENV === "production";
export const MOCK_ADAPTERS_ENABLED = NODE_ENV !== "production";

// Used in adapter factory
export function createPlatformAdapter(config: AdapterFactoryConfig): PlatformAdapter {
  if (!IS_PRODUCTION) {
    // Development-only mock adapters
    return MockAdapterFactory.create({...});
  }
  // Production adapters
  return new MetaPlatformAdapter(shared);
}
```

**Strengths:**

- ✅ Compile-time code elimination (mock adapters excluded from production)
- ✅ Type-safe with literal types
- ✅ Zero runtime overhead
- ✅ Security by design (production builds can't enable mocks)

**Limitations:**

- ⚠️ Requires container rebuilds for configuration changes
- ⚠️ No runtime feature toggling
- ⚠️ Can't enable/disable features per tenant
- ⚠️ Deployment required for behavioral changes

### 1.2 Identified Requirements

Based on AgenticVerdict's multi-tenant SaaS architecture:

| Requirement                                             | Priority | Current Solution   | Gap                                                  |
| ------------------------------------------------------- | -------- | ------------------ | ---------------------------------------------------- |
| **Infrastructure toggles** (mock adapters, debug modes) | High     | Compiler-driven ✅ | None                                                 |
| **Feature flags per tenant**                            | High     | None ❌            | Need runtime system                                  |
| **A/B testing capabilities**                            | Medium   | None ❌            | Need experimentation                                 |
| **Gradual rollouts**                                    | Medium   | None ❌            | Need deployment safety                               |
| **Configuration without rebuilds**                      | High     | None ❌            | Need runtime config                                  |
| **Database-driven config**                              | High     | Partial ⚠️         | CompanyConfig exists, needs feature flag integration |

---

## 2. Feature Flag Platform Comparison

### 2.1 Managed Solutions

#### **LaunchDarkly** (⭐⭐⭐⭐⭐ RECOMMENDED)

**Overview:** Industry-leading feature flagging platform with excellent TypeScript/Node.js support.

**Key Features:**

- Real-time flag updates without redeployment
- Multi-tenant data isolation
- A/B testing and experimentation
- Gradual rollouts with percentage-based targeting
- Secure SDK with offline mode
- Excellent TypeScript definitions

**Node.js SDK Example:**

```typescript
import { LDClient, LDOptions } from "launchdarkly-node-server-sdk";

const client = new LDClient("sdk-key-123abc", {
  stream: true, // Real-time updates
  diagnosticOptOut: false,
});

// Tenant-specific flag evaluation
const user = {
  key: `tenant-${tenantId}`,
  custom: {
    companyId: tenantId,
    plan: "enterprise",
    region: "SA",
  },
};

// Feature flag check
const showVerdict = await client.variation(
  "enable-verdict-report",
  user,
  false, // Default value
);

// Per-tenant configuration
const enableInsights = await client.variation("enable-insights", user, true);

// A/B testing
const uiVariant = await client.variation("dashboard-ui-variant", user, "control");
```

**Pros:**

- ✅ Excellent multi-tenant support
- ✅ Real-time flag propagation (<200ms)
- ✅ Powerful targeting rules (segments, attributes)
- ✅ A/B testing built-in
- ✅ Enterprise-grade security (SOC 2, HIPAA compliant)
- ✅ Offline mode for edge cases
- ✅ Excellent TypeScript support

**Cons:**

- ⚠️ Expensive for startups ($200+/month for Teams plan)
- ⚠️ Requires managed service dependency
- ⚠️ Learning curve for advanced features

**Pricing:**

- Starter: Free (up to 3 flags, 1 environment)
- Pro: $50/month (unlimited flags, 2 environments)
- Enterprise: Custom (SSO, advanced permissions, dedicated support)

**Production Use Cases:**

- IBM, Atlassian, VMware, Comcast
- Used by companies with 10M+ MAU

---

#### **Flagsmith** (⭐⭐⭐⭐)

**Overview:** Open-source feature flagging platform with managed hosting option.

**Key Features:**

- Self-hosted or managed options
- Multi-tenant data isolation
- A/B testing support
- REST API for configuration
- TypeScript SDK available

**Node.js SDK Example:**

```typescript
import Flagsmith from "flagsmith-nodejs";

const flagsmith = new Flagsmith({
  environmentKey: "ser.***",
});

// Get all flags for tenant
const flags = await flagsmith.getFlags({
  tenantID: tenantId,
});

// Check specific flag
const enableVerdict = flags.isFeatureEnabled("enable_verdict");

// Get flag value
const maxReports = flags.getValue("max_reports_per_month", 10);

// Identify user (tenant)
await flagsmith.identify(`tenant-${tenantId}`, {
  companyId: tenantId,
  plan: "enterprise",
});
```

**Pros:**

- ✅ Open-source (self-hosted option)
- ✅ More affordable than LaunchDarkly
- ✅ Good TypeScript support
- ✅ Simple API
- ✅ Self-hosted for data control

**Cons:**

- ⚠️ Less polished than LaunchDarkly
- ⚠️ Fewer advanced features
- ⚠️ Smaller community
- ⚠️ Real-time updates not as robust

**Pricing:**

- Open Source: Free (self-hosted)
- Professional: $25/month (unlimited flags, 2 environments)
- Enterprise: $199/month (SSO, advanced permissions)

**Production Use Cases:**

- Used by startups and mid-sized companies
- Good balance of features and cost

---

#### **Split** (⭐⭐⭐⭐)

**Overview:** Feature experimentation platform with strong focus on A/B testing.

**Key Features:**

- Advanced A/B testing
- Statistical significance engine
- Traffic allocation
- SDK for all major platforms
- TypeScript definitions

**Node.js SDK Example:**

```typescript
import { SplitFactory } from "@splitsoftware/splitio";

const factory = SplitFactory({
  core: {
    authorizationKey: "your-api-key",
  },
});

const client = factory.client();

// Get treatment for tenant
const treatment = await client.getTreatment(`tenant-${tenantId}`, "enable_verdict_feature");

// A/B test variants
if (treatment === "on") {
  // Show new feature
} else if (treatment === "control") {
  // Show old version
} else {
  // Default behavior
}
```

**Pros:**

- ✅ Excellent A/B testing capabilities
- ✅ Statistical significance built-in
- ✅ Good TypeScript support
- ✅ Powerful targeting

**Cons:**

- ⚠️ Focused on experimentation (less for configuration)
- ⚠️ More complex than needed for simple flags
- ⚠️ Pricing can be high

**Pricing:**

- Free: Up to 10K monthly tracked keys
- Starter: $49/month
- Enterprise: Custom

---

### 2.2 Open-Source Self-Hosted Solutions

#### **Unleash** (⭐⭐⭐⭐⭐ RECOMMENDED FOR SELF-HOSTED)

**Overview:** Open-source feature flag platform with excellent enterprise features.

**Key Features:**

- Self-hosted (full data control)
- Multi-tenant support
- A/B testing
- Gradual rollouts
- SDK for all platforms
- TypeScript definitions

**Node.js SDK Example:**

```typescript
import { Unleash } from "unleash-client";

const unleash = new Unleash({
  appName: "agenticverdict",
  url: "https://unleash.example.com",
  instanceId: `instance-${process.env.INSTANCE_ID}`,
  customHeaders: {
    Authorization: "your-api-token",
  },
});

// Tenant context
const context = {
  userId: `tenant-${tenantId}`,
  properties: {
    companyId: tenantId,
    plan: "enterprise",
    region: "SA",
  },
};

// Check flag
const enableVerdict = unleash.isEnabled("enable_verdict", context);

// Get variant
const variant = unleash.getVariant("ui_variant", context);
// Returns: { name: 'variant-a', enabled: true, payload: { color: 'blue' } }
```

**Pros:**

- ✅ Open-source (MIT license)
- ✅ Self-hosted (data sovereignty)
- ✅ Excellent multi-tenant support
- ✅ A/B testing built-in
- ✅ Good TypeScript support
- ✅ Active community
- ✅ Enterprise features (SSO, permissions)

**Cons:**

- ⚠️ Requires self-hosting infrastructure
- ⚠️ More complex setup than managed services
- ⚠️ Need to manage operations

**Pricing:**

- Open Source: Free (self-hosted)
- Unleash Cloud: $99/month (managed)

**Production Use Cases:**

- Used by enterprises requiring data control
- Popular in regulated industries (finance, healthcare)

---

#### **Flipt** (⭐⭐⭐⭐)

**Overview:** Modern open-source feature flag platform written in Go.

**Key Features:**

- High performance (Go-based)
- Simple deployment
- REST API
- TypeScript SDK
- Multi-tenant support

**Node.js SDK Example:**

```typescript
import { FliptEvaluationClient } from "@flipt-io/flipt";

const client = new FliptEvaluationClient({
  url: "https://flipt.example.com",
  authentication_key: "your-api-key",
});

// Evaluate boolean flag
const flag = await client.evaluateBoolean({
  namespaceKey: "default",
  flagKey: "enable_verdict",
  entityId: `tenant-${tenantId}`,
  context: {
    company_id: tenantId,
    plan: "enterprise",
  },
});

// Evaluate variant flag
const variant = await client.evaluateVariant({
  namespaceKey: "default",
  flagKey: "ui_variant",
  entityId: `tenant-${tenantId}`,
});
```

**Pros:**

- ✅ Modern architecture (Go-based, fast)
- ✅ Simple deployment
- ✅ Good TypeScript SDK
- ✅ Self-hosted
- ✅ REST API

**Cons:**

- ⚠️ Less mature than Unleash
- ⚠️ Smaller community
- ⚠️ Fewer features

**Pricing:**

- Open Source: Free (self-hosted)
- Cloud: Coming soon

---

### 2.3 Comparison Matrix

| Platform         | Multi-Tenant | Real-Time Updates | A/B Testing | TypeScript Support | Self-Hosted | Pricing (Monthly)  | Overall    |
| ---------------- | ------------ | ----------------- | ----------- | ------------------ | ----------- | ------------------ | ---------- |
| **LaunchDarkly** | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐        | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐         | ❌          | $200+ (Enterprise) | ⭐⭐⭐⭐⭐ |
| **Unleash**      | ⭐⭐⭐⭐⭐   | ⭐⭐⭐⭐          | ⭐⭐⭐⭐    | ⭐⭐⭐⭐           | ✅          | Free (self-hosted) | ⭐⭐⭐⭐⭐ |
| **Flagsmith**    | ⭐⭐⭐⭐     | ⭐⭐⭐            | ⭐⭐⭐      | ⭐⭐⭐⭐           | ✅          | $25 (Pro)          | ⭐⭐⭐⭐   |
| **Split**        | ⭐⭐⭐⭐     | ⭐⭐⭐⭐          | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐           | ❌          | $49+               | ⭐⭐⭐⭐   |
| **Flipt**        | ⭐⭐⭐⭐     | ⭐⭐⭐            | ⭐⭐        | ⭐⭐⭐             | ✅          | Free (self-hosted) | ⭐⭐⭐     |

---

## 3. Runtime Configuration Libraries

### 3.1 Node.js Configuration Libraries

#### **node-config** (⭐⭐⭐⭐)

**Overview:** Runtime configuration management with hot-reload.

**Features:**

- Multiple file formats (JSON, YAML, JS, TS)
- Environment-specific configs
- Hot-reload without restart
- Config validation
- TypeScript support

**Example:**

```typescript
import config from "config";

// Load configuration
const dbConfig = config.get("database");

// Tenant-specific config
const tenantConfig = config.get(`tenants.${tenantId}`);

// Watch for changes (hot-reload)
config.watch((obj) => {
  console.log("Config changed:", obj);
});
```

**File Structure:**

```
config/
  default.json        # Base configuration
  production.json     # Production overrides
  development.json    # Development overrides
  tenants/
    company-a.json    # Tenant-specific config
    company-b.json    # Tenant-specific config
```

**Pros:**

- ✅ Hot-reload without restart
- ✅ Flexible file formats
- ✅ Tenant-specific configs
- ✅ Mature library (10+ years)

**Cons:**

- ⚠️ File-based (not database-driven)
- ⚠️ Need to mount config files in Docker
- ⚠️ No built-in feature flagging

---

#### **convict** (⭐⭐⭐)

**Overview:** Configuration validation with schema support.

**Example:**

```typescript
import convict from "convict";
import convict_format_with_validator from "convict-format-with-validator";

convict.addFormats(convict_format_with_validator);

const config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  enableVerdict: {
    doc: "Enable verdict reports",
    format: Boolean,
    default: false,
  },
  tenants: {
    doc: "Tenant-specific configuration",
    format: Object,
    default: {},
  },
});

// Validate
config.validate({ allowed: "strict" });

// Get value
const enableVerdict = config.get("enableVerdict");
```

**Pros:**

- ✅ Schema validation
- ✅ Type-safe
- ✅ Environment variable support

**Cons:**

- ⚠️ No hot-reload
- ⚠️ Static configuration only
- ⚠️ No feature flagging

---

### 3.2 Database-Driven Configuration

#### **Custom PostgreSQL Solution** (⭐⭐⭐⭐ RECOMMENDED)

**Overview:** Leverage existing PostgreSQL database for runtime configuration.

**Schema Design:**

```sql
-- Feature flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant-specific flag overrides
CREATE TABLE tenant_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id),
  flag_id UUID NOT NULL REFERENCES feature_flags(id),
  enabled BOOLEAN,
  variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, flag_id)
);

-- Index for performance
CREATE INDEX idx_tenant_flags ON tenant_feature_flags(tenant_id, flag_id);
```

**Node.js Implementation:**

```typescript
// packages/config/src/runtime-config.ts
import { db } from "@agenticverdict/database";

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
}

interface TenantFlagOverride {
  enabled: boolean;
  variant?: string;
}

class RuntimeConfigService {
  private cache = new Map<string, FeatureFlag>();
  private cacheExpiry = 60000; // 1 minute
  private lastRefresh = 0;

  async refreshCache(): Promise<void> {
    const flags = await db.selectFrom("feature_flags").selectAll().execute();

    this.cache.clear();
    for (const flag of flags) {
      this.cache.set(flag.name, flag);
    }
    this.lastRefresh = Date.now();
  }

  async isFlagEnabled(flagName: string, tenantId: string): Promise<boolean> {
    // Refresh cache if needed
    if (Date.now() - this.lastRefresh > this.cacheExpiry) {
      await this.refreshCache();
    }

    const flag = this.cache.get(flagName);
    if (!flag) return false;

    // Check tenant-specific override
    const tenantFlag = await db
      .selectFrom("tenant_feature_flags")
      .where("tenant_id", "=", tenantId)
      .where("flag_id", "=", flag.id)
      .executeTakeFirst();

    if (tenantFlag) {
      // Tenant override takes precedence
      if (tenantFlag.enabled !== null) {
        return tenantFlag.enabled;
      }
    }

    // Use global flag setting
    if (!flag.enabled) return false;

    // Rollout percentage check
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashTenantFlag(tenantId, flagName);
      return hash < flag.rolloutPercentage;
    }

    return true;
  }

  private hashTenantFlag(tenantId: string, flagName: string): number {
    // Consistent hashing for rollout
    const combined = `${tenantId}:${flagName}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  async getFlagVariant(flagName: string, tenantId: string): Promise<string | null> {
    const tenantFlag = await db
      .selectFrom("tenant_feature_flags")
      .innerJoin("feature_flags", "feature_flags.id", "tenant_feature_flags.flag_id")
      .where("feature_flags.name", "=", flagName)
      .where("tenant_feature_flags.tenant_id", "=", tenantId)
      .select("tenant_feature_flags.variant")
      .executeTakeFirst();

    return tenantFlag?.variant ?? null;
  }
}

export const runtimeConfig = new RuntimeConfigService();
```

**Usage:**

```typescript
import { runtimeConfig } from "@agenticverdict/config/runtime-config";

// Check feature flag
const enableVerdict = await runtimeConfig.isFlagEnabled("enable_verdict", tenantId);

// Get variant for A/B testing
const uiVariant = await runtimeConfig.getFlagVariant("ui_variant", tenantId);

// Conditional feature
if (enableVerdict) {
  await generateVerdictReport(data);
}
```

**Pros:**

- ✅ Full data control
- ✅ Tenant-specific overrides
- ✅ No external dependencies
- ✅ Works with existing database
- ✅ Fast with caching
- ✅ Rollout percentages

**Cons:**

- ⚠️ Need to build tooling
- ⚠️ Need admin UI for management
- ⚠️ No built-in A/B testing analytics

---

## 4. Multi-Tenant Configuration Patterns

### 4.1 Per-Tenant Feature Flags

**Pattern:** Combine global flags with tenant-specific overrides.

**Implementation:**

```typescript
interface TenantFeatureContext {
  tenantId: string;
  plan: "basic" | "pro" | "enterprise";
  region: string;
  createdAt: Date;
}

async function evaluateFeatureFlag(
  flagName: string,
  context: TenantFeatureContext,
): Promise<{ enabled: boolean; variant?: string }> {
  // 1. Check tenant-specific override
  const tenantOverride = await db
    .selectFrom("tenant_feature_flags")
    .where("tenant_id", "=", context.tenantId)
    .where("flag_name", "=", flagName)
    .executeTakeFirst();

  if (tenantOverride) {
    return {
      enabled: tenantOverride.enabled,
      variant: tenantOverride.variant ?? undefined,
    };
  }

  // 2. Check plan-based rules
  const planRule = await getPlanRule(flagName, context.plan);
  if (planRule) {
    return { enabled: planRule.enabled };
  }

  // 3. Check global flag
  const globalFlag = await db
    .selectFrom("feature_flags")
    .where("name", "=", flagName)
    .executeTakeFirst();

  if (!globalFlag || !globalFlag.enabled) {
    return { enabled: false };
  }

  // 4. Check rollout percentage
  if (globalFlag.rolloutPercentage < 100) {
    const hash = hashTenantForRollout(context.tenantId, flagName);
    return { enabled: hash < globalFlag.rolloutPercentage };
  }

  return { enabled: true };
}
```

### 4.2 Configuration Hierarchy

**Precedence Order:**

1. **Tenant-specific override** (highest priority)
2. **Plan-based rules** (basic, pro, enterprise)
3. **Global feature flags**
4. **Default values** (lowest priority)

**Example Configuration:**

```typescript
// Global flag: enable_verdict_reports = true (50% rollout)
// Plan rule: Enterprise plans = 100% enabled
// Tenant override: Company A = disabled

// Results:
// Company A (enterprise): Disabled (tenant override)
// Company B (enterprise): Enabled (plan rule)
// Company C (basic): Enabled if in 50% rollout
// Company D (basic): Disabled if not in rollout
```

---

## 5. Docker-Native Solutions

### 5.1 Config File Mounting

**Approach:** Mount configuration files as Docker volumes.

**Docker Compose:**

```yaml
services:
  api:
    image: agenticverdict/api:latest
    volumes:
      - ./config/production.json:/app/config/production.json:ro
      - ./config/tenants:/app/config/tenants:ro
    environment:
      - NODE_ENV=production
      - CONFIG_DIR=/app/config
```

**Hot-Reload Implementation:**

```typescript
import chokidar from "chokidar";
import config from "config";

// Watch config files for changes
const watcher = chokidar.watch("/app/config/**/*.json", {
  persistent: true,
  ignoreInitial: true,
});

watcher.on("change", (path) => {
  console.log(`Config file changed: ${path}`);

  // Reload config
  config.util.setModuleDefaults("tenants", loadTenantConfigs());

  // Notify application
  emitConfigChangeEvent();
});
```

**Pros:**

- ✅ No container rebuilds needed
- ✅ Simple to implement
- ✅ Works with existing tools

**Cons:**

- ⚠️ Need to remount volumes on changes
- ⚠️ File synchronization in Kubernetes
- ⚠️ Not suitable for dynamic config changes

### 5.2 Environment Variable Injection

**Approach:** Use environment variables for configuration.

**Kubernetes ConfigMap:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agenticverdict-config
data:
  ENABLE_VERDICT_REPORTS: "true"
  VERDICT_ROLLOUT_PERCENTAGE: "50"
  ENABLE_INSIGHTS: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: agenticverdict-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  REDIS_URL: "redis://..."
```

**Deployment:**

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: api
          envFrom:
            - configMapRef:
                name: agenticverdict-config
            - secretRef:
                name: agenticverdict-secrets
```

**Pros:**

- ✅ Kubernetes-native
- ✅ Simple integration
- ✅ Works with existing infrastructure

**Cons:**

- ⚠️ Requires pod restart for changes
- ⚠️ Limited to simple values
- ⚠️ No complex feature flagging

### 5.3 Consul for Configuration

**Approach:** Use Consul for dynamic configuration.

**Implementation:**

```typescript
import Consul from "consul";

const consul = new Consul({
  host: "consul.service.consul",
  port: 8500,
});

// Watch for configuration changes
consul
  .watch({
    method: consul.kv.get,
    options: { key: "config/agenticverdict/enable_verdict" },
  })
  .on("change", (data) => {
    const enabled = data.Value === "true";
    console.log(`Config changed: enable_verdict = ${enabled}`);

    // Update application state
    updateFeatureFlag("enable_verdict", enabled);
  });
```

**Pros:**

- ✅ Real-time configuration updates
- ✅ Service discovery built-in
- ✅ Distributed configuration

**Cons:**

- ⚠️ Additional infrastructure
- ⚠️ Operational complexity
- ⚠️ Learning curve

---

## 6. Implementation Recommendations

### 6.1 Recommended Hybrid Approach

**Architecture:** Combine compiler-driven constants with runtime feature flags.

```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Build-Time      │         │  Runtime         │         │
│  │  Constants       │         │  Feature Flags   │         │
│  │                  │         │                  │         │
│  │  • Mock adapters │         │  • Per-tenant    │         │
│  │  • Debug modes   │         │  • A/B testing   │         │
│  │  • Environment   │         │  • Gradual       │         │
│  │    detection     │         │    rollouts      │         │
│  └──────────────────┘         └──────────────────┘         │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Configuration Evaluation Layer               │   │
│  │                                                       │   │
│  │  1. Check build-time constants (fast path)          │   │
│  │  2. Check runtime feature flags                     │   │
│  │  3. Merge results                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Recommended Solution

**For AgenticVerdict, we recommend:**

**Primary:** LaunchDarkly (if budget allows) OR Unleash (self-hosted)

**Secondary:** Custom PostgreSQL solution for tenant-specific configuration

**Rationale:**

1. **LaunchDarkly/Unleash** for feature flagging:
   - Per-tenant feature flags
   - A/B testing capabilities
   - Gradual rollouts
   - Real-time updates without rebuilds

2. **Custom PostgreSQL** for configuration:
   - Leverage existing database
   - Full data control
   - Tenant-specific settings
   - Works alongside CompanyConfig

3. **Keep compiler-driven constants** for:
   - Mock adapter selection
   - Debug modes
   - Environment detection
   - Infrastructure-level concerns

### 6.3 Implementation Architecture

```typescript
// packages/config/src/configuration.ts
import { BUILD_CONFIG } from "./build-constants";
import { runtimeConfig } from "./runtime-config";
import { LaunchDarkly } from "./launchdarkly"; // or Unleash

export class ConfigurationService {
  private ld: LaunchDarkly;
  private db: RuntimeConfigService;

  constructor() {
    this.ld = new LaunchDarkly({ sdkKey: process.env.LD_SDK_KEY });
    this.db = runtimeConfig;
  }

  async isFeatureEnabled(
    feature: string,
    tenantId: string,
    context: TenantContext,
  ): Promise<boolean> {
    // 1. Check build-time constants (infrastructure features)
    if (feature === "mock_adapters") {
      return BUILD_CONFIG.MOCK_ADAPTERS_ENABLED;
    }
    if (feature === "debug_mode") {
      return !BUILD_CONFIG.IS_PRODUCTION;
    }

    // 2. Check LaunchDarkly/Unleash (feature flags)
    const ldEnabled = await this.ld.isEnabled(feature, {
      key: `tenant-${tenantId}`,
      custom: context,
    });

    // 3. Check database (tenant-specific overrides)
    const dbEnabled = await this.db.isFlagEnabled(feature, tenantId);

    // 4. Merge: Database override > LaunchDarkly > defaults
    return dbEnabled ?? ldEnabled;
  }

  async getFeatureVariant(
    feature: string,
    tenantId: string,
    context: TenantContext,
  ): Promise<string | null> {
    // Check LaunchDarkly/Unleash for variants
    return await this.ld.getVariant(feature, {
      key: `tenant-${tenantId}`,
      custom: context,
    });
  }
}
```

### 6.4 Migration Strategy

**Phase 1: Foundation (Week 1-2)**

1. Set up LaunchDarkly/Unleash
2. Create configuration service
3. Implement basic feature flags
4. Add TypeScript types

**Phase 2: Integration (Week 3-4)**

1. Integrate with existing CompanyConfig
2. Add tenant-specific flags
3. Update adapter factory
4. Add A/B testing support

**Phase 3: Rollout (Week 5-6)**

1. Migrate existing features
2. Add gradual rollouts
3. Monitor performance
4. Train team

**Phase 4: Optimization (Week 7-8)**

1. Optimize caching
2. Add analytics
3. Build admin UI
4. Documentation

---

## 7. Comparison Summary

### 7.1 Solution Ranking

| Rank | Solution              | Use Case                     | Score      |
| ---- | --------------------- | ---------------------------- | ---------- |
| 1    | **LaunchDarkly**      | Enterprise feature flagging  | ⭐⭐⭐⭐⭐ |
| 2    | **Unleash**           | Self-hosted feature flagging | ⭐⭐⭐⭐⭐ |
| 3    | **Custom PostgreSQL** | Tenant-specific config       | ⭐⭐⭐⭐   |
| 4    | **Flagsmith**         | Budget-friendly managed      | ⭐⭐⭐⭐   |
| 5    | **node-config**       | File-based config            | ⭐⭐⭐     |

### 7.2 Decision Matrix

| Requirement           | LaunchDarkly | Unleash      | Custom PostgreSQL |
| --------------------- | ------------ | ------------ | ----------------- |
| Multi-tenant support  | ✅ Excellent | ✅ Excellent | ✅ Excellent      |
| Real-time updates     | ✅ <200ms    | ✅ <1s       | ⚠️ Needs polling  |
| A/B testing           | ✅ Built-in  | ✅ Built-in  | ⚠️ Custom needed  |
| No container rebuilds | ✅ Yes       | ✅ Yes       | ✅ Yes            |
| Self-hosted           | ❌ No        | ✅ Yes       | ✅ Yes            |
| Data control          | ⚠️ Managed   | ✅ Full      | ✅ Full           |
| Cost                  | 💰💰💰 High  | 💰 Free      | 💰 Free           |
| Setup effort          | ⚠️ Medium    | ⚠️ Medium    | ⚠️ High           |

---

## 8. Final Recommendation

### For AgenticVerdict

**Recommended Stack:**

1. **LaunchDarkly** (if budget permits) OR **Unleash** (self-hosted)
   - For feature flagging, A/B testing, gradual rollouts
   - Per-tenant feature flags
   - Real-time updates without rebuilds

2. **Custom PostgreSQL solution**
   - For tenant-specific configuration
   - Extend existing CompanyConfig schema
   - Full data control

3. **Keep compiler-driven constants**
   - For infrastructure concerns (mock adapters, debug modes)
   - No changes needed to existing implementation

**Benefits:**

- ✅ No container rebuilds for feature changes
- ✅ Per-tenant feature flags
- ✅ A/B testing capabilities
- ✅ Gradual rollouts
- ✅ Real-time configuration updates
- ✅ Maintains existing build-time optimizations
- ✅ Scales to thousands of tenants

**Implementation Effort:** 6-8 weeks (1 engineer)

**Cost:**

- LaunchDarkly: ~$200/month (Enterprise plan)
- Unleash: Free (self-hosted) + infrastructure costs
- Custom PostgreSQL: Free (uses existing database)

---

**Document Status:** ✅ Research Complete  
**Next Steps:** Choose between LaunchDarkly (managed) or Unleash (self-hosted) and begin implementation
