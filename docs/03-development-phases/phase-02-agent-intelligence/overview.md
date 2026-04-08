# Phase 2: Agent Runtime & Intelligence - Overview

**Phase Duration:** Weeks 5-6 (2 weeks)
**Status:** In progress
**Last Updated:** 2026-04-08

**Enhancement (P2, 2026-04-08):** `CompanyConfig.marketing.b2bKpiProfile` plus `computeB2bMarketingKpis` / `buildB2bFunnelSnapshotFromNormalizedSnapshots` in `@agenticverdict/agent-runtime` provide **configuration-driven** B2B funnel KPIs (CPQL, decision-maker / fleet-quality / regional mix, Arabic vs English engagement share). Optional `funnelMetricMapping` aggregates `NormalizedPlatformSnapshot` rows by metric suffix. Agent tool **`compute_b2b_kpis_from_snapshots`** (Phase 4 registry) reads tenant config from `requireTenantContext()`; analysis agents include it in default auto-tools. There is **no** tenant-specific code path.

---

## API and data contracts (Phase 03 prerequisites)

Phase 2 delivers **agent intelligence** and exposes **read and validation HTTP APIs** for insights, verdicts, and analysis bundles. Canonical REST shapes are defined in [**API_SPECIFICATIONS.md**](./API_SPECIFICATIONS.md) (OpenAPI-oriented). Authentication uses **JWT** with **tenant-scoped** access; rate limits and error envelopes match that document.

### Unified `MarketingVerdict` schema (single source of truth)

**There is no separate “Phase 2 internal verdict” type that Phase 3 must transform.** The **`MarketingVerdict`** contract (TypeScript + Zod in `@agenticverdict/types`, implemented under [Remediation Plan](/docs/03-development-phases/REMEDIATION_PLAN.md) **R-7**) is reused **across Phases 01–04**: normalization metadata feeds it, agents produce it, reports consume it, delivery layers archive it. Optional fields (e.g. `reportMetadata`) allow Phase 3 to enrich without breaking Phase 2 producers.

### `GeneratedInsight` schema

Insights are **typed, scored artifacts** (e.g. anomaly, trend, opportunity, warning) with **confidence**, **relevance**, **evidence links**, and **platform attribution**. They are listed on `GET /api/v1/insights` and embedded in `GET /api/v1/analysis-results/:id`. Exact field list and enums are specified in [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md) and mirrored in `@agenticverdict/types` when implemented.

### Data validation interface

A **data quality** layer (see remediation **R-10**) validates insights and verdicts before persistence or handoff to reports: `validateInsight`, `validateVerdict`, structured **`ValidationResult`** (`isValid`, `score` 0–100, `errors`, `warnings`, `recommendations`, metadata). **`POST /api/v1/insights/validate`** and **`POST /api/v1/verdicts/validate`** expose this for tooling, CI, and admin review.

### Provenance tracking

Each analysis run carries **`ProvenanceInfo`**: data sources (platform, date range, **freshness** in hours, **qualityScore**), model/agent identifiers, and an ordered list of **transformations** (normalization, merges, etc.). `GET /api/v1/analysis-results/:id` returns a full bundle including provenance, insights, and verdicts for audit and Phase 3 narrative generation.

### Worker workflow contracts

Phase 2 also defines queue-driven workflow contracts consumed by the worker layer via `POST /api/v1/workflows/trigger`:

- **`marketing-analysis`**: collect platform data, normalize snapshots, run agent analysis, and return structured insights.
- **`verdict-generation`**: execute the analysis pipeline, synthesize a verdict, generate report artifacts, and optionally enqueue delivery.

The workflow trigger config must support: `dateRange`, `platforms`, `analysisDepth`, `verdictDepth`, `outputFormat`, `deliveryEnabled`, and `recipientEmail`. Historical controls (`includeHistorical`, `historicalPeriods`) are optional and tenant-configurable.

Workflow outputs are typed and tenant-scoped, including phase message, summary metadata (`platformsAnalyzed`, durations), structured `GeneratedInsight[]`, unified `MarketingVerdict`, and report artifact metadata (`reportId`, `format`, `byteLength`, `location`) when report generation is requested.

### Workflow observability and error taxonomy

Phase 2 must emit worker-safe, dashboard-ready metrics for both workflows:

