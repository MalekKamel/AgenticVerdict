# Compiler-Driven Adapter Configuration: Implementation Plan

**Document Version:** 1.0
**Date:** 2026-04-08
**Author:** AgenticVerdict Technical Team
**Status:** Ready for Implementation
**Related Documents:** [Research Report](./compiler-driven-adapter-config-research.md)

---

## Overview

This implementation plan outlines the adoption of compiler-driven configuration for adapter selection in the AgenticVerdict platform. The goal is to move from runtime environment variable dependency to build-time constant injection, improving security, performance, and type safety.

**Key Outcomes:**

- ✅ Compile-time enforcement of adapter selection
- ✅ Elimination of mock adapter code from production bundles
- ✅ Improved type safety and developer experience
- ✅ Smaller production bundle sizes
- ✅ Better security through code elimination

---

## Table of Contents

1. [Phase 1: Foundation](#phase-1-foundation-week-1)
2. [Phase 2: Core Implementation](#phase-2-core-implementation-week-2)
3. [Phase 3: Integration & Testing](#phase-3-integration--testing-week-3)
4. [Phase 4: Migration & Documentation](#phase-4-migration--documentation-week-4)
5. [Success Criteria](#success-criteria)
6. [Risk Assessment](#risk-assessment)
7. [Rollback Strategy](#rollback-strategy)

---

## Phase 1: Foundation (Week 1)

### Objectives

- Set up build tooling for compile-time constants
- Create build configuration modules
- Establish testing infrastructure

### Tasks

#### 1.1 Add esbuild to API and Worker Packages

**Files:**

- `apps/api/package.json`
- `apps/worker/package.json`
- `apps/api/esbuild.config.js`
- `apps/worker/esbuild.config.js`

**Implementation:**

```bash
# Install dependencies
pnpm add -D -w esbuild @esbuild/typescript-plugin
```

```javascript
// apps/api/esbuild.config.js
import { build } from "esbuild";
import { esbuildPlugin } from "@esbuild/typescript-plugin";

export const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outdir: "dist",
  sourcemap: true,
  tsconfig: "tsconfig.json",
  plugins: [esbuildPlugin()],
  // Build-time constant injection
  define: {
    "process.env.NODE_ENV": '"production"',
    "import.meta.env.PROD": "true",
  },
};

if (process.env.NODE_ENV !== "production") {
  buildOptions.define = {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env.PROD": "false",
  };
}

export default buildOptions;
```

**Acceptance Criteria:**

- [ ] esbuild builds API without errors
- [ ] esbuild builds Worker without errors
- [ ] Build times are comparable to current setup
- [ ] Generated bundles work correctly

#### 1.2 Create Build Constants Module

**File:** `packages/config/src/build-constants.ts`

**Implementation:**

```typescript
/**
 * Build-time configuration constants.
 *
 * These values are determined at compile time and cannot be changed at runtime.
 * The compiler eliminates unreachable code branches based on these values.
 */

/** Current build environment */
export const NODE_ENV = process.env.NODE_ENV as "development" | "production" | "test";

/** Whether this is a production build */
export const IS_PRODUCTION = NODE_ENV === "production";

/** Whether mock adapters are enabled for this build */
export const MOCK_ADAPTERS_ENABLED = NODE_ENV !== "production";

/** Build timestamp */
export const BUILD_TIMESTAMP = Date.now();

/** API version */
export const API_VERSION = "v1" as const;

/**
 * Complete build configuration object
 */
export const BUILD_CONFIG = {
  environment: NODE_ENV,
  isProduction: IS_PRODUCTION,
  mockAdaptersEnabled: MOCK_ADAPTERS_ENABLED,
  timestamp: BUILD_TIMESTAMP,
  version: API_VERSION,
} as const;

/** Type for build configuration */
export type BuildConfig = typeof BUILD_CONFIG;

/**
 * Type guard for production builds
 */
export function isProductionBuild(): boolean {
  return IS_PRODUCTION;
}

/**
 * Type guard for development builds
 */
export function isDevelopmentBuild(): boolean {
  return NODE_ENV === "development";
}

/**
 * Type guard for test environment
 */
export function isTestBuild(): boolean {
  return NODE_ENV === "test";
}
```

**Update package exports:**

```typescript
// packages/config/src/index.ts
export * from "./build-constants";
```

**Acceptance Criteria:**

- [ ] Build constants module compiles without errors
- [ ] TypeScript correctly infers literal types
- [ ] All packages can import the module
- [ ] Unit tests pass for type guards

#### 1.3 Update TypeScript Configuration

**Files:**

- `tsconfig.json` (root)
- `apps/api/tsconfig.json`
- `apps/worker/tsconfig.json`
- `apps/web/tsconfig.json`

**Implementation:**

```json
// tsconfig.json (root)
{
  "extends": "./tsconfig.base.json",
  "files": [],
  "references": [
    { "path": "./packages/config" },
    { "path": "./packages/platform-adapters" },
    { "path": "./packages/agent-runtime" },
    { "path": "./packages/report-generator" },
    { "path": "./packages/database" },
    { "path": "./packages/types" },
    { "path": "./apps/api" },
    { "path": "./apps/worker" },
    { "path": "./apps/web" }
  ]
}
```

```json
// packages/config/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```

**Acceptance Criteria:**

- [ ] All TypeScript projects compile with project references
- [ ] IDE correctly resolves imports across packages
- [ ] Incremental compilation works
- [ ] Type checking catches cross-package errors

#### 1.4 Create Testing Infrastructure

**Files:**

- `tests/build-constants.test.ts`
- `tools/build/test-build-constants.ts`

**Implementation:**

```typescript
// tests/build-constants.test.ts
import { describe, expect, it } from "vitest";
import {
  BUILD_CONFIG,
  isProductionBuild,
  isDevelopmentBuild,
  isTestBuild,
  MOCK_ADAPTERS_ENABLED,
  IS_PRODUCTION,
} from "@agenticverdict/config/build-constants";

describe("BUILD_CONFIG", () => {
  it("should have correct type for environment", () => {
    expect(typeof BUILD_CONFIG.environment).toBe("string");
    expect(["development", "production", "test"]).toContain(BUILD_CONFIG.environment);
  });

  it("should have correct boolean flags", () => {
    expect(typeof BUILD_CONFIG.isProduction).toBe("boolean");
    expect(typeof BUILD_CONFIG.mockAdaptersEnabled).toBe("boolean");
  });

  it("should have immutable configuration", () => {
    // @ts-expect-error - Testing immutability
    expect(() => {
      BUILD_CONFIG.environment = "test";
    }).toThrow();
  });
});

describe("Type Guards", () => {
  it("isProductionBuild returns boolean", () => {
    expect(typeof isProductionBuild()).toBe("boolean");
  });

  it("isDevelopmentBuild returns boolean", () => {
    expect(typeof isDevelopmentBuild()).toBe("boolean");
  });

  it("isTestBuild returns boolean", () => {
    expect(typeof isTestBuild()).toBe("boolean");
  });
});

describe("Build-time Behavior", () => {
  it("mock adapters disabled in production", () => {
    if (process.env.NODE_ENV === "production") {
      expect(MOCK_ADAPTERS_ENABLED).toBe(false);
      expect(IS_PRODUCTION).toBe(true);
    }
  });

  it("mock adapters enabled in development", () => {
    if (process.env.NODE_ENV === "development") {
      expect(MOCK_ADAPTERS_ENABLED).toBe(true);
      expect(IS_PRODUCTION).toBe(false);
    }
  });
});
```

**Acceptance Criteria:**

- [ ] Tests for build constants pass in all environments
- [ ] Type guards work correctly
- [ ] Immutability is enforced
- [ ] Tests catch build-time configuration errors

### Phase 1 Deliverables

- [ ] esbuild configured for API and Worker
- [ ] Build constants module created
- [ ] TypeScript project references set up
- [ ] Testing infrastructure in place

---

## Phase 2: Core Implementation (Week 2)

### Objectives

- Implement compiler-driven adapter selection
- Update all adapter usage points
- Ensure backward compatibility

### Tasks

#### 2.1 Update Adapter Factory

**File:** `packages/platform-adapters/src/adapter-factory.ts`

**Implementation:**

```typescript
import { BUILD_CONFIG, isProductionBuild } from "@agenticverdict/config/build-constants";
import { platformAdapterTypes, type PlatformType } from "./index";

/**
 * Create a platform adapter with compile-time optimization.
 *
 * In development builds, mock adapters are used by default.
 * In production builds, mock adapter code is completely eliminated.
 *
 * @param config - Adapter factory configuration
 * @returns Platform adapter instance
 */
export function createPlatformAdapter(config: AdapterFactoryConfig): PlatformAdapter {
  // Compiler eliminates this entire branch in production builds
  if (!BUILD_CONFIG.isProduction && config.useMock !== false) {
    // Development-only code - never included in production
    if (isMockEnabledForPlatform(config.platform)) {
      return MockAdapterFactory.create({
        platform: config.platform,
        tenantId: config.tenantId,
        mockOptions: {
          seed: config.mockSeed,
          scenario: config.mockScenario ?? "normal",
        },
        ...baseOptions(config),
      });
    }
  }

  // Production adapter selection
  switch (config.platform) {
    case "meta":
      return new MetaPlatformAdapter({
        platform: config.platform,
        tenantId: config.tenantId,
        ...baseOptions(config),
      });
    case "ga4":
      return new Ga4PlatformAdapter({
        platform: config.platform,
        tenantId: config.tenantId,
        ...baseOptions(config),
      });
    case "gsc":
      return new GscPlatformAdapter({
        platform: config.platform,
        tenantId: config.tenantId,
        ...baseOptions(config),
      });
    case "gbp":
      return new GbpPlatformAdapter({
        platform: config.platform,
        tenantId: config.tenantId,
        ...baseOptions(config),
      });
    case "tiktok":
      return new TikTokPlatformAdapter({
        platform: config.platform,
        tenantId: config.tenantId,
        ...baseOptions(config),
      });
    default:
      const _exhaustive: never = config.platform;
      throw new Error(`Unsupported platform: ${_exhaustive}`);
  }
}

/**
 * Runtime security guard (defense in depth).
 *
 * NOTE: With compiler-driven configuration, this is a secondary check.
 * The primary enforcement happens at compile time through code elimination.
 */
export function isMockEnabledForPlatform(
  platform: PlatformType,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  // In production builds, this should always be unreachable
  if (BUILD_CONFIG.isProduction) {
    throw new Error(
      `[SECURITY] Mock adapters cannot be enabled in production builds. ` +
        `This code should have been eliminated by the compiler.`,
    );
  }

  const nodeEnv = String(env.NODE_ENV ?? "");
  const masterRaw = env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
  const platformKey = `AGENTICVERDICT_MOCK_${platform.toUpperCase()}`;
  const platformRaw = env[platformKey];

  const master = parseBinaryFlag(masterRaw, "AGENTICVERDICT_USE_MOCK_ADAPTERS");
  const platformOverride = parseBinaryFlag(platformRaw, platformKey);

  if (nodeEnv === "production" || nodeEnv === "staging") {
    if (master === true || platformOverride === true) {
      throw new Error(
        `[SECURITY] Mock adapters cannot be enabled in ${nodeEnv} environment for platform "${platform}"`,
      );
    }
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(env, platformKey)) {
    return platformOverride ?? false;
  }
  return master ?? false;
}
```

**Acceptance Criteria:**

- [ ] Adapter factory uses build constants
- [ ] Production builds eliminate mock adapter code
- [ ] Runtime security guard still works
- [ ] All existing tests pass

#### 2.2 Update Company Config Schema

**File:** `packages/config/src/schemas/company.ts`

**Implementation:**

```typescript
import { z } from "zod";
import { BUILD_CONFIG } from "../build-constants";

/**
 * Base company configuration schema
 */
const baseCompanyConfigSchema = z.object({
  companyId: z.string().uuid(),
  localization: z.object({
    language: z.enum(["en", "ar", "fr"]),
    region: z.string(),
    timezone: z.string(),
    currency: z.string(),
  }),
  marketing: z.object({
    channels: z.array(
      z.object({
        platform: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]),
        enabled: z.boolean().default(true),
      }),
    ),
  }),
  ai: z.object({
    primaryModel: z.string().default("glm-4.5"),
    provider: z.enum(["anthropic", "openai", "glm"]).default("glm"),
  }),
  features: z.object({
    enableInsights: z.boolean().default(true),
    enableVerdict: z.boolean().default(true),
  }),
});

/**
 * Development-specific configuration fields
 */
const developmentCompanyConfigSchema = baseCompanyConfigSchema.extend({
  environment: z.literal("development"),
  mockAdapters: z.boolean().default(true),
  debugMode: z.boolean().default(true),
});

/**
 * Production-specific configuration fields
 */
const productionCompanyConfigSchema = baseCompanyConfigSchema.extend({
  environment: z.literal("production"),
  mockAdapters: z.literal(false),
  debugMode: z.literal(false),
});

/**
 * Company configuration schema with environment discrimination
 */
export const companyConfigSchema = z.discriminatedUnion("environment", [
  developmentCompanyConfigSchema,
  productionCompanyConfigSchema,
]);

export type CompanyConfig = z.infer<typeof companyConfigSchema>;

/**
 * Type guard for development company config
 */
export function isDevelopmentCompanyConfig(
  config: CompanyConfig,
): config is z.infer<typeof developmentCompanyConfigSchema> {
  return config.environment === "development";
}

/**
 * Type guard for production company config
 */
export function isProductionCompanyConfig(
  config: CompanyConfig,
): config is z.infer<typeof productionCompanyConfigSchema> {
  return config.environment === "production";
}
```

**Acceptance Criteria:**

- [ ] Company config schema uses build constants
- [ ] Type guards correctly narrow types
- [ ] Validation works for all environments
- [ ] Existing configs remain valid

#### 2.3 Update Workflow Trigger Handler

**File:** `apps/api/src/routes/v1/workflows.ts`

**Implementation:**

```typescript
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

export async function POST(request: FastifyRequest, reply: FastifyReply) {
  const payload = workflowTriggerSchema.parse(request.body);

  // Validate testMode for non-production builds
  if (payload.testMode && BUILD_CONFIG.isProduction) {
    return reply.status(400).send({
      error: {
        code: "validation_error",
        message: "testMode is only available in development builds",
      },
    });
  }

  // Validate production-flow scenarios
  if (payload.config?.productionFlowScenarioId) {
    if (!PRODUCTION_FLOW_SCENARIOS.includes(payload.config.productionFlowScenarioId)) {
      return reply.status(400).send({
        error: {
          code: "validation_error",
          message: `Invalid production flow scenario: ${payload.config.productionFlowScenarioId}`,
          details: {
            validScenarios: PRODUCTION_FLOW_SCENARIOS,
          },
        },
      });
    }
  }

  // Enqueue workflow
  const jobId = `workflow-${payload.workflowId}-${nanoid()}`;
  await workflowQueue.add(jobId, payload, { jobId });

  return reply.status(202).send({
    executionId: jobId,
    status: "queued",
    startedAt: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
  });
}
```

**Acceptance Criteria:**

- [ ] Workflow handler uses build constants
- [ ] Test mode validation works correctly
- [ ] Production builds reject test workflows
- [ ] All existing tests pass

#### 2.4 Update Worker Configuration

**File:** `apps/worker/src/index.ts`

**Implementation:**

```typescript
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

async function main() {
  logger.info({
    msg: "Starting worker service",
    buildConfig: BUILD_CONFIG,
  });

  // Verify configuration
  if (BUILD_CONFIG.isProduction) {
    logger.info("Running in production mode");

    // Verify no mock adapters are enabled
    if (process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS === "1") {
      throw new Error("Mock adapters cannot be enabled in production builds");
    }
  } else {
    logger.info("Running in development mode", {
      mockAdapters: BUILD_CONFIG.mockAdaptersEnabled,
    });
  }

  // Initialize queues
  const reportQueue = await createReportQueue();
  const workflowQueue = await createWorkflowQueue();

  // Start workers
  const workers = await createWorkers({
    reportQueue,
    workflowQueue,
    buildConfig: BUILD_CONFIG,
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down workers...");
    await Promise.all(workers.map((w) => w.close()));
    await reportQueue.close();
    await workflowQueue.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  logger.info("Worker service ready");
}
```

**Acceptance Criteria:**

- [ ] Worker uses build constants
- [ ] Production mode validates configuration
- [ ] Development mode enables mock adapters
- [ ] Graceful shutdown works correctly

### Phase 2 Deliverables

- [ ] Adapter factory updated with build constants
- [ ] Company config schema enhanced
- [ ] Workflow handler updated
- [ ] Worker configuration updated
- [ ] All tests pass

---

## Phase 3: Integration & Testing (Week 3)

### Objectives

- Ensure all integration points work correctly
- Add comprehensive test coverage
- Measure performance improvements

### Tasks

#### 3.1 Integration Testing

**Test Files:**

- `packages/platform-adapters/src/adapter-factory.integration.test.ts`
- `apps/api/src/routes/v1/workflows.integration.test.ts`
- `apps/worker/src/queues/workflow-trigger-production-flow.integration.test.ts`

**Implementation:**

```typescript
// packages/platform-adapters/src/adapter-factory.integration.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import { createPlatformAdapter } from "./adapter-factory";
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

describe("createPlatformAdapter (Integration)", () => {
  const tenantId = "test-tenant";
  const platform = "meta";

  describe("Production build behavior", () => {
    beforeEach(() => {
      // Skip if not production build
      if (!BUILD_CONFIG.isProduction) {
        return "skip";
      }
    });

    it("should create production adapter", () => {
      const adapter = createPlatformAdapter({
        platform,
        tenantId,
      });

      expect(adapter.constructor.name).toBe("MetaPlatformAdapter");
      expect(adapter).not.toBeInstanceOf(MockPlatformAdapter);
    });

    it("should ignore useMock option in production", () => {
      const adapter = createPlatformAdapter({
        platform,
        tenantId,
        useMock: true, // Should be ignored
      });

      expect(adapter.constructor.name).toBe("MetaPlatformAdapter");
    });
  });

  describe("Development build behavior", () => {
    beforeEach(() => {
      // Skip if production build
      if (BUILD_CONFIG.isProduction) {
        return "skip";
      }
    });

    it("should create mock adapter by default", () => {
      const adapter = createPlatformAdapter({
        platform,
        tenantId,
      });

      expect(adapter).toBeInstanceOf(MockPlatformAdapter);
    });

    it("should create production adapter when useMock is false", () => {
      const adapter = createPlatformAdapter({
        platform,
        tenantId,
        useMock: false,
      });

      expect(adapter.constructor.name).toBe("MetaPlatformAdapter");
    });
  });
});
```

**Acceptance Criteria:**

- [ ] Integration tests pass in all environments
- [ ] Mock adapters work in development
- [ ] Production adapters work in production
- [ ] Code elimination verified

#### 3.2 Bundle Size Analysis

**Tool:** `tools/build/analyze-bundles.ts`

**Implementation:**

```typescript
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

interface BundleStats {
  file: string;
  size: number;
  mockCode: number;
  productionCode: number;
}

function analyzeBundle(dir: string): BundleStats[] {
  const files = readdirSync(dir, { withFileTypes: true });
  const results: BundleStats[] = [];

  for (const file of files) {
    if (file.isDirectory()) {
      results.push(...analyzeBundle(join(dir, file.name)));
    } else if (file.name.match(/\.js$/)) {
      const filePath = join(dir, file.name);
      const content = readFileSync(filePath, "utf-8");
      const stats = statSync(filePath);

      // Check for mock adapter code
      const hasMockCode = content.includes("MockPlatformAdapter");
      const hasProductionCode = content.includes("MetaPlatformAdapter");

      results.push({
        file: filePath,
        size: stats.size,
        mockCode: hasMockCode ? (content.match(/MockAdapter/g) || []).length : 0,
        productionCode: hasProductionCode ? (content.match(/PlatformAdapter/g) || []).length : 0,
      });
    }
  }

  return results;
}

// Analyze production bundles
const prodBundles = analyzeBundle("dist");

// Verify no mock code in production
const mockCodeInProd = prodBundles.filter((b) => b.mockCode > 0);
if (mockCodeInProd.length > 0) {
  console.error("Mock code found in production bundles:", mockCodeInProd);
  process.exit(1);
}

console.table(prodBundles);
```

**Acceptance Criteria:**

- [ ] Bundle analysis tool created
- [ ] Production bundles verified mock-free
- [ ] Bundle size reduction measured
- [ ] Report generated

#### 3.3 Performance Benchmarks

**Tool:** `tools/build/benchmark-builds.ts`

**Implementation:**

```typescript
import { execSync } from "child_process";
import { performance } from "perf_hooks";

interface BenchmarkResult {
  name: string;
  duration: number;
  bundleSize: number;
}

function benchmark(name: string, command: string): BenchmarkResult {
  const start = performance.now();
  execSync(command, { stdio: "ignore" });
  const duration = performance.now() - start;

  const bundleSize = getDirectorySize("dist");

  return { name, duration, bundleSize };
}

const results = [
  benchmark("Clean build", "pnpm build --force"),
  benchmark("Incremental build", "pnpm build"),
];

console.table(results);
```

**Acceptance Criteria:**

- [ ] Benchmark tool created
- [ ] Build times measured
- [ ] Bundle sizes measured
- [ ] Report generated

#### 3.4 CI/CD Pipeline Updates

**Files:**

- `.github/workflows/ci.yml`
- `.github/workflows/docker-build.yml`

**Implementation:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ["main", "develop"]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Type check
        run: pnpm run typecheck

      - name: Verify build constants
        run: pnpm run verify:build-config

  build-prod:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    env:
      NODE_ENV: production
    steps:
      - uses: actions/checkout@v4

      - name: Build production
        run: pnpm build

      - name: Verify no mock code in production
        run: pnpm run verify:production-bundle

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: production-bundles
          path: dist/
```

**Acceptance Criteria:**

- [ ] CI pipeline updated
- [ ] Production builds verified
- [ ] Bundle analysis automated
- [ ] All checks pass

### Phase 3 Deliverables

- [ ] Integration tests passing
- [ ] Bundle size analysis complete
- [ ] Performance benchmarks measured
- [ ] CI/CD pipeline updated

---

## Phase 4: Migration & Documentation (Week 4)

### Objectives

- Migrate all adapter usage
- Update documentation
- Provide migration guide

### Tasks

#### 4.1 Migration Guide

**File:** `docs/06-reference/migration-guide-compiler-driven-config.md`

**Content:**

````markdown
# Migration Guide: Compiler-Driven Adapter Configuration

## Overview

This guide helps you migrate from runtime environment-based adapter selection to compiler-driven configuration.

## What's Changing?

### Before

```typescript
// Adapter selection at runtime
const adapter = createPlatformAdapter({
  platform: "meta",
  useMock: process.env.NODE_ENV === "development",
});
```
````

### After

```typescript
// Adapter selection at compile time
const adapter = createPlatformAdapter({
  platform: "meta",
  // Compiler automatically selects correct adapter
});
```

## Migration Steps

### 1. Update Imports

**Before:**

```typescript
import { createPlatformAdapter } from "@agenticverdict/platform-adapters";
```

**After:**

```typescript
import { createPlatformAdapter } from "@agenticverdict/platform-adapters";
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";
```

### 2. Remove Runtime Checks

**Before:**

```typescript
if (process.env.NODE_ENV === "development") {
  // Development code
} else {
  // Production code
}
```

**After:**

```typescript
if (!BUILD_CONFIG.isProduction) {
  // Development code (eliminated in production builds)
} else {
  // Production code
}
```

### 3. Update Tests

**Before:**

```typescript
beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";
});
```

**After:**

```typescript
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

beforeEach(() => {
  // Build constants automatically set in test builds
  expect(BUILD_CONFIG.mockAdaptersEnabled).toBe(true);
});
```

## Breaking Changes

None for most use cases. The adapter factory maintains backward compatibility.

## Rollback

If you encounter issues, you can revert to runtime configuration by setting:

```typescript
const adapter = createPlatformAdapter({
  platform: "meta",
  useMock: false, // Explicitly request production adapter
});
```

````

**Acceptance Criteria:**
- [ ] Migration guide written
- [ ] Code examples provided
- [ ] Breaking changes documented
- [ ] Rollback procedures documented

#### 4.2 Update Manual Testing Guide

**File:** `docs/06-reference/manual-testing-guide.md`

**Updates:**

Add section on compiler-driven configuration and verification procedures.

**Acceptance Criteria:**
- [ ] Manual testing guide updated
- [ ] Build-time configuration documented
- [ ] Verification procedures added
- [ ] All examples updated

#### 4.3 Update API Documentation

**Files:**
- `docs/02-planning-and-methodology/architecture.md`
- `docs/04-technology-research/README.md`

**Updates:**

```markdown
## Compiler-Driven Configuration

The platform uses compiler-driven configuration to ensure type safety and eliminate runtime configuration errors.
````

**Acceptance Criteria:**

- [ ] Architecture documentation updated
- [ ] Technology research README updated
- [ ] API reference updated
- [ ] Code comments updated

#### 4.4 Create Examples Repository

**Repository:** `examples/compiler-driven-config`

**Examples:**

1. Simple adapter factory
2. Build-time feature flags
3. Environment-specific code
4. Bundle optimization

**Acceptance Criteria:**

- [ ] Examples repository created
- [ ] Working examples for each pattern
- [ ] Documentation included
- [ ] Tests passing

### Phase 4 Deliverables

- [ ] Migration guide completed
- [ ] Documentation updated
- [ ] Examples repository created
- [ ] Team training completed

---

## Success Criteria

### Functional Requirements

- [ ] All existing tests pass with new configuration
- [ ] Production builds contain no mock adapter code
- [ ] Development builds enable mock adapters by default
- [ ] Build times are within 10% of current baseline
- [ ] Bundle size reduction of at least 5% for production

### Performance Requirements

| Metric                        | Target | Maximum |
| ----------------------------- | ------ | ------- |
| Production build (cold)       | <30s   | 60s     |
| Production build (warm cache) | <10s   | 20s     |
| Development build             | <20s   | 40s     |
| Bundle size reduction         | >5%    | -       |

### Quality Requirements

- [ ] Test coverage maintained at 70%+
- [ ] No regressions in type safety
- [ ] Security guard still functional (defense in depth)
- [ ] Documentation complete and accurate

### Developer Experience

- [ ] Clear error messages for misconfiguration
- [ ] IDE autocomplete works correctly
- [ ] Local development experience unchanged
- [ ] Migration path clear and well-documented

---

## Risk Assessment

### High Risks

| Risk                       | Probability | Impact | Mitigation                              |
| -------------------------- | ----------- | ------ | --------------------------------------- |
| Build configuration errors | Medium      | High   | Comprehensive testing, rollback plan    |
| Bundle size increase       | Low         | High   | Monitor and analyze, optimize as needed |
| Breaking changes for users | Low         | High   | Migration guide, backward compatibility |

### Medium Risks

| Risk                            | Probability | Impact | Mitigation                             |
| ------------------------------- | ----------- | ------ | -------------------------------------- |
| CI/CD pipeline failures         | Low         | Medium | Staged rollout, monitoring             |
| Development workflow disruption | Low         | Medium | Documentation, training                |
| Third-party library issues      | Low         | Medium | Evaluate alternatives, test thoroughly |

### Low Risks

| Risk                   | Probability | Impact | Mitigation                 |
| ---------------------- | ----------- | ------ | -------------------------- |
| Performance regression | Low         | Medium | Benchmarking, profiling    |
| Type definition errors | Low         | Low    | Strict TypeScript, testing |

---

## Rollback Strategy

### Immediate Rollback (< 1 hour)

1. Revert adapter factory changes
2. Remove build constants usage
3. Redeploy previous version

### Short-Term Rollback (< 1 day)

1. Disable compiler-driven configuration
2. Use runtime environment variables
3. Fix issues and retry

### Long-Term Rollback (< 1 week)

1. Revert to previous approach
2. Document lessons learned
3. Plan alternative implementation

### Rollback Triggers

- Production incidents or errors
- Bundle size increase > 10%
- Build time increase > 50%
- Developer workflow disruption
- Security vulnerabilities

---

## Appendix

### A. Files Modified

```
packages/config/
  src/build-constants.ts              [NEW]
  src/schemas/company.ts              [MODIFIED]
  src/index.ts                        [MODIFIED]

packages/platform-adapters/
  src/adapter-factory.ts               [MODIFIED]
  src/index.ts                         [MODIFIED]

apps/api/
  esbuild.config.js                    [NEW]
  package.json                         [MODIFIED]
  src/routes/v1/workflows.ts           [MODIFIED]

apps/worker/
  esbuild.config.js                    [NEW]
  package.json                         [MODIFIED]
  src/index.ts                         [MODIFIED]

docs/
  06-reference/
    migration-guide-compiler-driven-config.md  [NEW]
    manual-testing-guide.md            [MODIFIED]
```

### B. Testing Checklist

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Bundle analysis passes
- [ ] Performance benchmarks acceptable
- [ ] Security review passed
- [ ] Documentation review passed

### C. Timeline Summary

| Phase                              | Duration | Start Date | End Date   |
| ---------------------------------- | -------- | ---------- | ---------- |
| Phase 1: Foundation                | 1 week   | 2026-04-08 | 2026-04-15 |
| Phase 2: Core Implementation       | 1 week   | 2026-04-15 | 2026-04-22 |
| Phase 3: Integration & Testing     | 1 week   | 2026-04-22 | 2026-04-29 |
| Phase 4: Migration & Documentation | 1 week   | 2026-04-29 | 2026-05-06 |

---

**Document Status:** ✅ Ready for Implementation
**Estimated Effort:** 4 weeks (1 engineer)
**Risk Level:** Medium
**Priority:** High

**Next Steps:**

1. Review and approve implementation plan
2. Assign resources
3. Set up project tracking
4. Begin Phase 1
