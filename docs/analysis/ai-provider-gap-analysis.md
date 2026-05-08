# AI Provider Configuration Gap Analysis

**Document Type:** Gap Analysis  
**Part of:** AI Provider Audit (`/prompts/ai-provider-audit.md`)  
**Date:** 2026-05-05  
**Status:** Draft

---

## Executive Summary

This gap analysis documents discrepancies between the current AgenticVerdict AI provider implementation and the target architecture defined in:

- `/openspec/changes/ai-providers/tasks.md` — Phase 1-4 task specifications
- `/docs/plans/ai-provider-migration-plan.md` — Migration strategy
- `/docs/architecture/business/business-architecture.md` — Business requirements
- Lobe Chat reference implementation patterns

**Overall Assessment:** The implementation has **strong foundational architecture** (factory pattern, error system, credential encryption, tenant isolation) but **critical gaps** in hardcoded provider assumptions, missing frontend UI, and incomplete tenant configuration.

---

## Gap Categories

| Category             | Severity    | Count |
| -------------------- | ----------- | ----- |
| Provider Agnosticism | 🔴 Critical | 8     |
| UI Implementation    | 🔴 Critical | 6     |
| Multi-Tenant Safety  | 🟡 High     | 4     |
| Error System         | 🟢 Medium   | 2     |
| Lifecycle Hooks      | 🟢 Medium   | 3     |
| Documentation        | 🟢 Medium   | 2     |

---

## 1. Provider Agnosticism Gaps

### Gap 1.1: Hardcoded Provider in Agent Factory

**Severity:** 🔴 Critical  
**Location:** `packages/agent-runtime/src/agent-factory.ts:62-76, 121-134, 188-201`

**Current State:**

```typescript
createChatModels(config: AgentFactoryConfig) {
  return {
    providerId: "openai",                    // ❌ HARDCODED
    modelId: config.role === "verdict" ? "gpt-4-turbo" : "gpt-4o",  // ❌ HARDCODED
    fallbackProviderId: "anthropic",         // ❌ HARDCODED
    fallbackModelId: "claude-3-5-sonnet-20241022",  // ❌ HARDCODED
  };
}
```

**Target State:**

```typescript
createChatModels(config: AgentFactoryConfig) {
  const tenantConfig = this.config.getTenantConfig();
  return {
    providerId: tenantConfig.ai.defaultProvider,
    modelId: tenantConfig.ai.getModelForRole(config.role),
    fallbackProviderId: tenantConfig.ai.fallbackProvider,
    fallbackModelId: tenantConfig.ai.fallbackModel,
  };
}
```

**Impact:**

- Cannot use Google/Bedrock providers without code changes
- Model updates require deployments
- Violates business architecture §2.4 (Insight-level AI configuration)

**Remediation:** Replace with tenant configuration lookup or provider registry query.

---

### Gap 1.2: Limited Provider Enum in API Schema

**Severity:** 🔴 Critical  
**Location:** `apps/api/src/trpc/routers/insights.ts:27-34`

**Current State:**

```typescript
const insightCreateSchema = z.object({
  aiConfig: z.object({
    model: z.string(),
    provider: z.enum(["anthropic", "openai"]).optional(), // ❌ LIMITED
    qualityLevel: z.enum(["standard", "premium"]).optional(),
    // ...
  }),
});
```

**Target State:**

```typescript
const insightCreateSchema = z.object({
  aiConfig: z.object({
    model: z.string(),
    provider: z.string(), // Dynamic from provider registry
    // Or validate against registered providers
    provider: z
      .string()
      .refine((p) => ProviderFactory.listProviders().includes(p), { message: "Unknown provider" }),
    // ...
  }),
});
```

**Impact:**

- API rejects valid providers (google, bedrock, openai-compatible)
- Blocks frontend from offering full provider selection

**Remediation:** Replace enum with dynamic validation against provider registry.

---

### Gap 1.3: Static Model List in Frontend

**Severity:** 🔴 Critical  
**Location:** `apps/frontend/src/features/insights/pages/InsightEditPage.tsx:34-40`

