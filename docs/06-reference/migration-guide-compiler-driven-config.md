# Migration Guide: Compiler-Driven Adapter Configuration

This guide explains how to move call sites from ad hoc `process.env.NODE_ENV` checks toward **build-time constants** for adapter selection and related guards, as described in the [implementation plan](../04-technology-research/compiler-driven-adapter-config-implementation-plan.md).

**Company configuration JSON:** The tenant `CompanyConfig` schema and on-disk company JSON files are **unchanged**. This work does **not** introduce a discriminated union on `environment` or new `mockAdapters` / `debugMode` fields in company config. Adapter behavior is controlled by **build constants** and existing mock env vars (`AGENTICVERDICT_USE_MOCK_ADAPTERS`, per-platform overrides), not by extending the company JSON schema.

---

## Overview

Compiler-driven configuration makes adapter mode and production-only restrictions depend on values fixed at **compile time** (typically derived from `NODE_ENV` during the build). That allows bundlers and TypeScript to drop development-only branches (for example mock adapter wiring) from production artifacts and to centralize flags in one module.

---

## What is changing?

### Before

Adapter selection leans on **runtime** environment state:

```typescript
// Typical pattern: mock when env says so
const adapter = createPlatformAdapter({
  platform: "meta",
  useMock: process.env.NODE_ENV === "development",
});
```

Guards such as “no mocks in production” are enforced at runtime via `NODE_ENV` and mock flags.

### After

Call sites rely on **shared build constants** (and the adapter factory implements production vs non-production paths using those constants). You stop scattering raw `process.env.NODE_ENV === ...` checks for adapter mode; tests and apps import the same `BUILD_CONFIG` (or related symbols) the factory uses.

```typescript
import { createPlatformAdapter } from "@agenticverdict/platform-adapters";
import { BUILD_CONFIG } from "@agenticverdict/config";

const adapter = createPlatformAdapter({
  platform: "meta",
  // Mock vs production follows build constants + existing mock env rules in non-production
});
```

Exact factory behavior is defined in `packages/platform-adapters` as the implementation lands; the intent is compile-time separation of production vs development/test paths.

---

## Migration steps

### 1. Update imports

**Adapter factory (unchanged package):**

```typescript
import { createPlatformAdapter } from "@agenticverdict/platform-adapters";
```

**Build constants** come from `@agenticverdict/config` once `build-constants` is implemented and re-exported from the package entry.

**Preferred (barrel):**

```typescript
import { BUILD_CONFIG, IS_PRODUCTION, MOCK_ADAPTERS_ENABLED } from "@agenticverdict/config";
```

**Optional subpath** (only after `packages/config/package.json` includes a `./build-constants` export):

```typescript
import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";
```

To enable the subpath, extend `exports` in `packages/config/package.json`, for example:

```json
"exports": {
  ".": "./src/index.ts",
  "./build-constants": "./src/build-constants.ts"
}
```

Also add `export * from "./build-constants"` (or explicit named exports) in `packages/config/src/index.ts` so the main entry re-exports the same symbols as the subpath.

Until those files and exports exist, imports of build constants will not resolve; follow the implementation plan for Phase 1 first.

### 2. Replace ad hoc environment branching

**Before:**

```typescript
if (process.env.NODE_ENV === "development") {
  // Development-only path
} else {
  // Production path
}
```

**After:**

```typescript
if (!BUILD_CONFIG.isProduction) {
  // Development/test path (eligible for dead-code elimination in production builds)
} else {
  // Production path
}
```

Keep **runtime** validation where the implementation plan requires defense in depth (for example rejecting mock env flags when the process is clearly production), but prefer `BUILD_CONFIG` for **feature gating** that should align with the built artifact.

### 3. Update tests

**Before:**

```typescript
beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";
});
```

**After:**

Rely on the test runner’s `NODE_ENV=test` (or your build’s defined constants) and assert against `BUILD_CONFIG` where useful:

```typescript
import { BUILD_CONFIG } from "@agenticverdict/config";

beforeEach(() => {
  expect(BUILD_CONFIG.mockAdaptersEnabled).toBe(true); // when NODE_ENV is "test"
});
```

Continue to set `AGENTICVERDICT_USE_MOCK_ADAPTERS` and per-platform mock vars when tests need to exercise env parsing; build constants do not remove those env vars in non-production—they complement them.

---

## Breaking changes

For most consumers, **none**: `createPlatformAdapter` keeps a compatible surface; company JSON and `CompanyConfig` types stay the same (no discriminated union).

Call sites that depended on **overriding** behavior purely by toggling `NODE_ENV` at runtime **after** a production build may need to use a non-production build or pass explicit options where the API allows it (for example `useMock: false` for forcing production adapters in a dev build).

---

## Rollback

1. Stop importing build constants from `@agenticverdict/config` and revert to the previous `process.env` checks if needed.
2. Redeploy or rebuild the previous artifact.

To force a production adapter in development without changing global env:

```typescript
const adapter = createPlatformAdapter({
  platform: "meta",
  useMock: false,
});
```

---

## Related documentation

- [Compiler-driven adapter configuration: research](../04-technology-research/compiler-driven-adapter-config-research.md)
- [Compiler-driven adapter configuration: implementation plan](../04-technology-research/compiler-driven-adapter-config-implementation-plan.md)
- [Mock adapter integration](./mock-adapter-integration.md) (env vars and behavior)
