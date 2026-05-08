# Legacy Agents Migration Guide

Migrate from deprecated `specialized-marketing-agents.ts` to the new `InsightAgentFactory`.

## Overview

The legacy `specialized-marketing-agents.ts` module has been **deleted** as part of the configurable agents implementation. All consumers must migrate to use `InsightAgentFactory`.

### What Changed

| Aspect                 | Legacy                      | New                                |
| ---------------------- | --------------------------- | ---------------------------------- |
| **Agent creation**     | Hardcoded factory functions | Configurable from database         |
| **Provider selection** | Hardcoded provider IDs      | Tenant-configured providers        |
| **System messages**    | Static templates            | Dynamic, per-insight configuration |
| **Tool selection**     | Fixed per agent             | Dynamic based on insight config    |
| **Output format**      | Implicit                    | Explicit with schema validation    |

## Migration Steps

### Step 1: Identify Your Use Case

Find which legacy agent you were using:

```typescript
// ❌ Legacy imports (no longer exist)
import {
  createSeoAnalysisAgent,
  createContentStrategyAgent,
  createSocialMediaAgent,
  createPPCOptimizerAgent,
} from "./specialized-marketing-agents";
```

### Step 2: Migrate to InsightAgentFactory

Replace hardcoded agent creation with configurable factory:

#### Before (Legacy)

```typescript
import { createSeoAnalysisAgent } from "./specialized-marketing-agents";

const agent = createSeoAnalysisAgent({
  tenantId: "tenant-123",
  apiKey: "sk-...",
});

const result = await agent.analyze({
  domain: "example.com",
  keywords: ["marketing", "seo"],
});
```

#### After (New)

```typescript
import { InsightAgentFactory } from "@agenticverdict/agent-runtime";

const agent = await InsightAgentFactory.create({
  insightId: "seo-analysis",
  tenantId: "tenant-123",
  // Configuration can come from database or inline
  config: {
    systemMessage: `You are an SEO analysis expert. Analyze the provided 
    domain and keywords to identify optimization opportunities.`,
    tools: ["web-scraper", "keyword-analyzer", "competitor-tracker"],
    outputFormat: {
      type: "json",
      schema: seoAnalysisSchema,
    },
    memory: "none", // or 'conversation'
  },
});

const result = await agent.invoke({
  domain: "example.com",
  keywords: ["marketing", "seo"],
});
```

### Step 3: Update Configuration Storage

Legacy agents had configuration hardcoded. New agents use database storage:

```typescript
import { db } from "@agenticverdict/database";
import { insights } from "@agenticverdict/database/schema";

// Insert insight configuration
await db.insert(insights).values({
  id: "seo-analysis",
  name: "SEO Analysis",
  description: "Analyze website SEO performance",
  config: {
    systemMessage: "You are an SEO analysis expert...",
    tools: ["web-scraper", "keyword-analyzer"],
    outputFormat: {
      type: "json",
      schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          issues: { type: "array" },
          recommendations: { type: "array" },
        },
      },
    },
  },
});
```

### Step 4: Update Tests

Migrate tests to use the new factory:

#### Before

```typescript
import { createSeoAnalysisAgent } from "./specialized-marketing-agents";

describe("SEO Analysis Agent", () => {
  it("analyzes domain", async () => {
    const agent = createSeoAnalysisAgent({ tenantId: "test" });
    const result = await agent.analyze({ domain: "example.com" });
    expect(result.score).toBeDefined();
  });
});
```

#### After

```typescript
import { InsightAgentFactory } from "@agenticverdict/agent-runtime";

describe("SEO Analysis Agent", () => {
  it("analyzes domain", async () => {
    const agent = await InsightAgentFactory.create({
      insightId: "seo-analysis",
      config: {
        systemMessage: "You are an SEO analysis expert...",
        tools: ["web-scraper"],
        outputFormat: { type: "json", schema: seoAnalysisSchema },
      },
    });

    const result = await agent.invoke({ domain: "example.com" });
    expect(result.score).toBeDefined();
  });
});
```

## Migration Examples

### Example 1: SEO Analysis Agent

**Legacy:**

