# Production Hardening - Implementation Plan

**Phase**: 04 - Production Hardening  
**Status**: ✅ Complete (Retrospective)  
**Implementation Period**: Weeks 12-14 (consolidated with Foundation)

## Executive Summary

This implementation plan documents the **actual work completed** for Production Hardening. The phase focused on transforming AgenticVerdict from a development environment into an enterprise-ready SaaS platform with comprehensive testing, security, observability, and deployment automation.

**Key Achievement**: Delivered production-grade infrastructure while maintaining excellent developer experience through Docker Compose workflows and Makefile automation.

## Completed Implementation

### 1. Testing Infrastructure ✅

**Delivered**: Comprehensive testing framework with 70%+ coverage

#### Unit Testing (Vitest)
- **Framework**: Vitest with v8 coverage provider
- **Test Files**: 646+ test files across packages and apps
- **Coverage Thresholds**: 
  - 70% lines, functions, statements
  - 65% branches
- **Test Projects**: 
  - `packages/*`: core, config, database, data-connectors, agent-runtime, report-generator, i18n, observability, testing, types, mock-platform-server
  - `apps/*`: web, api, worker
  - `tests/*`: integration, orchestrator, utils

#### E2E Testing (Playwright)
- **Framework**: Playwright with Chromium
- **Test Coverage**:
  - Critical path smoke tests
  - Home journey tests
  - Locale smoke tests (RTL/LTR)
  - Accessibility tests (WCAG 2.1 AA)
  - API health tests
- **Execution**: Parallel test runners for faster feedback

#### Integration Testing
- **Phase 01 Platform Integration**:
  - Mock mode integration tests
  - Adapter live tests (optional)
  - Adapter E2E tests
  - Adapter workflow tests
  - Throughput tests
  - SLA validation tests
  - Chaos tests
- **Company Config**: Cross-package integration tests

#### Scenario Orchestration
- **Scenarios**: R01-R12 automated end-to-end scenarios
- **Artifact Capture**: Document generation verification
- **Execution**: `tests/scripts/run-all-scenarios.sh`

#### Load & Performance Testing
- **Concurrent Load Matrix**: Report generation under load
- **SLA Validation**: P95 <3s, P99 <10s targets
- **Throughput Tests**: Adapter performance benchmarks

**Why These Tools**:
- **Vitest**: Native TypeScript, faster than Jest, better monorepo support
- **Playwright**: Better multi-browser support, faster than Cypress, excellent TypeScript integration

### 2. Security Hardening ✅

**Delivered**: Multi-layered security with container hardening and supply chain security

#### Container Security
- **Filesystem Hardening**:
  - Read-only root filesystems for all services
  - `tmpfs` for `/tmp` with `noexec,nosuid` and size limits (64MB)
- **Capability Dropping**:
  - `cap_drop: [ALL]` for application services (web, api, worker)
  - Selective capabilities for infrastructure (postgres, redis entrypoint compatibility)
- **Security Profiles**:
  - Seccomp profiles (`deploy/security/seccomp-profile.json`)
  - AppArmor profiles (`deploy/security/apparmor-profile`, Linux only)
  - `no-new-privileges:true` security option
- **Resource Limits**:
  - CPU and memory limits under `deploy.resources`
  - Prevents resource exhaustion attacks

#### Image Supply Chain
- **Vulnerability Scanning**:
  - Trivy scanning for CRITICAL/HIGH vulnerabilities
  - SARIF upload to GitHub Security tab
  - Weekly scheduled scans (cron: "0 6 * * 1")
- **SBOM Generation**:
  - SPDX JSON format via Anchore sbom-action
  - Per-service artifacts (web, api, worker)
- **Image Signing**:
  - Cosign keyless signing (OIDC)
  - Automated on release to GHCR

#### Secrets Management
- **Environment-Based**: `.env.docker` for local development
- **Docker Secrets**: Support in production compose files
- **No Hardcoded Secrets**: Enforcement via CI lint rules
- **Secret Rotation**: Procedures documented for production

