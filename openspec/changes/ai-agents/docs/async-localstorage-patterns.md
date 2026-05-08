# AsyncLocalStorage Usage Patterns

## Overview

This document describes how `AsyncLocalStorage` is used throughout the AgenticVerdict codebase to maintain tenant context isolation across asynchronous operations.

## Core Concept

`AsyncLocalStorage` (from Node.js `async_hooks`) provides a way to maintain context across asynchronous operations without explicitly passing context through every function call. This is critical for multi-tenant applications where every operation must be scoped to the correct tenant.

## Implementation Pattern

### 1. Context Definition

```typescript
// packages/core/src/tenant/context.ts
export interface TenantContext {
  tenantId: string;
  userId?: string;
  requestId: string;
  [key: string]: unknown;
}
```

### 2. Storage Initialization

```typescript
// packages/core/src/tenant/async-storage.ts
import { AsyncLocalStorage } from "async_hooks";
import type { TenantContext } from "./context";

export const tenantStorage = new AsyncLocalStorage<TenantContext>();
```

### 3. Context Propagation

```typescript
// In API middleware or request handler
import { tenantStorage } from "@agenticverdict/core";

async function handleRequest(request: Request, context: TenantContext) {
  return tenantStorage.run(context, async () => {
    // All async operations here have access to tenant context
    const result = await processInsight();
    return result;
  });
}
```

### 4. Context Retrieval

```typescript
// Anywhere in the async call chain
import { tenantStorage } from "@agenticverdict/core";

function getCurrentTenant(): string | undefined {
  const context = tenantStorage.getStore();
  return context?.tenantId;
}
```

## Usage in Provider Failover

The `ProviderFailover` class uses `AsyncLocalStorage` to ensure tenant isolation during failover operations:

```typescript
// packages/agent-runtime/src/core/failover.ts
async executeWithFailover<T>(
  tenantContext: { tenantId: string },
  providerIds: string[],
  operation: (providerId: string) => Promise<T>,
): Promise<T> {
  // Tenant context is passed explicitly and used for:
  // 1. Logging with tenant metadata
  // 2. Tenant-scoped circuit breakers
  // 3. Isolation verification

  for (const providerId of providerIds) {
    // Get tenant-specific circuit breaker
    const breaker = this.getCircuitBreaker(tenantContext.tenantId, providerId);

    // Log with tenant context
    log.info("Attempting provider", {
      tenantId: tenantContext.tenantId,
      providerId,
    });
  }
}
```

## Best Practices

### ✅ DO:

1. **Always run async operations within context**

   ```typescript
   tenantStorage.run(context, async () => {
     await databaseOperation();
     await providerCall();
     await cacheAccess();
   });
   ```

2. **Include tenant context in all logs**

   ```typescript
   log.info("Operation completed", {
     tenantId: context.tenantId,
     requestId: context.requestId,
   });
   ```

3. **Use tenant-scoped resources**

   ```typescript
   // Circuit breakers keyed by tenant
   const key = `tenant:${tenantId}:provider:${providerId}`;
   ```

4. **Verify context before sensitive operations**
   ```typescript
   const context = tenantStorage.getStore();
   if (!context?.tenantId) {
     throw new Error("Tenant context not found");
   }
   ```

### ❌ DON'T:

1. **Don't store context in global variables**

   ```typescript
   // ❌ WRONG
   let currentTenant: string;

   // ✅ CORRECT
   const context = tenantStorage.getStore();
   ```

2. **Don't pass context manually through every function**

   ```typescript
   // ❌ WRONG - defeats the purpose
   async function process(tenantId: string) {
     await validate(tenantId);
     await transform(tenantId);
   }

   // ✅ CORRECT - use AsyncLocalStorage
   async function process() {
     const context = tenantStorage.getStore();
     await validate();
     await transform();
   }
   ```