**Current State:**

```typescript
const AVAILABLE_MODELS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];
```

**Target State:**

```typescript
const { data: providers } = trpc.aiProvider.list.useQuery();
const models = useMemo(() => {
  return providers
    ?.filter((p) => p.enabled)
    ?.flatMap((p) => p.models.map((m) => ({ value: m.id, label: m.name })));
}, [providers]);
```

**Impact:**

- Users cannot select newly added models without deployment
- No visibility into model capabilities (vision, function calling, etc.)
- Violates business architecture §2.4 (model selection per Insight)

**Remediation:** Implement dynamic model discovery via API endpoint.

---

### Gap 1.4: No Provider Registration at Startup

**Severity:** 🟡 High  
**Location:** `packages/agent-runtime/src/core/ProviderRegistry.ts`

**Current State:**

- Providers are defined but not automatically registered
- Registration only occurs in test files
- No initialization routine to register all available providers

**Target State:**

```typescript
// packages/agent-runtime/src/index.ts
export function initializeAgentRuntime() {
  ProviderFactory.register("openai", OpenAIProvider);
  ProviderFactory.register("anthropic", AnthropicProvider);
  ProviderFactory.register("google", GoogleProvider);
  ProviderFactory.register("bedrock", BedrockProvider);
  ProviderFactory.register("openai-compatible", OpenAICompatibleProvider);
}
```

**Impact:**

- Providers may not be available at runtime
- No single source of truth for available providers

**Remediation:** Add initialization function called at app startup.

---

### Gap 1.5: No Dynamic Model Discovery

**Severity:** 🟡 High  
**Location:** N/A (missing feature)

**Current State:**

- No mechanism to fetch available models from providers
- Model lists are static/hardcoded
- Lobe Chat implements `showModelFetcher: true` pattern

**Target State:**

```typescript
// API endpoint
trpc.aiProvider.getModels.procedure
  .input(z.object({ providerId: z.string() }))
  .query(async ({ ctx, input }) => {
    const provider = ProviderFactory.create(input.providerId, config);
    return await provider.listModels();
  });
```

**Impact:**

- Cannot use new models without code deployment
- No model capability detection (context window, abilities)

**Remediation:** Implement model discovery API endpoint.

---

### Gap 1.6: No Provider Failover Configuration

**Severity:** 🟡 High  
**Location:** `packages/agent-runtime/src/agent-factory.ts`

**Current State:**

- Fallback providers hardcoded
- No tenant-configurable failover preferences
- No circuit breaker integration visible

**Target State:**

```typescript
interface TenantAIConfig {
  primaryProvider: string;
  fallbackProviders: string[]; // Ordered list
  failoverStrategy: "sequential" | "round-robin" | "latency-based";
  circuitBreakerThreshold: number;
}
```

**Impact:**

- Single point of failure if primary provider unavailable
- Cannot customize failover per tenant/Insight

**Remediation:** Add failover configuration to tenant config schema.

---

### Gap 1.7: No Provider Capability Detection

**Severity:** 🟡 High  
**Location:** N/A (missing feature)

**Current State:**

- No way to query provider capabilities (max tokens, supported features)
- Lobe Chat uses `ModelAbilities` interface for this

**Target State:**

```typescript
interface ProviderCapabilities {
  maxContextWindow: number;
  maxOutputTokens: number;
  abilities: {
    vision: boolean;
    functionCall: boolean;
    fileUpload: boolean;
    structuredOutput: boolean;
  };
  pricing: {
    inputPerToken: number;
    outputPerToken: number;
  };
}
```

**Impact:**

- Cannot validate model selection against task requirements
- No cost estimation for AI usage

**Remediation:** Implement capability detection in BaseProvider.

---

### Gap 1.8: No Cost Tracking/Visibility

**Severity:** 🟡 High  
**Location:** `packages/agent-runtime/src/hooks/billing.ts`

**Current State:**

- Billing hook exists but no frontend visibility
- No usage dashboard
- Business architecture §7.1 mentions "quality/cost control" but no implementation

