# Phase 1: Foundation

**Duration:** 2 weeks  
**Effort:** 15 person-days  
**Dependencies:** None

---

## Goal

Establish configuration-driven provider architecture with zero hardcoded assumptions.

---

## Tasks

### Task 1.1: Provider Registration System

**Priority:** 🔴 Critical  
**Effort:** 2 days  
**Dependencies:** None  
**Files:** `packages/agent-runtime/src/index.ts`, `packages/agent-runtime/src/core/ProviderRegistry.ts`

**Acceptance Criteria:**

- [ ] All 5 providers (openai, anthropic, google, bedrock, openai-compatible) registered at startup
- [ ] `ProviderFactory.listProviders()` returns all registered providers
- [ ] Provider registration test passing

**Implementation:**

```typescript
// packages/agent-runtime/src/index.ts
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GoogleProvider } from "./providers/google";
import { BedrockProvider } from "./providers/bedrock";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";

export function initializeAgentRuntime(): void {
  ProviderFactory.register("openai", OpenAIProvider);
  ProviderFactory.register("anthropic", AnthropicProvider);
  ProviderFactory.register("google", GoogleProvider);
  ProviderFactory.register("bedrock", BedrockProvider);
  ProviderFactory.register("openai-compatible", OpenAICompatibleProvider);
}
```

**Testing:**

- Unit test: Provider registration
- Integration test: Provider creation

---

### Task 1.2: Remove Hardcoded Providers from Agent Factory

**Priority:** 🔴 Critical  
**Effort:** 3 days  
**Dependencies:** Task 1.1  
**Files:** `packages/agent-runtime/src/agent-factory.ts`, `packages/agent-runtime/src/provider-agent.ts`

**Acceptance Criteria:**

- [ ] Zero hardcoded provider IDs in agent-factory.ts
- [ ] Provider selection from tenant config or registry
- [ ] Model selection based on role/capabilities
- [ ] All existing tests passing

**Implementation:**

```typescript
// Replace hardcoded values with config lookup
createChatModels(config: AgentFactoryConfig) {
  const tenantConfig = this.getTenantConfig();
  const providerId = tenantConfig.ai.getProviderForRole(config.role);
  const modelId = tenantConfig.ai.getModelForRole(config.role);

  return {
    providerId,
    modelId,
    fallbackProviderId: tenantConfig.ai.fallbackProvider,
    fallbackModelId: tenantConfig.ai.fallbackModel,
  };
}
```

**Testing:**

- Unit tests for provider selection logic
- Integration tests with mock tenant config

---

### Task 1.3: Dynamic Provider Validation in API Schema

**Priority:** 🔴 Critical  
**Effort:** 2 days  
**Dependencies:** Task 1.1  
**Files:** `apps/api/src/trpc/routers/insights.ts`

**Acceptance Criteria:**

- [ ] Provider field accepts any registered provider
- [ ] Validation error for unregistered providers
- [ ] Schema tests updated

**Implementation:**

```typescript
const insightCreateSchema = z.object({
  aiConfig: z.object({
    model: z.string(),
    provider: z
      .string()
      .refine((providerId) => ProviderFactory.listProviders().includes(providerId), {
        message: "Provider not available",
      }),
    qualityLevel: z.enum(["standard", "premium"]).optional(),
    detailLevel: z.enum(["executive", "standard", "comprehensive"]),
    customPrompt: z.string().optional(),
  }),
});
```

**Testing:**

- API validation tests
- Error message verification

---

### Task 1.4: Tenant AI Configuration Schema

**Priority:** 🔴 Critical  
**Effort:** 3 days  
**Dependencies:** None  
**Files:** `packages/core/src/tenant/config-schema.ts`, `packages/database/src/schema/tenant-config.ts`

**Acceptance Criteria:**

- [ ] TenantAIConfig schema defined with all fields
- [ ] Database schema created with all required fields
- [ ] Default configuration values defined

**Schema:**

```typescript
interface TenantAIConfig {
  defaultProvider: string;
  defaultModel: string;
  fallbackProvider: string;
  fallbackModel: string;
  modelPreferences: {
    analysis?: string;
    insights?: string;
    verdict?: string;
  };
  budget: {
    monthlyLimit: number;
    alertThreshold: number;
    hardLimit: boolean;
  };
  failover: {
    enabled: boolean;
    providers: string[];
    strategy: "sequential" | "round-robin";
  };
}
```

**Testing:**

- Schema validation tests
- Schema evolution tests

---

### Task 1.5: Provider Failover Implementation

**Priority:** 🟡 High  
**Effort:** 3 days  
**Dependencies:** Task 1.2  
**Files:** `packages/agent-runtime/src/core/failover.ts`, `packages/agent-runtime/src/providers/openai/index.ts`

**Acceptance Criteria:**

- [ ] Sequential failover working
- [ ] Circuit breaker integration
- [ ] Failover events logged with tenant context

**Implementation:**

```typescript
export class ProviderFailover {
  async executeWithFailover<T>(
    providers: string[],
    execute: (providerId: string) => Promise<T>,
  ): Promise<T> {
    const errors: Error[] = [];

    for (const providerId of providers) {
      try {
        return await execute(providerId);
      } catch (error) {
        errors.push(error);
        if (!this.isRetryable(error)) {
          throw error; // Non-retryable, don't failover
        }
      }
    }

    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.FAILOVER_EXHAUSTED,
      message: "All providers failed",
      errors,
    });
  }
}
```

**Testing:**

- Failover scenario tests
- Circuit breaker integration tests

---

### Task 1.6: AsyncLocalStorage Context Propagation Verification

**Priority:** 🟡 High  
**Effort:** 2 days  
**Dependencies:** None  
**Files:** `packages/agent-runtime/src/utils/tenant-context.ts`

**Acceptance Criteria:**

- [ ] Concurrent request test with 10+ tenants
- [ ] Zero cross-tenant context leakage
- [ ] Performance benchmark (<1ms overhead)

**Testing:**

```typescript
test("concurrent tenant isolation", async () => {
  const tenants = Array.from({ length: 10 }, (_, i) => `tenant-${i}`);
  const results = await Promise.all(
    tenants.map((tenantId) =>
      credentialManager.runWithTenantContext(tenantId, async () => {
        await sleep(random(10, 100));
        const currentTenant = credentialManager.getTenantId();
        expect(currentTenant).toBe(tenantId);
      }),
    ),
  );
});
```

---

## Phase 1 Deliverables

- [ ] Provider registration system working
- [ ] Zero hardcoded providers in agent-factory
- [ ] Dynamic provider validation in API
- [ ] Tenant AI config schema deployed
- [ ] Provider failover implemented
- [ ] Tenant isolation verified under load

---

## Phase 1 Exit Criteria

- [ ] 85%+ test coverage for new code
- [ ] All Phase 1 tasks complete
- [ ] Security review passed (encryption, tenant isolation)
- [ ] Zero critical bugs

---

## Next Phase

→ Proceed to [Phase 2: Provider Expansion](./02-phase-2-provider-expansion.md)