**Why This Approach**:
- **Trivy**: Comprehensive vulnerability DB, fast scanning, SARIF integration
- **Seccomp/AppArmor**: Proven security profiles, defense-in-depth
- **Cosign**: Keyless signing eliminates private key management overhead

### 3. Observability & Monitoring ✅

**Delivered**: Complete observability stack with logging, metrics, and dashboards

#### Structured Logging
- **Framework**: Pino with JSON output
- **Tenant Context**: Automatic injection of tenantId, requestId, userId
- **Log Rotation**: Rotating file stream with gzip compression
- **Log Levels**: DEBUG, INFO, WARN, ERROR (environment-configured)
- **Pretty Print**: Development mode with pino-pretty
- **Services**: API, Worker (separate log streams)

#### Metrics Collection
- **Framework**: Prometheus client with shared registry
- **Metric Types**:
  - Database: Query duration, connection pool usage, deadlock count
  - Test: Execution time, assertion counts, pass/fail rates
  - Queue: Job processing rate, retry rates, failure reasons
  - Platform Resilience: Adapter health, circuit breaker state, fallback rate
  - Config Access: Feature flag evaluation counts, cache hit rates
- **Exposition**: `/metrics` endpoint on API and Worker

#### Observability Stack (Docker Compose)
- **Prometheus**: Metrics storage and querying
- **Grafana**: Visualization dashboards
- **Loki**: Log aggregation
- **Promtail**: Log shipping (reads Docker socket)
- **Falco**: Runtime security monitoring (Linux only, privileged)

#### Dashboards
- **System Overview**: CPU, memory, disk, network
- **Application Health**: Request rate, error rate, latency (P50, P95, P99)
- **Database Performance**: Connection pool, query duration, locks
- **Queue Metrics**: Job depth, processing rate, failure rate
- **Business Metrics**: Tenant count, report generation rate, adapter health

**Why This Stack**:
- **Pino**: Fastest JSON logger for Node.js, low overhead
- **Prometheus**: Open-source, vendor-neutral, good Docker integration
- **Grafana**: Flexible visualization, large community, free

### 4. Deployment Automation ✅

**Delivered**: Full CI/CD automation with Docker multi-stage builds

#### Docker Multi-Stage Builds
- **Base Images**:
  - `deps`: Workspace dependencies (pnpm install)
  - `chromium-base`: Playwright/Chromium for PDF generation (worker)
- **Application Images**: web, api, worker (built on base images)
- **Caching Strategy**:
  - BuildKit inline cache
  - GitHub Actions cache (gha)
  - Registry cache (GHCR)
- **Build Optimization**:
  - Layer caching for dependencies
  - Parallel builds for web/api/worker
  - Cross-platform builds (linux/amd64, linux/arm64)

#### CI/CD Pipelines (GitHub Actions)
- **CI Workflow** (`.github/workflows/ci.yml`):
  - Quality gate (30 min timeout)
  - Format checking (Prettier)
  - Linting and typechecking (Turbo)
  - Circular dependency detection
  - Unit tests with coverage (Vitest)
  - Build constants verification
  - Production bundle verification (mock-code scan)
  - Scenario orchestration tests (R01-R12)
  - Phase 01 integration tests
  - OpenAPI linting
  - E2E tests (Playwright, 45 min timeout)

- **Docker Build** (`.github/workflows/docker-build.yml`):
  - Multi-platform builds
  - BuildKit caching
  - Registry caching
  - Push to GHCR

- **Docker Scan** (`.github/workflows/docker-scan.yml`):
  - Trivy vulnerability scanning
  - SARIF upload
  - SBOM generation
  - Artifact upload
  - Weekly scheduled scans

- **Docker Release** (`.github/workflows/docker-release.yml`):
  - Release-triggered (published)
  - Multi-platform push to GHCR
  - Cosign signing (keyless/OIDC)
  - Semantic versioning tags

- **Docker Compose Validate** (`.github/workflows/docker-compose-validate.yml`):
  - Compose file validation
  - Common merge validation
  - Pre-flight checks

