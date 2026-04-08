# Phase 2: Agent Runtime & Intelligence - Detailed Task List

**Phase Duration:** Weeks 5-6 (2 weeks)
**Total Tasks:** 31 tasks across 8 categories
**Status:** In progress
**Last Updated:** 2026-04-08

---

## Task Categories

1. **LangChain Integration & Configuration** (4 tasks)
2. **Agent Tool Definitions** (5 tasks)
3. **Prompt Template System** (3 tasks)
4. **Agent Creation Patterns** (3 tasks)
5. **Retry & Fallback Strategies** (2 tasks)
6. **Specialized Agents** (6 tasks)
7. **Testing & Validation** (4 tasks)
8. **HTTP API & external contracts** (4 tasks) — specifications in [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md); implementation tracked under [Remediation Plan](/docs/03-development-phases/REMEDIATION_PLAN.md) **R-1–R-6**
9. **Workflow processors & queue orchestration** (4 tasks)

---

## Category 1: LangChain Integration & Configuration

### Task 1.1: LangChain.js Project Setup and Configuration

**Description:** Initialize LangChain.js within the monorepo, configure TypeScript support, and set up the basic runtime environment with multi-provider support.

**Acceptance Criteria:**

- [ ] LangChain.js packages installed in appropriate workspace package
- [ ] TypeScript configuration supports LangChain types
- [ ] Environment variables for LLM API keys configured
- [ ] Basic LangChain integration test passes
- [ ] Documentation for local development setup

**Estimated Effort:** 4 hours

**Dependencies:**

- Phase 0: Monorepo structure complete
- Phase 0: Configuration management system operational

**Technical Details:**

```typescript
// Required packages
@langchain/core
@langchain/langgraph
@langchain/community
@langchain/anthropic
@langchain/openai
langsmith
```

**Deliverables:**

- Package configuration (package.json)
- TypeScript type definitions
- Environment variable schema
- Integration test
- Setup documentation

---

### Task 1.2: Multi-Provider LLM Configuration

**Description:** Configure Claude and GPT-4 as LLM providers, implement provider switching logic, and establish default model configurations for different use cases.

**Acceptance Criteria:**

- [ ] Claude 3.5 Sonnet configured and tested
- [ ] GPT-4 Turbo configured and tested
- [ ] Provider selection strategy implemented
- [ ] Model configuration per agent type defined
- [ ] Cost and performance tracking enabled

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 1.1: LangChain.js setup complete
- Phase 0: Configuration management system

**Provider Strategy:**

- **Primary:** Claude 3.5 Sonnet (complex reasoning, verdict generation)
- **Secondary:** GPT-4 Turbo (faster responses, simple analysis)
- **Fallback:** Automatic switch on API failures

**Deliverables:**

- Provider configuration module
- Model selection logic
- Cost tracking implementation
- Provider testing suite

---

### Task 1.3: LangSmith Observability Integration

**Description:** Integrate LangSmith for agent tracing, prompt debugging, and performance monitoring to enable observability into agent decision-making.

**Acceptance Criteria:**

- [ ] LangSmith SDK configured with API key
- [ ] Automatic tracing enabled for all agent executions
- [ ] Prompt and response logging operational
- [ ] LangSmith dashboard accessible for debugging
- [ ] Trace data retention policy defined

**Estimated Effort:** 4 hours

**Dependencies:**

- Task 1.1: LangChain.js setup complete
- Task 1.2: LLM providers configured

**Observability Requirements:**

- Trace all agent executions
- Log prompts, responses, and tool calls
- Capture timing metrics
- Enable replay for debugging

**Deliverables:**

- LangSmith configuration
- Tracing middleware
- Dashboard setup guide
- Data retention documentation

---

### Task 1.4: Agent Runtime Environment

**Description:** Create the agent runtime environment with proper error handling, context propagation, and resource management for agent execution.

**Acceptance Criteria:**

- [ ] Agent execution context properly initialized
- [ ] Tenant context propagation to agent tools
- [ ] Error boundaries for agent failures
- [ ] Resource cleanup after agent execution
- [ ] Runtime health checks operational

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 1.1: LangChain.js setup complete
- Task 1.2: LLM providers configured
- Phase 0: Tenant context system

**Runtime Requirements:**

- Isolated execution per tenant
- Timeout management
- Memory limits
- Error recovery

**Deliverables:**

- Agent runtime module
- Context propagation logic
- Error handling framework
- Health check implementation

---

## Category 2: Agent Tool Definitions

### Tool Error Handling Contract (All Category 2 Tasks)

**CRITICAL:** All agent tools MUST implement the standardized `ToolResult<T>` contract to ensure consistent error handling across the agent runtime.

**Tool Result Contract:**

```typescript
/**
 * Standardized tool result contract for all agent tools
 * Enables graceful degradation and retry logic
 */
type ToolResult<T> =
  | { success: true; data: T; executionTime: number }
  | {
      success: false;
      error: ToolError;
      retryable: boolean;
      partialResults?: T;
      executionTime: number;
    };

interface ToolError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  originalError?: Error;
}

type ErrorCode =
  | "PLATFORM_AUTH_FAILED" // Non-retryable: credentials invalid
  | "PLATFORM_RATE_LIMITED" // Retryable: exponential backoff
  | "PLATFORM_TIMEOUT" // Retryable: may be transient
  | "PLATFORM_UNAVAILABLE" // Retryable: service down
  | "INVALID_INPUT" // Non-retryable: validation failed
  | "DATA_TRANSFORM_FAILED" // Non-retryable: schema mismatch
  | "CACHE_ERROR" // Retryable: cache failure
  | "UNKNOWN_ERROR"; // Retryable: unexpected error

/**
 * Base tool class with standardized error handling
 */
abstract class BaseTool<TInput, TOutput> {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: z.ZodType<TInput>;

  /**
   * Execute tool with automatic error handling and retry logic
   */
  async execute(input: TInput): Promise<ToolResult<TOutput>> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = this.inputSchema.parse(input);

      // Execute with retry wrapper
      const data = await this.executeWithRetry(validatedInput);

      return {
        success: true,
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return this.handleError(error, startTime);
    }
  }

  /**
   * Core execution logic - override in subclasses
   */
  protected abstract executeLogic(input: TInput): Promise<TOutput>;

  /**
   * Execute with automatic retry for retryable errors
   */
  private async executeWithRetry(input: TInput, attempt = 1): Promise<TOutput> {
    try {
      return await this.executeLogic(input);
    } catch (error) {
      const toolError = this.classifyError(error);

      if (toolError.retryable && attempt < 3) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.executeWithRetry(input, attempt + 1);
      }

      throw toolError;
    }
  }

  /**
   * Classify error to determine retryability
   */
  private classifyError(error: unknown): ToolError {
    if (error instanceof PlatformError) {
      switch (error.code) {
        case "auth_failed":
          return { code: "PLATFORM_AUTH_FAILED", message: error.message, retryable: false };
        case "rate_limited":
          return { code: "PLATFORM_RATE_LIMITED", message: error.message, retryable: true };
        case "timeout":
          return { code: "PLATFORM_TIMEOUT", message: error.message, retryable: true };
        case "unavailable":
          return { code: "PLATFORM_UNAVAILABLE", message: error.message, retryable: true };
        default:
          return { code: "UNKNOWN_ERROR", message: error.message, retryable: true };
      }
    }

    if (error instanceof z.ZodError) {
      return {
        code: "INVALID_INPUT",
        message: `Input validation failed: ${error.issues.map((i) => i.message).join(", ")}`,
        details: { issues: error.issues },
        retryable: false,
      };
    }

    return {
      code: "UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
      retryable: true,
    };
  }

  /**
   * Convert error to ToolResult
   */
  private handleError(error: unknown, startTime: number): ToolResult<TOutput> {
    const toolError = this.classifyError(error);

    return {
      success: false,
      error: toolError,
      retryable: toolError.retryable,
      executionTime: Date.now() - startTime,
    };
  }
}
```

**Usage Example:**

