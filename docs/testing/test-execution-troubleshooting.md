# Test Execution Troubleshooting Guide

## Problem: Tests Hang with High Memory Usage

**Symptoms:**

- Multiple processes (8+) hang after running `pnpm exec turbo run test --concurrency=8`
- Each process consumes 2GB+ RAM
- Tests complete but processes don't exit

## Root Causes & Fixes

### 1. Missing `forceExit` Configuration

**Problem:** Vitest waits for the event loop to empty, but tests with timers, promises, or open connections keep it alive.

**Fix Applied:** Added `forceExit: true` to all `vitest.config.ts` files.

```typescript
export default defineConfig({
  test: {
    forceExit: true, // Forces Vitest to exit after tests complete
  },
});
```

### 2. Unbounded Thread Pool

**Problem:** Default thread pool creates unlimited workers, causing memory bloat.

**Fix Applied:** Limited thread pool size in root and heavy packages.

```typescript
export default defineConfig({
  test: {
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 4, // Root config
        minThreads: 1,
        useAtomics: true,
      },
    },
  },
});
```

**Package-specific limits:**

- Root: `maxThreads: 4`
- API/Worker: `maxThreads: 2` (heavy Fastify apps)
- Database: `maxThreads: 2` (slow I/O tests)
- Others: Default (lightweight unit tests)

### 3. Incomplete Resource Cleanup

**Problem:** Fastify servers, Redis connections, and timers not properly closed in `afterAll`.

**Fix Applied:** Created cleanup utilities in `packages/testing/src/test-cleanup.ts`.

**Usage in tests:**

```typescript
import { afterAll, beforeAll } from "vitest";
import { buildApiServer } from "../server";
import { cleanupFastify } from "@agenticverdict/testing";

describe("API tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiServer();
    await app.ready();
  });

  afterAll(async () => {
    await cleanupFastify(app); // Proper cleanup
  });
});
```

**Available cleanup helpers:**

- `cleanupFastify(app)` - Close Fastify servers
- `cleanupRedis(client)` - Close Redis connections
- `cleanupTimers()` - Clear all timeouts
- `cleanupIntervals()` - Clear all intervals
- `registerCleanup(fn)` - Register custom cleanup
- `runGlobalCleanup()` - Run all registered cleanups

### 4. Long Timeouts Without Cleanup

**Problem:** 120s timeouts in database tests allow hanging operations.

**Fix Applied:** Reduced integration test timeouts, added `hookTimeout`.

```typescript
export default defineConfig({
  test: {
    testTimeout: 60_000, // Reduced from 120s
    hookTimeout: 60_000,
  },
});
```

## Best Practices

### Writing Tests That Exit Cleanly

✅ **DO:**

```typescript
import { afterAll, beforeAll } from "vitest";
import { cleanupFastify, cleanupRedis } from "@agenticverdict/testing";

describe("My Test", () => {
  let app: FastifyInstance;
  let redis: Redis;

  beforeAll(async () => {
    app = await buildApiServer();
    redis = createRedis();
    await app.ready();
  });

  afterAll(async () => {
    await cleanupFastify(app);
    await cleanupRedis(redis);
  });

  it("should work", async () => {
    // Test logic
  });
});
```

❌ **DON'T:**

```typescript
// Missing cleanup - will hang!
describe("My Test", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApiServer();
  });

  // No afterAll cleanup!
});
```

### Handling Timers

✅ **DO:**

```typescript
import { cleanupTimers } from "@agenticverdict/testing";

afterEach(() => {
  cleanupTimers(); // Clear any leftover timers
});
```

### Running Tests Efficiently

```bash
# Run all unit tests (recommended)
pnpm run test:unit

# Run with coverage
pnpm run test:coverage

# Run specific package (faster)
pnpm --filter @agenticverdict/core test

# Run integration tests (requires Docker)
pnpm run test:integration

# Run E2E tests (Playwright)
pnpm run test:e2e

# Debug hanging tests
pnpm run test:unit --no-file-parallelism --max-workers=1
```

### Turbo Concurrency

```bash
# Good: Limited concurrency
pnpm exec turbo run test --concurrency=8

# Bad: Too many concurrent test runners
pnpm exec turbo run test --concurrency=8
```

**Recommended:** `--concurrency=8` or `--concurrency=50%`

## Monitoring Test Health

### Check for Hanging Processes

```bash
# After tests complete, check for node processes
ps aux | grep node | grep vitest

# Kill hanging processes
pkill -f vitest
```

### Memory Profiling

```bash
# Run tests with memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm run test:unit

# Check for memory leaks
pnpm run test:unit --expose-gc
```

## Configuration Reference

### Root Config (`vitest.config.ts`)

```typescript
{
  test: {
    projects: [...], // 18 test projects
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
        useAtomics: true,
      },
    },
    forceExit: true,
    dangerouslyIgnoreUnhandledErrors: false,
  },
}
```

### Package-Specific Configs

| Package                    | `maxThreads` | `testTimeout` | Notes                     |
| -------------------------- | ------------ | ------------- | ------------------------- |
| `apps/api`                 | 2            | Default       | Fastify app, heavy        |
| `apps/worker`              | Default      | Default       | BullMQ processor          |
| `packages/database`        | 2            | 120s          | Slow I/O, requires Docker |
| `packages/agent-runtime`   | Default      | Default       | LLM mocks                 |
| `packages/data-connectors` | 2            | Default       | Adapter tests             |
| Others                     | Default      | Default       | Lightweight unit tests    |

## Quick Fix Checklist

If tests hang:

1. ✅ Check `forceExit: true` in vitest config
2. ✅ Verify `afterAll` cleanup in tests
3. ✅ Look for unhandled timers/promises
4. ✅ Reduce `--concurrency` in turbo command
5. ✅ Check for open Redis/DB connections
6. ✅ Run with `--no-file-parallelism` to isolate issue

## Related Files

- Root config: `vitest.config.ts`
- Cleanup utilities: `packages/testing/src/test-cleanup.ts`
- API helpers: `apps/api/src/test-helpers.ts`
- Package configs: `**/vitest.config.ts`

## Industry Standards

This fix follows Vitest best practices:

1. **Vitest Docs:** [`forceExit`](https://vitest.dev/config/#forceexit)
2. **Thread Pool Management:** Limit workers to prevent memory bloat
3. **Resource Cleanup:** Always close servers/connections in `afterAll`
4. **Test Isolation:** Clean state between tests
5. **Timeout Management:** Reasonable timeouts prevent infinite hangs

**References:**

- [Vitest Configuration](https://vitest.dev/config/)
- [Vitest Pool Options](https://vitest.dev/config/#pool)
- [Fastify Testing](https://fastify.dev/docs/latest/Reference/Testing/)