#### Makefile Workflows
- **Development**:
  - `make help`: Show available targets
  - `make setup`: Secrets, directories, optional `.env.docker`
  - `make preflight`: Host checks (Docker, ports)
  - `make validate`: Compose file validation
  - `make dev`: Infra + apps with dev stage and mock-friendly env
  - `make build`: Base + app image builds
  - `make dev-build`: Rebuild all images then recreate dev stack
  - `make dev-stop`: Stop dev stack (keeps volumes)
  - `make dev-logs`: Follow dev stack logs

- **Production-Like**:
  - `make apps-up`: Production-like app images (NODE_ENV=production)
  - `make apps-down`: Stop production-like app stack
  - `make apps-logs`: Follow production-like logs

- **Infrastructure**:
  - `make infra-up`: Postgres + Redis only
  - `make infra-down`: Stop infra-only project
  - `make infra-logs`: Follow Postgres + Redis logs

- **Health & Status**:
  - `make health`: HTTP checks + health check script
  - `make health-web`: HTTP check for web service
  - `make health-api`: HTTP check for API service
  - `make health-worker`: HTTP check for worker service
  - `make ps`: Docker Compose ps for dev stack
  - `make ps-apps`: Docker Compose ps for prod-like stack

- **Database**:
  - `make db-migrate`: Run Drizzle migrations
  - `make db-seed`: Seed test data
  - `make db-reset`: Reset database (drop + recreate)
  - `make shell-db`: Open database shell
  - `make db-dump`: Dump database to file
  - `make backup`: Database backup (via scripts/docker-backup.sh)
  - `make restore-latest`: Restore from latest backup

- **Testing**:
  - `make test`: Run unit tests
  - `make test:integration`: Run integration tests
  - `make test:e2e`: Run E2E tests
  - `make test:scenarios:all`: Run all scenario tests
  - `make test:scripts-validate`: Validate test scripts
  - `make test:scripts-verify-artifacts`: Verify scenario artifacts

- **Observability**:
  - `make obs-up`: Start observability stack
  - `make obs-down`: Stop observability stack
  - `make obs-logs`: Follow observability logs

- **Security**:
  - `make scan`: Run Trivy scan
  - `make sbom`: Generate SBOM
  - `make verify-image`: Verify Cosign signature

- **Cleanup**:
  - `make clean`: Remove build artifacts
  - `make clean-volumes`: Remove volumes
  - `make clean-all`: Remove everything

**Why GitHub Actions**:
- Native GitHub integration
- Excellent monorepo support
- Free for public repositories
- Large marketplace for actions

### 5. Layered Configuration System ✅

**Delivered**: Four-layer configuration for separation of concerns

#### Build Constants (Compile-Time)
- **Package**: `@agenticverdict/config/build-constants`
- **Constants**:
  - `IS_PRODUCTION`: Boolean for production guards
  - `BUILD_CONFIG`: Version, commit hash, build timestamp
  - Bundler-friendly (tree-shakeable)
- **Usage**: Production-only code branches, feature flags

#### Runtime Configuration (Zod-Validated)
- **Package**: `@agenticverdict/config/configuration`
- **Service**: `ConfigurationService` with Zod schemas
- **Sources**: Environment variables
- **Validation**: Runtime type safety
- **Features**:
  - `isMockEnabledForPlatform()`: Adapter mocking control
  - Database URLs, Redis URLs
  - Log levels, feature flags
  - API keys, secrets (from environment)
- **Safety**: No database dependency (prevents circular dependencies)

#### Postgres Feature Flags
- **Tables**: `feature_flags`, `tenant_feature_flags`
- **Service**: `createFeatureFlagService(db)` from `@agenticverdict/database`
- **Features**:
  - Global feature flags (all tenants)
  - Tenant-specific flags (per-tenant overrides)
  - Audit logging for flag changes
- **Why in Database**: Zero-downtime changes, tenant-specific customization

#### Tenant Configuration (CompanyConfig)
- **Schema**: `CompanyConfig` interface
- **Scope**: Business rules per tenant
- **Features**:
  - Localization (language, region, timezone, currency)
  - Business context (industry, products, value propositions)
  - AI configuration (primary model, provider)
  - Feature toggles (insights, verdict, etc.)
