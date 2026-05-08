# Provider Failover Configuration

Configure automatic provider failover with circuit breaker protection.

## Overview

Provider failover ensures high availability by automatically switching to backup providers when the primary provider fails. The system uses **sequential failover** based on tenant-configured provider priority.

## How Failover Works

```
Request → Primary Provider (anthropic)
         ↓ [fails with retryable error]
      Fallback 1 (openai)
         ↓ [fails with retryable error]
      Fallback 2 (google)
         ↓ [success]
      Return result
```

### Sequential vs Round-Robin

This system uses **sequential failover** (not round-robin):

- **Predictable**: Always tries providers in the same order
- **Cost-controlled**: Respects tenant provider preferences
- **Debuggable**: Easy to trace which provider handled each request

## Configuration

### Basic Failover Settings

```json
{
  "providerOrder": ["anthropic", "openai", "google", "bedrock"],
  "failover": {
    "enabled": true,
    "maxRetries": 3
  }
}
```

| Setting               | Default                   | Description                     |
| --------------------- | ------------------------- | ------------------------------- |
| `providerOrder`       | `['anthropic', 'openai']` | Priority list (first = primary) |
| `failover.enabled`    | `true`                    | Enable/disable failover         |
| `failover.maxRetries` | `3`                       | Maximum retry attempts          |

### What Triggers Failover?

**Retryable errors** (trigger failover):

- `ETIMEDOUT` — Network timeout
- `ECONNRESET` — Connection reset
- `503 Service Unavailable` — Provider down
- `429 Too Many Requests` — Rate limited
- `500 Internal Server Error` — Provider error

**Non-retryable errors** (immediate failure):

- `401 Unauthorized` — Invalid API key
- `403 Forbidden` — Permission denied
- `400 Bad Request` — Invalid request format
- `InsufficientFunds` — Account balance too low

## Circuit Breaker

The circuit breaker prevents cascading failures by temporarily blocking unhealthy providers.

### How It Works

```
State: CLOSED (normal)
  ↓ [5 failures in 30 seconds]
State: OPEN (failing fast)
  ↓ [60 seconds timeout]
State: HALF-OPEN (testing)
  ↓ [1 test request succeeds]
State: CLOSED (recovered)
```

### Circuit Breaker Configuration

```json
{
  "advanced": {
    "circuitBreaker": {
      "failureThreshold": 5, // failures before opening
      "failureWindow": 30, // seconds (rolling window)
      "timeout": 60 // seconds before half-open
    }
  }
}
```

| Setting            | Default | Description                                 |
| ------------------ | ------- | ------------------------------------------- |
| `failureThreshold` | `5`     | Number of failures to open circuit          |
| `failureWindow`    | `30`    | Time window for counting failures (seconds) |
| `timeout`          | `60`    | Time before testing recovery (seconds)      |

### Circuit Breaker States

**CLOSED** (normal operation):

- Requests flow to provider normally
- Failures are counted
- Circuit opens when threshold exceeded

**OPEN** (failing fast):

- All requests immediately fail
- No calls to provider
- Logs `circuit_breaker_open` event
- After timeout, transitions to half-open

**HALF-OPEN** (testing):

- One test request allowed
- If succeeds → circuit closes
- If fails → circuit re-opens

## Failover Logic

### Execution Flow

```typescript
async function executeWithFailover(config, operation) {
  const providers = config.providerOrder;
  const errors = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    // Check circuit breaker
    if (circuitBreaker.isOpen(provider)) {
      continue; // Skip this provider
    }

    try {
      const result = await operation(provider);

      // Success → close circuit if it was open
      circuitBreaker.close(provider);
      return result;
    } catch (error) {
      errors.push({ provider, error });

      // Log failover event
      logFailoverEvent({
        tenantId: config.tenantId,
        primaryProvider: provider,
        fallbackProvider: providers[i + 1],
        error: error.message,
      });

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error; // Non-retryable → fail immediately
      }

      // Update circuit breaker
      circuitBreaker.recordFailure(provider);

      // Check if max retries exceeded
      if (errors.length >= config.failover.maxRetries) {
        break;
      }
    }
  }

  // All providers exhausted
  throw new ProviderFailoverExhaustedError(errors);
}
```

### Error Classification

```typescript
function isRetryableError(error): boolean {
  const retryableCodes = [429, 500, 502, 503, 504];
  const retryableErrors = ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED"];

  if (error.status && retryableCodes.includes(error.status)) {
    return true;
  }

  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }

  // Provider-specific errors
  if (error.type === "rate_limit_error") return true;
  if (error.type === "api_timeout") return true;

  return false; // Default to non-retryable
}
```

## Logging & Observability

### Failover Events

```json
{
  "level": "warn",
  "event": "provider_failover",
  "tenantId": "tenant-123",
  "requestId": "req-456",
  "primaryProvider": "anthropic",
  "fallbackProvider": "openai",
  "error": {
    "type": "ETIMEDOUT",
    "message": "Request timed out after 30000ms"
  },
  "attemptNumber": 1,
  "maxRetries": 3,
  "timestamp": "2026-05-05T12:34:56.789Z"
}
```

### Circuit Breaker Events

```json
{
  "level": "error",
  "event": "circuit_breaker_open",
  "tenantId": "tenant-123",
  "requestId": "req-456",
  "providerId": "anthropic",
  "failureCount": 5,
  "failureWindow": 30,
  "timestamp": "2026-05-05T12:34:56.789Z"
}
```