- Duration histograms and success/failure counters
- Platforms analyzed and insights generated totals
- LLM token usage and fallback counters
- Verdict score and action item distribution metrics
- Report artifact size and delivery enqueue metrics

Standard workflow error categories must be stable across API and worker logs:
`platform_fetch_failed`, `platform_timeout`, `analysis_failed`, `insight_generation_failed`, `verdict_synthesis_failed`, `report_generation_failed`, and `delivery_queue_failed`.

---

## Executive Summary

Phase 2 establishes the intelligence layer of AgenticVerdict, implementing the AI agent runtime that powers **cross-platform marketing analytics**, automated insight generation, and **media performance verdicts**. This phase builds upon the platform integration foundation from Phase 1 (Meta Ads, GA4, GSC, GBP, TikTok) to create intelligent, context-aware agents that analyze marketing performance data and generate actionable recommendations.

**Updated for Phase 1 completion:** This overview has been revised to reflect the actual platform adapters implemented in Phase 1, replacing placeholder e-commerce references with the marketing/advertising platforms that are production-ready.

---

## Phase Objectives

### Primary Objectives

1. **Establish Agent Runtime Infrastructure**
   - Implement LangChain.js integration with TypeScript
   - Configure multi-provider LLM support (Claude, GPT-4)
   - Set up LangSmith for observability and debugging
   - Create agent execution environment with proper error handling

2. **Build Agent Tool Ecosystem**
   - Develop platform data access tools for **Meta Ads, GA4, GSC, GBP, TikTok**
   - Create database query tools for historical marketing metrics retrieval
   - Implement insight generation tools for formatted output
   - Build tool validation and testing framework

3. **Implement Prompt Engineering System**
   - Design reusable prompt templates for marketing analysis agent types
   - Create company context injection system (B2B industry, region, goals)
   - Implement prompt versioning and A/B testing framework
   - Build prompt optimization and iteration workflow

4. **Develop Specialized Marketing Agents**
   - **Cross-platform marketing analysis agent** for holistic campaign performance evaluation
   - **Marketing insight generation agent** for pattern and anomaly identification
   - **Media verdict generation agent** for budget allocation recommendations
   - Agent orchestration layer for coordinated workflows

5. **Establish Testing Framework**
   - Mock LLM response system for deterministic testing
   - Agent behavior validation suite
   - Performance benchmarking for response latency
   - Output quality assessment framework

### Secondary Objectives

- Implement retry and fallback strategies for LLM API failures
- Create agent memory and context management system
- Build agent telemetry and monitoring integration
- Establish agent performance baseline metrics

---

## Success Criteria

### Functional Requirements

- [ ] LangChain.js runtime configured with Claude and GPT-4 providers
- [ ] Minimum **10 production-ready agent tools** implemented and tested (5 platform tools + 5 analysis tools)
- [ ] Three specialized agents (Marketing Analysis, Insight Generation, Media Verdict) operational
- [ ] Agent orchestration workflow handles end-to-end marketing verdict generation
- [ ] Prompt template system supports company context injection
- [ ] Retry mechanism handles 99% of transient LLM API failures
- [ ] Mock LLM system enables deterministic unit testing

### Quality Metrics

- **Test Coverage:** ≥85% for agent runtime and tools
- **Agent Response Accuracy:** ≥90% on marketing analysis validation dataset
- **Average Response Latency:** <5 seconds for single-agent tasks
- **Error Rate:** <2% for agent execution failures
- **Prompt Effectiveness:** ≥85% success rate on marketing benchmark tasks
- **Workflow Latency Targets:** marketing-analysis <30s for 2 platforms, <60s for 5 platforms; verdict-generation <60s quick profile, <90s standard profile

### Integration Requirements

- [ ] All agents successfully access Phase 1 platform adapters (Meta, GA4, GSC, GBP, TikTok)
- [ ] Database queries retrieve normalized marketing metrics correctly
- [ ] Company context propagates through agent workflows (tenant ID, industry, region, goals)
- [ ] Agent telemetry integrates with Phase 0 logging system
- [ ] LangSmith tracing captures all agent executions
- [ ] **HTTP API layer** (`apps/api`) implements routes in [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md) with JWT, tenant scope, and rate limits (see [Remediation Plan](/docs/03-development-phases/REMEDIATION_PLAN.md) Part 2 **R-1–R-6**)

