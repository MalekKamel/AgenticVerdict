# Implementation Plan: Refactor `packages/database/src/logger.ts` to Reuse Observability Logger

## 1. Problem Statement

`packages/database/src/logger.ts` currently creates its own standalone `pino` logger instance (`dbLogger`), duplicating the logging infrastructure that already exists in `@agenticverdict/observability`. This violates the project's architectural principle of centralized observability and means:

- **No tenant context mixin**: `dbLogger` lacks the `mixin()` function that injects `tenantId`, `requestId`, and `userId` from `AsyncLocalStorage` (provided by `getTenantContext()` in the observability logger).
- **No rotating file stream support**: The database logger doesn't support `LOG_FILE`, `LOG_MAX_SIZE`, or `LOG_MAX_FILES` environment variables.
- **Inconsistent log formatting**: The database logger doesn't use the same `formatters.level` or `base: { service }` structure.
- **Duplicated pino dependency logic**: Both files independently configure pino with overlapping options.

The database package already depends on `@agenticverdict/observability` (confirmed in `package.json`), so there is no new dependency cost.

## 2. Current State Analysis

### 2.1 Current `dbLogger` implementation (`packages/database/src/logger.ts`)

```typescript
import pino from "pino";

const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

export const dbLogger = isTest
  ? {
      info: () => {},
      warn: console.warn,
      error: console.error,
      debug: () => {},
    }
  : pino({ level: process.env.LOG_LEVEL || "info" });

export type DbLogger = typeof dbLogger;
```

### 2.2 Current usage of `dbLogger`

Only one file imports `dbLogger`:

- `packages/database/src/seeds/templates.seed.ts` — uses `dbLogger.info()`, `dbLogger.warn()` for seed operation logging.

### 2.3 Observability logger (`packages/observability/src/logger.ts`)

The canonical logger factory `createPinoLogger(service)`:

- Accepts a service name (`"api" | "worker" | "agent-runtime"`)
- Resolves log level via `resolveLogLevel()` from `@agenticverdict/config`
- Injects tenant context via `mixin()` using `getTenantContext()` from `@agenticverdict/core`
- Supports rotating file streams (`LOG_FILE`, `LOG_MAX_SIZE`, `LOG_MAX_FILES`)
- Uses `pino-pretty` in non-production dev mode
- Exports `Logger` type (pino's `Logger` type)

### 2.4 Established pattern in other packages

The worker package demonstrates the correct pattern (`apps/worker/src/queues/logger.ts`):

```typescript
import { createPinoLogger } from "@agenticverdict/observability";

let root: WorkerLogger | undefined;

export function getWorkerRootLogger(): WorkerLogger {
  if (!root) {
    root = createPinoLogger("worker");
  }
  return root;
}
```

## 3. Proposed Changes

### 3.1 Extend `ObservabilityServiceName` type

**File:** `packages/observability/src/logger.ts`

Add `"database"` to the `ObservabilityServiceName` union type:

```typescript
export type ObservabilityServiceName = "api" | "worker" | "agent-runtime" | "database";
```

### 3.2 Replace `dbLogger` with a lazy-initialized logger from observability

**File:** `packages/database/src/logger.ts`

Replace the entire file content with a lazy-initialized singleton pattern that delegates to `createPinoLogger("database")`:

```typescript
import { createPinoLogger, type Logger } from "@agenticverdict/observability";

let _dbLogger: Logger | undefined;

function getDbLogger(): Logger {
  if (!_dbLogger) {
    _dbLogger = createPinoLogger("database");
  }
  return _dbLogger;
}

// Re-export the logger instance getter for backward compatibility
export const dbLogger = getDbLogger();

// Keep the type alias for backward compatibility (maps to pino Logger)
export type DbLogger = Logger;
```

**Key design decisions:**

1. **Lazy initialization**: The logger is created on first access, not at module load time. This ensures `AsyncLocalStorage` and other runtime context is available when the logger initializes.

2. **Backward compatibility**: The exported `dbLogger` constant and `DbLogger` type remain, so existing imports in `templates.seed.ts` require zero changes.

3. **Test behavior**: In test environments, `createPinoLogger` already handles this gracefully — it uses `pino-pretty` when `VITEST !== "true"` and `NODE_ENV !== "production"`. The pino logger with level `"silent"` or the test-appropriate level from `resolveLogLevel()` will handle test silence. If explicit no-op behavior is needed during tests, we can configure `resolveLogLevel()` to return `"silent"` when `VITEST === "true"` (check `@agenticverdict/config` for this behavior).

4. **No direct pino import**: The database package no longer imports `pino` directly for logger creation, eliminating duplication.

### 3.3 Update `resolveLogLevel()` to handle test mode

**File:** `packages/config/src/schemas/observability.ts`

`resolveLogLevel()` currently does **not** check for `VITEST === "true"`. It defaults to `"debug"` in non-production environments. This means tests would produce verbose debug-level output.

Update the function to return `"silent"` when `VITEST === "true"`:

```typescript
export function resolveLogLevel(): LogLevel {
  if (process.env.VITEST === "true") {
    return "silent";
  }
  const parsed = observabilityEnvSchema.safeParse({
    LOG_LEVEL: process.env.LOG_LEVEL,
    // ... rest unchanged
  });
  // ... rest unchanged
}
```

This ensures all loggers created via `createPinoLogger` (including the database logger) are silent during tests, which is the correct behavior and replaces the current ad-hoc no-op object in `dbLogger`.

### 3.4 Remove direct `pino` dependency from database package (optional cleanup)

**File:** `packages/database/package.json`

After the refactor, `pino` is no longer directly imported in database source files. However, since `@agenticverdict/observability` re-exports the `Logger` type from pino, and the database package may transitively need it, keep `pino` as a dependency for now. This can be revisited after confirming no other database source files import from `pino` directly.

## 4. Implementation Steps

| Step | Action                                                                   | File(s)                                        | Risk |
| ---- | ------------------------------------------------------------------------ | ---------------------------------------------- | ---- |
| 1    | Add `"database"` to `ObservabilityServiceName` union                     | `packages/observability/src/logger.ts`         | Low  |
| 2    | Rewrite `packages/database/src/logger.ts` to use `createPinoLogger`      | `packages/database/src/logger.ts`              | Low  |
| 3    | Update `resolveLogLevel()` to return `"silent"` when `VITEST === "true"` | `packages/config/src/schemas/observability.ts` | Low  |
| 4    | Run existing tests to confirm no regressions                             | `packages/database/`                           | Low  |
| 5    | Run lint and typecheck                                                   | workspace-wide                                 | Low  |

## 5. Risk Assessment

- **Low risk**: The change is a drop-in replacement. The `dbLogger` export signature remains compatible (pino `Logger` has `info`, `warn`, `error`, `debug` methods).
- **Test isolation**: The singleton pattern means all test files share the same logger instance. This is consistent with how the worker logger works and is acceptable since tests should not be producing real log output anyway.
- **Circular dependency risk**: None. The dependency chain is `database → observability → core → ...`, which is already established and acyclic.

## 6. Acceptance Criteria

1. `packages/database/src/logger.ts` imports `createPinoLogger` from `@agenticverdict/observability` instead of creating its own pino instance.
2. `dbLogger` export remains backward compatible — `templates.seed.ts` works without modification.
3. All database package tests pass (`pnpm --filter @agenticverdict/database test`).
4. `pnpm run lint` and `pnpm run typecheck` pass workspace-wide.
5. Log output from database operations includes `service: "database"` and tenant context fields when available.