3. **Don't leak context across request boundaries**

   ```typescript
   // ❌ WRONG - context leakage
   const context = tenantStorage.getStore();
   setTimeout(() => {
     useTenantContext(context); // Context may have changed!
   }, 1000);

   // ✅ CORRECT - capture needed values
   const tenantId = tenantStorage.getStore()?.tenantId;
   setTimeout(() => {
     useTenantId(tenantId); // Safe, just a string
   }, 1000);
   ```

## Testing Patterns

### Unit Tests

```typescript
import { tenantStorage } from "@agenticverdict/core";

describe("MyService", () => {
  it("should respect tenant context", async () => {
    const context = { tenantId: "test-tenant", requestId: "req-123" };

    await tenantStorage.run(context, async () => {
      const service = new MyService();
      const result = await service.process();
      expect(result.tenantId).toBe("test-tenant");
    });
  });
});
```

### Concurrent Request Tests

```typescript
it("should maintain isolation under concurrency", async () => {
  const tenants = ["tenant-1", "tenant-2", "tenant-3"];

  await Promise.all(
    tenants.map((tenantId) =>
      tenantStorage.run({ tenantId, requestId: `req-${tenantId}` }, async () => {
        const result = await processRequest();
        expect(result.tenantId).toBe(tenantId);
      }),
    ),
  );
});
```

## Common Pitfalls

### 1. Context Loss in Promise Chains

```typescript
// ❌ WRONG - context lost after first await
async function process() {
  const context = tenantStorage.getStore();
  await step1();
  await step2(); // Still has context if called within run()
}

// ✅ CORRECT - wrap entire async chain
tenantStorage.run(context, async () => {
  await step1();
  await step2();
});
```

### 2. Context Loss in Event Emitters

```typescript
// ❌ WRONG - event handler loses context
emitter.on("data", async () => {
  const context = tenantStorage.getStore(); // undefined!
});

// ✅ CORRECT - capture context at emission time
const context = tenantStorage.getStore();
emitter.on("data", async () => {
  tenantStorage.run(context, async () => {
    // Process with context
  });
});
```

### 3. Context Loss in setTimeout/setInterval

```typescript
// ❌ WRONG
setTimeout(async () => {
  const context = tenantStorage.getStore(); // undefined!
}, 1000);

// ✅ CORRECT
const context = tenantStorage.getStore();
setTimeout(async () => {
  tenantStorage.run(context, async () => {
    // Process with context
  });
}, 1000);
```

## Debugging

### Check Current Context

```typescript
function debugContext() {
  const context = tenantStorage.getStore();
  console.log("Current context:", {
    tenantId: context?.tenantId,
    userId: context?.userId,
    requestId: context?.requestId,
  });
}
```

### Verify Isolation

```typescript
async function verifyIsolation() {
  const results = await Promise.all([
    tenantStorage.run({ tenantId: "tenant-1" }, async () => {
      await delay(10);
      return tenantStorage.getStore()?.tenantId;
    }),
    tenantStorage.run({ tenantId: "tenant-2" }, async () => {
      await delay(10);
      return tenantStorage.getStore()?.tenantId;
    }),
  ]);

  console.log("Isolation check:", results); // ["tenant-1", "tenant-2"]
}
```

## Performance Considerations

- **Overhead**: AsyncLocalStorage adds minimal overhead (<0.01ms per operation)
- **Memory**: Each context object is small (~100 bytes), cleaned up automatically
- **Scalability**: Tested with 100+ concurrent tenants with zero context leakage

## Related Files

- `packages/core/src/tenant/context.ts` - Context type definitions
- `packages/core/src/tenant/async-storage.ts` - Storage initialization
- `packages/agent-runtime/src/core/failover.ts` - Failover with tenant isolation
- `packages/agent-runtime/src/core/concurrent-requests.test.ts` - Isolation tests
- `packages/agent-runtime/src/core/performance-benchmarks.test.ts` - Performance tests
