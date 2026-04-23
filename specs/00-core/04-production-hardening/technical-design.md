# Production Hardening - Technical Implementation

**Phase**: 04 - Production Hardening  
**Status**: ✅ Complete  
**Implementation Period**: Weeks 12-14 (consolidated with Foundation)

## Technology Stack

### Testing Framework
- **Unit Testing**: Vitest with v8 coverage provider
- **E2E Testing**: Playwright with Chromium
- **Integration Testing**: Vitest with Testcontainers
- **Coverage Thresholds**: 70% lines/functions/statements, 65% branches

### Container Orchestration
- **Development**: Docker Compose with overlay files
- **Base Images**: Multi-stage builds (deps, chromium-base)
- **Registry**: GitHub Container Registry (GHCR)
- **Signing**: Cosign keyless signing

### CI/CD
- **Platform**: GitHub Actions
- **Caching**: BuildKit inline cache + GitHub Actions cache
- **Security**: Trivy vulnerability scanning + SBOM generation

### Observability
- **Logging**: Pino with rotating file stream
- **Metrics**: Prometheus client with shared registry
- **Visualization**: Grafana dashboards
- **Log Aggregation**: Loki + Promtail
- **Security**: Falco runtime security (Linux)

### Security
- **Container Hardening**: Seccomp profiles, AppArmor, read-only filesystems
- **Vulnerability Scanning**: Trivy (CRITICAL/HIGH)
- **Supply Chain**: SBOM (SPDX JSON) + Cosign signing
- **Secrets Management**: Environment-based with Docker secrets support

## Architecture

### Layered Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Constants                           │
│         (@agenticverdict/config/build-constants)             │
│  IS_PRODUCTION | BUILD_CONFIG | compile-time constants      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Runtime Configuration                        │
│        (@agenticverdict/config/configuration)               │
│  ConfigurationService | Zod validation | env-derived        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              Postgres Feature Flags                          │
│           (@agenticverdict/database)                         │
│  feature_flags | tenant_feature_flags | db-scoped           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Tenant Configuration                         │
│              (TenantConfig schema)                          │
│  Business rules | Localization | AI models | Features       │
└─────────────────────────────────────────────────────────────┘
```

### Docker Compose Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Base Layer                               │
│  docker-compose.yml (infra)                                 │
│  docker-compose.networks.yml                                │
│  docker-compose.base-images.yml                             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Applications Layer                         │
│  docker-compose.apps.yml (web, api, worker)                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Environment Layer                         │
│  docker-compose.dev.yml (development)                       │
│  docker-compose.test.yml (testing)                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Overlays Layer                           │
│  deploy/docker-compose.dev.override.yml                     │
│  deploy/docker-compose.production.example.yml               │
│  deploy/docker-compose.backup.yml                           │
│  deploy/docker-compose.security-linux.override.yml          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Observability Layer                        │
│  docker-compose.observability.yml                           │
│  (Prometheus, Grafana, Loki, Promtail, Falco)               │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CI Workflow                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Quality (30 min timeout)                              │  │
│  │  • Format (Prettier check)                            │  │
│  │  • Lint & typecheck (Turbo)                           │  │
│  │  • Circular dependency check                          │  │
│  │  • Unit tests with coverage (Vitest)                  │  │
│  │  • Verify build constants                            │  │
│  │  • Production Vite bundles (mock-code scan)           │  │
│  │  • Scenario orchestration tests (R01-R12)            │  │
│  │  • Phase 01 integration tests                        │  │
│  │  • OpenAPI lint                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ E2E (45 min timeout)                                  │  │
│  │  • Install Playwright browsers                        │  │
│  │  • Run E2E tests (Playwright)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Docker Build Workflow                       │
│  • Clean local build artifacts                              │
│  • Build workspace deps layer (with cache)                  │
│  • Build Chromium base (worker only)                        │
│  • Build and push images (multi-platform)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Docker Scan Workflow                        │
│  • Build images (web, api, worker)                          │
│  • Run Trivy vulnerability scanner (CRITICAL/HIGH)          │
│  • Upload Trivy SARIF to GitHub Security                    │
│  • Generate SBOM (SPDX JSON)                                │
│  • Upload SBOM artifacts                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Docker Release Workflow                      │
│  • Build and push to GHCR (web, api, worker)               │
│  • Cosign sign images (keyless / OIDC)                      │
│  • Triggered on release publication                         │
└─────────────────────────────────────────────────────────────┘
```

