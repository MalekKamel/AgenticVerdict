# Docker Best Practices for Node.js/Next.js Applications (2025-2026)

**Research Document**: Comprehensive analysis of Docker industry standards and best practices for modern web development, with specific focus on Node.js, Next.js, and monorepo architectures.

**Generated**: 2026-04-09  
**Version**: 1.0

---

## Table of Contents

1. [Image Optimization](#1-image-optimization)
2. [Security Best Practices](#2-security-best-practices)
3. [Development vs Production Patterns](#3-development-vs-production-patterns)
4. [Multi-Service & Monorepo Patterns](#4-multi-service--monorepo-patterns)
5. [CI/CD Integration](#5-cicd-integration)
6. [Node.js/Next.js Specific Considerations](#6-nodejsnextjs-specific-considerations)
7. [Industry Standards 2025-2026](#7-industry-standards-2025-2026)
8. [Key Recommendations Summary](#8-key-recommendations-summary)
9. [References & Sources](#9-references--sources)

---

## 1. Image Optimization

### 1.1 Multi-Stage Build Patterns

Multi-stage builds are the industry standard for creating minimal, production-ready images. They allow separation of build dependencies from runtime dependencies.

**Standard Multi-Stage Pattern for Node.js:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies only when needed
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER node

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Next.js Specific Multi-Stage Build:**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only standalone artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Key Principles:**

- Separate build, test, and production stages
- Use `AS` stage names for clarity
- Copy only necessary artifacts between stages
- Leverage BuildKit caching (`--mount=type=cache`)

### 1.2 Layer Caching Strategies

Effective layer caching is critical for build performance.

**Optimized Layer Ordering:**

```dockerfile
# 1. Base OS layer (changes rarely)
FROM node:20-alpine

# 2. System dependencies (changes rarely)
RUN apk add --no-cache libc6-compat

# 3. Dependency installation (changes when dependencies change)
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# 4. Application build (changes when source changes)
COPY . .
RUN npm run build

# 5. Production runtime (changes least frequently)
ENV NODE_ENV=production
CMD ["npm", "start"]
```

**Advanced Caching with BuildKit:**

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine

# Cache npm packages globally
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# Cache build outputs
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build
```

**Best Practices:**

- Order layers from least to most frequently changed
- Separate dependency installation from source code copying
- Use `.dockerignore` to exclude unnecessary files
- Leverage BuildKit's cache mounts for compilation artifacts
- Pin dependency versions in lock files

### 1.3 .dockerignore Best Practices

A well-crafted `.dockerignore` file reduces build context size and improves build speed.

```text
# Node.js
node_modules
npm-debug.log
yarn-error.log
pnpm-debug.log

# Testing
coverage
.nyc_output
*.test.ts
*.spec.ts
__tests__

# Development
.env.local
.env.development
.env.test

# Build artifacts
dist
build
.next
out

# IDE
.vscode
.idea
*.swp
*.swo
*~

# Git
.git
.gitignore
.gitattributes

# Docker
Dockerfile*
docker-compose*
.dockerignore

# Documentation
README.md
CHANGELOG.md
*.md

# CI/CD
.github
.gitlab-ci.yml
.travis.yml

# Misc
.DS_Store
*.log
```

**Key Rules:**

- Exclude `node_modules` (will be installed in container)
- Exclude test files and coverage reports
- Exclude development environment files
- Exclude documentation and CI/CD configs
- Include only production-critical files

### 1.4 Base Image Selection

**Image Size Comparison (2025):**

| Base Image           | Size   | Use Case                       |
| -------------------- | ------ | ------------------------------ |
| `node:20`            | ~900MB | Development only               |
| `node:20-slim`       | ~250MB | Production (Debian-based)      |
| `node:20-alpine`     | ~170MB | Production (musl-based)        |
| `node:20-distroless` | ~150MB | Production (Google distroless) |

**Selection Criteria:**

```dockerfile
# Alpine: Small size, musl libc
FROM node:20-alpine
# Pros: Smallest size, minimal attack surface
# Cons: musl compatibility issues, slower build

# Slim: Balanced size, glibc compatibility
FROM node:20-slim
# Pros: glibc compatibility, predictable performance
# Cons: Larger than Alpine, includes some unnecessary tools

# Distroless: Minimal, security-focused
FROM gcr.io/distroless/nodejs20-debian12
# Pros: Minimal attack surface, no shell, auto-updates
# Cons: Debugging challenges, immutable
```

**2025 Recommendation:**

- **Development**: Use `node:20-alpine` or `node:20-slim`
- **Production**: Use `node:20-alpine` for compatibility or distroless for maximum security
- **Enterprise**: Consider distroless with security scanning integration

### 1.5 Image Size Reduction Techniques

```dockerfile
# 1. Use specific version tags
FROM node:20.11.0-alpine  # Not node:20 or node:latest

# 2. Multi-stage builds
FROM node:20-alpine AS builder
# ... build steps ...
FROM node:20-alpine
COPY --from=builder /app/dist ./dist

# 3. Single-line commands (reduce layers)
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && npm install \
    && apk del .build-deps

# 4. Clean up package manager caches
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# 5. Use .dockerignore
# (see section 1.3)

# 6. Optimize NEXT.js standalone output
# output: "standalone" in next.config.js
# Copies only necessary files for production

# 7. Compress assets
RUN find ./public -type f -name '*.png' -exec pngquant --quality=80-90 {} \;
```

---

## 2. Security Best Practices

### 2.1 Minimal Base Images

**2025 Security Hierarchy:**

1. **Distroless** (Most Secure)

   ```dockerfile
   FROM gcr.io/distroless/nodejs20-debian12
   # No shell, no package manager
   # Minimal attack surface
   # Auto-updates by Google
   ```

2. **Alpine** (Balanced)

   ```dockerfile
   FROM node:20-alpine
   # Small footprint
   # Active security patches
   # Some compatibility considerations
   ```

3. **Slim Debian** (Compatible)
   ```dockerfile
   FROM node:20-slim
   # Full glibc compatibility
   # Regular security updates
   # Slightly larger attack surface
   ```

**Security Trade-offs:**

| Image      | Attack Surface | Compatibility | Debugging | Updates |
| ---------- | -------------- | ------------- | --------- | ------- |
| Distroless | Minimal        | Moderate      | Difficult | Auto    |
| Alpine     | Low            | Good          | Good      | Manual  |
| Slim       | Moderate       | Excellent     | Excellent | Manual  |

### 2.2 Non-Root User Execution

**Implementation Pattern:**

```dockerfile
FROM node:20-alpine

# Create non-root user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory ownership
WORKDIR /app
RUN chown -R nextjs:nodejs /app

# Copy as root, change ownership
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
```

**Best Practices:**

- Create dedicated user with specific UID/GID
- Set ownership for all application directories
- Switch to non-root user AFTER build operations
- Use high UID (1000+) to avoid conflicts
- Document UID/GID for Kubernetes PSP/POD policies

### 2.3 Secret Management Patterns

**Anti-Patterns to Avoid:**

```dockerfile
# DON'T: Hardcode secrets
ENV API_KEY="sk_live_1234567890abcdef"

# DON'T: Copy secrets in images
COPY .env.production .

# DON'T: Build secrets into layers
RUN echo "password123" > /etc/secret
```

**Approved Patterns:**

```dockerfile
# DO: Use environment variables (injected at runtime)
ENV DATABASE_HOST
ENV DATABASE_USER
ENV DATABASE_PASSWORD

# DO: Use secret files (mounted at runtime)
RUN --mount=type=secret,id=db_credentials,target=/tmp/db_secret \
    cat /tmp/db_secret

# DO: Use build secrets (BuildKit)
# syntax=docker/dockerfile:1.4
FROM node:20-alpine
RUN --mount=type=secret,id=npm_token,target=/tmp/token \
    npm config set //registry.npmjs.org/:_authToken $(cat /tmp/token)
```

**Runtime Secret Injection:**

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    image: myapp:latest
    environment:
      - DATABASE_HOST=${DB_HOST}
      - DATABASE_USER=${DB_USER}
    secrets:
      - db_password
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

**Kubernetes Secret Integration:**

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      image: myapp:latest
      env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
```

### 2.4 Vulnerability Scanning Integration

**Pre-Build Scanning (CI/CD):**

```yaml
# GitHub Actions
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ steps.docker.outputs.image }}
    format: "sarif"
    output: "trivy-results.sarif"
    severity: "CRITICAL,HIGH"

- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: "trivy-results.sarif"
```

**Post-Build Scanning:**

```bash
# Trivy
trivy image myapp:latest --severity CRITICAL,HIGH

# Snyk
snyk test myapp:latest --severity-threshold=high

# Docker Scout
docker scout quickview myapp:latest
docker scout cves myapp:latest
```

**Automated Scanning in Dockerfile:**

```dockerfile
# Scan during build
FROM node:20-alpine AS scanner
RUN apk add --no-cache trivy
COPY --from=builder /app /app
RUN trivy image --severity CRITICAL,HIGH --exit-code 1 app:latest
```

### 2.5 Supply Chain Security

**Signed Images (Docker Content Trust):**

```bash
# Enable DCT
export DOCKER_CONTENT_TRUST=1

# Build and push signed image
docker build -t myapp:latest .
docker push myapp:latest

# Pull verified image
docker pull myapp:latest
```

**SBOM Generation:**

```dockerfile
# Generate SBOM with Syft
FROM node:20-alpine AS sbom
RUN apk add --no-cache syft
COPY --from=builder /app /app
RUN syft /app -o spdx-json > sbom.json
```

** provenance Attestations:**

```bash
# Build with provenance
docker buildx build \
  --provenance=true \
  --sbom=true \
  -t myapp:latest \
  .
```

**Dependency Pinning:**

```json
// package.json
{
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "4.17.21" // Exact version
  }
}
```

```dockerfile
# Use lock files
COPY package.json package-lock.json ./
RUN npm ci  # Not npm install (respects lock file)
```

---

## 3. Development vs Production Patterns

### 3.1 Environment-Specific Configurations

**Multi-Environment Dockerfile:**

```dockerfile
# syntax=docker/dockerfile:1.4

# Base stage
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./

# Development dependencies
FROM base AS dev-deps
RUN npm ci
COPY . .

# Production dependencies
FROM base AS prod-deps
RUN npm ci --only=production

# Development image
FROM base AS development
ENV NODE_ENV=development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Builder for production
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Build Commands:**

```bash
# Development image
docker build --target development -t myapp:dev .

# Production image
docker build --target production -t myapp:latest .
```

### 3.2 Development Workflow Optimization

**Hot Reload Configuration:**

```dockerfile
# Development Dockerfile
FROM node:20-alpine
WORKDIR /app

# Install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Enable polling for file changes in containers
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Docker Compose for Development:**

```yaml
# docker-compose.dev.yml
version: "3.8"
services:
  app:
    build:
      context: .
      target: development
    volumes:
      # Mount source code for hot reload
      - .:/app
      - /app/node_modules # Prevent overwriting
      - /app/.next # Prevent overwriting Next.js build
    environment:
      - NODE_ENV=development
      - NEXT_TELEMETRY_DISABLED=1
    ports:
      - "3000:3000"
    command: npm run dev
```

**Production Docker Compose:**

```yaml
# docker-compose.prod.yml
version: "3.8"
services:
  app:
    build:
      context: .
      target: production
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3.3 Production Hardening Techniques

**Read-Only Root Filesystem:**

```dockerfile
FROM node:20-alpine
# ... application setup ...
# Create writable directory for necessary runtime files
RUN mkdir -p /app/tmp && chmod 777 /app/tmp
# Mark as read-only (in Compose or K8s)
```

```yaml
# docker-compose.yml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /app/tmp
```

**Health Checks:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1
```

```javascript
// healthcheck.js
const http = require("http");

const options = {
  host: "localhost",
  port: 3000,
  path: "/api/health",
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", () => process.exit(1));
request.end();
```

**Resource Limits:**

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

**Security-Optimized Production Image:**

```dockerfile
FROM node:20-alpine AS builder
# ... build steps ...

FROM node:20-alpine
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary artifacts only
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

---

## 4. Multi-Service & Monorepo Patterns

### 4.1 Docker Compose for Local Development

**Monorepo Structure:**

```
apps/
├── web/
│   ├── Dockerfile
│   └── package.json
├── api/
│   ├── Dockerfile
│   └── package.json
└── worker/
    ├── Dockerfile
        └── package.json
docker-compose.yml
docker-compose.dev.yml
docker-compose.prod.yml
```

**Base Docker Compose:**

```yaml
# docker-compose.yml
version: "3.8"
services:
  web:
    build:
      context: ./apps/web
      target: base
    environment:
      - NODE_ENV=${NODE_ENV:-development}
    depends_on:
      - api
      - postgres
      - redis

  api:
    build:
      context: ./apps/api
      target: base
    environment:
      - NODE_ENV=${NODE_ENV:-development}
    depends_on:
      - postgres
      - redis

  worker:
    build:
      context: ./apps/worker
      target: base
    environment:
      - NODE_ENV=${NODE_ENV:-development}
    depends_on:
      - api
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=agenticverdict
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

**Development Overlay:**

```yaml
# docker-compose.dev.yml
version: "3.8"
services:
  web:
    build:
      target: development
    volumes:
      - ./apps/web:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NEXT_TELEMETRY_DISABLED=1
    ports:
      - "3000:3000"

  api:
    build:
      target: development
    volumes:
      - ./apps/api:/app
      - /app/node_modules
    environment:
      - API_PORT=4000
    ports:
      - "4000:4000"

  worker:
    build:
      target: development
    volumes:
      - ./apps/worker:/app
      - /app/node_modules
```

**Usage:**

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4.2 Service Orchestration Patterns

**Service Discovery:**

```yaml
version: "3.8"
services:
  api:
    build: ./apps/api
    networks:
      - app_network
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/agenticverdict
      - REDIS_URL=redis://redis:6379

  worker:
    build: ./apps/worker
    networks:
      - app_network
    environment:
      - API_URL=http://api:4000
      - REDIS_URL=redis://redis:6379

networks:
  app_network:
    driver: bridge
```

**Shared Base Images:**

```dockerfile
# Dockerfile.base
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_VERSION=8.15.0

# Install pnpm globally
RUN npm install -g pnpm@$PNPM_VERSION

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
RUN pnpm install --frozen-lockfile
```

```dockerfile
# apps/web/Dockerfile
FROM localhost/agenticverdict/base:latest AS base
# ... web-specific setup ...
```

**Build Optimization for Monorepos:**

```dockerfile
# Use BuildKit cache mounts for workspace
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY packages packages

# Cache pnpm store
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
```

### 4.3 Shared Dependencies Strategy

**Workspace Configuration:**

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Dockerfile for Monorepo Packages:**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Install all workspace dependencies
COPY package.json ./
COPY packages packages/
RUN pnpm install --frozen-lockfile

# Build packages in dependency order
RUN pnpm run build --filter=@agenticverdict/core...
```

**Selective Package Building:**

```bash
# Build only changed packages
docker build --build-arg BUILD_PACKAGE=@agenticverdict/web .

# Dockerfile with build arg
ARG BUILD_PACKAGE
RUN pnpm run build --filter=${BUILD_PACKAGE}...
```

---

## 5. CI/CD Integration

### 5.1 Build Caching in Pipelines

**GitHub Actions with Layer Caching:**

```yaml
name: Build and Push
on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Cache Docker layers
        uses: actions/cache@v3
        with:
          path: /tmp/.buildx-cache
          key: ${{ runner.os }}-buildx-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-buildx-

      - name: Build image
        uses: docker/build-push-action@v5
        with:
          context: .
          cache-from: type=local,src=/tmp/.buildx-cache
          cache-to: type=local,dest=/tmp/.buildx-cache-new,mode=max

      - name: Move cache
        run: |
          rm -rf /tmp/.buildx-cache
          mv /tmp/.buildx-cache-new /tmp/.buildx-cache
```

**GitLab CI with Caching:**

```yaml
build:
  image: docker:24
  services:
    - docker:24-dind
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .docker-cache
  script:
    - docker buildx build
      --cache-from type=local,src=.docker-cache
      --cache-to type=local,dest=.docker-cache-new
      -t myapp:$CI_COMMIT_SHA .
    - rm -rf .docker-cache
    - mv .docker-cache-new .docker-cache
```

### 5.2 Layer Optimization for CI

**Parallel Builds:**

```yaml
# Build multiple targets in parallel
strategy:
  matrix:
    target: [web, api, worker]
steps:
  - name: Build ${{ matrix.target }}
    run: |
      docker build
        --target ${{ matrix.target }}
        -t myapp/${{ matrix.target }}:${{ github.sha }}
        .
```

**BuildKit Cache Configuration:**

```dockerfile
# syntax=docker/dockerfile:1.4
FROM node:20-alpine

# Use registry cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Use local cache mount
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build
```

```bash
# Enable BuildKit cache
export BUILDKIT_STEP_LOG_MAX_SIZE=10485760
docker buildx build \
  --cache-from=type=registry,ref=myapp:cache \
  --cache-to=type=registry,ref=myapp:cache,mode=max \
  -t myapp:latest .
```

### 5.3 Testing in Containers

**Unit Testing:**

```dockerfile
# Dockerfile.test
FROM node:20-alpine AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run test -- --coverage
```

```yaml
# CI pipeline
- name: Run tests
  run: |
    docker build
      --target test
      -t myapp:test
      .
    docker run myapp:test
```

**Integration Testing:**

```yaml
# docker-compose.test.yml
version: "3.8"
services:
  app:
    build:
      target: test
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/test
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
```

```yaml
# CI integration test step
- name: Run integration tests
  run: |
    docker-compose -f docker-compose.test.yml up --abort-on-container-exit
    docker-compose -f docker-compose.test.yml down --volumes
```

**E2E Testing:**

```dockerfile
FROM node:20-alpine AS e2e
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx playwright install --with-deps chromium
CMD ["npm", "run", "test:e2e"]
```

### 5.4 Deployment Strategies

**Blue-Green Deployment:**

```yaml
# docker-compose.blue-green.yml
version: "3.8"
services:
  app-blue:
    image: myapp:${IMAGE_TAG}
    environment:
      - COLOR=blue
    deploy:
      replicas: 3

  app-green:
    image: myapp:${PREVIOUS_IMAGE_TAG}
    environment:
      - COLOR=green
    deploy:
      replicas: 3

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - app-blue
      - app-green
```

**Canary Deployment:**

```yaml
services:
  app-stable:
    image: myapp:${STABLE_TAG}
    deploy:
      replicas: 9

  app-canary:
    image: myapp:${CANARY_TAG}
    deploy:
      replicas: 1
```

**Rolling Update:**

```yaml
# docker-compose.yml with rolling update
version: "3.8"
services:
  app:
    image: myapp:${IMAGE_TAG}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 30s
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 10s
```

---

## 6. Node.js/Next.js Specific Considerations

### 6.1 Dependency Management

**Lock File Best Practices:**

```dockerfile
# Always copy lock files
COPY package.json package-lock.json ./
# or
COPY package.json pnpm-lock.yaml ./

# Use ci for deterministic installs
RUN npm ci
# or
RUN pnpm install --frozen-lockfile
```

**Offline Mode for CI:**

```dockerfile
RUN npm ci --prefer-offline --no-audit
RUN pnpm install --frozen-lockfile --prefer-offline
```

**Development vs Production Dependencies:**

```dockerfile
# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# or
RUN pnpm install --prod --frozen-lockfile
```

**Peer Dependencies:**

```dockerfile
# For monorepo workspace
COPY package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile \
    --strict-peer-dependencies=false
```

### 6.2 Build Artifacts Optimization

**Next.js Standalone Mode:**

```javascript
// next.config.js
module.exports = {
  output: "standalone", // Creates self-contained deployment
  compress: true, // Enable gzip compression
  swcMinify: true, // Use SWC minifier (faster)
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["lodash", "date-fns"],
  },
};
```

**Dockerfile for Standalone Output:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output only
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
```

**Image Size Comparison:**

| Build Mode          | Image Size | Build Time |
| ------------------- | ---------- | ---------- |
| Standard            | ~500MB     | Fast       |
| Standalone          | ~180MB     | Moderate   |
| Standalone + Alpine | ~150MB     | Moderate   |
| Static Export       | ~50MB      | Slow       |

### 6.3 Static Asset Serving

**Dockerfile with Nginx:**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production with Nginx
FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration:**

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Cache static assets
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (if needed)
    location /api {
        proxy_pass http://api:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Multi-Stage for Static + API:**

```dockerfile
# Next.js static build
FROM node:20-alpine AS web-builder
WORKDIR /app/web
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web ./
RUN npm run build

# API build
FROM node:20-alpine AS api-builder
WORKDIR /app/api
COPY apps/api/package*.json ./
RUN npm ci
COPY apps/api ./
RUN npm run build

# Production: Nginx + Node
FROM node:20-alpine AS production

# Copy API
WORKDIR /app/api
COPY --from=api-builder /app/api ./

# Copy static files to Nginx
COPY --from=web-builder /app/web/out /usr/share/nginx/html

# Run both (using supervisord or similar)
CMD ["/app/api/start.sh"]
```

### 6.4 Next.js Standalone Output Mode

**Complete Next.js Docker Configuration:**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Optimize for production
  swcMinify: true,
  compress: true,

  // Optimize images
  images: {
    domains: ["cdn.example.com"],
    formats: ["image/avif", "image/webp"],
  },

  // Optimize package imports
  experimental: {
    optimizePackageImports: ["@mantine/core", "@tabler/icons-react"],
  },

  // Disable source maps in production
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
```

```dockerfile
# Optimized Next.js Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@$PNPM_VERSION
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## 7. Industry Standards 2025-2026

### 7.1 Current Trends in Containerization

**Key Trends:**

1. **Distroless Images Dominance**
   - Google's distroless images becoming default for production
   - Minimal attack surface prioritized over debugging convenience
   - Automated security updates becoming standard

2. **BuildKit Adoption**
   - BuildKit now default in Docker Engine
   - Advanced caching and parallel builds
   - Secret mounting support
   - Build-time improvements

3. **SBOM and Supply Chain Security**
   - Software Bill of Materials (SBOM) becoming mandatory
   - Docker Scout integrated into Docker Desktop
   - Automated vulnerability scanning in CI/CD

4. **WebAssembly (Wasm) Containers**
   - Wasm workloads running in containers
   - Smaller footprint than traditional containers
   - Faster startup times

5. **Serverless Container Integration**
   - AWS Fargate, Google Cloud Run, Azure Container Apps
   - Pay-per-use container execution
   - Automatic scaling

### 7.2 Official Docker Recommendations

**From Docker Documentation 2025:**

1. **Use Multi-Stage Builds**
   - Reduce final image size by up to 90%
   - Separate build and runtime dependencies
   - Use specific stage targets

2. **Leverage BuildKit**

   ```bash
   export DOCKER_BUILDKIT=1
   docker build .
   ```

3. **Implement Health Checks**

   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s \
     CMD curl -f http://localhost/ || exit 1
   ```

4. **Use .dockerignore**
   - Reduce build context size
   - Exclude unnecessary files
   - Improve build speed

5. **Tag Images Properly**
   ```bash
   docker build -t myapp:1.0.0 -t myapp:latest .
   ```

### 7.3 Cloud-Native Best Practices (CNCF)

**12-Factor App Compliance:**

1. **Codebase**: One codebase tracked in version control
2. **Dependencies**: Explicitly declare and isolate dependencies
3. **Config**: Store config in environment variables
4. **Backing services**: Treat backing services as attached resources
5. **Build, release, run**: Strictly separate build and run stages
6. **Processes**: Execute the app as one or more stateless processes
7. **Port binding**: Export services via port binding
8. **Concurrency**: Scale out via the process model
9. **Disposability**: Maximize robustness with fast startup and shutdown
10. **Dev/prod parity**: Keep development, staging, and production as similar as possible
11. **Logs**: Treat logs as event streams
12. **Admin processes**: Run admin/management tasks as one-off processes

**Cloud Native Computing Foundation (CNCF) Guidance:**

- Use OCI-compliant images
- Implement resource limits
- Use secrets management
- Enable observability (metrics, logs, traces)
- Design for horizontal scaling

---

## 8. Key Recommendations Summary

### 8.1 Image Optimization Checklist

- [ ] Use multi-stage builds for all production images
- [ ] Implement proper .dockerignore files
- [ ] Leverage BuildKit caching with cache mounts
- [ ] Choose appropriate base images (alpine for size, distroless for security)
- [ ] Order Dockerfile instructions for optimal layer caching
- [ ] Use specific version tags (not `latest`)
- [ ] Clean up package manager caches in the same layer
- [ ] Enable Next.js standalone mode for production builds

### 8.2 Security Checklist

- [ ] Run containers as non-root users
- [ ] Use distroless or minimal base images
- [ ] Implement secret management (no hardcoded secrets)
- [ ] Enable vulnerability scanning in CI/CD
- [ ] Sign images with Docker Content Trust
- [ ] Generate and maintain SBOMs
- [ ] Pin dependency versions in lock files
- [ ] Implement read-only root filesystems where possible
- [ ] Add health checks to all services
- [ ] Set resource limits (CPU, memory)

### 8.3 Development Workflow Checklist

- [ ] Separate development and production Dockerfiles
- [ ] Use Docker Compose for local development
- [ ] Enable hot reload in development environment
- [ ] Mount source code as volumes in development
- [ ] Use BuildKit for faster builds
- [ ] Implement parallel builds for monorepos
- [ ] Cache dependencies between builds
- [ ] Test in containerized environments

### 8.4 Production Deployment Checklist

- [ ] Use specific version tags for production images
- [ ] Implement blue-green or canary deployments
- [ ] Enable rolling updates with health checks
- [ ] Set up monitoring and logging
- [ ] Configure resource limits and requests
- [ ] Use read-only root filesystems
- [ ] Implement proper logging drivers
- [ ] Set up automated backups
- [ ] Document runbooks and procedures
- [ ] Test disaster recovery procedures

### 8.5 Node.js/Next.js Specific Checklist

- [ ] Use `npm ci` or `pnpm install --frozen-lockfile`
- [ ] Enable Next.js standalone mode
- [ ] Configure proper environment variables
- [ ] Optimize static asset serving
- [ ] Implement proper error handling
- [ ] Use connection pooling for databases
- [ ] Enable compression for responses
- [ ] Configure proper CORS policies
- [ ] Implement rate limiting
- [ ] Use TypeScript for type safety

---

## 9. References & Sources

### Official Documentation

- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Docker Content Trust](https://docs.docker.com/engine/security/trust/)
- [Docker Scout](https://docs.docker.com/scout/)

### CNCF and Cloud Native

- [Cloud Native Computing Foundation](https://www.cncf.io/)
- [12-Factor App Methodology](https://12factor.net/)
- [Open Container Initiative](https://opencontainers.org/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### Security Resources

- [Distroless Images](https://github.com/GoogleContainerTools/distroless)
- [Trivy Vulnerability Scanner](https://aquasecurity.github.io/trivy/)
- [Snyk Container Security](https://snyk.io/product/container-security/)
- [Docker Security](https://docs.docker.com/engine/security/)

### Node.js and Next.js

- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/README.md)
- [Next.js Docker Examples](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [pnnpm Docker Integration](https://pnpm.io/docker)

### CI/CD and Automation

- [GitHub Actions Docker](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-docker)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitLab CI/CD Docker](https://docs.gitlab.com/ee/ci/docker/)

### Monitoring and Observability

- [Prometheus Monitoring](https://prometheus.io/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/)
- [OpenTelemetry](https://opentelemetry.io/)

### Additional Resources

- [Awesome Docker Compose](https://github.com/veggiemonk/awesome-docker-compose)
- [Docker Samples](https://github.com/docker/awesome-compose)
- [Container Best Practices](https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/)

---

**Document End**

_This research document consolidates Docker best practices as of 2026-04-09. For the most current information, always refer to the official documentation of each tool and platform._