**Target State:**

- Usage dashboard showing AI consumption per tenant/Insight
- Cost estimation before running Insights
- Budget alerts and limits

**Impact:**

- Tenants cannot make informed cost/quality trade-offs
- No budget enforcement visibility

**Remediation:** Build usage tracking dashboard with cost analytics.

---

## 2. UI Implementation Gaps

### Gap 2.1: No Credential Management UI

**Severity:** 🔴 Critical  
**Location:** N/A (missing feature)

**Current State:**

- CredentialManager exists with encryption
- No frontend forms for entering API keys
- No API endpoints for credential CRUD

**Target State (based on Lobe Chat):**

- Provider configuration form with API key input
- Connection testing with model selector
- Encrypted storage with tenant scoping

**Impact:**

- Admins must set credentials via environment variables
- Cannot support tenant-specific credentials
- Violates business architecture §6.1 (tenant configuration isolation)

**Remediation:** Build credential management UI following Lobe Chat patterns.

---

### Gap 2.2: No Provider Selection UI

**Severity:** 🔴 Critical  
**Location:** N/A (missing feature)

**Current State:**

- No provider grid/card layout
- No enable/disable toggle per provider
- No provider navigation sidebar

**Target State (based on Lobe Chat):**

```
/settings/provider/
├── ProviderGrid/          # Card layout with logos
│   ├── Card.tsx           # Provider card
│   └── EnableSwitch.tsx   # Enable/disable
├── ProviderMenu/          # Sidebar navigation
└── detail/                # Provider detail pages
    ├── openai/
    ├── anthropic/
    └── default/
```

**Impact:**

- Cannot add/remove providers dynamically
- No visual provider discovery

**Remediation:** Implement provider selection UI following Lobe Chat patterns.

---

### Gap 2.3: No Model Management UI

**Severity:** 🔴 Critical  
**Location:** N/A (missing feature)

**Current State:**

- Static model dropdown
- No model enabling/disabling
- No model reordering
- No custom model creation

**Target State (based on Lobe Chat):**

```
features/ModelList/
├── index.tsx              # Container with tabs
├── ModelItem.tsx          # Model row with toggle
├── EnabledModelList/      # Enabled models section
├── DisabledModels.tsx     # Disabled models section
├── CreateNewModelModal/   # Add custom model
├── ModelConfigModal/      # Edit model config
└── SortModelModal/        # Reorder models
```

**Impact:**

- Cannot customize model availability per tenant
- No model organization

**Remediation:** Build model management UI with enable/disable and sorting.

---

### Gap 2.4: No Connection Testing UI

**Severity:** 🟡 High  
**Location:** N/A (missing feature)

**Current State:**

- No way to test API credentials
- No connection status indicator

**Target State (based on Lobe Chat):**

```typescript
// Checker.tsx component
- Model dropdown (sorted intelligently)
- "Test Connection" button
- Loading state with spinner
- Success indicator (green checkmark)
- Error modal with JSON details
```

**Impact:**

- Users cannot verify credentials before saving
- Debugging credential issues difficult

**Remediation:** Implement connection testing component.

---

### Gap 2.5: No Provider Configuration Form

**Severity:** 🔴 Critical  
**Location:** N/A (missing feature)

**Current State:**

- AI Settings Step only has model dropdown
- No baseURL configuration
- No provider-specific settings (e.g., AWS regions for Bedrock)

**Target State (based on Lobe Chat):**

```typescript
ProviderConfig/
├── index.tsx              # Dynamic form based on provider settings
├── Checker.tsx            # Connection test
├── EnableSwitch.tsx       # Provider enable toggle
├── OAuthDeviceFlowAuth/   # OAuth authentication
└── UpdateProviderInfo/    # Custom provider editor
```

**Impact:**

- Cannot configure custom OpenAI-compatible endpoints
- No OAuth support
- Limited provider customization

**Remediation:** Build dynamic provider configuration form.

---

### Gap 2.6: No Budget Management UI