### Observability Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Web (Pino) │  │  API (Pino) │  │Worker(Pino) │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Collection Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Promtail (reads Docker socket, ships to Loki)       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Prometheus Client (metrics exposition on /metrics)  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Storage Layer                              │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │  Loki (logs)    │  │  Prometheus (metrics)            │  │
│  └─────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Visualization Layer                         │
│  ┌─────────────────┐  ┌──────────────────────────────────┐  │
│  │ Grafana (dashboards for logs & metrics)                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Container Security Controls                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Application Services (web, api, worker)              │   │
│  │  • read_only: true                                   │   │
│  │  • tmpfs: /tmp (noexec,nosuid)                       │   │
│  │  • cap_drop: [ALL]                                   │   │
│  │  • security_opt: no-new-privileges:true              │   │
│  │  • security_opt: seccomp=seccomp-profile.json        │   │
│  │  • security_opt: apparmor=agenticverdict-app (Linux) │   │
│  │  • deploy.resources (CPU, memory limits)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Infrastructure (postgres, redis)                     │   │
│  │  • read_only: true                                   │   │
│  │  • tmpfs: /tmp (noexec,nosuid)                       │   │
│  │  • Resource limits                                   │   │
│  │  • Exceptions for entrypoint compatibility           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Image Supply Chain                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CI Pipeline → Docker Build → Trivy Scan → SBOM       │   │
│  │                 ↓                                   │   │
│  │           GHCR Push → Cosign Sign                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Runtime Security                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Falco (Linux only, privileged)                       │   │
│  │  • Syscall monitoring                                │   │
│  │  • Anomaly detection                                 │   │
│  │  • Security event alerts                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Testing Infrastructure

**Vitest Configuration** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    projects: [
      "packages/*",
      "apps/*",
      "tests/integration",
      "tests/orchestrator",
      "tests/utils"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 65,
        statements: 70
      }
    }
  }
});
```

**Test Organization**:
- **Unit Tests**: 646+ test files across all packages/apps
- **Integration Tests**: Phase 01 platform integration, tenant config
- **Scenario Tests**: R01-R12 orchestration scenarios
- **Load Tests**: Concurrent report generation matrix
- **Chaos Tests**: Adapter failure injection

### 2. Observability Implementation

**Pino Logger** (`@agenticverdict/observability/src/logger.ts`):
```typescript
export function createPinoLogger(service: ObservabilityServiceName): Logger {
  const level = resolveLogLevel();
  const mixin = (): Record<string, string | undefined> => {
    const tenant = getTenantContext();
    if (!tenant) return {};
    return {
      tenantId: tenant.tenantId,
      requestId: tenant.requestId,
      userId: tenant.userId
    };
  };
  
  return pino({
    level,
    base: { service },
    mixin,
    formatters: { level: (label) => ({ level: label }) },
    serializers: { err: pino.stdSerializers.err },
    timestamp: pino.stdTimeFunctions.isoTime
  });
}
```

**Prometheus Metrics** (`@agenticverdict/observability/src/registry.ts`):
```typescript
export const productionFlowTestRegistry = new Registry();
```

**Metric Types**:
- **Database Metrics**: Query duration, connection pool usage
- **Test Metrics**: Test execution time, assertion counts
- **Queue Metrics**: Job processing rate, retry rates
- **Platform Resilience**: Adapter health, circuit breaker state
- **Config Access**: Feature flag evaluation counts

### 3. Security Implementation

**Container Hardening** (from `docker-compose.apps.yml`):
```yaml
services:
  web:
    security_opt:
      - no-new-privileges:true
      - seccomp:deploy/security/seccomp-profile.json
    cap_drop: [ALL]
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=64m
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

**Seccomp Profile** (`deploy/security/seccomp-profile.json`):
- Blocks dangerous syscalls (e.g., `chmod`, `chown`, `mount`)
- Allows necessary syscalls for Node.js applications
- Provides defense-in-depth against container breakout

**AppArmor Profile** (`deploy/security/apparmor-profile`):
- Confines file system access
- Restricts network operations
- Limits process capabilities

### 4. CI/CD Implementation

**Docker Build Strategy**:
```yaml
# Multi-stage build with caching
buildx build \
  --cache-from type=gha,scope=monorepo-deps \
  --cache-to type=gha,mode=max,scope=monorepo-deps \
  --build-arg DEPS_IMAGE=agenticverdict/deps:ci \
  -f apps/frontend/Dockerfile \
  -t ghcr.io/agenticverdict/web:latest \
  --push \
  .
```

**Trivy Scan** (`.github/workflows/docker-scan.yml`):
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: "agenticverdict/${{ matrix.service }}:scan"
    format: sarif
    output: "trivy-${{ matrix.service }}.sarif"
    severity: CRITICAL,HIGH
    exit-code: "0"
