# Testing Strategy for AgenticVerdict

## Document Information

- **Version**: 1.0
- **Last Updated**: 2026-04-03
- **Status**: Active
- **Owner**: Quality Assurance Team

## 1. Testing Philosophy

### Core Principles

- **Quality First**: Testing is not an afterthought but a fundamental part of development
- **Shift Left**: Test requirements and designs before implementation
- **Automate Everything**: Automate repetitive tests to free human testers for exploratory testing
- **Fast Feedback**: Maintain rapid test execution cycles for quick iteration
- **Real-World Scenarios**: Test with actual data patterns and user workflows
- **Continuous Improvement**: Regularly review and enhance testing practices

### Quality Attributes

- **Reliability**: Consistent test results across environments
- **Maintainability**: Easy to update and extend tests
- **Performance**: Fast execution without sacrificing coverage
- **Clarity**: Clear test intentions and failure messages

## 2. Testing Pyramid

```
         ┌──────────────────┐
         │   E2E Tests (5%) │
         │  Critical paths  │
         └────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    │    System Tests (10%)     │
    │  Component integration    │
    └─────────────┬─────────────┘
                  │
    ┌─────────────┴─────────────┐
    │  Integration Tests (25%)  │
    │    API & Data flows       │
    └─────────────┬─────────────┘
                  │
┌─────────────────┴─────────────────┐
│     Unit Tests (60%)              │
│  Fast, isolated, comprehensive    │
└───────────────────────────────────┘
```

### Unit Tests (60%)

- **Purpose**: Validate individual components in isolation
- **Execution**: < 5 minutes total
- **Tools**: Jest, pytest, JUnit
- **Coverage**: 80%+ for critical business logic

### Integration Tests (25%)

- **Purpose**: Verify component interactions
- **Execution**: < 30 minutes total
- **Scope**: API endpoints, database operations, external services
- **Environment**: Staging with test data

### System Tests (10%)

- **Purpose**: Validate complete workflows
- **Execution**: < 2 hours total
- **Scope**: Multi-component user journeys
- **Environment**: Pre-production

### E2E Tests (5%)

- **Purpose**: Verify critical business paths
- **Execution**: < 4 hours total
- **Scope**: Real user scenarios across full stack
- **Environment**: Production-like

## 3. Phase-Specific Testing Requirements

### Phase 0: Foundation

- **Unit Testing**: All utility functions, data models
- **Integration Testing**: Database connections, basic API endpoints
- **Coverage Target**: 70% for core utilities
- **Automated**: 80% of tests

### Phase 1: Core Platform

- **Unit Testing**: Business logic, validation rules, data processing
- **Integration Testing**: Complete API surface, authentication, authorization
- **System Testing**: User registration, login, basic operations
- **Coverage Target**: 80% for business logic
- **Automated**: 85% of tests

### Phase 2: Single-Tenant Operations

- **Unit Testing**: Domain-specific logic, report generation
- **Integration Testing**: Full workflow APIs, external integrations
- **System Testing**: Complete user journeys, error scenarios
- **E2E Testing**: Critical business workflows
- **Coverage Target**: 85% for domain logic
- **Automated**: 90% of tests

### Phase 3: Multi-Tenant Architecture

- **Unit Testing**: Tenant isolation, permission logic
- **Integration Testing**: Multi-tenant data access, routing
- **System Testing**: Tenant provisioning, cross-tenant operations
- **E2E Testing**: Multi-tenant scenarios
- **Coverage Target**: 90% for tenant logic
- **Automated**: 95% of tests

### Phase 4: AI Agent System

- **Unit Testing**: Agent decision logic, prompt templates
- **Integration Testing**: Agent-platform interfaces, AI provider APIs
- **System Testing**: Agent workflows, fallback mechanisms
- **E2E Testing**: Complete AI-assisted operations
- **Coverage Target**: 85% for agent logic
- **Automated**: 85% of tests (some AI aspects require manual validation)