---

## Dependencies on Phase 1 (UPDATED)

### Critical Dependencies

**Platform Adapters (Phase 1) - ✅ COMPLETE**

- **Available:** Meta (Facebook/Instagram Ads), GA4 (Google Analytics 4), GSC (Google Search Console), GBP (Google Business Profile), TikTok Ads adapters
- **Purpose:** Agent tools fetch platform-specific marketing metrics
- **Integration Point:** `PlatformAdapter` interface from `@agenticverdict/platform-adapters`
- **Status:** All 5 adapters production-ready with OAuth, caching, rate limiting, normalization

**Data Normalization Layer (Phase 1) - ✅ COMPLETE**

- **Available:** `NormalizedPlatformSnapshot` schema with `platform`, `dateRange`, `records[]`
- **Purpose:** Agents analyze consistent marketing data structures across platforms
- **Integration Point:** `runNormalizationPipeline()` and `validateNormalizedSnapshot()`
- **Status:** Validation framework includes cross-field checks, data quality scoring, outlier detection

**Caching Infrastructure (Phase 1) - ✅ COMPLETE**

- **Available:** Memory + Upstash Redis cache with 80%+ hit rate target
- **Purpose:** Reduce redundant LLM API calls and platform data fetches
- **Integration Point:** `PlatformCache` interface, `buildAdapterCacheKey()`
- **Status:** Cache metrics tracking available via `AdapterMethodMetrics`

**Rate Limiting (Phase 1) - ✅ COMPLETE**

- **Available:** Circuit breakers, token buckets, exponential backoff with jitter
- **Purpose:** Protect LLM APIs and platform APIs from overload
- **Integration Point:** `CircuitBreaker`, `TokenBucket`, platform rate profiles
- **Status:** Platform-specific rate limits configured (Meta: 200/hour, GA4: 50k/day, GSC: 300 RPM, TikTok: 60 RPM)

### Foundation Dependencies (Phase 0) - ✅ COMPLETE

**Configuration Management**

- ✅ `CompanyConfig` schema with LLM provider settings, feature flags
- ✅ ConfigManager with caching, env merge, hot reload
- ✅ Agent configuration schemas ready

**Tenant Context System**

- ✅ AsyncLocalStorage-based context for tenant-scoped agent execution
- ✅ Multi-tenant data isolation via RLS
- ✅ Context propagation through agent chains

**Database Abstraction**

- ✅ Drizzle ORM with `marketing_metrics` table for historical data
- ✅ Agent execution logging capability
- ✅ Prompt version storage schema

**Logging Infrastructure**

- ✅ Pino structured logging with tenant context
- ✅ Request ID for distributed tracing
- ✅ Hooks for agent decision logging

### Dependency Validation

- [x] All Phase 1 platform adapters passing integration tests
- [x] Data normalization layer stable with schema version 1.0
- [x] Caching layer operational with ≥80% hit rate capability
- [x] Rate limiting tested and calibrated for production load
- [x] Configuration system supports agent-specific settings

**Assessment:** All Phase 0 and Phase 1 dependencies are **PRODUCTION-READY**. Phase 2 can proceed with confidence.

---

## High-Level Approach

### Architecture Strategy

**Layered Intelligence Design**

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestration Layer                │
│  (Workflow coordination, agent communication, routing)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Specialized Agents Layer                  │
│  (Marketing Analysis → Insights → Media Verdict Generation)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Agent Tool Layer                        │
│  (Platform Data: Meta, GA4, GSC, GBP, TikTok + Analysis)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     LangChain Runtime                        │
│  (LLM integration, prompt management, tool execution)        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Phase 1 Platform Layer                     │
│  (Meta, GA4, GSC, GBP, TikTok adapters + normalization)     │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Methodology

**Incremental Agent Development**

1. **Week 1: Foundation (Days 1-7)**
   - LangChain.js integration and configuration
   - Basic tool development (5 platform data access tools)
   - Simple ReAct agent implementation
   - Mock LLM testing framework

2. **Week 2: Specialization (Days 8-14)**
   - Specialized marketing agent development
   - Complex tool orchestration (cross-platform analysis)
   - Agent workflow implementation
   - Integration testing and optimization