```

**Cosign Signing** (`.github/workflows/docker-release.yml`):
```yaml
- name: Cosign sign image (keyless / OIDC)
  env:
    DIGEST: ${{ steps.build.outputs.digest }}
  run: |
    cosign sign \
      --yes \
      "ghcr.io/$(echo '${{ github.repository }}' | tr '[:upper:]' '[:lower:]')/${{ matrix.service }}@${DIGEST}"
```

### 5. Makefile Workflow

**Development Target**:
```makefile
dev: build-base
	$(DC) $(DEV_STACK) up -d --build
```

**Production-Like Target**:
```makefile
apps-up: build-base
	$(DC) $(PROD_LIKE) up -d --build
```

**Health Check**:
```makefile
health: ## HTTP checks + scripts/health-check.sh
	./scripts/health-check.sh
```

### 6. Configuration Layers

**Build Constants** (compile-time):
```typescript
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const BUILD_CONFIG = {
  version: process.env.BUILD_VERSION || "dev",
  commitHash: process.env.BUILD_COMMIT || "unknown"
};
```

**Runtime Configuration** (Zod-validated):
```typescript
const configurationSchema = z.object({
  nodeEnv: z.enum(["development", "test", "production"]),
  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),
  logLevel: z.enum(["debug", "info", "warn", "error"])
});
```

**Postgres Feature Flags**:
```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT
);

CREATE TABLE tenant_feature_flags (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  feature_id UUID NOT NULL REFERENCES feature_flags(id),
  enabled BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (tenant_id, feature_id)
);
```

## Performance Characteristics

### Build Performance
- **Base Image Build**: ~5 minutes with cache
- **App Image Build**: ~3 minutes with BuildKit cache
- **CI Pipeline**: ~20 minutes (quality) + ~10 minutes (E2E)
- **Docker Scan**: ~3 minutes per service

### Runtime Performance
- **Startup Time**: <30 seconds for all services
- **Health Check**: <1 second per service
- **Test Execution**: ~5 minutes for 646 unit tests
- **E2E Tests**: ~10 minutes for critical paths

### Resource Utilization (Development)
- **Web**: 0.5 CPU / 512MB RAM (base), 2 CPU / 2GB RAM (max)
- **API**: 0.5 CPU / 512MB RAM (base), 2 CPU / 2GB RAM (max)
- **Worker**: 0.5 CPU / 512MB RAM (base), 2 CPU / 2GB RAM (max)
- **Postgres**: 0.25 CPU / 256MB RAM (base), 1 CPU / 1GB RAM (max)
- **Redis**: 0.25 CPU / 128MB RAM (base), 0.5 CPU / 512MB RAM (max)

## Monitoring & Alerting

### Key Metrics
- **System**: CPU, memory, disk, network
- **Application**: Request rate, error rate, latency (P50, P95, P99)
- **Database**: Connection pool, query duration, deadlock count
- **Queue**: Job depth, processing rate, failure rate
- **Business**: Tenant count, report generation rate, adapter health

### Alert Thresholds
- **Error Rate**: >1% (warning), >5% (critical)
- **Latency**: P95 >3s (warning), P99 >10s (critical)
- **Connection Pool**: >80% (warning), >95% (critical)
- **Queue Depth**: >1000 (warning), >5000 (critical)

### Log Retention
- **Development**: 7 days
- **Test**: 3 days
- **Production**: 30 days (with archival)

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups via `make backup`
- **Redis**: AOF persistence with daily snapshots
- **Reports**: S3-compatible storage with lifecycle policies
- **Configuration**: Git-tracked with environment overrides

### Recovery Procedures
- **Database Restore**: `make restore-latest` (from latest backup)
- **Service Restart**: `make dev` / `make apps-up` (recreate containers)
- **Rollback**: `git revert` + Docker image tag rollback

### Recovery Time Objectives
- **RTO**: <4 hours (database restore)
- **RPO**: <24 hours (data loss window)
- **MTTR**: <2 hours (mean time to recovery)

## Technical Debt & Future Improvements

### Known Limitations
- TypeScript execution via `tsx` in API/worker images (not JIT-compiled)
- No advanced caching (CDN, Redis cluster)
- No distributed tracing (OpenTelemetry)
- No automated canary deployments
- No multi-region deployment

### Future Enhancements
- **Performance**: Query optimization, connection pooling, CDN
- **Security**: Penetration testing, SOC 2 certification, secret rotation
- **Operations**: Runbooks, alert tuning, automated remediation
- **Scalability**: Kubernetes migration, horizontal pod autoscaling
- **Observability**: Distributed tracing, advanced dashboards, anomaly detection

---

**Last Updated**: 2026-04-14  
**Implementation Status**: ✅ Complete