### Phase 5: Platform Expansion

- **Unit Testing**: Platform-specific adapters, parsers
- **Integration Testing**: Platform API integrations, data transformation
- **System Testing**: Platform-specific workflows
- **E2E Testing**: Multi-platform scenarios
- **Coverage Target**: 80% per platform adapter
- **Automated**: 90% of tests

### Phase 6: Analytics & Reporting

- **Unit Testing**: Calculation logic, aggregation functions
- **Integration Testing**: Data pipeline, reporting APIs
- **System Testing**: Report generation, dashboards
- **E2E Testing**: Scheduled reports, notifications
- **Coverage Target**: 85% for analytics logic
- **Automated**: 90% of tests

## 4. Coverage Requirements

### Minimum Coverage Targets

| Component Type  | Minimum Coverage | Critical Components |
| --------------- | ---------------- | ------------------- |
| Business Logic  | 85%              | 90%                 |
| Data Models     | 80%              | 85%                 |
| API Controllers | 75%              | 85%                 |
| Utilities       | 90%              | 95%                 |
| UI Components   | 70%              | 80%                 |

### Critical Code Definition

Code is considered critical if it:

- Handles financial transactions
- Manages user authentication/authorization
- Processes sensitive data
- Implements tenant isolation
- Controls agent behavior
- Generates official reports
- Handles data persistence

### Coverage Exclusions

- Third-party libraries (vetted separately)
- Configuration files
- Generated code
- Simple DTOs with no logic
- Platform-specific native code (use platform testing)

## 5. Test Automation Strategy

### Automation Pyramid

```
┌─────────────────────────────────┐
│      Manual Testing (10%)       │
│   Exploratory, UX, Complex AI   │
└─────────────┬───────────────────┘
              │
┌─────────────┴───────────────────┐
│    Automated Testing (90%)      │
│  Unit, Integration, System, E2E │
└─────────────────────────────────┘
```

### CI/CD Integration

- **Pre-commit**: Linting, format checking, unit tests (< 30 seconds)
- **On Push**: Full unit test suite, integration tests (< 10 minutes)
- **On PR**: Extended integration tests, system tests (< 30 minutes)
- **Pre-merge**: Full test suite including E2E (< 2 hours)
- **Nightly**: Comprehensive test suite, performance tests (< 6 hours)
- **Weekly**: Security scanning, compliance tests

### Test Environment Strategy

- **Local Development**: Local services (PostgreSQL, Redis) started via `pnpm db:up`, or in-memory mocks
- **CI Environment**: Automated provisioning with test data and service containers
- **Staging**: Mirror of production with anonymized data
- **Production**: Canary deployments with automated monitoring

## 6. Mock Data and Test Fixtures

### Test Data Strategy

#### Mock Data Principles

- **Realistic**: Match production data patterns
- **Isolated**: No dependencies between test data sets
- **Deterministic**: Same data every time
- **Comprehensive**: Cover edge cases and boundary conditions

#### Fixture Categories

**Base Fixtures** (framework, tenant, platform configurations)

```yaml
# Example structure
test_tenants:
  - id: "tenant-001"
    name: "Acme Corporation"
    plan: "enterprise"
    settings: { ... }

test_platforms:
  - id: "shopify"
    name: "Shopify"
    api_version: "2024-01"
    credentials: { ... }
```

**Domain Fixtures** (orders, customers, products)

```yaml
test_orders:
  - id: "order-001"
    platform: "shopify"
    customer: "customer-001"
    items: [...]
    total: 150.00
    status: "completed"
```

**Edge Case Fixtures** (error scenarios, boundary conditions)

```yaml
edge_cases:
  - large_orders: 1000+ items
  - international: Multi-currency
  - complex_disputes: Multiple transactions
  - api_failures: Timeout, rate limit
```

### Fixture Management

