# Tenant AI Configuration Guide

Configure AI providers, budgets, and failover strategies per tenant.

## Overview

Tenant AI configuration allows each tenant to customize:

- **Provider preferences** — Choose preferred AI providers (OpenAI, Anthropic, Google, etc.)
- **Model overrides** — Specify which models to use for different roles
- **Budget controls** — Set monthly spending limits and alerts
- **Failover strategies** — Configure automatic fallback on provider failures

## Configuration Schema

```typescript
interface TenantAIConfig {
  // Provider priority list (first = primary)
  providerOrder: string[];

  // Per-provider model overrides
  modelOverrides: Record<string, string>;

  // Budget configuration
  budget: {
    monthlyLimit: number; // USD
    alertThreshold: number; // percentage (0-100)
  };

  // Failover configuration
  failover: {
    enabled: boolean;
    maxRetries: number;
  };

  // Advanced settings
  advanced?: {
    // Circuit breaker thresholds
    circuitBreaker?: {
      failureThreshold: number; // failures before opening
      failureWindow: number; // seconds
      timeout: number; // seconds before half-open
    };

    // Request timeout (ms)
    requestTimeout?: number;

    // Retry delay (ms)
    retryDelay?: number;
  };
}
```

## Provider Configuration

### Available Providers

| Provider ID         | Description            | Default Models                     |
| ------------------- | ---------------------- | ---------------------------------- |
| `openai`            | OpenAI GPT models      | gpt-4-turbo, gpt-4o, gpt-3.5-turbo |
| `anthropic`         | Anthropic Claude       | claude-3-5-sonnet, claude-3-opus   |
| `google`            | Google Gemini          | gemini-1.5-pro, gemini-1.5-flash   |
| `bedrock`           | AWS Bedrock            | Claude, Llama, Titan via AWS       |
| `openai-compatible` | OpenAI-compatible APIs | Custom endpoints                   |

### Setting Provider Priority

The `providerOrder` array determines the failover sequence:

```json
{
  "providerOrder": ["anthropic", "openai", "google"]
}
```

- **Primary**: `anthropic` (tried first)
- **Fallback 1**: `openai` (if anthropic fails)
- **Fallback 2**: `google` (if openai also fails)

### Model Overrides

Override default models per provider:

```json
{
  "modelOverrides": {
    "anthropic": "claude-3-opus-20240229",
    "openai": "gpt-4o",
    "google": "gemini-1.5-pro"
  }
}
```

## Budget Configuration

### Monthly Spending Limits

```json
{
  "budget": {
    "monthlyLimit": 500, // $500 USD per month
    "alertThreshold": 80 // Alert at 80% ($400)
  }
}
```

**Behavior:**

- **Soft limit (default)**: Alerts when threshold reached, requests continue
- **Hard limit**: Blocks requests when limit reached (configure via admin)

### Budget Tracking

Budgets are tracked per tenant using:

- **Token usage** — Input + output tokens
- **Provider rates** — Real-time pricing from provider APIs
- **Monthly reset** — Resets on the 1st of each month

## Failover Configuration

### Enabling Failover

```json
{
  "failover": {
    "enabled": true,
    "maxRetries": 3
  }
}
```

**Failover behavior:**

1. Try primary provider
2. If fails with retryable error → try next provider
3. Repeat until success or `maxRetries` exhausted
4. Throw `ProviderFailoverExhaustedError` if all fail

### Retryable vs Non-Retryable Errors

**Retryable** (triggers failover):

- Network timeouts
- 5xx server errors
- Rate limits (429)
- Temporary service unavailability

**Non-retryable** (immediate failure):

- Authentication errors (401)
- Permission errors (403)
- Invalid request (400)
- Insufficient funds

### Circuit Breaker

Prevents cascading failures by temporarily blocking unhealthy providers:

```json
{
  "advanced": {
    "circuitBreaker": {
      "failureThreshold": 5, // 5 failures
      "failureWindow": 30, // in 30 seconds
      "timeout": 60 // block for 60 seconds
    }
  }
}
```

**States:**

- **Closed**: Normal operation
- **Open**: Failing fast, no requests to provider
- **Half-Open**: Testing with one request