**Severity:** 🟡 High  
**Location:** N/A (missing feature)

**Current State:**

- Billing hook checks budget but no UI to configure it
- No budget alerts or limits configuration

**Target State:**

- Budget configuration per tenant
- Usage tracking dashboard
- Alert thresholds
- Hard/soft limit enforcement

**Impact:**

- Cannot control AI spending
- No cost visibility

**Remediation:** Build budget management UI.

---

## 3. Multi-Tenant Safety Gaps

### Gap 3.1: No Credential UI for Tenant Switching

**Severity:** 🟡 High  
**Location:** `packages/agent-runtime/src/utils/credentials.ts`

**Current State:**

- AsyncLocalStorage provides tenant context
- No UI for agency partners to manage credentials across tenants

**Target State:**

- Agency dashboard showing all client tenants
- Credential configuration per tenant
- Bulk credential updates

**Impact:**

- Agency partners cannot efficiently manage multiple clients
- Violates business architecture §6.2 (agency multi-tenant oversight)

**Remediation:** Build agency credential management dashboard.

---

### Gap 3.2: No Audit Logging UI

**Severity:** 🟡 High  
**Location:** `packages/agent-runtime/src/hooks/structured-logging.ts`

**Current State:**

- Structured logging hook exists
- Logs include tenant context
- No UI to view audit logs

**Target State:**

- Audit log viewer with tenant filtering
- AI usage history
- Credential access logs

**Impact:**

- Cannot audit AI usage
- Difficult to debug tenant-specific issues

**Remediation:** Build audit log viewer UI.

---

### Gap 3.3: No Cache Key Inspection Tool

**Severity:** 🟢 Medium  
**Location:** N/A (missing feature)

**Current State:**

- Credential caching with TTL
- No visibility into cached credentials
- No cache invalidation UI

**Target State:**

- Cache inspector showing tenant-scoped keys
- Manual cache invalidation
- Cache hit/miss metrics

**Impact:**

- Difficult to debug credential caching issues
- Stale credentials may persist

**Remediation:** Add cache management tools.

---

### Gap 3.4: No Concurrent Request Testing

**Severity:** 🟢 Medium  
**Location:** N/A (missing test)

**Current State:**

- AsyncLocalStorage context propagation implemented
- No test verifying isolation under concurrent load

**Target State:**

- Load test with multiple tenants making simultaneous requests
- Verification that tenant context never leaks

**Impact:**

- Tenant isolation not verified under load
- Risk of cross-tenant data leakage

**Remediation:** Add concurrent tenant isolation tests.

---

## 4. Error System Gaps

### Gap 4.1: No Error Translation Frontend

**Severity:** 🟢 Medium  
**Location:** `packages/agent-runtime/src/errors/core-integration.ts`

**Current State:**

- Error codes map to AppFault
- i18n message keys defined
- No frontend error translator

**Target State:**

```typescript
// Frontend error translator
function translateAgentRuntimeFault(fault: AgentRuntimeFault): string {
  return i18n.t(`errors.agentRuntime.${fault.code}`, {
    providerId: fault.providerId,
    modelId: fault.modelId,
  });
}
```

**Impact:**

- Users see technical error messages
- No localization

**Remediation:** Implement frontend error translator.

---

### Gap 4.2: No Error Monitoring Dashboard

**Severity:** 🟢 Medium  
**Location:** N/A (missing feature)

**Current State:**

- Errors logged with tenant context
- No dashboard for error tracking

**Target State:**

- Error rate per provider
- Error trends over time
- Tenant-specific error views

**Impact:**

- Difficult to identify provider reliability issues
- No proactive alerting

**Remediation:** Build error monitoring dashboard.

---

## 5. Lifecycle Hook Gaps

### Gap 5.1: No Hook Configuration UI

**Severity:** 🟢 Medium  
**Location:** `packages/agent-runtime/src/core/hook-composition.ts`

**Current State:**

- Hooks composed programmatically
- No UI to enable/disable hooks
- No hook configuration per tenant

**Target State:**

