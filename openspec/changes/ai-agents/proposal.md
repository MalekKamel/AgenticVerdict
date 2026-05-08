## Why

The current agent architecture contains hardcoded provider references and lacks configuration-driven flexibility, preventing tenant-specific AI customization and resilient failover. This change establishes a unified provider abstraction layer with dynamic registration, tenant-scoped configuration, and automatic failover to ensure reliable, customizable AI services across all tenants.

## What Changes

- **New provider registry system** with dynamic provider discovery and registration at runtime
- **Configuration-driven agent factory** replacing hardcoded provider/model assumptions
- **Tenant AI configuration schema** enabling per-tenant provider preferences, budgets, and failover strategies
- **Provider failover mechanism** with circuit breaker integration and sequential failover
- **Configurable agent architecture** driven by insight configurations instead of hardcoded agent definitions
- **Dynamic API validation** accepting any registered provider instead of static enums
- **Legacy code removal** - destructive deletion of `specialized-marketing-agents.ts` and hardcoded provider references

## Capabilities

### New Capabilities

- `provider-registry`: Dynamic provider registration, discovery, and lifecycle management
- `tenant-ai-config`: Per-tenant AI provider preferences, budgets, and failover configuration
- `provider-failover`: Circuit breaker integration with sequential failover across providers
- `configurable-agents`: Insight-driven agent creation with customizable system messages, tools, and output formats
- `provider-validation`: Dynamic API schema validation against registered providers

### Modified Capabilities

- `agent-factory`: Provider selection now uses tenant config and registry instead of hardcoded values
- `insights-api`: Provider validation uses dynamic registry instead of static enum

## Impact

- **Code**: `packages/agent-runtime/src/` (provider registry, failover, configurable agents), `apps/api/src/trpc/routers/insights.ts` (dynamic validation), `packages/core/src/tenant/config-schema.ts` (AI config)
- **Database**: New tenant AI configuration tables in `packages/database/src/schema/tenant-config.ts`
- **Dependencies**: LangChain.js providers (openai, anthropic, google, bedrock), circuit-breaker library
- **Systems**: AsyncLocalStorage context propagation critical for tenant isolation during failover
- **Breaking**: Legacy `specialized-marketing-agents.ts` consumers must migrate to `InsightAgentFactory`
