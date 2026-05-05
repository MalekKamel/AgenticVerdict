# AI Provider Architecture Review Prompt

**Document Type:** Architecture Review Specification  
**Review Scope:** AI Provider Integration Architecture & Migration Plan  
**Timebox:** 2-3 hours  
**Output:** `/docs/reviews/ai-provider-architecture-review.md`

---

## Context

### Source Documents Under Review

| Document                  | Location                                        | Purpose                                                    |
| ------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| **Architecture Analysis** | `/docs/analysis/ai-provider-architecture.md`    | Lobe Chat pattern analysis for 73+ provider support        |
| **Migration Plan**        | `/docs/plans/ai-provider-migration-plan.md`     | 8-week implementation roadmap with destructive replacement |
| **Reference Prompt**      | `/prompts/ai-provider-architecture-analysis.md` | Original analysis prompt                                   |

### Business Requirements (Authoritative Source)

**Document:** `/docs/architecture/business/business-architecture.md`

| Section         | Requirement                                                         | Relevance to Review                                     |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| **Section 2**   | Core Business Entities (Insights, Connectors, Metrics)              | Provider abstraction must support configurable Insights |
| **Section 2.4** | Insight Configuration (AI settings, model selection, quality level) | Provider architecture must enable runtime configuration |
| **Section 6**   | Multi-Tenancy Model (Direct Business + Agency Partner)              | Tenant isolation is non-negotiable                      |
| **Section 6.2** | Agency Partner Capabilities (multi-client management)               | Credential isolation per tenant                         |
| **Section 8**   | Deployment Flexibility (Desktop, Web, Cloud, Self-Hosted)           | All 4 modes must be supported                           |
| **Section 9**   | Success Criteria (self-service, <5 min setup, 70% template usage)   | Technical implementation must enable these metrics      |

---

## Objective

Conduct a comprehensive architecture review to validate that the AI provider integration design:

1. **Aligns with Business Requirements:** Supports all stakeholder needs from business-architecture.md
2. **Ensures Production Readiness:** Meets security, observability, resilience, and performance standards
3. **Maintains Architectural Quality:** Follows repository patterns, clean separation of concerns, extensibility
4. **Identifies Risks Early:** Surfaces gaps, technical debt, and implementation risks before Week 1 begins

**Review Decision:** Produce a clear recommendation: **Approved** | **Approved with Conditions** | **Needs Revision**

---

## Review Tasks

### Task 1: Business Requirements Validation (30 min)

Validate architecture supports all business requirements:

#### 1.1 Multi-Tenancy Alignment (Section 6)

- [ ] **Data Isolation:** Tenant-scoped credentials, per-tenant API keys, row-level security alignment
- [ ] **Configuration Isolation:** ProviderConfig per tenant via TenantConfig
- [ ] **Resource Isolation:** Per-tenant rate limiting, quotas, budget enforcement
- [ ] **Visual Isolation:** Tenant metadata in all error objects, logs, and dashboards

#### 1.2 Insight Configuration Support (Section 2.4)

- [ ] **Model Selection:** Dynamic model discovery, provider-model mapping
- [ ] **Quality Level:** Model capabilities metadata, tiered model selection
- [ ] **Cost Control:** Lifecycle hooks for billing, budget tracking per tenant
- [ ] **Template Support:** Provider configuration templates with full customization

#### 1.3 Agency Partner Capabilities (Section 6.2)

- [ ] **Multi-Tenant Management:** CredentialManager enables instant tenant switching
- [ ] **Client Onboarding:** Rapid provisioning with provider config templates
- [ ] **Centralized Oversight:** Health dashboard, cost tracking per tenant

#### 1.4 Deployment Flexibility (Section 8)

- [ ] **Desktop:** Encrypted local credential storage
- [ ] **Web:** Session-based credentials with AsyncLocalStorage
- [ ] **Cloud:** Integration with managed secret managers
- [ ] **Self-Hosted:** Customer-provided keys, configuration-driven setup

**Deliverable:** Table mapping each business requirement to technical implementation with status (✅ Supported | ⚠️ Partial | ❌ Missing)

---

### Task 2: Architecture Quality Review (45 min)

Assess technical design quality and maintainability:

#### 2.1 Provider Abstraction Layer

- [ ] **Factory Pattern:** ProviderFactory enables adding providers without code changes
- [ ] **Configuration-Driven:** New providers require <4 hours (configuration only)
- [ ] **Unified Interface:** Consistent API across all providers (chat, embeddings, models)
- [ ] **Capability Detection:** Graceful degradation for unsupported features