- Hook configuration per tenant
- Enable/disable tracing, billing, logging
- Hook execution order customization

**Impact:**

- Cannot customize hook behavior per tenant
- All tenants get same hooks

**Remediation:** Add hook configuration to tenant settings.

---

### Gap 5.2: No Langfuse/Langsmith UI Configuration

**Severity:** 🟢 Medium  
**Location:** `packages/agent-runtime/src/hooks/langfuse.ts`, `langsmith.ts`

**Current State:**

- Tracing hooks require API keys set via env vars
- No UI for configuring tracing credentials

**Target State:**

- Tracing configuration form
- API key input with encryption
- Trace viewer integration

**Impact:**

- Tenants cannot use their own tracing accounts
- Tracing credentials not tenant-scoped

**Remediation:** Build tracing configuration UI.

---

### Gap 5.3: No Graceful Shutdown UI

**Severity:** 🟢 Low  
**Location:** `packages/agent-runtime/src/lifecycle.ts`

**Current State:**

- LifecycleController has drain() method
- No UI to trigger graceful shutdown
- No visibility into in-flight requests

**Target State:**

- Admin panel showing active agents
- Manual drain trigger
- In-flight request count

**Impact:**

- Difficult to perform maintenance
- No visibility into agent state

**Remediation:** Add agent lifecycle dashboard.

---

## 6. Documentation Gaps

### Gap 6.1: No Provider Addition Guide

**Severity:** 🟢 Medium  
**Location:** N/A (missing documentation)

**Current State:**

- No documentation on adding new providers
- Lobe Chat has clear patterns but not documented for this codebase

**Target State:**

```markdown
# Adding a New AI Provider

1. Create provider implementation extending BaseProvider
2. Register provider in initialization
3. Add provider card to UI
4. Configure credential fields
5. Test connection
```

**Impact:**

- Developers unclear on provider addition process
- Inconsistent provider implementations

**Remediation:** Write provider addition guide.

---

### Gap 6.2: No Tenant Configuration Schema Documentation

**Severity:** 🟢 Medium  
**Location:** N/A (missing documentation)

**Current State:**

- TenantConfig exists but AI settings not documented
- No schema reference

**Target State:**

```typescript
interface TenantAIConfig {
  defaultProvider: string;
  defaultModel: string;
  fallbackProviders: string[];
  budget: {
    monthlyLimit: number;
    alertThreshold: number;
  };
  // ...
}
```

**Impact:**

- Unclear what AI settings are tenant-configurable
- No schema reference for developers

**Remediation:** Document tenant AI configuration schema.

---

## Summary: Critical Path Gaps

### Must Fix Before Phase 2 (Provider Expansion)

1. **Remove hardcoded providers** from `agent-factory.ts` (Gap 1.1)
2. **Expand API schema** to allow all providers (Gap 1.2)
3. **Dynamic model discovery** (Gap 1.5)
4. **Credential management UI** (Gap 2.1)
5. **Provider selection UI** (Gap 2.2)
6. **Provider registration at startup** (Gap 1.4)

### Must Fix Before Phase 3 (Migration)

7. **Model management UI** (Gap 2.3)
8. **Connection testing UI** (Gap 2.4)
9. **Provider configuration form** (Gap 2.5)
10. **Tenant credential isolation verification** (Gap 3.1)
11. **Concurrent request testing** (Gap 3.4)

### Should Fix Before Phase 4 (Advanced Features)

12. **Provider capability detection** (Gap 1.7)
13. **Cost tracking/visibility** (Gap 1.8)
14. **Budget management UI** (Gap 2.6)
15. **Error translation frontend** (Gap 4.1)
16. **Audit logging UI** (Gap 3.2)

---

## Next Steps

1. **Prioritize gaps** with product team input
2. **Create implementation tasks** for each gap
3. **Estimate effort** per remediation task
4. **Define acceptance criteria** for each fix
5. **Schedule into phases** (Phase 1-4)

---

**Document Version:** 1.0  
**Status:** Draft for review  
**Next Review:** After implementation planning