**Progressive Enhancement**

- Start with rule-based agent behaviors for baseline functionality
- Add LLM-powered decision making for insights
- Implement multi-agent collaboration for complex analysis
- Optimize for production performance

### Technical Strategy

**Multi-Provider LLM Support**

- **Primary:** Claude 3.5 Sonnet (claude-3-5-sonnet-20241022) for complex reasoning
- **Secondary:** GPT-4 Turbo for faster response times on simple tasks
- **Fallback:** Automatic provider switching on failures
- **Strategy:** Route based on task complexity (simple queries → GPT-4, complex analysis → Claude)
- **Optional Provider Route:** GLM-compatible endpoint support may be enabled per tenant configuration when required

**Prompt Engineering Approach**

- Template-based prompts for consistency across marketing use cases
- Dynamic context injection for company-specific analysis (industry, region, goals, budget)
- A/B testing framework for prompt optimization
- Version control for prompt iteration

**Error Handling Strategy**

- Retry with exponential backoff for transient failures
- Circuit breaker for persistent LLM API issues
- Graceful degradation to rule-based logic
- Comprehensive error logging for debugging
- Per-platform isolation in workflow pipelines so one adapter failure does not force full-run failure

---

## Key Outcomes

### Deliverables

**Software Components**

1. LangChain.js runtime with multi-provider support
2. **10 production-ready agent tools:**
   - 5 platform data tools (Meta, GA4, GSC, GBP, TikTok)
   - 5 analysis tools (historical queries, trends, comparisons, calculations, context)
3. Three specialized agents (Marketing Analysis, Insight Generation, Media Verdict)
4. Agent orchestration workflow system
5. Prompt template library with company context injection
6. Mock LLM testing framework
7. Agent telemetry and monitoring integration
8. Worker workflow processors for `marketing-analysis` and `verdict-generation`
9. Typed workflow trigger and result contracts shared across API and worker

**Documentation**

1. Agent architecture documentation
2. Tool development guide
3. Prompt engineering best practices for marketing
4. Agent testing guide
5. Performance benchmarking report

**Infrastructure**

1. LangSmith observability integration
2. Agent execution logging
3. Prompt version control system
4. Agent performance dashboards

### Capabilities Enabled

**Marketing Intelligence Capabilities**

- Cross-platform marketing metric analysis with AI reasoning
- Automated insight generation from marketing data (anomalies, trends, opportunities)
- Intelligent media verdict formulation with evidence (ROAS analysis, budget recommendations)
- Context-aware recommendations based on company profile (B2B vs B2C, region, industry)

**Operational Capabilities**

- Deterministic testing of AI-powered features
- Observability into agent decision-making
- Performance monitoring and optimization
- Rapid iteration on prompts and agent behaviors

**Foundation for Phase 3**

- Agent-generated **insights** and **verdicts** using the **same** `GeneratedInsight` and **`MarketingVerdict`** types reports will render (no cross-phase schema rewrite)
- **HTTP APIs** for insights, verdicts, analysis results, and validation (see [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md))
- **Provenance** and **validation** contracts for trustworthy report narratives
- Performance benchmarks for SLA definition

### Business Value

**For Masafh (Primary Client - B2B GPS Fleet Tracking):**

- Analyze marketing performance across Meta Ads, GA4, GSC, GBP for lead generation campaigns
- Identify which platforms deliver the best quality leads (not just lowest CPA)
- Generate actionable verdicts on budget allocation (e.g., "Increase Meta Ads by 20%, decrease TikTok")
- Detect anomalies in campaign performance early (sudden drop in lead quality, spike in CPA)
- Support Arabic/English reporting for Saudi Arabia market

**Immediate Value**

- Reduced manual analysis time through AI automation
- More consistent insight generation across platforms
- Scalable analysis process as platform grows
- Foundation for advanced AI features

**Long-term Value**

- Competitive advantage through AI-powered marketing insights
- Improved client satisfaction with faster analysis
- Reduced operational costs through automation
- Platform for continuous AI capability enhancement

---

## Risk Mitigation

### Technical Risks

**LLM API Reliability**