- **Location**: `/tests/fixtures/` directory
- **Format**: JSON for static data, YAML for configurations
- **Version Control**: All fixtures in Git
- **Refresh Strategy**: Monthly review and update
- **Privacy**: No real customer data, synthetic only

### Mock Services

- **External APIs**: WireMock or similar for external services
- **AI Providers**: Mock responses for consistent testing
- **Payment Gateways**: Sandbox environments
- **Email Services**: Test mailboxes

## 7. Performance Testing

### Performance Test Types

#### Load Testing

- **Purpose**: Validate system capacity
- **Tool**: k6, JMeter, Gatling
- **Scenarios**:
  - Normal load: 100 concurrent users
  - Peak load: 500 concurrent users
  - Stress test: Beyond capacity limits

#### Response Time Targets

| Operation         | P50     | P95     | P99     |
| ----------------- | ------- | ------- | ------- |
| API calls         | < 100ms | < 300ms | < 500ms |
| Page load         | < 1s    | < 2s    | < 3s    |
| Report generation | < 5s    | < 15s   | < 30s   |
| AI agent response | < 2s    | < 10s   | < 30s   |

#### Scalability Testing

- **Horizontal Scaling**: Add instances, measure throughput
- **Vertical Scaling**: Increase resources, measure performance gain
- **Database Performance**: Query optimization, indexing
- **Cache Efficiency**: Hit rates, invalidation strategies

### Performance Monitoring

- **Metrics**: Response time, throughput, error rate, resource usage
- **Tools**: Prometheus, Grafana, APM solutions
- **Alerts**: Threshold-based notifications
- **Baseline**: Establish performance baselines for each phase

## 8. Security Testing

### Security Test Categories

#### Authentication & Authorization

- **Password policies**: Complexity, rotation, expiration
- **Session management**: Timeout, token handling
- **Role-based access**: Permission enforcement
- **API security**: Rate limiting, token validation

#### Data Protection

- **Encryption**: At rest and in transit
- **Data masking**: Sensitive information in logs
- **Tenant isolation**: No cross-tenant data leakage
- **PII handling**: Compliance with privacy regulations

#### Input Validation

- **SQL injection**: Parameterized queries
- **XSS prevention**: Output encoding
- **CSRF protection**: Token validation
- **File upload**: Type and size restrictions

### Security Testing Tools

- **SAST**: Static code analysis (SonarQube, CodeQL)
- **DAST**: Dynamic application security testing (OWASP ZAP)
- **Dependency Scanning**: Vulnerability detection (Snyk, Dependabot)
- **Secret Scanning**: Credential detection in code

### Security Test Schedule

- **Pre-commit**: Secret scanning, dependency checks
- **Nightly**: Full security scan
- **Pre-release**: Comprehensive security audit
- **Quarterly**: Penetration testing

## 9. Specialized Testing Considerations

### Multi-Tenancy Testing

#### Tenant Isolation

- **Data Segregation**: Verify no cross-tenant data access
- **Resource Allocation**: Fair resource distribution
- **Configuration Separation**: Tenant-specific settings
- **Performance Isolation**: No "noisy neighbor" effects

#### Test Scenarios

```yaml
multi_tenant_tests:
  - scenario: "Tenant provisioning"
    steps: [create, configure, activate]

  - scenario: "Concurrent tenant operations"
    load: 100 tenants, 10 users each

  - scenario: "Tenant upgrade/downgrade"
    transitions: [basic → pro, pro → enterprise]

  - scenario: "Data isolation verification"
    checks: [database, cache, files, logs]
```

#### Tenant Testing Strategy

- **Test Tenants**: Dedicated test tenants for each plan type
- **Data Cleanup**: Complete isolation between test runs
- **Performance Testing**: Multi-tenant load scenarios
- **Configuration Testing**: Plan-specific features

### AI Agent Testing

#### AI-Specific Challenges