#### 2.2 Error System Integration

- [ ] **Canonical Error Types:** All errors map to `AgentRuntimeErrorCode` enum
- [ ] **Tenant Metadata:** Every error includes tenantId, providerId, requestId
- [ ] **Error Transformation:** Provider-specific errors → canonical types
- [ ] **Integration Point:** Aligns with `packages/core/src/error-system/`

#### 2.3 Lifecycle Hooks Design

- [ ] **Hook Types:** beforeChat, onChatComplete, onChatError (and embeddings equivalents)
- [ ] **Billing Integration:** Cost tracking, budget checking, usage recording
- [ ] **Tracing Integration:** LangSmith/Langfuse support
- [ ] **Structured Logging:** Pino integration with tenant context
- [ ] **Hook Composition:** Multiple hooks can be composed safely

#### 2.4 Tenant Context Propagation

- [ ] **AsyncLocalStorage:** Tenant context set at API entry, propagated through all layers
- [ ] **Credential Retrieval:** CredentialManager uses tenant context, never hardcoded
- [ ] **Database Access:** All DB calls use dbScoped() wrapper
- [ ] **Cache Keys:** Tenant-prefixed Redis keys (`tenant:{id}:...`)
- [ ] **Logging:** All log entries include tenantId

#### 2.5 Streaming Protocol

- [ ] **Unified Protocol:** Consistent chunk types across providers (text, tool_calls, usage, error)
- [ ] **Error Handling:** Errors in stream transform to canonical types
- [ ] **Performance:** p95 latency <2s for chat completions

**Deliverable:** Architecture strengths and weaknesses with specific code references

---

### Task 3: Implementation Plan Assessment (30 min)

Evaluate the 4-phase, 8-week migration plan:

#### 3.1 Phase Sequencing

- [ ] **Phase 1 (Foundation):** Core interfaces, factory, error system, OpenAI provider
- [ ] **Phase 2 (Expansion):** 7+ providers, lifecycle hooks, Bedrock
- [ ] **Phase 3 (Destructive Replacement):** Legacy removal, all agents replaced
- [ ] **Phase 4 (Advanced):** Model discovery, health monitoring, rate limiting, cost optimization

**Review Questions:**

- Are dependencies between phases logical?
- Is Week 6 destructive replacement too aggressive?
- Are acceptance criteria measurable and testable?

#### 3.2 Destructive Replacement Strategy

- [ ] **Legacy Audit:** Complete inventory of hardcoded providers (glm-config.ts, langchain-integration.ts, etc.)
- [ ] **Validation Script:** Automated detection of legacy patterns
- [ ] **Zero-Reference Policy:** Zero `ChatOpenAI`, `ChatAnthropic`, `@langchain/*` outside tests
- [ ] **Rollback Plan:** Full system restore from backup if deployment fails

**Risk Assessment:** Is destructive replacement too risky? Should gradual migration be considered?

#### 3.3 Testing Strategy

- [ ] **Unit Tests:** 85%+ coverage for business logic, 90%+ for critical paths
- [ ] **Integration Tests:** Provider API integration with mock responses
- [ ] **Performance Tests:** Latency benchmarks, load testing
- [ ] **Tenant Isolation Tests:** Validate credentials never leak across tenants
- [ ] **Legacy Detection Tests:** Ensure zero references remain after Phase 3

#### 3.4 Timeline Realism

- [ ] **8 Weeks / 120 Person-Days:** Realistic or optimistic?
- [ ] **Critical Path:** Which tasks are on critical path?
- [ ] **Buffer Time:** Is there contingency for unexpected complexity?

**Deliverable:** Implementation plan feedback with timeline assessment (realistic / optimistic / pessimistic)

---

### Task 4: Risk Analysis (30 min)

Identify and assess risks:

| Risk Category   | Specific Risk             | Impact (H/M/L) | Probability (H/M/L) | Current Mitigation                   | Additional Mitigation Needed |
| --------------- | ------------------------- | -------------- | ------------------- | ------------------------------------ | ---------------------------- |
| **Security**    | Credential leaks          | Critical       | Low                 | Encryption at rest, tenant isolation | ?                            |
| **Security**    | Tenant data leakage       | Critical       | Low                 | AsyncLocalStorage, RLS               | ?                            |
| **Technical**   | Incomplete legacy removal | High           | Medium              | Validation script                    | ?                            |
| **Technical**   | Performance regression    | Medium         | Medium              | Benchmarks, load testing             | ?                            |
| **Technical**   | Provider API changes      | Medium         | High                | Abstraction layer, health checks     | ?                            |
| **Business**    | Cost overruns             | High           | Medium              | Budget hooks, rate limiting          | ?                            |
| **Business**    | Missing edge cases        | High           | Medium              | Comprehensive test coverage          | ?                            |
| **Operational** | Deployment failure        | High           | Low                 | Backup/restore, rollback plan        | ?                            |
| **Operational** | Missing documentation     | Medium         | Medium              | Documentation deliverables defined   | ?                            |

**Deliverable:** Completed risk register with mitigation recommendations

---

### Task 5: Gap Identification (15 min)

Surface missing requirements, underspecified details, and integration gaps:

#### 5.1 Missing Business Requirements

- [ ] Product metrics (70% template usage, 50% multi-connector) not connected to technical implementation
- [ ] <5 minute Insight creation time not addressed in provider architecture
- [ ] Template system for Insights not detailed (only provider config templates)

#### 5.2 Underspecified Technical Details

- [ ] Credential rotation mechanism (how often, trigger conditions, user experience)
- [ ] Model discovery caching strategy (TTL, invalidation, multi-tenant considerations)
- [ ] Health check implementation details (frequency, thresholds, alerting integration)
- [ ] Rate limiting algorithm (token bucket, sliding window, distributed coordination)

#### 5.3 Integration Points Not Covered

- [ ] Frontend UI for provider configuration (Admin Dashboard integration)
- [ ] Billing system integration (how usage data flows to billing)
- [ ] Report generator integration (how agents consume provider runtime)
- [ ] Monitoring/alerting dashboards (Prometheus metrics, Grafana panels)

#### 5.4 Documentation Gaps

- [ ] Runbooks for common issues (API key expiration, rate limit exceeded, provider outage)
- [ ] Troubleshooting guides for support staff
- [ ] API reference for lifecycle hooks
- [ ] Migration guide for existing agents (for team training)

**Deliverable:** List of gaps categorized by severity (Critical / High / Medium / Low)

---

## Deliverables

Write the review report to: `/docs/reviews/ai-provider-architecture-review.md`

### Required Sections

```markdown
# AI Provider Architecture Review Report

## Executive Summary

- **Recommendation:** Approved | Approved with Conditions | Needs Revision
- **Critical Issues:** [List 3-5 blockers if any]
- **Overall Assessment:** [2-3 paragraph summary]

## 1. Business Alignment Analysis

- Requirement mapping table (Requirement → Implementation → Status)
- Gaps or misalignments identified
- Recommended changes

## 2. Technical Review Findings

- Architecture strengths
- Architecture weaknesses
- Specific code/design improvements (with examples)

## 3. Implementation Plan Feedback

- Phase sequencing assessment
- Timeline realism evaluation
- Missing tasks or dependencies
- Testing strategy feedback

## 4. Risk Register

[Completed table from Task 4]

## 5. Gap Analysis

- Missing requirements
- Underspecified details
- Integration gaps
- Documentation gaps

## 6. Actionable Recommendations

### Critical (Must Fix Before Implementation)

1. [Specific, actionable recommendation]
2. ...

### High Priority (Required for Production)

1. ...

### Medium Priority (Improve Maintainability)

1. ...

### Low Priority (Optimizations)

1. ...

## Appendix: Review Checklist

[Completed checklists from all 5 tasks]
```

---

## Review Criteria

### Architecture Quality Standards

| Criterion                  | Pass Condition                                                             | Evidence Required                         |
| -------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| **Separation of Concerns** | Clear layer boundaries (Application → Runtime → Provider → Infrastructure) | Architecture diagram, module dependencies |
| **Extensibility**          | New provider in <4 hours with configuration only                           | Provider addition walkthrough             |
| **Error Consistency**      | 100% of errors use canonical types with tenant metadata                    | Error mapping audit                       |
| **Tenant Isolation**       | Zero credential leakage across tenants                                     | Tenant isolation test results             |
| **Observability**          | Structured logging, tracing, metrics on all provider operations            | Log examples, tracing screenshots         |

### Business Alignment Standards