```typescript
class MetaMetricsTool extends BaseTool<MetaMetricsInput, MetaMetricsOutput> {
  name = "fetch_meta_metrics";
  description = "Fetch campaign performance metrics from Meta Ads";

  inputSchema = z.object({
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
    campaignIds: z.array(z.string()).optional(),
  });

  protected async executeLogic(input: MetaMetricsInput): Promise<MetaMetricsOutput> {
    const adapter = await this.platformAdapterRegistry.get("meta", this.tenantId);

    const metrics = await adapter.fetchMetrics({
      dateRange: input.dateRange,
      campaignIds: input.campaignIds,
    });

    return {
      platform: "meta",
      metrics: normalizeMetrics(metrics),
      fetchedAt: new Date().toISOString(),
    };
  }
}

// In agent workflow
const result = await metaTool.execute({ dateRange: { start: "2024-01-01", end: "2024-01-31" } });

if (result.success) {
  console.log("Metrics:", result.data);
} else {
  if (result.retryable) {
    // Agent will retry automatically
    console.warn("Tool failed but retryable:", result.error.message);
  } else {
    // Non-retryable: log and continue with partial results
    console.error("Tool failed permanently:", result.error.message);
    if (result.partialResults) {
      console.log("Using partial results:", result.partialResults);
    }
  }
}
```

---

### Task 2.1: Platform Data Access Tools

**Description:** Implement LangChain tools for fetching data from Meta Ads, GA4, GSC, GBP, and TikTok platforms through Phase 1 adapters.

**Acceptance Criteria:**

- [ ] Meta Ads data fetch tool operational
- [ ] GA4 data fetch tool operational
- [ ] GSC data fetch tool operational
- [ ] GBP data fetch tool operational
- [ ] TikTok Ads data fetch tool operational
- [ ] All tools implement `ToolResult<T>` contract
- [ ] All tools extend `BaseTool<TInput, TOutput>`
- [ ] Retry logic handles rate limits and timeouts
- [ ] Non-retryable errors (auth, validation) fail fast
- [ ] Partial results returned when appropriate
- [ ] Tool output schemas defined and validated
- [ ] Unit tests with ≥85% coverage including error scenarios

**Estimated Effort:** 8 hours

**Dependencies:**

- Task 1.4: Agent runtime environment
- Phase 1: All platform adapters complete

**Tool Specifications:**

All tools MUST:

- Extend `BaseTool<TInput, TOutput>`
- Return `ToolResult<TOutput>` from execute()
- Implement proper error classification
- Support retry for transient failures
- Provide partial results when possible

**Required Tools:**

1. `fetch_meta_metrics` - Campaign performance, spend, conversions
2. `fetch_ga4_metrics` - Website sessions, users, events, conversions
3. `fetch_gsc_metrics` - Search queries, impressions, clicks, CTR
4. `fetch_gbp_metrics` - Local views, searches, reviews, interactions
5. `fetch_tiktok_metrics` - Campaign performance, spend, conversions

**Deliverables:**

- Five platform data tools extending BaseTool
- Tool schema definitions with Zod
- Standardized error handling
- Unit tests for success and error paths

---

### Task 2.2: Database Query Tools

**Description:** Create tools for querying historical metrics, trends, and comparisons from the database through the Phase 0 abstraction layer.

**Acceptance Criteria:**

- [ ] Historical metrics query tool operational
- [ ] Trend analysis query tool operational
- [ ] Period comparison tool operational
- [ ] SQL injection prevention validated
- [ ] Query performance optimized (<500ms)
- [ ] Unit tests with ≥85% coverage

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 1.4: Agent runtime environment
- Phase 0: Database abstraction layer

**Tool Specifications:**

- `query_historical_metrics` - Fetch historical data
- `analyze_trends` - Calculate trends over time
- `compare_periods` - Compare time periods

**Deliverables:**

- Three database query tools
- Query optimization
- Security validation
- Unit tests

---

### Task 2.3: Report Generation Tools

**Description:** Implement tools for generating formatted reports, summaries, and visualizations based on agent analysis.

**Acceptance Criteria:**

- [ ] Summary generation tool operational
- [ ] Report formatting tool operational
- [ ] Chart data preparation tool operational
- [ ] Output validation against schemas
- [ ] Error handling for generation failures
- [ ] Unit tests with ≥85% coverage

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 1.4: Agent runtime environment
- Phase 0: Configuration management

**Tool Specifications:**

- `generate_summary` - Create analysis summary
- `format_report` - Format output for display
- `prepare_chart_data` - Prepare data for visualizations

**Deliverables:**

- Three report generation tools
- Output schema definitions
- Format templates
- Unit tests

---

### Task 2.4: Calculation and Analysis Tools

**Description:** Build tools for performing calculations, statistical analysis, and metric transformations within agent workflows.

**Acceptance Criteria:**

- [ ] Calculation tool (growth rates, averages) operational
- [ ] Statistical analysis tool (correlations, outliers) operational
- [ ] Metric normalization tool operational
- [ ] Precision and rounding handling defined
- [ ] Edge cases handled (division by zero, empty data)
- [ ] Unit tests with ≥85% coverage

**Estimated Effort:** 4 hours

**Dependencies:**

- Task 1.4: Agent runtime environment

**Tool Specifications:**

- `calculate_metrics` - Perform calculations
- `statistical_analysis` - Statistical operations
- `normalize_metrics` - Normalize for comparison

**Deliverables:**

- Three calculation tools
- Mathematical validations
- Edge case handling
- Unit tests

---

### Task 2.5: Company Context Tools

**Description:** Create tools for accessing company-specific context, business rules, and configuration data to personalize agent analysis.

**Acceptance Criteria:**

- [ ] Company profile retrieval tool operational
- [ ] Business rules retrieval tool operational
- [ ] Configuration access tool operational
- [ ] Tenant data isolation validated
- [ ] Caching for frequently accessed context
- [ ] Unit tests with ≥85% coverage

**Estimated Effort:** 4 hours

**Dependencies:**

- Task 1.4: Agent runtime environment
- Phase 0: Tenant context system

**Tool Specifications:**

- `get_company_profile` - Fetch company information
- `get_business_rules` - Retrieve analysis rules
- `get_config` - Access tenant configuration

**Deliverables:**

- Three context tools
- Caching layer
- Data isolation validation
- Unit tests

---

## Category 3: Prompt Template System

### Task 3.1: Base Prompt Template Library

**Description:** Design and implement a library of reusable prompt templates for common agent interactions with proper versioning and testing. Include **industry-specific templates for B2B contexts** like Masafh's fleet tracking domain.

**Acceptance Criteria:**

- [ ] Base template system implemented
- [ ] Templates for each agent type defined
- [ ] Template versioning system operational
- [ ] Template validation and testing
- [ ] Documentation for template creation
- [ ] ≥10 production-ready templates
- [ ] **B2B-specific templates included**
- [ ] **Masafh fleet tracking domain templates included**
- [ ] **Industry parameterization support**

**Estimated Effort:** 10 hours (includes B2B domain templates)

**Dependencies:**

- Task 1.2: Multi-provider LLM configuration

**Template Categories:**

1. **Analysis Templates:** Cross-platform analysis, trend identification
2. **Insight Templates:** Pattern recognition, anomaly detection
3. **Verdict Templates:** Recommendation generation, evidence synthesis
4. **Utility Templates:** Data summarization, comparison
5. **B2B Industry Templates:** Fleet tracking, lead generation, B2B metrics

**Template Structure:**

```typescript
interface PromptTemplate {
  id: string;
  version: string;
  type: "analysis" | "insight" | "verdict" | "utility" | "industry-b2b";
  industry?: "b2c" | "b2b" | "b2g" | "general";
  template: string;
  variables: string[];
  metadata: {
    createdAt: Date;
    author: string;
    tags: string[];
    domain?: string; // e.g., "fleet-tracking", "logistics"
  };
}
```

**Masafh-Specific B2B Prompt Templates:**

