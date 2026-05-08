# Agent Architecture Remediation Plan

**Document Type:** Remediation Analysis  
**Date:** 2026-05-05  
**Status:** Draft  
**Approach:** Greenfield Implementation (Destructive)  
**Related Plans:**

- `/docs/plans/ai-provider-migration-plan.md`
- `/docs/plans/ai-provider/01-phase-1-foundation-and-integration.md`
- `/openspec/changes/ai-providers/tasks.md`

---

## Executive Summary

The current implementation in `packages/agent-runtime/src/specialized-marketing-agents.ts` represents a **legacy architectural pattern** that conflicts with the target business architecture. This document provides a comprehensive analysis of the gap and a remediation plan to align the agent implementation with the business architecture requirements for **insight-driven, fully configurable agent behavior**.

**Development Status:** Pre-production greenfield  
**Approach:** Destructive replacement without backward compatibility or migration scripts

### Key Issue

**Hardcoded Marketing-Specific Logic vs. Configurable Insight-Driven Agents**

| Current State                            | Target State                                              |
| ---------------------------------------- | --------------------------------------------------------- |
| Marketing-specific hardcoded agent kinds | Generic agent runtime with insight-scoped configuration   |
| Fixed prompt templates per agent kind    | Dynamic system messages from insight config               |
| No support for per-insight customization | Full customization (system message, quality, tools, etc.) |
| Agent behavior determined at code level  | Agent behavior determined at configuration level          |
| Tied to marketing domain                 | Domain-agnostic, reusable across all business domains     |

### Destructive Approach Decision

This is a **greenfield pre-production codebase** with no live users or production data. We will:

- **Destructively replace** `specialized-marketing-agents.ts` with new configurable agent architecture
- **No backward compatibility** layers or compatibility wrappers
- **No migration scripts** for legacy configurations
- **No parallel run** or blue-green deployment
- **Direct deletion** of legacy code after new implementation is complete

**Rationale:** Maintaining legacy code increases technical debt and complexity. Destructive approach ensures clean architecture from launch.

---

## 1. Current State Assessment

### 1.1 File Analysis: `specialized-marketing-agents.ts`

**Location:** `packages/agent-runtime/src/specialized-marketing-agents.ts`  
**Lines of Code:** 190  
**Primary Functions:**

- `buildSpecializedMarketingFactoryConfig()` - Builds agent config for marketing roles
- `createSpecializedMarketingTestAgent()` - Creates test agent with mock LLM
- `createSpecializedMarketingProductionAgent()` - Creates production agent with real providers

### 1.2 Architectural Violations

#### 1.2.1 Business Architecture Section 2.4: Insight Configuration

**Requirement:**

> Insights are fully configurable business entities that define: AI Configuration (model selection, quality level, detail level, **system messages**, **agent behavior**)

**Violation:**

```typescript
// Line 47-54: Hardcoded agent kind to role mapping
const KIND_ROLE: Record<SpecializedMarketingAgentKind, AgentLlmRole> = {
  cross_platform_analysis: "analysis",
  marketing_insight_generation: "insights",
  media_verdict: "verdict",
};

// Line 49-54: Fixed template IDs per kind
const KIND_TEMPLATE_ID: Record<SpecializedMarketingAgentKind, string> = {
  cross_platform_analysis: "analysis.cross_platform_overview",
  marketing_insight_generation: "insight.anomaly_scan",
  media_verdict: "verdict.recommendation_synthesis",
};
```

**Impact:** Agent behavior is determined by code, not by insight configuration. Cannot support custom agent behaviors per insight.

#### 1.2.2 Business Architecture Section 9.1: Self-Service Configuration

**Requirement:**

> Self-service intelligence: Create Insights without IT dependency. Flexible configuration: Choose exactly which metrics matter. **AI customization: Use system defaults or tailor AI settings.**

**Violation:**

```typescript
// Line 119-130: Hardcoded specialization strings
const specialization =
  kind === "cross_platform_analysis"
    ? "\n\nSpecialization: cross-platform marketing analysis..."
    : kind === "marketing_insight_generation"
      ? "\n\nSpecialization: marketing insight generation..."
      : "\n\nSpecialization: media verdict synthesis...";
```

**Impact:** Users cannot customize agent behavior, system messages, or specializations without code changes.

#### 1.2.3 Business Architecture Section 1: Multi-Domain Support

**Requirement:**

> Unified Intelligence: Single platform for **marketing, finance, operations, and other domains**

**Violation:**

- File name: `specialized-**marketing**-agents.ts`
- All agent kinds reference marketing-specific use cases
- No support for finance, operations, or other domain agents

**Impact:** Architecture does not scale to non-marketing domains as specified in business architecture.

### 1.3 Code-Level Issues