- **Non-deterministic behavior**: LLM responses vary
- **Cost per test**: API calls have monetary cost
- **Evaluation complexity**: Assessing response quality
- **Rate limiting**: Provider constraints

#### Testing Strategy

**Unit Testing** (Deterministic)

```python
# Test agent logic with mocked AI responses
def test_agent_decision_logic():
    mock_response = {"decision": "approve", "confidence": 0.95}
    result = agent.process_claim(mock_response)
    assert result.status == "approved"
    assert result.confidence > 0.9
```

**Integration Testing** (Controlled AI)

```python
# Test with real AI but controlled inputs
def test_agent_with_real_ai():
    test_scenarios = [
        {"input": "clear_case", "expected": "approve"},
        {"input": "ambiguous_case", "expected": "escalate"},
        {"input": "fraud_indicators", "expected": "decline"}
    ]
    for scenario in test_scenarios:
        result = agent.process(scenario.input)
        assert result.action == scenario.expected
```

**Evaluation Testing** (Quality Assessment)

```python
# Assess AI response quality
def test_agent_response_quality():
    evaluator = ResponseEvaluator()
    test_cases = load_test_cases()

    for case in test_cases:
        response = agent.generate_response(case.context)
        quality = evaluator.evaluate(response, case.expected)
        assert quality.score >= 0.8
```

#### AI Testing Best Practices

- **Mocking**: Use mock responses for unit tests
- **Caching**: Cache AI responses for consistent integration tests
- **Evaluation**: Human evaluation of sample responses
- **Cost Management**: Separate test API keys with usage limits
- **Fallback Testing**: Verify graceful degradation on AI failures

#### MarketingVerdict prompt/schema compliance (required)

- **Unit**: validate `parseMarketingVerdictFromAgentText` rejects invalid UUID ids, enum case mismatches, and non-numeric `estimatedImpact` values
- **Prompt policy**: assert the media verdict system policy includes strict enum literals, UUID v4 requirements, and numeric examples
- **Pipeline integration**: verify tolerated parse failures return `degraded` with field-level diagnostics in the error message
- **Production-flow regression**: keep a scenario that asserts schema-compliant verdict output shape and fails fast on parse/schema violations

### Platform Adapter Testing

#### Adapter Testing Strategy

```yaml
adapter_tests:
  structure:
    - base_tests: "Common for all platforms"
    - platform_specific: "Custom per platform"
    - integration_tests: "End-to-end workflows"

  coverage:
    - api_compatibility: "All supported API versions"
    - error_handling: "Rate limits, timeouts, failures"
    - data_mapping: "Transformations, validations"
    - webhooks: "Event processing, idempotency"
```

#### Test Fixture Template

```python
class PlatformAdapterTest:
    def setUp(self):
        self.adapter = create_adapter(platform="shopify")
        self.mock_api = mock_platform_api()

    def test_authentication(self):
        # Verify API authentication
        pass

    def test_data_fetch(self):
        # Test data retrieval
        pass

    def test_error_handling(self):
        # Test error scenarios
        pass

    def test_rate_limiting(self):
        # Test rate limit handling
        pass

    def test_webhook_processing(self):
        # Test webhook events
        pass
```

#### Platform-Specific Considerations

- **API Versions**: Test against all supported versions
- **Rate Limits**: Verify backoff strategies
- **Pagination**: Handle large datasets correctly
- **Field Mapping**: Validate data transformations
- **Error Codes**: Handle platform-specific errors

### Report Generation Testing

#### Report Testing Categories

**Data Accuracy**

- Verify calculations match specifications
- Cross-check with source data
- Validate aggregation logic
- Test rounding and formatting

**Format Validation**

- PDF rendering: Layout, fonts, images
- HTML reports: Responsive design, printing
- CSV exports: Delimiter handling, encoding
- JSON exports: Schema validation

**Performance**

- Large reports: 10,000+ transactions
- Concurrent generation: Multiple reports simultaneously
- Template rendering: Complex layouts, charts
- Caching: Repeated report requests