```typescript
const agent = createSeoAnalysisAgent({ tenantId, apiKey });
const report = await agent.analyze({ domain, keywords });
```

**New:**

```typescript
const agent = await InsightAgentFactory.create({
  insightId: "seo-analysis",
  config: {
    systemMessage: "Analyze SEO performance and provide recommendations.",
    tools: ["web-scraper", "keyword-analyzer", "rank-tracker"],
    outputFormat: {
      type: "json",
      schema: {
        type: "object",
        properties: {
          overallScore: { type: "number" },
          technicalIssues: { type: "array" },
          contentIssues: { type: "array" },
          recommendations: { type: "array" },
        },
        required: ["overallScore", "recommendations"],
      },
    },
  },
});

const report = await agent.invoke({ domain, keywords });
```

### Example 2: Content Strategy Agent

**Legacy:**

```typescript
const agent = createContentStrategyAgent({ tenantId, apiKey });
const strategy = await agent.plan({ topics, audience });
```

**New:**

```typescript
const agent = await InsightAgentFactory.create({
  insightId: "content-strategy",
  config: {
    systemMessage: "Create comprehensive content strategies for the target audience.",
    tools: ["trend-analyzer", "audience-researcher", "content-planner"],
    outputFormat: {
      type: "json",
      schema: {
        type: "object",
        properties: {
          contentPillars: { type: "array" },
          topicClusters: { type: "array" },
          calendar: { type: "array" },
          kpis: { type: "object" },
        },
      },
    },
  },
});

const strategy = await agent.invoke({ topics, audience });
```

### Example 3: Social Media Agent

**Legacy:**

```typescript
const agent = createSocialMediaAgent({ tenantId, apiKey });
const posts = await agent.generate({ platform, campaign });
```

**New:**

```typescript
const agent = await InsightAgentFactory.create({
  insightId: "social-media",
  config: {
    systemMessage: "Generate engaging social media posts optimized for each platform.",
    tools: ["trend-tracker", "hashtag-optimizer", "image-suggester"],
    outputFormat: {
      type: "json",
      schema: {
        type: "object",
        properties: {
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                platform: { type: "string" },
                content: { type: "string" },
                hashtags: { type: "array" },
                scheduledTime: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

const posts = await agent.invoke({ platform, campaign });
```

### Example 4: PPC Optimizer Agent

**Legacy:**

```typescript
const agent = createPPCOptimizerAgent({ tenantId, apiKey });
const optimization = await agent.optimize({ campaigns, budget });
```

**New:**

```typescript
const agent = await InsightAgentFactory.create({
  insightId: "ppc-optimization",
  config: {
    systemMessage: "Optimize PPC campaigns for maximum ROI within budget constraints.",
    tools: ["bid-optimizer", "keyword-researcher", "ad-copy-analyzer"],
    outputFormat: {
      type: "json",
      schema: {
        type: "object",
        properties: {
          bidAdjustments: { type: "array" },
          keywordRecommendations: { type: "array" },
          budgetAllocation: { type: "object" },
          projectedROI: { type: "number" },
        },
      },
    },
  },
});

const optimization = await agent.invoke({ campaigns, budget });
```

## Configuration Options

### System Message

Customize the agent's behavior with a system message:

```typescript
{
  systemMessage: `You are a {role} expert specializing in {specialty}.
  
Your goals:
1. {goal1}
2. {goal2}
3. {goal3}

Always provide actionable recommendations with supporting data.`;
}
```

### Tools

Select only the tools needed for the insight:

```typescript
{
  tools: [
    "web-scraper", // Fetch web content
    "keyword-analyzer", // Analyze keywords
    "competitor-tracker", // Track competitors
    "trend-analyzer", // Identify trends
  ];
}
```

Available tools depend on your installation. See `packages/agent-runtime/src/tools/` for the complete list.

### Output Format

Enforce structured output with schema validation:

```typescript
{
  outputFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
              description: { type: 'string' },
            },
          },
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['score', 'issues', 'recommendations'],
    },
  },
}
```

### Memory

Choose memory mode:

```typescript
{
  memory: "none"; // Stateless (default)
  // or
  memory: "conversation"; // Maintains conversation history
}
```