```markdown
## Template: B2B Fleet Tracking Marketing Analysis

**ID:** `b2b-fleet-tracking-analysis`
**Industry:** B2B
**Domain:** Fleet Tracking / Logistics

You are a marketing analytics expert specializing in B2B fleet tracking and GPS technology companies. Your task is to analyze marketing performance data for a company that provides GPS fleet tracking devices and SaaS fleet management platforms.

**Company Context (Masafh):**

- **Industry:** B2B GPS Fleet Tracking & SaaS Fleet Management
- **Target Markets:** Logistics and transport companies, car rental companies, educational institutions
- **Primary Product:** GPS fleet tracking devices (Dash Cam H20P, H18P-3CH) with AI-supported cameras
- **Key Value Propositions:**
  - Increases fleet income by 10%+
  - Reduces fuel costs through operational efficiency
  - Prevents waste in stops, fuel, and operations
  - Integrates with Wasl Platform for Saudi regulatory compliance
  - 24-hour installation service, 24/7 field and technical support
- **Region:** Saudi Arabia (Riyadh-based)
- **Business Model:** B2B (selling to businesses, not individual consumers)

**B2B Marketing Focus:**
Unlike B2C marketing, B2B marketing for fleet tracking emphasizes:

- **Lead Quality over Quantity:** One qualified fleet manager lead > 100 individual consumer clicks
- **Sales Cycle:** Longer decision cycles (weeks to months) involving multiple stakeholders
- **Decision Makers:** Fleet managers, operations directors, procurement officers, C-level executives
- **ROI Metrics:** Cost per qualified lead (not just cost per click), lead-to-conversion rate, deal value
- **Trust Signals:** Case studies, testimonials, certifications, compliance (Wasl integration)

**Marketing Platform KPIs for B2B Fleet Tracking:**

**Meta Ads (B2B Context):**

- **Primary Goal:** Generate qualified B2B leads (fleet managers, decision makers)
- **Key Metrics:**
  - Lead quality score (based on job title, company size, fleet size)
  - Cost per qualified lead (CPQL)
  - Lead-to-opportunity rate
  - Form completion rate (not just click-through)
- **Success Indicator:** Leads from companies with 10+ vehicles (minimum viable fleet size)

**GA4 (Website Analytics):**

- **Primary Goal:** Track B2B buyer journey through long sales cycle
- **Key Metrics:**
  - Time on site (B2B buyers research extensively)
  - Pages per session (indicates serious interest)
  - Whitepaper/download completions (lead capture)
  - Request demo form submissions
  - Returning visitor rate (B2B buyers visit multiple times)
- **Success Indicator:** Visitors who engage with pricing or product specification pages

**Google Search Console (SEO):**

- **Primary Goal:** Capture B2B search intent for fleet management solutions
- **Key Metrics:**
  - Rankings for B2B terms: "fleet management system Saudi Arabia", "GPS tracking for logistics"
  - Click-through from commercial investigation queries
  - Local visibility for "fleet tracking Riyadh"
- **Success Indicator:** Traffic from decision-maker roles (based on site behavior)

**Google Business Profile (Local B2B):**

- **Primary Goal:** Local presence for Riyadh-based B2B clients
- **Key Metrics:**
  - Directions requests (indicates serious business intent)
  - Phone calls from businesses
  - Reviews from other B2B companies (credibility)
- **Success Indicator:** Contact requests from logistics companies

**TikTok Ads (Emerging Channel):**

- **Primary Goal:** Brand awareness among logistics decision makers
- **Note:** B2B presence on TikTok is emerging; focus on professional content
- **Key Metrics:** Video completion, profile visits (less focus on immediate conversions)

**Analysis Framework:**

When analyzing performance for this B2B fleet tracking company, consider:

1. **Lead Quality Assessment:**
   - Are we attracting actual B2B decision makers (fleet managers, operations directors)?
   - What percentage of leads represent viable fleets (10+ vehicles)?
   - Are leads geographically relevant (Saudi Arabia focus)?

2. **B2B Sales Cycle Alignment:**
   - Are Meta Ads driving initial awareness effectively?
   - Is GA4 capturing research-phase behaviors (multiple visits, resource downloads)?
   - Is GBP capturing local business intent?
   - Are we seeing alignment across channels (e.g., Meta click → GA4 research → GBP visit)?

3. **ROI for B2B:**
   - Cost per qualified lead by platform
   - Estimated deal value vs. acquisition cost
   - Lifetime value of B2B customers (recurring SaaS revenue + hardware)
   - Which platform delivers the highest-value leads?

4. **Saudi Market Specifics:**
   - Arabic vs. English engagement patterns
   - Regional performance (Riyadh vs. other Saudi cities)
   - Compliance messaging effectiveness (Wasl platform integration)

**Output Format:**
Provide analysis that:

- Identifies which platforms generate the highest-quality B2B leads
- Highlights campaigns/ad sets attracting decision makers vs. general traffic
- Recommends budget allocation to maximize qualified lead generation
- Suggests optimizations for longer B2B sales cycles
- Notes any cultural or regional patterns in Saudi B2B market response

---

## Template: B2B Verdict Generation - Fleet Tracking Context

**ID:** `b2b-verdict-fleet-tracking`
**Type:** Verdict
**Industry:** B2B

You are generating strategic marketing verdicts for a B2B GPS fleet tracking company targeting Saudi Arabian businesses. Your verdicts should emphasize:

**Verdict Structure for B2B Fleet Tracking:**

1. **Overall Verdict:** Positive/Neutral/Negative with B2B justification
2. **Lead Quality Score:** (0-100) Based on:
   - Percentage of leads from viable fleets (10+ vehicles)
   - Decision-maker role match (fleet managers, operations directors)
   - Geographic relevance to Saudi target market

3. **Budget Allocation Recommendations:**
   - Prioritize platforms delivering qualified B2B leads (not just volume)
   - Consider B2B sales cycle length in budget pacing
   - Allocate for remarketing to longer research cycles
   - Balance brand awareness (TikTok) with lead generation (Meta, GBP)

4. **Platform-Specific Recommendations:**

   **Meta Ads (B2B Focus):**
   - Emphasize lead quality over click volume
   - Target B2B job titles (Fleet Manager, Operations Director, Logistics Manager)
   - Use B2B-specific ad formats (lead forms, carousel for product features)
   - Highlight ROI messaging (10%+ fleet income increase, fuel cost reduction)

   **GA4 (B2B Journey):**
   - Optimize for research-behavior signals (time on site, page depth)
   - Track lead magnet performance (whitepapers, case studies)
   - Measure multi-visit conversion paths
   - Identify which content drives serious B2B interest

   **GBP (Local B2B):**
   - Emphasize directions and phone call conversions
   - Highlight B2B customer testimonials
   - Feature Wasl compliance prominently
   - Target Saudi industrial areas and logistics hubs

   **GSC (B2B SEO):**
   - Focus on commercial investigation queries
   - Optimize for "fleet management [city]" terms
   - Create B2B-specific content (case studies, ROI calculators)
   - Target decision-stage keywords with clear B2B intent

5. **Action Items for B2B Marketing Team:**
   - Lead follow-up process for longer sales cycles
   - Content strategy for different B2B buyer stages
   - Account-based marketing campaigns for large fleets
   - Testimonial/case study development for credibility

6. **Cultural Considerations for Saudi Market:**
   - Arabic language messaging quality
   - Religious/cultural observances in campaign timing
   - Local business relationship building (wasta, referrals)
   - Regulatory compliance (Wasl platform) as trust signal

**Confidence Calibration:**

- High confidence (90%+): Data-driven insights from clear B2B metrics
- Medium confidence (70-89%): Trends with limited sample size or new campaigns
- Low confidence (<70%): Extrapolations, seasonal variations, external factors

**Evidence Requirements:**
Every claim must be backed by:

- Platform-specific metrics
- Time-period comparisons (vs. previous period or baseline)
- B2B lead quality indicators
- Regional performance data
```

**Template Versioning Strategy:**

```typescript
interface TemplateVersion {
  id: string;
  version: string; // Semantic versioning (1.0.0)
  previousVersion?: string; // Link to previous version
  changelog: string[]; // What changed
  createdAt: Date;
  createdBy: string;
  deprecatedAt?: Date;
  replacedBy?: string; // New template ID if deprecated
}

// Version categories:
// - MAJOR: Breaking changes to template structure or output format
// - MINOR: Additions, variables, or improvements (backward compatible)
// - PATCH: Bug fixes, minor wording improvements
```

**Deliverables:**

- Template library module with B2B support
- Industry parameterization system
- Version control system with changelogs
- Masafh-specific B2B templates (2 templates included above)
- Template documentation with B2B examples
- Initial template set (≥10 templates)

---

### Task 3.2: Company Context Injection System

**Description:** Implement dynamic injection of company-specific context into prompt templates to personalize agent analysis and recommendations.

**Acceptance Criteria:**

- [ ] Context injection framework operational
- [ ] Company profile data integrated into prompts
- [ ] Business rules injected appropriately
- [ ] Context relevance validated
- [ ] Prompt length management (token limits)
- [ ] Testing with diverse company profiles

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 3.1: Base prompt template library
- Task 2.5: Company context tools

**Context Data:**

- Company industry and size
- Business model and goals
- Historical performance benchmarks
- Customer segments and markets
- Known constraints and requirements

**Injection Strategy:**

- Pre-pend context to system messages
- Format context for clarity
- Prioritize critical context
- Manage token budget

**Deliverables:**

- Context injection module
- Context prioritization logic
- Token budget management
- Testing with sample companies

---

### Task 3.3: Prompt A/B Testing Framework

**Description:** Build a framework for testing and comparing prompt variations to optimize agent performance and output quality.

**Acceptance Criteria:**

