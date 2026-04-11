# Compiler-Driven Adapter Configuration: Code Examples

**Document Version:** 1.0
**Date:** 2026-04-08
**Related:** [Research Report](./compiler-driven-adapter-config-research.md) | [Implementation Plan](./compiler-driven-adapter-config-implementation-plan.md)

---

## Overview

This document provides working code examples for compiler-driven configuration patterns in TypeScript, demonstrating industry-standard approaches for build-time adapter selection.

---

## Table of Contents

1. [Build-Time Constants](#1-build-time-constants)
2. [Type Guards and Discriminated Unions](#2-type-guards-and-discriminated-unions)
3. [Dead Code Elimination](#3-dead-code-elimination)
4. [esbuild Configuration](#4-esbuild-configuration)
5. [Testing Patterns](#5-testing-patterns)

---

## 1. Build-Time Constants

### 1.1 Basic Build Constants Module

```typescript
// packages/config/src/build-constants.ts
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

/** API version */
export const API_VERSION = "v1" as const;

/**
 * Complete build configuration object
 */
export const BUILD_CONFIG = {
  environment: NODE_ENV,
  isProduction: IS_PRODUCTION,
  mockAdaptersEnabled: MOCK_ADAPTERS_ENABLED,
  version: API_VERSION,
} as const;

/** Type for build configuration */
export type BuildConfig = typeof BUILD_CONFIG;
```

### 1.2 Using Build Constants

```typescript
// packages/data-connectors/src/adapter-factory.ts
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

export function createConnectorAdapter(config: AdapterFactoryConfig): ConnectorAdapter {
  // Compiler eliminates this entire branch in production builds
  if (BUILD_CONFIG.mockAdaptersEnabled && config.useMock !== false) {
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

  // Production adapters - only included in production builds
  return createProductionAdapter(config);
}
```

---

## 2. Type Guards and Discriminated Unions

### 2.1 Environment Type Definitions

```typescript
// packages/config/src/types/environment.ts
import { z } from "zod";

/** Base environment interface */
interface BaseEnvironment {
  nodeEnv: string;
  databaseUrl: string;
  redisUrl: string;
}

/** Development environment */
interface DevelopmentEnvironment extends BaseEnvironment {
  nodeEnv: "development";
  mockAdapters: true;
  debugMode: true;
  hotReload: true;
}

/** Production environment */
interface ProductionEnvironment extends BaseEnvironment {
  nodeEnv: "production";
  mockAdapters: false;
  debugMode: false;
  hotReload: false;
}

/** Test environment */
interface TestEnvironment extends BaseEnvironment {
  nodeEnv: "test";
  mockAdapters: true;
  debugMode: false;
  coverage: true;
}

/** Discriminated union type */
export type Environment = DevelopmentEnvironment | ProductionEnvironment | TestEnvironment;

/** Type guard for development environment */
export function isDevelopmentEnvironment(env: Environment): env is DevelopmentEnvironment {
  return env.nodeEnv === "development";
}

/** Type guard for production environment */
export function isProductionEnvironment(env: Environment): env is ProductionEnvironment {
  return env.nodeEnv === "production";
}

/** Type guard for test environment */
export function isTestEnvironment(env: Environment): env is TestEnvironment {
  return env.nodeEnv === "test";
}
```

### 2.2 Using Discriminated Unions

```typescript
// Example: Type-safe configuration based on environment
function configureAdapter(env: Environment) {
  if (isDevelopmentEnvironment(env)) {
    // TypeScript knows env is DevelopmentEnvironment here
    return {
      adapterType: "mock" as const,
      debugMode: env.debugMode,
      hotReload: env.hotReload,
    };
  }

  if (isProductionEnvironment(env)) {
    // TypeScript knows env is ProductionEnvironment here
    return {
      adapterType: "production" as const,
      optimizations: true,
    };
  }

  // Test environment
  return {
    adapterType: "mock" as const,
    coverage: env.coverage,
  };
}

// Usage - fully type-safe
const env = loadEnvironment();
const config = configureAdapter(env);

// TypeScript knows these properties exist based on environment
if (config.adapterType === "mock") {
  // Mock adapter code
}
```

---

## 3. Dead Code Elimination

### 3.1 Conditional Code Elimination

```typescript
// packages/config/src/logger.ts
import { BUILD_CONFIG } from "./build-constants";

interface Logger {
  log(message: string): void;
  debug(message: string): void;
  error(message: string): void;
}

class DevelopmentLogger implements Logger {
  log(message: string): void {
    console.log(`[DEV] ${message}`);
  }

  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

class ProductionLogger implements Logger {
  log(message: string): void {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: Date.now(),
      }),
    );
  }

  debug(message: string): void {
    // No-op in production - eliminated by compiler
  }

  error(message: string): void {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: Date.now(),
      }),
    );
  }
}

/**
 * Create logger based on build configuration.
 *
 * In production builds, the DevelopmentLogger code is completely eliminated.
 */
export function createLogger(): Logger {
  // Compiler eliminates this branch in production builds
  if (BUILD_CONFIG.mockAdaptersEnabled) {
    return new DevelopmentLogger();
  }

  // Only ProductionLogger code remains in production bundles
  return new ProductionLogger();
}
```

### 3.2 Feature Flag Elimination

```typescript
// packages/config/src/features.ts
import { BUILD_CONFIG } from './build-constants';

/**
 * Feature flags that are enforced at compile time.
 *
 * In production builds, disabled features are completely eliminated
 * from the bundle, reducing size and improving performance.
 */
export const FEATURES = {
  /** AI-powered insights generation */
  insights: BUILD_CONFIG.isProduction ? true : true,

  /** AI-powered verdict generation */
  verdict: BUILD_CONFIG.isProduction ? true : true,

  /** Debug tools (development only) */
  debugTools: BUILD_CONFIG.isProduction ? false : true,

  /** Hot module replacement (development only) */
  hotReload: BUILD_CONFIG.isProduction ? false : true,

  /** Coverage collection (test only) */
  coverage: BUILD_CONFIG.environment === 'test' ? true : false,
} as const;

/**
 * Check if a feature is enabled.
 *
 * This check is performed at compile time when possible.
 * The compiler eliminates unreachable code branches.
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

// Usage example
if (isFeatureEnabled('debugTools')) {
  // This code is completely eliminated from production builds
  const debugger = new DevelopmentDebugger();
  debugger.attach();
}
```

---

## 4. esbuild Configuration

### 4.1 Basic esbuild Setup

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
    // Replace process.env.NODE_ENV with literal value
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),

    // Define build-time constants
    "import.meta.env.PROD": JSON.stringify(process.env.NODE_ENV === "production"),
    "import.meta.env.MOCK_ADAPTERS": JSON.stringify(process.env.NODE_ENV !== "production"),
  },
};

// Export for both CLI and programmatic use
export default buildOptions;

// CLI usage:
// esbuild esbuild.config.js
```

### 4.2 Environment-Specific Builds

```javascript
// scripts/build-prod.js
import { build } from "esbuild";

async function buildProduction() {
  await build({
    entryPoints: ["apps/api/src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outdir: "dist/prod",

    // Production build constants
    define: {
      "process.env.NODE_ENV": '"production"',
      "import.meta.env.PROD": "true",
      "import.meta.env.MOCK_ADAPTERS": "false",
    },

    // Minify for production
    minify: true,
    sourcemap: false,

    // Tree-shake unused code
    treeShaking: true,
  });
}

buildProduction().catch(console.error);
```

```javascript
// scripts/build-dev.js
import { build } from "esbuild";

async function buildDevelopment() {
  await build({
    entryPoints: ["apps/api/src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outdir: "dist/dev",

    // Development build constants
    define: {
      "process.env.NODE_ENV": '"development"',
      "import.meta.env.PROD": "false",
      "import.meta.env.MOCK_ADAPTERS": "true",
    },

    // Development-friendly options
    sourcemap: true,
    minify: false,
    watch: process.argv.includes("--watch"),
  });
}

buildDevelopment().catch(console.error);
```

### 4.3 Package.json Scripts

```json
{
  "scripts": {
    "build": "node scripts/build-prod.js",
    "build:dev": "node scripts/build-dev.js --watch",
    "build:all": "pnpm run build && pnpm run build:dev",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 5. Testing Patterns

### 5.1 Unit Testing with Build Constants

```typescript
// tests/build-constants.test.ts
import { describe, expect, it, beforeEach } from "vitest";
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

  it("should be immutable", () => {
    const originalEnvironment = BUILD_CONFIG.environment;

    // @ts-expect-error - Testing immutability
    expect(() => {
      (BUILD_CONFIG as any).environment = "test";
    }).toThrow();

    expect(BUILD_CONFIG.environment).toBe(originalEnvironment);
  });
});

describe("Type Guards", () => {
  it("isProductionBuild returns boolean", () => {
    expect(typeof isProductionBuild()).toBe("boolean");
    // In production builds, this should be true
    if (process.env.NODE_ENV === "production") {
      expect(isProductionBuild()).toBe(true);
    }
  });

  it("isDevelopmentBuild returns boolean", () => {
    expect(typeof isDevelopmentBuild()).toBe("boolean");
    if (process.env.NODE_ENV === "development") {
      expect(isDevelopmentBuild()).toBe(true);
    }
  });

  it("isTestBuild returns boolean", () => {
    expect(typeof isTestBuild()).toBe("boolean");
    if (process.env.NODE_ENV === "test") {
      expect(isTestBuild()).toBe(true);
    }
  });
});

describe("Build-Time Behavior", () => {
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

### 5.2 Integration Testing

```typescript
// tests/integration/adapter-factory.integration.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import { createConnectorAdapter } from "@agenticverdict/data-connectors";
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

describe("createConnectorAdapter (Integration)", () => {
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
      const adapter = createConnectorAdapter({
        platform,
        tenantId,
      });

      expect(adapter.constructor.name).toBe("MetaPlatformAdapter");
      expect(adapter).not.toBeInstanceOf(MockConnectorAdapter);
    });

    it("should ignore useMock option in production", () => {
      const adapter = createConnectorAdapter({
        platform,
        tenantId,
        useMock: true, // Should be ignored
      });

      expect(adapter.constructor.name).toBe("MetaPlatformAdapter");
    });
  });

  describe("Development build behavior", () => {
    beforeEach(() => {
      if (BUILD_CONFIG.isProduction) {
        return "skip";
      }
    });

    it("should create mock adapter by default", () => {
      const adapter = createConnectorAdapter({
        platform,
        tenantId,
      });

      expect(adapter).toBeInstanceOf(MockConnectorAdapter);
    });

    it("should create production adapter when useMock is false", () => {
      const adapter = createConnectorAdapter({
        platform,
        tenantId,
        useMock: false,
      });

      expect(adapter.constructor.name).toBe("MetaPlatformAdapter");
    });
  });
});
```

### 5.3 Bundle Verification Tests

```typescript
// tests/build/bundle-verification.test.ts
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

describe("Production Bundle Verification", () => {
  beforeEach(() => {
    if (process.env.NODE_ENV !== "production") {
      return "skip";
    }
  });

  it("should not contain mock adapter code", () => {
    const distDir = "dist";
    const files = readdirSync(distDir);

    for (const file of files) {
      if (!file.endsWith(".js")) continue;

      const content = readFileSync(join(distDir, file), "utf-8");

      // Check for mock adapter references
      expect(content).not.toContain("MockConnectorAdapter");
      expect(content).not.toContain("MockAdapterFactory");

      // Check for development-only code
      expect(content).not.toContain("DevelopmentLogger");
      expect(content).not.toContain("debugger");
    }
  });

  it("should contain production adapter code", () => {
    const distDir = "dist";
    const mainBundle = readFileSync(join(distDir, "index.js"), "utf-8");

    // Should contain production adapters
    expect(mainBundle).toContain("MetaPlatformAdapter");
    expect(mainBundle).toContain("Ga4PlatformAdapter");
  });

  it("should not contain debug code", () => {
    const distDir = "dist";
    const files = readdirSync(distDir);

    for (const file of files) {
      if (!file.endsWith(".js")) continue;

      const content = readFileSync(join(distDir, file), "utf-8");

      // Debug statements should be eliminated
      expect(content).not.toContain("console.debug");
      expect(content).not.toContain("debugger");
    }
  });
});
```

---

## Appendix: Complete Working Example

```typescript
/**
 * Complete example: Compiler-driven adapter factory
 *
 * This example demonstrates all the patterns working together
 */

// Step 1: Define build constants
// packages/config/src/build-constants.ts
export const BUILD_CONFIG = {
  environment: process.env.NODE_ENV as "development" | "production" | "test",
  isProduction: process.env.NODE_ENV === "production",
  mockAdaptersEnabled: process.env.NODE_ENV !== "production",
} as const;

// Step 2: Define adapter interfaces
// packages/data-connectors/src/types.ts
export interface ConnectorAdapter {
  fetchMetrics(dateRange: DateRange): Promise<PlatformData>;
  isHealthy(): Promise<boolean>;
}

// Step 3: Create factory with build-time optimization
// packages/data-connectors/src/adapter-factory.ts
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

export function createConnectorAdapter(config: {
  platform: "meta" | "ga4" | "gsc";
  tenantId: string;
  useMock?: boolean;
}): ConnectorAdapter {
  // Compiler eliminates this branch in production builds
  if (BUILD_CONFIG.mockAdaptersEnabled && config.useMock !== false) {
    return new MockConnectorAdapter(config);
  }

  // Production adapter selection
  switch (config.platform) {
    case "meta":
      return new MetaPlatformAdapter(config);
    case "ga4":
      return new Ga4PlatformAdapter(config);
    case "gsc":
      return new GscPlatformAdapter(config);
    default:
      const exhaustive: never = config.platform;
      throw new Error(`Unsupported platform: ${exhaustive}`);
  }
}

// Step 4: Use in application code
// apps/worker/src/queues/workflow-processor.ts
import { createConnectorAdapter } from "@agenticverdict/data-connectors";

async function processWorkflow(job: Job) {
  // Adapter selection happens at compile time in production
  const adapter = createConnectorAdapter({
    platform: job.data.platform,
    tenantId: job.data.tenantId,
  });

  const metrics = await adapter.fetchMetrics(job.data.dateRange);

  // Process metrics...
}
```

---

**Document Status:** ✅ Complete
**Examples Status:** Ready to Use
**Related Documentation:** [Research Report](./compiler-driven-adapter-config-research.md)