## Tenant Configuration Integration

The new factory automatically uses tenant AI configuration:

```typescript
// Tenant config (from database/JWT)
{
  providerOrder: ['anthropic', 'openai'],
  modelOverrides: {
    anthropic: 'claude-3-opus',
  },
}

// Agent creation automatically uses tenant config
const agent = await InsightAgentFactory.create({
  insightId: 'seo-analysis',
  // Provider selection uses tenant config automatically
});
```

## Error Handling

### Legacy Error Handling

```typescript
try {
  const agent = createSeoAnalysisAgent({ tenantId, apiKey });
  await agent.analyze({ domain });
} catch (error) {
  // Generic error
  console.error("Agent failed:", error);
}
```

### New Error Handling

```typescript
try {
  const agent = await InsightAgentFactory.create({ insightId });
  await agent.invoke({ domain });
} catch (error) {
  if (error instanceof ProviderFailoverExhaustedError) {
    // All providers failed
    console.error("All AI providers failed:", error.errors);
  } else if (error instanceof OutputValidationError) {
    // Output didn't match schema
    console.error("Invalid output:", error.validationErrors);
  } else if (error instanceof InsightConfigNotFoundError) {
    // Insight configuration not found
    console.error("Insight not found:", error.insightId);
  } else {
    throw error;
  }
}
```

## Testing Migration

### Unit Tests

```typescript
import { InsightAgentFactory } from "@agenticverdict/agent-runtime";
import { MockProvider } from "@agenticverdict/agent-runtime/testing";

describe("InsightAgentFactory", () => {
  it("creates agent from config", async () => {
    const agent = await InsightAgentFactory.create({
      insightId: "test",
      config: {
        systemMessage: "Test agent",
        tools: [],
        outputFormat: { type: "json", schema: testSchema },
      },
    });

    expect(agent).toBeDefined();
  });

  it("invokes with mock provider", async () => {
    const mockProvider = new MockProvider({
      response: { result: "mocked" },
    });

    const agent = await InsightAgentFactory.create({
      insightId: "test",
      config: {
        systemMessage: "Test",
        tools: [],
        outputFormat: { type: "json", schema: testSchema },
      },
      provider: mockProvider,
    });

    const result = await agent.invoke({ input: "test" });
    expect(result.result).toBe("mocked");
  });
});
```

### Integration Tests

```typescript
import { runWithTenantContext } from "@agenticverdict/core";
import { InsightAgentFactory } from "@agenticverdict/agent-runtime";

describe("InsightAgentFactory Integration", () => {
  it("respects tenant provider preferences", async () => {
    await runWithTenantContext("tenant-123", async () => {
      const agent = await InsightAgentFactory.create({
        insightId: "seo-analysis",
      });

      // Agent uses tenant's configured provider
      const result = await agent.invoke({ domain: "example.com" });
      expect(result).toBeDefined();
    });
  });
});
```

## AST Scan for Legacy References

The CI pipeline includes an AST scan to detect hardcoded provider references:

```bash
# Run AST scan manually
pnpm --filter @agenticverdict/agent-runtime scan:ast

# Or run via CI (automatic on PR)
pnpm run test:scenarios:all
```

The scan checks for:

- Imports from `specialized-marketing-agents`
- Hardcoded provider IDs (`openai`, `anthropic`, etc.)
- Legacy agent factory calls

## Checklist

- [ ] Identify all imports from `specialized-marketing-agents.ts`
- [ ] Replace with `InsightAgentFactory.create()`
- [ ] Update configuration to use database or inline config
- [ ] Migrate tests to new factory pattern
- [ ] Update error handling for new error types
- [ ] Verify tenant configuration integration
- [ ] Run AST scan to verify zero legacy references
- [ ] Run full test suite

## Related Documentation

- [Tenant AI Configuration Guide](./tenant-ai-config-guide.md)
- [Provider Failover Configuration](./provider-failover-config.md)
- [Agent Runtime README](../../packages/agent-runtime/README.md)
- [Configurable Agents Spec](../../openspec/changes/ai-agents/specs/configurable-agents/spec.md)