| Issue                                   | Severity | Location                         |
| --------------------------------------- | -------- | -------------------------------- |
| Hardcoded agent kind enum               | High     | Line 38-41                       |
| Fixed role mapping                      | High     | Line 47-54                       |
| Template ID coupling                    | High     | Line 49-54                       |
| Marketing-specific specialization logic | High     | Line 119-130                     |
| JSON verdict suffix hardcoded           | Medium   | Line 20-36                       |
| No insight configuration integration    | Critical | Entire file                      |
| No support for custom system messages   | Critical | `buildSpecializedSystemPolicy()` |
| No domain-agnostic abstraction          | High     | Entire file structure            |

---

## 2. Gap Analysis

### 2.1 Business Architecture Requirements vs. Current Implementation

| Requirement                     | Status     | Gap Description                                     |
| ------------------------------- | ---------- | --------------------------------------------------- |
| Per-insight agent customization | ❌ Missing | Agent behavior is hardcoded, not insight-scoped     |
| Dynamic system messages         | ❌ Missing | Templates are fixed per agent kind                  |
| Quality level configuration     | ⚠️ Partial | Passed via factory config but not insight-driven    |
| Tool configuration per insight  | ⚠️ Partial | Tools are shared across all agent kinds             |
| Domain-agnostic agent runtime   | ❌ Missing | Tied to marketing domain in naming and logic        |
| Template-based initialization   | ⚠️ Partial | Templates exist but are not insight-configurable    |
| Full customization preserved    | ❌ Missing | No mechanism to override agent behavior per insight |

### 2.2 Root Cause Analysis

**Primary Root Cause:**
The agent implementation was designed for a **fixed set of marketing use cases** rather than a **configurable, insight-driven architecture**.

**Contributing Factors:**

1. **Tight coupling between agent kind and behavior** - Agent kind enum determines all behavior
2. **No insight configuration schema for agent behavior** - Insights cannot specify custom agent parameters
3. **Template system is rigid** - Templates are selected by enum, not by insight configuration
4. **Domain-specific naming** - "Marketing" in file name and types prevents reuse

---

## 3. Target Architecture

### 3.1 Design Principles

1. **Insight-Driven Configuration** - Agent behavior is defined by insight configuration, not code
2. **Domain Agnosticism** - Agent runtime works for marketing, finance, operations, and any future domain
3. **Full Customization** - Every aspect of agent behavior is configurable (system message, tools, quality, models)
4. **Template-Based with Overrides** - Templates provide defaults, but all properties are overrideable
5. **Backward Compatibility** - Existing marketing agent functionality preserved through configuration

### 3.2 Target Component Structure

```
packages/agent-runtime/src/
├── specialized-agents/
│   ├── marketing-agents.ts (legacy, to be deleted)
│   └── index.ts (legacy exports)
│
├── configurable-agents/
│   ├── InsightAgentConfig.ts (NEW - insight-scoped config schema)
│   ├── InsightAgentFactory.ts (NEW - factory for configurable agents)
│   ├── InsightAgentRuntime.ts (NEW - runtime with dynamic behavior)
│   └── index.ts (NEW - public API)
│
└── prompts/
    ├── templates/ (existing template system)
    └── dynamic-prompts.ts (NEW - runtime prompt generation)
```

### 3.3 New Configuration Schema

```typescript
// packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts

export interface InsightAgentConfig {
  /** Unique identifier for this agent configuration */
  id: string;

  /** Insight ID this agent is configured for */
  insightId: string;

  /** Tenant ID for multi-tenancy */
  tenantId: string;

  /** Display name for this agent (user-facing) */
  name: string;

  /** Agent domain (marketing, finance, operations, etc.) */
  domain: string;

  /** System message/policy for the agent (fully customizable) */
  systemMessage: string;

  /** Optional template ID for initialization */
  templateId?: string;

  /** Template version (semver) */
  templateVersion?: string;

  /** AI model configuration */
  model: {
    providerId: string;
    modelId: string;
    qualityLevel: "standard" | "premium" | "economy";
    detailLevel: "executive" | "standard" | "comprehensive";
  };

  /** Tool configuration */
  tools: {
    enabled: string[]; // List of enabled tool IDs
    config?: Record<string, unknown>; // Per-tool configuration
  };

  /** Memory configuration */
  memory: {
    mode: "none" | "short-term" | "long-term";
    maxTokens?: number;
  };

  /** Custom parameters passed to prompts */
  promptVariables: Record<string, string>;

  /** Output format configuration */
  output: {
    format: "json" | "text" | "markdown";
    schema?: Record<string, unknown>; // JSON schema for structured output
  };

  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### 3.4 New Factory Pattern

```typescript
// packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts

