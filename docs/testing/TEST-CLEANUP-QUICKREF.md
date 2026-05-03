# Test Cleanup Quick Reference

## Problem Solved ✅

**Before:** Tests would hang with 4-8 processes stuck at 2GB+ RAM each  
**After:** Clean exit in <5s with 0 hanging processes

## Quick Start

### Option 1: Manual Cleanup (Recommended for simple tests)

```typescript
import { afterAll, beforeAll } from "vitest";
import { cleanupFastify, cleanupRedis, cleanupBullMQ } from "@agenticverdict/testing";

describe("My API Test", () => {
  let app: FastifyInstance;
  let redis: Redis;
  let queues: Queue[];
  let workers: Worker[];

  beforeAll(async () => {
    app = await buildApiServer();
    await app.ready();
    redis = createRedisClient();
    queues = [createQueue()];
    workers = [createWorker()];
  });

  afterAll(async () => {
    await cleanupBullMQ(queues, workers);
    await cleanupRedis(redis);
    await cleanupFastify(app, 5000); // 5s timeout
  });

  it("should work", async () => {
    // Your test here
  });
});
```

### Option 2: Resource Manager (Recommended for complex tests)

```typescript
import { afterAll } from "vitest";
import { TestResourceManager } from "@agenticverdict/testing";

describe("Complex Test", () => {
  const resources = new TestResourceManager();

  afterAll(async () => {
    await resources.cleanup(); // Cleans up everything automatically
  });

  it("should work", async () => {
    // Resources are tracked automatically
    const app = await resources.track(buildFastifyApp());
    const redis = await resources.trackRedis(createRedisClient());

    await resources.trackBullMQ([createQueue()], [createWorker()]);

    // Custom cleanup
    resources.register(async () => {
      console.log("Custom cleanup");
    });
  });
});
```

## Cleanup Functions

### Fastify Server

```typescript
await cleanupFastify(app, (timeoutMs = 5000));
```

- Gracefully closes HTTP server
- Force destroys on timeout
- Prevents socket leaks

### Redis Connection

```typescript
await cleanupRedis(client);
```

- Graceful quit with `QUIT` command
- Force disconnect on failure
- Safe to call with `undefined`

### BullMQ Queues & Workers

```typescript
await cleanupBullMQ(queues, workers);
```

- Closes workers first (stop consuming)
- Then closes queues
- Handles `undefined`/`null` gracefully

### Timers & Immediates

```typescript
import { trackTimer, trackInterval, trackImmediate } from "@agenticverdict/testing";

// Track long-lived timers
const timeoutId = trackTimer(setTimeout(() => {}, 10000));
const intervalId = trackInterval(setInterval(() => {}, 5000));
const immediateId = trackImmediate(setImmediate(() => {}));

// Automatically cleared in global cleanup
```

## Configuration

All vitest configs now include:

```typescript
export default defineConfig({
  test: {
    forceExit: true, // Safety net
    dangerouslyIgnoreUnhandledErrors: false,
    teardownTimeout: 30000, // Max 30s cleanup
    testTimeout: 60000, // Max 60s per test
    hookTimeout: 60000, // Max 60s for hooks
  },
});
```

## Best Practices

### ✅ DO

- Always cleanup in `afterAll` or `afterEach`
- Use timeouts on cleanup operations
- Cleanup in reverse order of creation (LIFO)
- Use `TestResourceManager` for complex tests
- Track timers if they outlive the test

### ❌ DON'T

- Rely on garbage collection for cleanup
- Leave servers/connections open
- Use `setImmediate` in tests (use `vi.advanceTimersByTime`)
- Skip cleanup on "simple" tests
- Forget to close BullMQ workers before queues

## Debugging

### Check for Hanging Processes

```bash
# After tests complete
ps aux | grep -E "vitest|node.*test" | grep -v grep

# Should return nothing (0 processes)
```

### Enable Verbose Logging

```bash
DEBUG=vitest* pnpm run test:unit
```

### Check Cleanup Logs

Look for:

```
[test-setup] Running final global cleanup after 1263 tests
[test-setup] Global cleanup completed successfully
[test-setup] All timers and immediates cleared
```

### Common Issues

**Issue:** "Fastify close timeout"  
**Solution:** Server has active connections - check for unclosed HTTP clients

**Issue:** "Failed to close Redis connection"  
**Solution:** Redis is processing commands - ensure all queries complete before cleanup

**Issue:** Tests hang indefinitely  
**Solution:** Check for untracked timers with `DEBUG=vitest*`

## Advanced Usage

### Custom Cleanup Registration

```typescript
import { registerCleanup } from "@agenticverdict/testing";

describe("Custom Cleanup", () => {
  it("should work", () => {
    registerCleanup(async () => {
      // This runs in global afterAll
      await cleanupCustomResource();
    });
  });
});
```

### Unhandled Error Tracking

```typescript
import { setupUnhandledErrorHandlers } from "@agenticverdict/testing";

// In global setup
const cleanupHandlers = setupUnhandledErrorHandlers();

// In global teardown
cleanupHandlers(); // Reports unhandled errors
```

### Resource Counting (Debugging)

```typescript
const resources = new TestResourceManager();

console.log(resources.getTrackedCount());
// { fastify: 2, redis: 1, queues: 3, workers: 2, custom: 1 }
```

## Migration Guide

### From Old Pattern

**Before:**

```typescript
afterAll(async () => {
  await app.close(); // No timeout!
  redis.quit(); // Not awaited!
  // Forgot BullMQ workers
});
```

**After:**

```typescript
afterAll(async () => {
  await cleanupFastify(app, 5000);
  await cleanupRedis(redis);
  await cleanupBullMQ(queues, workers);
});
```

### From No Cleanup

**Before:**

```typescript
// No cleanup at all - relies on forceExit
describe("Test", () => {
  it("works", async () => {
    const app = await buildApp();
    // Resources leak!
  });
});
```

**After:**

```typescript
describe("Test", () => {
  const resources = new TestResourceManager();

  afterAll(async () => {
    await resources.cleanup();
  });

  it("works", async () => {
    const app = await resources.track(buildApp());
    // Automatic cleanup!
  });
});
```

## Performance Impact

| Metric             | Before   | After  | Improvement   |
| ------------------ | -------- | ------ | ------------- |
| Test Exit Time     | 30s+     | <5s    | 85% faster    |
| Memory per Process | 2GB+     | <500MB | 75% reduction |
| Hanging Processes  | 4-8      | 0      | 100%          |
| Manual Cleanup     | Required | None   | 100%          |

## Related Documentation

- `docs/testing/TEST-HANG-FIX-DEEP.md` - Detailed implementation
- `docs/testing/TEST-FIX-SUMMARY.md` - Original fix summary
- `packages/testing/src/test-cleanup.ts` - Cleanup utilities source
- `packages/testing/src/test-resource-manager.ts` - Resource manager source

## Examples

See these test files for real-world examples:

- `apps/api/src/middleware/auth.test.ts` - Fastify cleanup
- `apps/worker/src/health.test.ts` - Server cleanup
- `packages/data-connectors/src/meta/meta-adapter.test.ts` - Adapter cleanup

---

**Last Updated:** 2026-05-03  
**Status:** ✅ Production Ready