| Criterion                  | Pass Condition                                     | Evidence Required                   |
| -------------------------- | -------------------------------------------------- | ----------------------------------- |
| **Self-Service**           | Provider configuration without code changes        | Configuration UI mockup or workflow |
| **Template Support**       | Insight templates initialize from provider configs | Template schema, example            |
| **Agency Partner**         | Multi-tenant dashboard with instant switching      | Tenant switching flow               |
| **Deployment Flexibility** | All 4 deployment modes supported                   | Deployment-specific config examples |
| **Cost Control**           | Budget enforcement per tenant                      | Budget hook implementation          |

### Production Readiness Standards

| Criterion       | Pass Condition                                            | Evidence Required                       |
| --------------- | --------------------------------------------------------- | --------------------------------------- |
| **Security**    | Credential encryption, zero hardcoded keys, audit logging | Security audit checklist                |
| **Resilience**  | Circuit breakers, retry logic, fallback strategies        | Resilience pattern documentation        |
| **Performance** | p95 latency <2s, throughput targets met                   | Load test results                       |
| **Operations**  | Health monitoring, alerting, runbooks                     | Dashboard screenshots, runbook examples |

---

## Review Process

### Step 1: Document Reading (30 min)

1. Read `/docs/analysis/ai-provider-architecture.md` (skim Sections 1-6, deep-read Sections 3, 7, 8)
2. Read `/docs/plans/ai-provider-migration-plan.md` (focus on Tasks, Acceptance Criteria, Risks)
3. Re-read `/docs/architecture/business/business-architecture.md` (Sections 2, 6, 8, 9)

### Step 2: Systematic Analysis (60 min)

1. Complete Task 1 checklist (Business Requirements Validation)
2. Complete Task 2 checklist (Architecture Quality Review)
3. Complete Task 3 checklist (Implementation Plan Assessment)
4. Complete Task 4 checklist (Risk Analysis)
5. Complete Task 5 checklist (Gap Identification)

### Step 3: Synthesis (30 min)

1. Organize findings into deliverable structure
2. Prioritize recommendations by impact and effort
3. Write executive summary with clear recommendation

### Step 4: Quality Check (15 min)

1. Verify all review tasks are addressed
2. Confirm recommendations are specific and actionable
3. Check tone is constructive and professional
4. Ensure business requirements are explicitly referenced

---

## Success Criteria for Review

A high-quality review will:

- ✅ Surface **3-5 critical issues** (if none exist, architecture is suspiciously perfect)
- ✅ Provide **specific, actionable recommendations** (not vague suggestions like "improve security")
- ✅ Reference **business requirements explicitly** (section numbers from business-architecture.md)
- ✅ Balance **praise for good design** with constructive criticism
- ✅ Enable **informed go/no-go decision** for implementation
- ✅ Include **code examples** for recommended improvements where applicable
- ✅ Complete **all checklists** from the 5 review tasks

---

## Cross-Reference Validation Points

Trace these critical flows across all three documents:

| Validation Point        | Documents to Cross-Reference                         | Review Question                                   |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| **Tenant Isolation**    | Migration Plan 1.4 + Business 6 + Architecture 3.4   | Is tenant context propagated through all layers?  |
| **Error Consistency**   | Migration Plan 1.3 + Architecture 3.5 + Business 4   | Do error types map to stakeholder requirements?   |
| **Provider Selection**  | Migration Plan 2.3 + Business 2.4 + Architecture 5.1 | Is configuration-driven selection truly no-code?  |
| **Billing Integration** | Migration Plan 2.4 + Business 7.2 + Architecture 3.4 | Is cost tracking accurate per tenant?             |
| **Deployment Support**  | Migration Plan 9.4 + Business 8 + Architecture 7.3   | Are all 4 deployment modes technically supported? |

---

## Output Quality Gate

Before finalizing the review report, verify:

- [ ] Executive summary provides clear recommendation (Approved / Approved with Conditions / Needs Revision)
- [ ] At least 3 critical issues identified (or explicit statement that architecture is exceptionally sound)
- [ ] All 5 review task checklists completed
- [ ] Risk register populated with at least 8 risks
- [ ] Recommendations are prioritized (Critical, High, Medium, Low)
- [ ] Business requirements referenced by section number
- [ ] Specific code/design improvement examples provided
- [ ] Review report written to `/docs/reviews/ai-provider-architecture-review.md`

---

**Review Start:** [Date]  
**Review Complete:** [Date]  
**Reviewer:** [Name]  
**Review Decision:** [Approved / Approved with Conditions / Needs Revision]