export class InsightAgentFactory {
  /**
   * Creates an agent based on insight configuration
   */
  async createAgent(config: InsightAgentConfig): Promise<IAgent> {
    // 1. Resolve template if specified
    const systemMessage = await this.resolveSystemMessage(config);

    // 2. Build factory config from insight config
    const factoryConfig: AgentFactoryConfig = {
      role: "configurable",
      systemPolicy: systemMessage,
      model: config.model,
      memoryMode: config.memory.mode,
      runtimeMode: "production",
    };

    // 3. Select tools based on config
    const tools = this.selectTools(config.tools);

    // 4. Create agent with dynamic behavior
    return this.factory.createAgentWithTools(factoryConfig, tools);
  }

  /**
   * Creates agent from template with overrides
   */
  async createAgentFromTemplate(
    templateId: string,
    overrides: Partial<InsightAgentConfig>,
  ): Promise<IAgent> {
    const template = await this.loadTemplate(templateId);
    const config = this.mergeTemplateWithOverrides(template, overrides);
    return this.createAgent(config);
  }
}
```

---

## 4. Implementation Strategy

### 4.1 Destructive Replacement Approach

```
Phase A: New Implementation (2 weeks)
  - Build configurable agent system from scratch
  - No compatibility with legacy marketing agents
  - Direct implementation of InsightAgentConfig and InsightAgentFactory

Phase B: Testing & Validation (1 week)
  - Unit tests for new configurable agent system
  - Integration tests with insight configurations
  - Validate against business architecture requirements

Phase C: Destructive Cleanup (2 days)
  - Delete specialized-marketing-agents.ts
  - Remove all legacy imports and references
  - Update documentation
```

### 4.2 No Backward Compatibility

**Decision:** Zero backward compatibility layers

**Rationale:**

- Pre-production codebase with no live users
- No production data or tenant configurations to migrate
- Legacy code is technical debt that complicates future development
- Clean architecture from launch is higher priority than preserving legacy patterns

**What We Will NOT Do:**

- ❌ No compatibility wrappers
- ❌ No migration scripts for legacy configs
- ❌ No parallel run or comparison testing
- ❌ No deprecation warnings or gradual rollout
- ❌ No feature flags for legacy vs new system

**What We Will Do:**

- ✅ Direct destructive replacement
- ✅ Delete legacy code immediately after new implementation
- ✅ Update all consumers to use new system
- ✅ Comprehensive tests for new architecture only

---

## 5. Risk Assessment

### 5.1 Technical Risks

| Risk                            | Probability | Impact | Mitigation                                     |
| ------------------------------- | ----------- | ------ | ---------------------------------------------- |
| New implementation has bugs     | Medium      | High   | Comprehensive unit + integration tests         |
| Missing edge cases from legacy  | Low         | Medium | Manual code review of legacy before deletion   |
| Template resolution performance | Low         | Medium | Cache resolved templates with TTL              |
| Configuration schema complexity | Medium      | Medium | Provide default configs and validation helpers |

### 5.2 Business Risks

| Risk                  | Probability | Impact | Mitigation                       |
| --------------------- | ----------- | ------ | -------------------------------- |
| None - pre-production | N/A         | N/A    | No live users or production data |

---

## 6. Implementation Tasks

### 6.1 New Implementation Tasks

Add to `/openspec/changes/ai-providers/tasks.md`:

```markdown
## 5. Phase 5: Configurable Agent Architecture (Weeks 13-15)

### Insight Agent Configuration Schema

- [ ] 5.1 Create `InsightAgentConfig` interface in `packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts`
- [ ] 5.2 Define Zod schema for validation in `packages/config/src/schemas/insight-agent-config.ts`
- [ ] 5.3 Create database schema for insight agent configurations in `packages/database/src/schema/insight-agent-config.ts`
- [ ] 5.4 Write schema validation tests with 90%+ coverage

### Configurable Agent Factory

- [ ] 5.5 Implement `InsightAgentFactory` class in `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts`
- [ ] 5.6 Implement template resolution with overrides
- [ ] 5.7 Implement dynamic tool selection based on insight config
- [ ] 5.8 Write factory unit tests with mock insight configurations

### Dynamic Prompt Generation

- [ ] 5.9 Implement runtime prompt generation from insight config in `packages/agent-runtime/src/prompts/dynamic-prompts.ts`
- [ ] 5.10 Support custom system messages per insight (full override capability)
- [ ] 5.11 Implement prompt variable injection from `InsightAgentConfig.promptVariables`
- [ ] 5.12 Write prompt generation tests with template override scenarios

### Consumer Updates

- [ ] 5.13 Update `apps/api/src/trpc/routers/insights.ts` to use configurable agents
- [ ] 5.14 Update `apps/worker/src/jobs/insight-runner.ts` agent creation logic
- [ ] 5.15 Update test fixtures and mocks in `packages/agent-runtime/tests/`
- [ ] 5.16 Update documentation

### Destructive Legacy Removal