- **Principle**: No hardcoded company logic

**Why Layered Configuration**:
- **Separation of Concerns**: Build vs runtime vs tenant
- **Zero-Downtime Changes**: Runtime and tenant config changes without deployment
- **Type Safety**: Zod validation at all layers
- **Performance**: Compile-time constants for hot paths

### 6. Performance & Reliability ✅

**Delivered**: Performance testing and chaos engineering

#### Performance Testing
- **Load Tests**:
  - Concurrent report generation (matrix test)
  - Adapter throughput tests
  - API endpoint performance tests
- **SLA Validation**:
  - P95 <3s for standard queries
  - P99 <10s for complex queries
  - 100+ concurrent users support

#### Chaos Engineering
- **Adapter Chaos Tests**:
  - Network failures
  - Timeouts and delays
  - Rate limit errors
  - Circuit breaker validation
- **Graceful Degradation**:
  - Fallback to cached data
  - Partial result delivery
  - Error message clarity

#### Caching Strategy
- **Build Caching**:
  - BuildKit inline cache
  - GitHub Actions cache
  - Registry cache (GHCR)
- **Runtime Caching**:
  - Upstash Redis (distributed)
  - node-cache (L1 in-memory)
  - Query result caching

#### Resource Management
- **Docker Resource Limits**:
  - CPU limits and reservations
  - Memory limits and reservations
  - Prevents resource exhaustion
- **Health Checks**:
  - HTTP endpoints for all services
  - Dependency health checks
  - Graceful shutdown handling

### 7. Developer Experience ✅

**Delivered**: Comprehensive tooling for developer productivity

#### Health Checks
- **Script**: `scripts/health-check.sh`
- **Endpoints**:
  - Web: `http://localhost:3000/health`
  - API: `http://localhost:3001/health`
  - Worker: `http://localhost:3002/health`
- **Makefile Targets**: `make health`, `make health-web`, `make health-api`, `make health-worker`

#### Database Management
- **Migrations**: `make db-migrate` (Drizzle)
- **Seeding**: `make db-seed` (test data)
- **Reset**: `make db-reset` (drop + recreate)
- **Shell**: `make shell-db` (psql shell)
- **Dump**: `make db-dump` (SQL dump)

#### Backup & Restore
- **Backup**: `make backup` (via `scripts/docker-backup.sh`)
- **Restore**: `make restore-latest` (via `scripts/docker-restore.sh`)
- **Scheduling**: Cron-compatible (manual setup)
- **Retention**: Configurable (default 7 days)

#### Log Management
- **Dev Logs**: `make logs` / `make dev-logs`
- **Apps Logs**: `make apps-logs`
- **Infra Logs**: `make infra-logs`
- **Obs Logs**: `make obs-logs`
- **Follow Mode**: All log targets support `-f` for tailing

#### Testing Shortcuts
- **Unit Tests**: `make test`
- **Integration Tests**: `make test:integration`
- **E2E Tests**: `make test:e2e`
- **Scenario Tests**: `make test:scenarios:all`
- **Phase 01 Integration**: `make test:phase01-integration`

## Deviations from Original Plan

### Deferred Items
- **Penetration Testing**: Replaced with automated Trivy scanning
- **SOC 2 Type II Readiness**: Deferred to dedicated security audit phase
- **Infrastructure Cost Optimization**: Deferred to post-production optimization
- **Advanced PDF Features**: PDF/A compliance, real XLSX generation deferred to Phase 03 enhancements
- **APM Solutions**: Datadog/New Relic replaced with Prometheus/Grafana stack

### Added Value (Not in Original Plan)
- **Makefile Workflows**: Comprehensive development automation
- **Docker Compose Security**: Seccomp, AppArmor, read-only filesystems
- **Scenario Orchestration**: R01-R12 automated scenario validation
- **Backup/Restore Automation**: Database backup scripts with cron scheduling
- **Complete Observability Stack**: Prometheus, Grafana, Loki, Promtail, Falco
- **Cosign Signing**: Keyless image signing with OIDC