- [ ] A/B testing framework implemented
- [ ] Metrics for prompt comparison defined
- [ ] Automated testing workflow operational
- [ ] Results tracking and analysis
- [ ] Winning prompt selection logic
- [ ] Documentation for prompt optimization

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 3.1: Base prompt template library
- Task 3.2: Company context injection

**Testing Metrics:**

- Output quality score
- Response accuracy
- Token efficiency
- Response time
- User satisfaction

**Framework Features:**

- Side-by-side prompt testing
- Statistical significance testing
- Automated winner selection
- Rollback capabilities

**Deliverables:**

- A/B testing module
- Metrics dashboard
- Automation scripts
- Optimization guide

---

## Category 4: Agent Creation Patterns

### Task 4.1: Base Agent Factory Pattern

**Description:** Implement a factory pattern for creating agents with consistent configuration, tool assignment, and behavior patterns.

**Acceptance Criteria:**

- [ ] Agent factory implemented with TypeScript generics
- [ ] Standard agent configuration defined
- [ ] Tool assignment pattern established
- [ ] Agent initialization process validated
- [ ] Factory creates testable agents
- [ ] Documentation for agent creation
- [ ] **Tenant context propagation in all agent instances**
- [ ] **Error boundary wrapping for agent failures**

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 1.4: Agent runtime environment
- All Category 2 tasks: Agent tools

**Factory Pattern:**