- **Risk:** API downtime affects marketing analysis availability
- **Mitigation:** Multi-provider support (Claude + GPT-4), caching, graceful degradation to rule-based analysis

**Prompt Effectiveness for Marketing Data**

- **Risk:** Poor prompt quality leads to bad marketing analysis and recommendations
- **Mitigation:** A/B testing, validation dataset with real marketing scenarios, gradual rollout

**Cost Management**

- **Risk:** LLM API costs exceed budget for frequent analysis
- **Mitigation:** Aggressive caching of platform data and agent outputs, prompt optimization, provider cost optimization (GPT-4 for simple queries)

**Performance Latency**

- **Risk:** Agent response time impacts user experience for marketing teams
- **Mitigation:** Parallel platform data fetching, streaming responses, caching of common analysis patterns

### Operational Risks

**Team Expertise in Marketing Analytics**

- **Risk:** Limited LangChain/agent development experience + domain knowledge gap in marketing
- **Mitigation:** Training on marketing fundamentals, proof-of-concept sprint, consultation with marketing experts

**Testing Complexity with Marketing Data**

- **Risk:** Non-deterministic LLM responses complicate testing; marketing data variability
- **Mitigation:** Mock LLM framework, validation dataset with representative marketing scenarios, property-based testing

**Integration Challenges**

- **Risk:** Phase 1 dependencies delay Phase 2 progress
- **Mitigation:** Early integration testing with real platform adapters, feature flags, parallel development

---

## Next Steps

### Immediate Actions

1. **Validation:** Review Phase 1 completion status and platform adapter capabilities
2. **Environment Setup:** Configure LangChain.js development environment
3. **Proof of Concept:** Build simple agent with one platform tool (e.g., Meta Ads data fetch)
4. **Team Alignment:** Conduct LangChain/agent development training + marketing analytics domain training

### Week 1 Priorities

1. LangChain.js integration with Claude and GPT-4
2. First five agent tools (Meta, GA4, GSC, GBP, TikTok platform data access)
3. Basic ReAct agent implementation
4. Mock LLM testing framework foundation

### Week 2 Priorities

1. Three specialized agents (Marketing Analysis, Insight Generation, Media Verdict)
2. Five additional analysis tools (historical queries, trends, comparisons, calculations, context)
3. Agent orchestration workflow (end-to-end marketing verdict generation)
4. Integration testing with real platform data and optimization

### Transition to Phase 3

- Agent outputs validated for report generation
- Performance baselines established for SLA definition
- Prompt optimization process documented
- Agent monitoring integrated with production observability

---

## Platform Capability Matrix (NEW)

For reference, here's what each Phase 1 adapter provides to Phase 2 agents:

| Platform     | Key Metrics                                                       | Dimensions                                     | Primary Use Case                           |
| ------------ | ----------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| **Meta Ads** | spend, impressions, clicks, conversions, CTR, CPC, reach          | campaign, ad set, ad, date, platform (fb/ig)   | Paid social performance, creative testing  |
| **GA4**      | sessions, users, events, conversions, page views, engagement rate | source, medium, campaign, landing page, device | Website analytics, traffic source analysis |
| **GSC**      | queries, impressions, clicks, CTR, position                       | query, page, country, device, date             | SEO performance, content optimization      |
| **GBP**      | views, searches, interactions, reviews, rating                    | location, date                                 | Local presence, review sentiment analysis  |
| **TikTok**   | spend, impressions, clicks, conversions, CTR, CPC                 | campaign, ad group, ad, date                   | Emerging paid media, Gen Z audience        |

**Cross-Platform Analysis Opportunities:**

- ROAS comparison: Meta Ads vs TikTok for similar audiences
- Attribution: GA4 traffic sources → Meta/GSC/GBP performance
- Local + Paid: GBP views → Meta Ads geotargeting effectiveness
- SEO + Paid: GSC queries → Meta Ads keyword targeting

---

**Phase 2 Owner:** Development Lead  
**Technical Reviewer:** AI/ML Specialist  
**Dependencies:** Phase 1 (Platform Integration) ✅ COMPLETE  
**Blocks:** Phase 3 (Report Generation) requires agent outputs **and** stable contracts in [API_SPECIFICATIONS.md](./API_SPECIFICATIONS.md) / unified `MarketingVerdict` (**R-7**)