### Technical Decisions

| Decision | Original Plan | Actual Implementation | Rationale |
|----------|---------------|----------------------|-----------|
| Load Testing Tool | k6/Artillery | Vitest-based load tests | Better CI integration, no external dependencies |
| APM Solution | Datadog/New Relic | Prometheus/Grafana | Cost efficiency, vendor neutrality |
| Penetration Testing | Manual audit | Automated Trivy scanning | Continuous security validation |
| PDF/A Compliance | Phase 04 | Deferred to Phase 03+ | Focus on core PDF generation first |
| Cost Optimization | Phase 04 | Deferred to post-production | Prioritize feature delivery |

## Implementation Timeline

**Actual Duration**: Weeks 12-14 (consolidated with Foundation)

### Week 12: Testing Infrastructure
- ✅ Vitest configuration and thresholds
- ✅ Playwright E2E setup
- ✅ Integration test organization
- ✅ Coverage configuration (70% target)
- ✅ CI workflow implementation

### Week 13: Security & Observability
- ✅ Container security hardening (seccomp, AppArmor, read-only)
- ✅ Trivy vulnerability scanning
- ✅ SBOM generation
- ✅ Pino logging setup
- ✅ Prometheus metrics
- ✅ Observability Compose stack

### Week 14: Deployment Automation
- ✅ Docker multi-stage builds
- ✅ GitHub Actions workflows
- ✅ Cosign image signing
- ✅ Makefile workflows
- ✅ Backup/restore automation
- ✅ Documentation completion

## Quality Gates

### Pre-Merge Requirements
- ✅ All tests pass (unit, integration, scenario, E2E)
- ✅ Zero critical/high vulnerabilities in Trivy scans
- ✅ Compose files validate successfully
- ✅ Build constants verified
- ✅ Production bundles free of mock code
- ✅ Format (Prettier) and lint (ESLint) pass
- ✅ Typecheck (TypeScript) passes
- ✅ No circular dependencies

### Pre-Production Requirements
- ✅ Health checks passing for all services
- ✅ Observability stack operational
- ✅ Backup/restore procedures tested
- ✅ Security scans clean
- ✅ Performance benchmarks met (P95 <3s, P99 <10s)
- ✅ Documentation complete

## Success Criteria

### Achieved Metrics
- ✅ **Test Coverage**: 70%+ (target met)
- ✅ **Security Scanning**: Automated Trivy scanning for all images
- ✅ **CI/CD**: Full automation with <15 min deployment time
- ✅ **Observability**: Structured logging + Prometheus metrics
- ✅ **Documentation**: Comprehensive Docker documentation (17 files)
- ✅ **Developer Experience**: Makefile workflows for all common tasks

### Quality Metrics
- ✅ **Test Count**: 646+ test files
- ✅ **CI Pipeline**: ~20 minutes (quality) + ~10 minutes (E2E)
- ✅ **Docker Build**: ~5 minutes (base) + ~3 minutes (apps)
- ✅ **Security**: Zero critical/high vulnerabilities in production images
- ✅ **Performance**: Startup time <30 seconds for all services

## Next Steps

### Immediate (Post-Launch)
1. **Production Monitoring**: Configure alerting thresholds
2. **Performance Tuning**: Optimize based on production metrics
3. **Runbooks**: Create operational procedures
4. **Incident Response**: Establish escalation procedures

### Short-Term (1-3 Months)
1. **Advanced Caching**: Implement Redis cluster
2. **Query Optimization**: Optimize database queries
3. **CDN Integration**: Distribute static assets
4. **Rate Limiting**: Implement advanced rate limiting

### Long-Term (3-6 Months)
1. **Kubernetes Migration**: Evaluate and plan K8s deployment
2. **Distributed Tracing**: Implement OpenTelemetry
3. **Security Audit**: Schedule external penetration testing
4. **SOC 2 Certification**: Begin compliance process

---

**Last Updated**: 2026-04-14  
**Implementation Status**: ✅ Complete