- [ ] 5.17 Delete `packages/agent-runtime/src/specialized-marketing-agents.ts`
- [ ] 5.18 Remove all imports of `specialized-marketing-agents.ts` across codebase
- [ ] 5.19 Remove legacy types and exports from `packages/agent-runtime/src/index.ts`
- [ ] 5.20 Verify zero legacy references remain via AST scan
- [ ] 5.21 Run full test suite to ensure all tests pass after deletion

### Phase 5 Testing & Validation

- [ ] 5.22 Achieve 85%+ test coverage for new configurable agent system
- [ ] 5.23 Verify support for non-marketing domains (finance, operations examples)
- [ ] 5.24 Validate insight-driven agent customization end-to-end
- [ ] 5.25 Performance benchmark (<5ms overhead for dynamic configuration)
```

### 6.2 Updated Phase 1 Task 1.7

**Current Task 1.7:** "Integrate Specialized Marketing Agents"

**Replace with:**

````markdown
### Task 1.7: Implement Configurable Agent Architecture Foundation

**Priority:** 🔴 Critical  
**Effort:** 5 days  
**Dependencies:** Task 1.2 (Remove Hardcoded Providers)  
**Files:**

- `packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts` (NEW)
- `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts` (NEW)
- `packages/agent-runtime/src/specialized-marketing-agents.ts` (LEGACY - to be deleted)

**Acceptance Criteria:**

- [ ] `InsightAgentConfig` schema defined with all configurable fields
- [ ] `InsightAgentFactory` creates agents from insight configuration
- [ ] Support for custom system messages per insight
- [ ] Support for dynamic tool selection
- [ ] Backward compatibility wrapper for legacy marketing agents
- [ ] All existing marketing agent tests passing via compatibility layer

**Implementation:**

```typescript
// New configurable agent creation
const agent = await InsightAgentFactory.createAgent({
  insightId: "insight_123",
  name: "Custom Marketing Analysis",
  domain: "marketing",
  systemMessage: tenantConfig.ai.customSystemMessage ?? defaultTemplate,
  model: {
    providerId: tenantConfig.ai.defaultProvider,
    modelId: tenantConfig.ai.defaultModel,
    qualityLevel: "standard",
  },
  tools: { enabled: tenantConfig.ai.enabledTools ?? [] },
  memory: { mode: "none" },
  promptVariables: tenantConfig.ai.promptVariables ?? {},
});

// Legacy compatibility (temporary)
const legacyAgent = createLegacyMarketingAgentWrapper("cross_platform_analysis", options);
```
````

**Testing:**

- Unit tests for InsightAgentFactory
- Integration tests with mock insight configs
- Backward compatibility tests (legacy vs new output comparison)

**Links:**

- [Remediation Plan](/docs/plans/ai-provider/agent-architecture-remediation.md)
- [Business Architecture](/docs/architecture/business/business-architecture.md#24-insight-configuration)

```

---

## 7. Success Criteria

### 7.1 Technical Success Criteria

- [ ] Zero hardcoded agent behaviors in production code
- [ ] All agent behavior driven by insight configuration
- [ ] Support for custom system messages per insight
- [ ] Support for domain-agnostic agents (marketing, finance, operations)
- [ ] 85%+ test coverage for new configurable agent system
- [ ] Zero legacy code references remaining

### 7.2 Business Success Criteria

- [ ] Users can create custom agent behaviors without code changes
- [ ] Insight creation supports full AI customization (system message, quality, tools)
- [ ] Template-based initialization with full override capability
- [ ] Self-service agent configuration (no IT dependency)
- [ ] Support for multiple business domains (not just marketing)

### 7.3 Implementation Success Criteria

- [ ] Legacy code destructively removed
- [ ] All consumers updated to new system
- [ ] Documentation updated with new patterns
- [ ] Team trained on new configurable agent architecture

---

## 8. Timeline

| Phase                      | Duration | Start Date | End Date   |
| -------------------------- | -------- | ---------- | ---------- |
| Phase A: New Implementation| 2 weeks  | Week 13    | Week 14    |
| Phase B: Testing           | 1 week   | Week 15    | Week 15    |
| Phase C: Destructive Cleanup | 2 days | Week 16    | Week 16    |

**Total Duration:** 3.5 weeks
**Total Effort:** ~18 person-days

---

## 9. Related Documents

- [Business Architecture](/docs/architecture/business/business-architecture.md)
- [AI Provider Migration Plan](/docs/plans/ai-provider-migration-plan.md)
- [Phase 1 Implementation Plan](/docs/plans/ai-provider/01-phase-1-foundation-and-integration.md)
- [AI Provider Tasks](/openspec/changes/ai-providers/tasks.md)

---

**Document Version:** 1.0
**Next Review:** After Phase 5 completion
**Maintainer:** Architecture Team
```