```json
{
  "level": "info",
  "event": "circuit_breaker_close",
  "tenantId": "tenant-123",
  "requestId": "req-789",
  "providerId": "anthropic",
  "testRequestSucceeded": true,
  "timestamp": "2026-05-05T12:36:56.789Z"
}
```

### Failover Exhausted Events

```json
{
  "level": "error",
  "event": "provider_failover_exhausted",
  "tenantId": "tenant-123",
  "requestId": "req-456",
  "attemptedProviders": ["anthropic", "openai", "google"],
  "errors": [
    { "provider": "anthropic", "error": "ETIMEDOUT" },
    { "provider": "openai", "error": "503 Service Unavailable" },
    { "provider": "google", "error": "500 Internal Server Error" }
  ],
  "timestamp": "2026-05-05T12:34:58.123Z"
}
```

## Examples

### Example 1: Basic Failover

```typescript
import { ProviderFailover, ProviderFactory } from "@agenticverdict/agent-runtime";

const failover = new ProviderFailover({
  providers: ["anthropic", "openai"],
  tenantId: "tenant-123",
  maxRetries: 2,
});

const result = await failover.execute(async (providerId) => {
  const provider = await ProviderFactory.getProvider(providerId);
  return await provider.invoke(messages);
});
```

### Example 2: With Circuit Breaker

```typescript
import { ProviderFailover, CircuitBreakerConfig } from "@agenticverdict/agent-runtime";

const circuitConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  failureWindow: 30000, // 30 seconds
  timeout: 60000, // 60 seconds
};

const failover = new ProviderFailover({
  providers: ["anthropic", "openai", "google"],
  tenantId: "tenant-123",
  maxRetries: 3,
  circuitBreakerConfig: circuitConfig,
});

try {
  const result = await failover.execute(async (providerId) => {
    const provider = await ProviderFactory.getProvider(providerId);
    return await provider.invoke(messages);
  });
} catch (error) {
  if (error instanceof ProviderFailoverExhaustedError) {
    // All providers failed
    console.error("All providers failed:", error.errors);
  }
  throw error;
}
```

### Example 3: Custom Error Classification

```typescript
const failover = new ProviderFailover({
  providers: ["anthropic", "openai"],
  tenantId: "tenant-123",
  maxRetries: 2,
  isRetryableError: (error) => {
    // Custom logic for your use case
    if (error.code === "CUSTOM_RETRYABLE") {
      return true;
    }
    // Fall back to default classification
    return failover.defaultIsRetryableError(error);
  },
});
```

## Performance Considerations

### Failover Latency

Typical failover overhead:

- **No failover (primary succeeds)**: < 1ms overhead
- **One failover**: +200-500ms (provider switch)
- **Two failovers**: +400-1000ms (two switches)

### Circuit Breaker Performance

- **Circuit state check**: < 0.1ms (in-memory)
- **Failure recording**: < 0.1ms (in-memory counter)
- **State transitions**: < 0.1ms (atomic operations)

### Memory Footprint

- **Circuit breaker state**: ~1KB per tenant
- **Failure counters**: ~100 bytes per provider
- **Total overhead**: < 1MB for 1000 tenants

## Best Practices

### 1. Configure Multiple Providers

```json
{
  "providerOrder": ["anthropic", "openai", "google"]
}
```

**Why**: Single point of failure if only one provider.

### 2. Set Reasonable Max Retries

```json
{
  "failover": {
    "maxRetries": 3
  }
}
```

**Why**: Too many retries → high latency. Too few → missed recoveries.

### 3. Tune Circuit Breaker Thresholds

```json
{
  "advanced": {
    "circuitBreaker": {
      "failureThreshold": 5,
      "failureWindow": 30
    }
  }
}
```

**Why**: Too sensitive → false positives. Too lenient → cascading failures.

### 4. Monitor Failover Events

Set up alerts for:

- High failover rate (> 10% of requests)
- Circuit breaker opens
- Provider failover exhausted errors

### 5. Test Failover Regularly

```bash
# Simulate provider failure
AGENTICVERDICT_MOCK_SCENARIO=failover pnpm test
```

**Why**: Ensure fallback providers are configured and working.

## Troubleshooting

### Issue: Failover not triggering

**Check:**

- Failover is enabled: `failover.enabled: true`
- Error is classified as retryable
- Provider order has multiple providers
- Circuit breaker is not open

### Issue: High failover rate

**Check:**

- Primary provider health (status pages)
- API key validity and rate limits
- Network latency to provider
- Consider reordering provider priority

### Issue: Circuit breaker opens frequently

**Check:**

- Failure threshold too low (increase to 10)
- Failure window too short (increase to 60s)
- Provider experiencing issues
- Network connectivity problems

### Issue: Failover exhausted errors

**Check:**

- All providers in `providerOrder` are healthy
- API keys are valid for all providers
- Budget limits not exceeded
- Network connectivity to all providers

## Related Documentation

- [Tenant AI Configuration Guide](./tenant-ai-config-guide.md)
- [Agent Runtime README](../../packages/agent-runtime/README.md)
- [Provider Registry](../../packages/agent-runtime/src/core/ProviderRegistry.ts)