```typescript
// Concrete implementation pattern for agent factory
class AgentFactory<T extends AgentConfig> {
  private llmCache = new Map<string, BaseLLM>();
  private toolRegistry = new ToolRegistry();

  constructor(
    private configManager: ConfigManager,
    private logger: Logger,
  ) {}

  /**
   * Create a configured ReAct agent with LangChain
   */
  createAgent(config: T): Agent {
    // Step 1: Resolve LLM with caching
    const llm = this.getOrCreateLLM(config.ai);

    // Step 2: Load tools based on configuration
    const tools = this.loadTools(config.toolTypes);

    // Step 3: Load prompt template with company context
    const prompt = this.loadPromptTemplate(config.promptId, {
      companyContext: config.companyContext,
      tokenBudget: config.maxTokens || 2000,
    });

    // Step 4: Create agent with error wrapping
    const agent = new ReActAgent({
      llm,
      tools,
      prompt,
      maxIterations: config.maxIterations || 10,
      earlyStoppingMethod: "generate",
      verbose: config.debug || false,
    });

    // Step 5: Wrap with tenant context and error handling
    return this.wrapAgentWithContext(agent, config);
  }

  /**
   * Create agent with explicit tool set
   */
  createAgentWithTools(config: T, tools: Tool[]): Agent {
    const llm = this.getOrCreateLLM(config.ai);
    const prompt = this.loadPromptTemplate(config.promptId);

    const agent = new ReActAgent({ llm, tools, prompt });
    return this.wrapAgentWithContext(agent, config);
  }

  /**
   * Create test agent with mock LLM for deterministic testing
   */
  createTestAgent(config: T, mockLLM: MockLLM): TestAgent {
    const tools = this.loadTools(config.toolTypes);
    const prompt = this.loadPromptTemplate(config.promptId);

    return new TestAgent({
      llm: mockLLM,
      tools,
      prompt,
      deterministic: true,
    });
  }

  /**
   * Wrap agent with tenant context propagation and error handling
   */
  private wrapAgentWithContext(agent: Agent, config: T): Agent {
    return new ContextAwareAgent({
      agent,
      tenantId: config.tenantId,
      requestId: config.requestId || crypto.randomUUID(),
      onError: (error) => this.handleAgentError(error, config),
    });
  }

  /**
   * Get or create cached LLM instance
   */
  private getOrCreateLLM(aiConfig: AIConfig): BaseLLM {
    const cacheKey = `${aiConfig.provider}-${aiConfig.model}-${aiConfig.temperature}`;

    if (this.llmCache.has(cacheKey)) {
      return this.llmCache.get(cacheKey)!;
    }

    let llm: BaseLLM;
    switch (aiConfig.provider) {
      case "anthropic":
        llm = new ChatAnthropic({
          modelName: aiConfig.model,
          temperature: aiConfig.temperature || 0.7,
          maxTokens: aiConfig.maxTokens || 2000,
        });
        break;
      case "openai":
        llm = new ChatOpenAI({
          modelName: aiConfig.model,
          temperature: aiConfig.temperature || 0.7,
          maxTokens: aiConfig.maxTokens || 2000,
        });
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${aiConfig.provider}`);
    }

    this.llmCache.set(cacheKey, llm);
    return llm;
  }

  /**
   * Load tools by type from registry
   */
  private loadTools(toolTypes: string[]): Tool[] {
    return toolTypes.map((type) => {
      const tool = this.toolRegistry.get(type);
      if (!tool) {
        throw new Error(`Tool not found: ${type}`);
      }
      return tool;
    });
  }

  /**
   * Load prompt template with token budget management
   */
  private loadPromptTemplate(
    templateId: string,
    options: { companyContext?: CompanyContext; tokenBudget?: number },
  ): PromptTemplate {
    const template = this.configManager.getPromptTemplate(templateId);
    const tokenBudget = options.tokenBudget || 2000;

    // Inject company context with prioritization
    if (options.companyContext) {
      return this.injectContextWithBudget(template, options.companyContext, tokenBudget);
    }

    return template;
  }

  /**
   * Inject company context respecting token budget
   * Priority: business rules > industry > products > value propositions
   */
  private injectContextWithBudget(
    template: PromptTemplate,
    context: CompanyContext,
    budget: number,
  ): PromptTemplate {
    const estimatedTokens = this.estimateTokens(template.template);
    const remainingBudget = budget - estimatedTokens;

    if (remainingBudget <= 0) {
      this.logger.warn("Template exceeds token budget, returning without context");
      return template;
    }

    // Priority-based context injection
    const contextSections = [
      { priority: 1, content: context.businessRules, weight: 0.4 },
      { priority: 2, content: context.industry, weight: 0.2 },
      { priority: 3, content: context.products.slice(0, 3), weight: 0.25 },
      { priority: 4, content: context.valuePropositions.slice(0, 2), weight: 0.15 },
    ];

    let injectedContext = "";
    let usedTokens = 0;

    for (const section of contextSections) {
      const sectionTokens = this.estimateTokens(JSON.stringify(section.content));
      const sectionBudget = remainingBudget * section.weight;

      if (usedTokens + sectionTokens <= sectionBudget) {
        injectedContext += `\n\n${JSON.stringify(section.content)}`;
        usedTokens += sectionTokens;
      }
    }

    return {
      ...template,
      template: template.template.replace("{{companyContext}}", injectedContext),
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private handleAgentError(error: Error, config: T): never {
    this.logger.error(
      {
        tenantId: config.tenantId,
        agentType: config.type,
        error: error.message,
        stack: error.stack,
      },
      "Agent execution failed",
    );

    throw new AgentError(error.message, {
      tenantId: config.tenantId,
      agentType: config.type,
      recoverable: this.isRecoverableError(error),
    });
  }

  private isRecoverableError(error: Error): boolean {
    // Recoverable: rate limits, timeouts, transient network errors
    // Non-recoverable: authentication failures, invalid configuration
    const recoverablePatterns = [/rate limit/i, /timeout/i, /ECONNREFUSED/i, /ETIMEDOUT/i];

    return recoverablePatterns.some((pattern) => pattern.test(error.message));
  }
}

// Error handling contract
class AgentError extends Error {
  constructor(
    message: string,
    public metadata: {
      tenantId: string;
      agentType: string;
      recoverable: boolean;
      code?: string;
    },
  ) {
    super(message);
    this.name = "AgentError";
  }
}
```

**Configuration Schema:**

```typescript
interface AgentConfig {
  // Core identification
  tenantId: string;
  requestId?: string;
  type: AgentType;

  // AI configuration
  ai: AIConfig;
  toolTypes: string[];
  promptId: string;

  // Behavior parameters
  maxIterations?: number;
  maxTokens?: number;
  temperature?: number;
  debug?: boolean;

  // Company context for injection
  companyContext?: CompanyContext;
}

interface CompanyContext {
  businessRules: string[];
  industry: string;
  products: Array<{ id: string; name: string; description: string }>;
  valuePropositions: string[];
  targetMarkets: string[];
  differentiators: string[];
}
```

**Deliverables:**

- Agent factory module with implementation
- Configuration types
- Tool registry interface
- Context injection algorithm with token budget management
- Error handling contract with recoverability classification
- Usage documentation with examples

---

### Task 4.2: Company Context Integration Pattern

**Description:** Establish patterns for injecting company context into agents during creation and execution to ensure personalized analysis.

**Acceptance Criteria:**

- [ ] Context integration pattern defined
- [ ] Automatic context injection operational
- [ ] Context validation implemented
- [ ] Multi-tenant isolation validated
- [ ] Context propagation through agent chains
- [ ] Testing with multiple tenants

**Estimated Effort:** 4 hours

**Dependencies:**

- Task 4.1: Base agent factory pattern
- Task 3.2: Company context injection system

**Integration Points:**

- Agent initialization
- System message construction
- Tool execution context
- Memory and state management

**Pattern Requirements:**

- Automatic context loading
- Validation of context completeness
- Fallback for missing context
- Audit logging for context usage

**Deliverables:**

- Context integration module
- Validation logic
- Testing suite
- Pattern documentation

---

### Task 4.3: Agent Memory and State Management

**Description:** Implement memory systems for agents to maintain context across tool calls and multi-step reasoning processes.

**Acceptance Criteria:**

- [ ] Short-term memory for conversation context
- [ ] Long-term memory for historical context
- [ ] State persistence for long-running agents
- [ ] Memory retrieval and update mechanisms
- [ ] Memory size limits and cleanup
- [ ] Testing of memory effectiveness

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 4.1: Base agent factory pattern
- Task 4.2: Company context integration

**Memory Types:**

1. **Conversation Buffer:** Recent message history
2. **Summary Memory:** Compressed conversation history
3. **Vector Memory:** Semantic search over history
4. **Entity Memory:** Track mentioned entities

**State Management:**

- Agent execution state
- Tool call results
- Intermediate reasoning
- Final output state

**Deliverables:**

- Memory module with types
- State persistence layer
- Memory management utilities
- Testing framework

---

## Category 5: Retry & Fallback Strategies

### Task 5.1: LLM API Retry Mechanism

**Description:** Implement intelligent retry logic with exponential backoff for transient LLM API failures to improve reliability.

**Acceptance Criteria:**

- [ ] Retry logic with exponential backoff operational
- [ ] Configurable retry limits and timeouts
- [ ] Retry for specific error types (429, 500, 503)
- [ ] Jitter to prevent thundering herd
- [ ] Retry attempt logging and monitoring
- [ ] Testing with failure scenarios

**Estimated Effort:** 4 hours

**Dependencies:**

- Task 1.2: Multi-provider LLM configuration

**Retry Strategy:**

- **Retryable Errors:** Rate limits (429), server errors (500, 502, 503), timeouts
- **Non-Retryable Errors:** Authentication (401), invalid requests (400)
- **Backoff Strategy:** Exponential with jitter (1s, 2s, 4s, 8s, 16s)
- **Max Retries:** 3 attempts for critical operations, 1 for non-critical

**Implementation:**

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}
```

**Deliverables:**

- Retry middleware
- Configuration module
- Error classification
- Testing suite

---

### Task 5.2: Multi-Provider Fallback Strategy

**Description:** Implement automatic fallback to alternative LLM providers when primary provider fails to ensure continuous operation.

**Acceptance Criteria:**

- [ ] Automatic provider switching operational
- [ ] Fallback triggers defined and tested
- [ ] Fallback chain configured (Claude → GPT-4 → Rule-based)
- [ ] Fallback event logging and monitoring
- [ ] Graceful degradation to rule-based logic
- [ ] Testing with provider failures

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 5.1: LLM API retry mechanism

**Fallback Chain:**

1. **Primary:** Claude 3.5 Sonnet (best quality)
2. **Secondary:** GPT-4 Turbo (good quality, faster)
3. **Tertiary:** Rule-based logic (baseline functionality)

**Fallback Triggers:**

- Max retries exceeded
- Provider downtime (>5 minutes)
- Rate limit exhaustion
- Cost threshold exceeded

**Degradation Strategy:**

- Reduce analysis complexity
- Use cached results when available
- Provide partial results with warnings
- Queue for later processing

**Deliverables:**

- Fallback controller
- Provider health monitoring
- Degradation logic
- Testing scenarios

---

## Category 6: Specialized Agents

### Task 6.1: Cross-Platform Marketing Analysis Agent

**Description:** Develop an agent specialized in analyzing marketing metrics across Meta Ads, GA4, GSC, GBP, and TikTok to identify patterns, correlations, and cross-channel performance insights.

**Acceptance Criteria:**

- [ ] Agent fetches data from all marketing platforms
- [ ] Identifies cross-platform marketing patterns
- [ ] Detects correlations between marketing channels
- [ ] Handles platform-specific marketing nuances
- [ ] Generates marketing analysis summaries
- [ ] Unit tests with ≥85% coverage
- [ ] Integration tests with real platform data

**Estimated Effort:** 12 hours

**Dependencies:**

- Task 4.1: Base agent factory pattern
- Task 4.2: Company context integration
- All Category 2 tasks: Agent tools

**Agent Capabilities:**

- Aggregate marketing metrics across platforms (impressions, clicks, conversions, cost)
- Identify channel interdependencies (attribution, assist interactions)
- Detect platform-specific anomalies (CPA spikes, ROAS fluctuations)
- Calculate cross-platform KPIs (total ROAS, blended CPA, conversion rates)
- Generate comparative marketing analysis (channel performance, budget efficiency)

**Tool Requirements:**

- Platform data tools (Meta Ads, GA4, GSC, GBP, TikTok)
- Database query tools (historical marketing trends)
- Calculation tools (correlations, ROAS/CPA calculations)
- Company context tools (marketing goals, KPI targets)

**Prompt Strategy:**

- Focus on cross-channel insights
- Platform-specific expertise
- Business context awareness
- Actionable recommendation focus

**Deliverables:**

- Cross-platform analysis agent
- Tool orchestration logic
- Analysis templates
- Testing suite

---

### Task 6.2: Marketing Insight Generation Agent

**Description:** Create an agent specialized in identifying marketing insights, anomalies, and opportunities from campaign performance data across Meta Ads, GA4, GSC, GBP, and TikTok.

**Acceptance Criteria:**

- [ ] Agent identifies campaign performance anomalies
- [ ] Detects marketing trend changes and inflection points
- [ ] Recognizes marketing opportunities and risks
- [ ] Prioritizes insights by business impact
- [ ] Provides evidence-based marketing insights
- [ ] Unit tests with ≥85% coverage
- [ ] Validation against known marketing insights

**Estimated Effort:** 10 hours

**Dependencies:**

- Task 4.1: Base agent factory pattern
- Task 4.2: Company context integration
- All Category 2 tasks: Agent tools

**Agent Capabilities:**

- Campaign performance anomaly detection (CTR, CPC, CPA fluctuations)
- Marketing trend analysis (campaign growth, seasonality, platform shifts)
- Marketing opportunity identification (underperforming campaigns, budget reallocation)
- Marketing risk assessment (declining ROAS, lead quality issues)
- Insight prioritization (business impact, effort required)

**Tool Requirements:**

- Database query tools (historical marketing data)
- Calculation tools (statistical analysis of marketing metrics)
- Company context tools (marketing goals, target KPIs)
- Platform data tools (current campaign metrics)

**Prompt Strategy:**

- Statistical rigor
- Business context integration
- Evidence-based conclusions
- Actionable focus

**Deliverables:**

- Insight generation agent
- Anomaly detection logic
- Insight prioritization framework
- Testing suite

---

### Task 6.3: Media Verdict Generation Agent

**Description:** Develop an agent specialized in synthesizing marketing insights into media verdicts with budget allocation recommendations and performance optimization strategies.

**Acceptance Criteria:**

- [ ] Agent synthesizes multiple marketing insights
- [ ] Generates clear media verdict statements
- [ ] Provides prioritized budget allocation recommendations
- [ ] Includes marketing action items with owners
- [ ] Supports evidence-based conclusions with ROAS data
- [ ] Unit tests with ≥85% coverage
- [ ] Quality validation against rubric

**Estimated Effort:** 12 hours

**Dependencies:**

- Task 4.1: Base agent factory pattern
- Task 4.2: Company context integration
- Task 6.1: Cross-platform marketing analysis agent
- Task 6.2: Marketing insight generation agent

**Agent Capabilities:**

- Synthesize marketing insights from all channels
- Generate overall media verdict (positive/negative/neutral)
- Prioritize budget recommendations by ROAS impact
- Assign marketing action items to stakeholders
- Provide supporting evidence with marketing metrics
- Estimate implementation effort for optimizations

**Tool Requirements:**

- Report generation tools (formatting)
- Company context tools (stakeholders, marketing goals)
- Database query tools (marketing benchmarks)
- All marketing analysis and insight tools

**Prompt Strategy:**

- Executive communication style
- Clear and concise language
- Action-oriented recommendations
- Evidence-based conclusions

**Verdict structure:** Use the unified **`MarketingVerdict`** type from `@agenticverdict/types` (see [Remediation Plan](/docs/03-development-phases/REMEDIATION_PLAN.md) **R-7**) — **do not** maintain a parallel `Verdict` interface. Phase 3 report templates bind directly to this schema (optional `reportMetadata` for layout hints).

**Deliverables:**

- Verdict generation agent
- Verdict schema definitions
- Recommendation templates
- Quality rubric

---

### Task 6.4: Agent Communication Protocol

**Description:** Establish protocols for agents to communicate, share context, and coordinate workflows in multi-agent scenarios.

**Acceptance Criteria:**

- [ ] Agent-to-agent message format defined
- [ ] Context sharing mechanism operational
- [ ] Workflow coordination implemented
- [ ] Error propagation between agents
- [ ] Communication logging and debugging
- [ ] Testing of agent collaboration
- [ ] **Message serialization format specified (JSON with envelope)**
- [ ] **Message validation with Zod schemas**
- [ ] **Async message passing support**
- [ ] **Tenant context propagation in all messages**

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 6.1: Cross-platform marketing analysis agent
- Task 6.2: Marketing insight generation agent
- Task 6.3: Media verdict generation agent

**Protocol Specification:**

```typescript
/**
 * Standardized agent message format with serialization envelope
 * All agent-to-agent communication MUST use this format
 */
interface AgentMessage<TPayload = unknown> {
  // Message envelope
  envelope: MessageEnvelope;

  // Payload (type varies by message type)
  payload: TPayload;
}

interface MessageEnvelope {
  // Message identification
  messageId: string; // UUID v4
  conversationId: string; // UUID v4 - groups related messages
  parentMessageId?: string; // For message threading

  // Source and destination
  from: AgentIdentifier;
  to: AgentIdentifier;

  // Message classification
  type: MessageType;
  category: MessageCategory;

  // Timing and state
  timestamp: string; // ISO 8601
  expiresAt?: string; // For time-sensitive messages

  // Context propagation
  tenantId: string; // MUST be included for all messages
  requestId: string; // Distributed tracing
  correlationId: string; // Cross-system correlation

  // Delivery control
  deliveryMode: DeliveryMode;
  priority: MessagePriority;

  // Metadata
  metadata: MessageMetadata;
}

type AgentIdentifier = {
  agentId: string;
  agentType: "marketing-analysis" | "insight-generation" | "verdict-generation";
  instanceId?: string; // For multi-instance deployments
};

type MessageType =
  | "request" // Soliciting a response
  | "response" // Reply to a request
  | "notification" // One-way message
  | "broadcast" // To all subscribed agents
  | "error" // Error notification
  | "heartbeat"; // Liveness check

type MessageCategory =
  | "data-query"
  | "data-response"
  | "analysis-request"
  | "analysis-result"
  | "insight-share"
  | "verdict-request"
  | "control" // Start, stop, pause
  | "status"; // Health checks

type DeliveryMode =
  | "sync" // Synchronous RPC-style
  | "async" // Fire-and-forget
  | "deferred" // Queue for later processing
  | "streaming"; // Chunked delivery

type MessagePriority = "critical" | "high" | "normal" | "low";

interface MessageMetadata {
  version: "1.0";
  serialization: "json"; // Currently JSON; consider MessagePack for v2
  compressed: boolean;
  encrypted: boolean;
  size: number; // Bytes
  checksum?: string; // For integrity verification
}

/**
 * Serialization format
 * All messages are serialized to JSON with the following structure:
 *
 * JSON structure (max 1MB per message):
 * {
 *   "envelope": { ... },
 *   "payload": { ... }
 * }
 *
 * For large payloads (>100KB), consider:
 * - Storing payload in shared cache and passing reference
 * - Using streaming/chunked delivery
 * - Compressing payload with gzip/deflate
 */
```

**Message Examples:**

```typescript
// Example 1: Marketing analysis agent requesting insight generation
const insightRequest: AgentMessage<{
  analysisData: AnalysisData;
  requiredInsights: number;
}> = {
  envelope: {
    messageId: crypto.randomUUID(),
    conversationId: crypto.randomUUID(),
    from: {
      agentId: "marketing-analysis-agent-1",
      agentType: "marketing-analysis",
    },
    to: {
      agentId: "insight-generation-agent-1",
      agentType: "insight-generation",
    },
    type: "request",
    category: "insight-share",
    timestamp: new Date().toISOString(),
    tenantId: "tenant-uuid-here",
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    deliveryMode: "async",
    priority: "normal",
    metadata: {
      version: "1.0",
      serialization: "json",
      compressed: false,
      encrypted: false,
      size: 0,
    },
  },
  payload: {
    analysisData: {
      /* ... */
    },
    requiredInsights: 5,
  },
};

// Example 2: Insight agent responding with generated insights
const insightResponse: AgentMessage<{
  insights: GeneratedInsight[];
  qualityScore: number;
}> = {
  envelope: {
    messageId: crypto.randomUUID(),
    conversationId: insightRequest.envelope.conversationId,
    parentMessageId: insightRequest.envelope.messageId,
    from: {
      agentId: "insight-generation-agent-1",
      agentType: "insight-generation",
    },
    to: {
      agentId: "marketing-analysis-agent-1",
      agentType: "marketing-analysis",
    },
    type: "response",
    category: "insight-share",
    timestamp: new Date().toISOString(),
    tenantId: insightRequest.envelope.tenantId,
    requestId: insightRequest.envelope.requestId,
    correlationId: insightRequest.envelope.correlationId,
    deliveryMode: "async",
    priority: "normal",
    metadata: {
      version: "1.0",
      serialization: "json",
      compressed: false,
      encrypted: false,
      size: 0,
    },
  },
  payload: {
    insights: [
      /* ... */
    ],
    qualityScore: 0.87,
  },
};
```

**Communication Patterns:**

**1. Request-Response Pattern:**

```typescript
// Agent A sends request
const request = createRequestMessage(toAgentB, payload);
await messageBus.send(request);

// Agent B receives and responds
const response = await messageBus.receive(agentBId);
await messageBus.send(createResponseMessage(request, responsePayload));

// Agent A receives response
const finalResponse = await messageBus.receive(agentAId, request.messageId);
```

**2. Publish-Subscribe Pattern:**

```typescript
// Agents publish to topics
await messageBus.publish("insights.available", message);

// Other agents subscribe
await messageBus.subscribe("insights.available", async (message) => {
  // Process insights from any agent
});
```

**3. Pipeline Pattern:**

```typescript
// Sequential processing through agents
const result = await agentPipeline
  .pipe(marketingAnalysisAgent)
  .pipe(insightGenerationAgent)
  .pipe(verdictGenerationAgent)
  .execute(initialPayload);
```

**Message Validation:**

```typescript
import { z } from "zod";

// Message envelope schema
const MessageEnvelopeSchema = z.object({
  messageId: z.string().uuid(),
  conversationId: z.string().uuid(),
  parentMessageId: z.string().uuid().optional(),
  from: AgentIdentifierSchema,
  to: AgentIdentifierSchema,
  type: z.enum(["request", "response", "notification", "broadcast", "error", "heartbeat"]),
  category: z.enum([
    "data-query",
    "data-response",
    "analysis-request",
    "analysis-result",
    "insight-share",
    "verdict-request",
    "control",
    "status",
  ]),
  timestamp: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  tenantId: z.string().uuid(),
  requestId: z.string().uuid(),
  correlationId: z.string().uuid(),
  deliveryMode: z.enum(["sync", "async", "deferred", "streaming"]),
  priority: z.enum(["critical", "high", "normal", "low"]),
  metadata: z.object({
    version: z.literal("1.0"),
    serialization: z.literal("json"),
    compressed: z.boolean(),
    encrypted: z.boolean(),
    size: z.number().nonnegative(),
    checksum: z.string().optional(),
  }),
});

// Validate incoming messages
function validateMessage(message: unknown): AgentMessage {
  const parsed = z
    .object({
      envelope: MessageEnvelopeSchema,
      payload: z.any(), // Payload validated by recipient based on type/category
    })
    .parse(message);

  // Verify tenant matches current context
  const context = getTenantContext();
  if (parsed.envelope.tenantId !== context.tenantId) {
    throw new Error("Tenant ID mismatch in message");
  }

  return parsed as AgentMessage;
}

// Size validation
function validateMessageSize(message: AgentMessage): void {
  const serialized = JSON.stringify(message);
  const size = Buffer.byteLength(serialized, "utf8");

  if (size > 1_000_000) {
    // 1MB max
    throw new Error(`Message size ${size} bytes exceeds 1MB limit`);
  }

  message.envelope.metadata.size = size;
}
```

**Deliverables:**

- Message protocol module with schemas
- Message validation utilities
- Communication utilities for all patterns
- Logging integration with message tracing
- Testing framework for message flows

---

### Task 6.5: Agent Orchestration Workflow

**Description:** Implement the orchestration layer that coordinates agent execution in the correct sequence with proper data flow and error handling.

**Acceptance Criteria:**

- [ ] Sequential agent workflow operational
- [ ] Data flow between agents validated
- [ ] Error handling and recovery implemented
- [ ] Workflow state management
- [ ] Progress tracking and reporting
- [ ] End-to-end integration tests passing

**Estimated Effort:** 10 hours

**Dependencies:**

- Task 6.4: Agent communication protocol
- All Category 6 tasks: Specialized agents

**Workflow Definition:**

```
1. Cross-Platform Marketing Analysis Agent
   ↓
2. Marketing Insight Generation Agent
   ↓
3. Media Verdict Generation Agent
   ↓
4. Report Formatting (Phase 3)
```

**Orchestration Features:**

- Agent execution scheduling
- **Pass-through of shared types** (`GeneratedInsight[]`, `MarketingVerdict[]`) between steps — **no** alternate DTOs or transformation layers; enrich in place using the same Zod contracts
- Error recovery and retry
- State persistence and resumption
- Progress tracking
- Caching intermediate results

**Error Handling:**

- Agent-level retry with fallback
- Workflow-level checkpointing
- Graceful degradation
- Partial result completion

**Deliverables:**

- Orchestration engine
- Workflow definitions
- State management
- Integration tests

---

### Task 6.6: Agent Performance Optimization

**Description:** Optimize agent performance through caching, parallelization, and efficient prompt engineering to meet response time requirements.

**Acceptance Criteria:**

- [ ] Response time <5 seconds for single agents
- [ ] Response time <15 seconds for full workflow
- [ ] Caching reduces redundant LLM calls by ≥50%
- [ ] Parallel execution where possible
- [ ] Token usage optimized
- [ ] Performance benchmarks established

**Estimated Effort:** 8 hours

**Dependencies:**

- Task 6.5: Agent orchestration workflow
- All Category 6 tasks: Specialized agents

**Optimization Strategies:**

1. **Caching:**
   - Cache agent outputs for identical inputs
   - Cache platform data queries
   - Cache prompt template results
   - TTL-based invalidation

2. **Parallelization:**
   - Parallel platform data fetching
   - Parallel independent agent tasks
   - Async tool execution

3. **Prompt Optimization:**
   - Reduce prompt token count
   - Use more efficient templates
   - Optimize context injection

4. **Model Selection:**
   - Use faster models for simple tasks
   - Reserve best models for complex reasoning
   - Cost-based routing

**Deliverables:**

- Performance optimization module
- Caching layer
- Benchmarking suite
- Optimization guide

---

## Category 7: Testing & Validation

### Task 7.1: Mock LLM Response Framework

**Description:** Build a comprehensive mock LLM framework that returns deterministic responses for testing agent behaviors without making actual API calls.

**Acceptance Criteria:**

- [ ] Mock LLM implements LangChain interface
- [ ] Deterministic responses for given inputs
- [ ] Supports different response scenarios (success, error, timeout)
- [ ] Configurable response delays for testing
- [ ] Response library for common agent interactions
- [ ] ≥50 mock responses defined

**Estimated Effort:** 8 hours

**Dependencies:**

- Task 1.2: Multi-provider LLM configuration

**Mock Framework Features:**

- Input-based response matching
- Response templates with variables
- Error simulation capabilities
- Performance testing (latency simulation)
- Response recording for test data generation

**Mock Interface:**

```typescript
class MockLLM extends BaseLLM {
  constructor(config: MockConfig);
  addResponse(input: string, response: string): void;
  setError(mode: "always" | "sometimes" | "never"): void;
  setDelay(min: number, max: number): void;
}
```

**Deliverables:**

- Mock LLM implementation
- Response library
- Testing utilities
- Usage documentation

---

### Task 7.2: Agent Behavior Testing Suite

**Description:** Create comprehensive tests for agent behaviors, tool execution, prompt effectiveness, and output quality using the mock LLM framework.

**Acceptance Criteria:**

- [ ] Unit tests for all agents (≥85% coverage)
- [ ] Tool execution tests with various inputs
- [ ] Prompt effectiveness tests
- [ ] Output quality validation tests
- [ ] Error handling tests
- [ ] Integration tests for agent workflows

**Estimated Effort:** 12 hours

**Dependencies:**

- Task 7.1: Mock LLM response framework
- All Category 6 tasks: Specialized agents

**Testing Categories:**

1. **Unit Tests:**
   - Individual agent behaviors
   - Tool execution logic
   - Prompt template rendering
   - Error handling

2. **Integration Tests:**
   - Agent workflows
   - Tool orchestration
   - Context propagation
   - Multi-agent communication

3. **Quality Tests:**
   - Output structure validation
   - Content quality assessment
   - Prompt effectiveness
   - Response accuracy

**Testing Framework:**

```typescript
describe("Cross-Platform Marketing Analysis Agent", () => {
  it("should aggregate marketing metrics across platforms", async () => {
    const mockLLM = new MockLLM();
    mockLLM.addResponse("analyze", mockResponse);
    const agent = createMarketingAnalysisAgent({ llm: mockLLM });
    const result = await agent.analyze(mockInput);
    expect(result).toMatchSchema(MarketingAnalysisOutputSchema);
  });
});
```

**Deliverables:**

- Comprehensive test suite
- Test utilities and helpers
- Quality validation functions
- CI/CD integration

---

### Task 7.3: Agent Performance Benchmarking

**Description:** Establish performance benchmarks for agent response times, token usage, and output quality to ensure production readiness.

**Acceptance Criteria:**

- [ ] Baseline performance metrics established
- [ ] Response time benchmarks defined
- [ ] Token usage benchmarks defined
- [ ] Output quality benchmarks defined
- [ ] Performance regression tests
- [ ] Benchmarking dashboard

**Estimated Effort:** 6 hours

**Dependencies:**

- Task 7.2: Agent behavior testing suite
- Task 6.6: Agent performance optimization

**Benchmark Metrics:**

1. **Performance:**
   - Response time (p50, p95, p99)
   - Token usage (input, output, total)
   - Tool execution time
   - End-to-end workflow time

2. **Quality:**
   - Output accuracy rate
   - Insight relevance score
   - Verdict clarity score
   - Recommendation actionability

3. **Cost:**
   - Cost per agent execution
   - Cost per workflow
   - Cost optimization opportunities

**Benchmark Scenarios:**

- Single agent execution
- Full workflow execution
- High-load scenarios
- Error recovery scenarios

**Deliverables:**

- Benchmark suite
- Performance dashboard
- Regression tests
- Optimization recommendations

---

### Task 7.4: Output Quality Validation Framework

**Description:** Implement automated validation of agent outputs to ensure quality, accuracy, and consistency before production deployment.

**Acceptance Criteria:**

- [ ] Output schema validation operational
- [ ] Content quality scoring implemented
- [ ] Accuracy testing against validation dataset
- [ ] Consistency checking across runs
- [ ] Automated quality gates
- [ ] Quality trend tracking

**Estimated Effort:** 8 hours

**Dependencies:**

- Task 7.2: Agent behavior testing suite
- Task 6.3: Verdict generation agent

**Validation Framework:**

```typescript
interface QualityValidator {
  validateSchema(output: unknown): ValidationResult;
  scoreQuality(output: unknown): QualityScore;
  checkAccuracy(output: unknown, expected: unknown): AccuracyScore;
  testConsistency(outputs: unknown[]): ConsistencyScore;
}
```

**Quality Dimensions:**

1. **Structural:**
   - Schema compliance
   - Required fields present
   - Data type correctness
   - Format consistency

2. **Content:**
   - Accuracy (vs. validation dataset)
   - Relevance (to business question)
   - Clarity (of communication)
   - Actionability (of recommendations)

3. **Consistency:**
   - Same input → similar output
   - Stable across multiple runs
   - Deterministic when appropriate

**Validation Dataset:**

- Curated set of test scenarios
- Expected outputs for validation
- Quality rubrics for assessment
- Continuous improvement process

**Deliverables:**

- Quality validation module
- Validation dataset
- Quality gate automation
- Trend tracking dashboard

---

## Category 8: HTTP API & external contracts

### Task 8.1: Insights retrieval API

**Description:** Implement `GET /api/v1/insights` with filter, sort, and pagination per [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md).

**Acceptance Criteria:**

- [ ] Response matches `InsightListResponse`; items validate as `GeneratedInsight`
- [ ] JWT required; tenant scope enforced
- [ ] Rate limit: **100 req/min** per tenant (configurable); **5-minute** response cache where applicable
- [ ] OpenAPI fragment kept in sync with implementation

**Estimated Effort:** 16 hours (see remediation R-1)

**Dependencies:** Agent pipelines persisting or projecting insights; auth middleware (R-5)

---

### Task 8.2: Verdicts retrieval API

**Description:** Implement `GET /api/v1/verdicts` with optional `campaignId`, `verdictType`, `dateRange` filters.

**Acceptance Criteria:**

- [ ] Response matches `VerdictListResponse`; items validate as **`MarketingVerdict`** (unified schema)
- [ ] JWT + tenant scope; rate limit; **10-minute** cache where applicable
- [ ] OpenAPI fragment in sync

**Estimated Effort:** 16 hours (see remediation R-2)

**Dependencies:** Task 6.3 output type = `MarketingVerdict`; auth middleware (R-5)

---

### Task 8.3: Analysis result bundle API

**Description:** Implement `GET /api/v1/analysis-results/:id` returning insights, verdicts, and **`ProvenanceInfo`**.

**Acceptance Criteria:**

- [ ] Payload matches `AnalysisResultResponse`; provenance complete for all listed sources
- [ ] JWT + tenant scope; no cross-tenant `analysisId` access
- [ ] OpenAPI fragment in sync

**Estimated Effort:** 8 hours (see remediation R-3)

**Dependencies:** Provenance tracker (remediation R-11) or interim stub documented

---

### Task 8.4: Validation APIs

**Description:** Implement `POST /api/v1/insights/validate` and `POST /api/v1/verdicts/validate` delegating to the data-quality service (remediation R-10).

**Acceptance Criteria:**

- [ ] Request/response bodies match [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md)
- [ ] JWT + tenant scope; suitable rate limits for batch validation
- [ ] Returns `ValidationResult` with score, errors, warnings, recommendations

**Estimated Effort:** 16 hours (see remediation R-4)

**Dependencies:** Data quality validator interface; unified schemas (R-7)

---

## Category 9: Workflow processors & queue orchestration

### Task 9.1: Marketing analysis workflow processor

**Description:** Implement the worker processor for `marketing-analysis` with staged orchestration (collect, normalize, analyze, insights, output envelope).

**Acceptance Criteria:**

- [x] Worker route dispatches `workflowId === "marketing-analysis"` to a dedicated processor
- [x] Trigger config validates `dateRange`, `platforms`, and optional `analysisDepth`
- [x] Per-platform failures are isolated with structured partial-failure reporting
- [x] Result payload includes phase message, insight list, and processing metadata

**Estimated Effort:** 12 hours

**Dependencies:** Category 2 tools, Category 6.1 and 6.2 agents

---

### Task 9.2: Verdict generation workflow processor

**Description:** Implement the worker processor for `verdict-generation` that reuses analysis pipeline outputs and produces verdict/report metadata.

**Acceptance Criteria:**

- [x] Worker route dispatches `workflowId === "verdict-generation"` to a dedicated processor
- [ ] Processing chain executes analysis reuse -> verdict synthesis -> report generation -> optional delivery enqueue
- [x] Config supports `verdictDepth`, `outputFormat`, and delivery flags when enabled
- [ ] Result payload includes unified `MarketingVerdict` and report artifact metadata

**Estimated Effort:** 14 hours

**Dependencies:** Task 9.1, Category 6.3 agent, Category 8 APIs

---

### Task 9.3: Workflow contract schemas and error codes

**Description:** Define shared Zod contracts for trigger payloads and workflow results and standardize queue-safe error codes.

**Acceptance Criteria:**

- [x] Typed schemas for `marketing-analysis` and `verdict-generation` trigger configs
- [x] Typed schemas for result envelopes and metadata
- [x] Error catalog documented and reused: `platform_fetch_failed`, `platform_timeout`, `analysis_failed`, `insight_generation_failed`, `verdict_synthesis_failed`, `report_generation_failed`, `delivery_queue_failed`
- [x] Contract tests verify API trigger payload compatibility with worker processors
- [ ] **Error code timing and applicability documented**

**Estimated Effort:** 8 hours

**Dependencies:** Category 8 external contracts

**Error Code Catalog with Timing:**

| Error Code                  | Applicability | Phase Introduced | Notes                                                             |
| --------------------------- | ------------- | ---------------- | ----------------------------------------------------------------- |
| `platform_fetch_failed`     | Immediate     | Phase 02         | Platform adapter failure                                          |
| `platform_timeout`          | Immediate     | Phase 02         | Platform API timeout                                              |
| `analysis_failed`           | Immediate     | Phase 02         | Analysis pipeline failure                                         |
| `insight_generation_failed` | Immediate     | Phase 02         | Insight generation failure                                        |
| `verdict_synthesis_failed`  | Immediate     | Phase 02         | Verdict synthesis failure                                         |
| `report_generation_failed`  | Phase 03+     | Phase 03         | Report generation failure                                         |
| `delivery_queue_failed`     | Immediate     | Phase 03         | Applicable where delivery-enabled workflow execution is supported |

**Important Notes:**

- **`delivery_queue_failed`** is now applicable for delivery-enabled workflow paths where email delivery is attempted
- Phase 02 workflows should use `report_generation_failed` when report generation fails
- The error code catalog is forward-compatible but not all codes are immediately applicable

---

### Task 9.4: Workflow metrics and SLA verification

**Description:** Implement workflow observability and verify duration and quality targets in staging.

**Acceptance Criteria:**

- [ ] Metrics emitted for duration, status, platforms analyzed, insights generated, tokens used, and report artifact size
- [ ] Dashboard/alerts for workflow failures and fallback behavior available
- [ ] Latency tests cover analysis and verdict workflows across platform-count profiles
- [ ] SLA evidence captured for phase sign-off

**Estimated Effort:** 8 hours

**Dependencies:** Task 9.1, Task 9.2, Category 7 benchmarking

---

## Task Summary

### Effort Summary

| Category                                  | Tasks  | Total Hours   |
| ----------------------------------------- | ------ | ------------- |
| LangChain Integration & Configuration     | 4      | 20 hours      |
| Agent Tool Definitions                    | 5      | 28 hours      |
| Prompt Template System                    | 3      | 20 hours      |
| Agent Creation Patterns                   | 3      | 16 hours      |
| Retry & Fallback Strategies               | 2      | 10 hours      |
| Specialized Agents                        | 6      | 58 hours      |
| Testing & Validation                      | 4      | 34 hours      |
| HTTP API & external contracts             | 4      | 56 hours      |
| Workflow processors & queue orchestration | 4      | 42 hours      |
| **Total**                                 | **35** | **284 hours** |

### Critical Path

1. Task 1.1 → Task 1.2 → Task 1.4 (Foundation)
2. Task 1.4 → All Category 2 tasks (Tools)
3. All Category 2 tasks → Task 4.1 → Task 4.2 (Agent Factory)
4. Task 4.2 → Task 6.1 (Marketing Analysis) → Task 6.2 (Marketing Insights) → Task 6.3 (Media Verdict)
5. Task 6.3 → Task 6.5 → Task 7.2 (Orchestration & Testing)

### Parallel Opportunities

- **Category 2 (Tools):** Can be developed in parallel after Task 1.4
- **Category 3 (Prompts):** Can be developed in parallel with Category 4
- **Category 5 (Retry):** Can be developed in parallel with Category 6
- **Category 7 (Testing):** Task 7.1 can start early, others depend on agents

### Risk Mitigation

- Start with Task 7.1 (Mock LLM) early to enable parallel testing
- Implement Task 5.1 and 5.2 (Retry/Fallback) before complex agents
- Create comprehensive validation dataset early for Task 7.4
- Establish performance benchmarks continuously during development

---

**Phase 2 Status:** Active implementation
**Next Review:** End of Week 1
**Blocking Issues:** None identified
**Dependencies:** Phase 1 must be 100% complete; API route implementation may proceed in parallel with agents once contracts in [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md) are frozen