## Advanced Configuration

### Request Timeout

```json
{
  "advanced": {
    "requestTimeout": 30000 // 30 seconds
  }
}
```

### Retry Delay

```json
{
  "advanced": {
    "retryDelay": 1000 // 1 second between retries
  }
}
```

## Configuration Examples

### Example 1: Startup (Cost-Optimized)

```json
{
  "providerOrder": ["openai", "anthropic"],
  "modelOverrides": {
    "openai": "gpt-3.5-turbo"
  },
  "budget": {
    "monthlyLimit": 100,
    "alertThreshold": 90
  },
  "failover": {
    "enabled": true,
    "maxRetries": 2
  }
}
```

### Example 2: Enterprise (High Availability)

```json
{
  "providerOrder": ["anthropic", "openai", "google", "bedrock"],
  "modelOverrides": {
    "anthropic": "claude-3-opus-20240229",
    "openai": "gpt-4o"
  },
  "budget": {
    "monthlyLimit": 5000,
    "alertThreshold": 75
  },
  "failover": {
    "enabled": true,
    "maxRetries": 4
  },
  "advanced": {
    "circuitBreaker": {
      "failureThreshold": 3,
      "failureWindow": 60,
      "timeout": 120
    },
    "requestTimeout": 60000
  }
}
```

### Example 3: Development (Single Provider)

```json
{
  "providerOrder": ["openai"],
  "budget": {
    "monthlyLimit": 50,
    "alertThreshold": 100
  },
  "failover": {
    "enabled": false
  }
}
```

## API Usage

### Getting Tenant Config

```typescript
import { getTenantContext } from "@agenticverdict/core";

const context = getTenantContext();
const aiConfig = context?.aiConfig;

console.log(aiConfig.providerOrder); // ['anthropic', 'openai']
console.log(aiConfig.budget.monthlyLimit); // 500
```

### Updating Tenant Config

```typescript
import { updateTenantAIConfig } from "@agenticverdict/database";

await updateTenantAIConfig(tenantId, {
  providerOrder: ["anthropic", "openai"],
  budget: {
    monthlyLimit: 1000,
    alertThreshold: 80,
  },
});
```

## Monitoring & Alerts

### Budget Alerts

Alerts are triggered when spending reaches `alertThreshold`:

- **Email notification** — Sent to tenant admins
- **Dashboard warning** — Visible in tenant dashboard
- **Webhook** — Optional webhook notification

### Failover Events

All failover events are logged with tenant context:

```json
{
  "level": "warn",
  "event": "provider_failover",
  "tenantId": "tenant-123",
  "primaryProvider": "anthropic",
  "fallbackProvider": "openai",
  "error": "ETIMEDOUT",
  "timestamp": "2026-05-05T12:34:56Z"
}
```

### Circuit Breaker Events

```json
{
  "level": "error",
  "event": "circuit_breaker_open",
  "tenantId": "tenant-123",
  "providerId": "anthropic",
  "failureCount": 5,
  "timestamp": "2026-05-05T12:34:56Z"
}
```

## Best Practices

1. **Start with 2-3 providers** — Balance cost and reliability
2. **Set realistic budgets** — Monitor usage for first month, then adjust
3. **Enable failover for production** — Critical for high availability
4. **Use circuit breakers** — Prevent cascading failures
5. **Monitor failover events** — Identify unhealthy providers early
6. **Test failover regularly** — Ensure fallback providers work

## Troubleshooting

### Issue: All providers failing

**Check:**

- API keys are valid and not expired
- Network connectivity to provider endpoints
- Provider status pages for outages
- Budget limits not exceeded

### Issue: High failover rate

**Check:**

- Primary provider health (circuit breaker logs)
- Latency to provider endpoints
- Rate limits being hit
- Consider reordering provider priority

### Issue: Budget exceeded unexpectedly

**Check:**

- Token usage patterns (sudden spikes?)
- Model choices (using expensive models?)
- Consider lowering limits or enabling hard caps

## Related Documentation

- [Provider Failover Configuration](./provider-failover-config.md)
- [Agent Runtime README](../../packages/agent-runtime/README.md)
- [Migration Guide](./legacy-agents-migration.md)