#### Test Scenarios

```yaml
report_tests:
  - scenario: "Standard dispute report"
    data_size: 100 transactions
    format: PDF

  - scenario: "Large volume report"
    data_size: 10000 transactions
    format: Excel

  - scenario: "Multi-platform report"
    platforms: [shopify, stripe, paypal]
    format: PDF

  - scenario: "Scheduled report"
    schedule: daily
    delivery: email
```

#### Visual Regression Testing

- **Tools**: Percy, Chromatic, or similar
- **Scope**: Report templates, dashboards
- **Baseline**: Establish visual references
- **Comparison**: Pixel-perfect matching
- **Approval**: Manual review for differences

## 10. Testing Tools and Frameworks

### Recommended Toolchain

| Category            | Tools                         |
| ------------------- | ----------------------------- |
| Unit Testing        | Jest, pytest, JUnit           |
| Integration Testing | Supertest, REST Assured       |
| E2E Testing         | Playwright, Cypress           |
| API Testing         | Postman, Newman, REST Assured |
| Performance Testing | k6, JMeter, Gatling           |
| Security Testing    | OWASP ZAP, SonarQube          |
| Mock Servers        | WireMock, MSW                 |
| Test Data           | Faker, generated fixtures     |
| Coverage            | Istanbul, Coverage.py, JaCoCo |
| CI/CD               | GitHub Actions, GitLab CI     |

### Tool Selection Criteria

- Community support and documentation
- Integration with existing tech stack
- Ease of use and learning curve
- Performance and reliability
- Cost and licensing

## 11. Test Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review flaky tests, update fixtures
- **Monthly**: Review coverage metrics, update test data
- **Quarterly**: Tool upgrades, strategy review
- **Annually**: Comprehensive test suite audit

### Test Health Metrics

- **Flakiness Rate**: < 2% of tests
- **Execution Time**: Maintain within SLA
- **Maintenance Burden**: < 20% of development time
- **False Positive Rate**: < 1%

### Test Debt Management

- Identify and track test debt
- Allocate time for test refactoring
- Prioritize critical test improvements
- Prevent accumulation of technical debt

## 12. Testing Documentation

### Required Documentation

- Test plans for each feature
- Test case specifications
- Test data documentation
- Test environment setup guides
- Test execution procedures
- Defect reporting guidelines

### Documentation Standards

- Clear, concise, actionable
- Version controlled with code
- Regularly updated
- Accessible to entire team

## 13. Continuous Improvement

### Metrics and KPIs

- **Defect Escape Rate**: < 5% to production
- **Test Automation Ratio**: > 90%
- **Mean Time to Detection**: < 1 hour
- **Test Execution Time**: Within SLA
- **Code Coverage**: Meeting targets

### Regular Reviews

- **Sprint Retrospectives**: Discuss testing challenges
- **Quarterly Reviews**: Strategy evaluation
- **Annual Assessments**: Tool and process optimization

### Experimentation

- Pilot new testing tools
- Explore AI-assisted testing
- Adopt industry best practices
- Share lessons learned

---

## Appendix: Quick Reference

### Test Command Examples

```bash
# Run all unit tests
npm test

# Run integration tests
npm run test:integration

# Run specific test suite
npm test -- --grep "Multi-tenancy"

# Generate coverage report
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run performance tests
k6 run performance/load-test.js
```

### Coverage Report

```bash
# Generate coverage report
npm run coverage

# Check specific file coverage
npm run coverage:report -- src/services/tenant.service.ts

# Enforce coverage thresholds
npm run coverage:check
```

### Test Data Generation

```bash
# Generate test fixtures
npm run fixtures:generate

# Seed test database
npm run db:seed

# Reset test data
npm run fixtures:reset
```

---

**Document Owners**: QA Team
**Review Cycle**: Quarterly
**Change History**: Maintain version history in Git
