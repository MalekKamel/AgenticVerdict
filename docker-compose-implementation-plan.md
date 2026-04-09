# Docker Compose Strategy Implementation Plan

**Project**: AgenticVerdict
**Date**: 2026-04-09
**Author**: Claude Code
**Status**: Implemented (tooling + docs + CI; see repository)

## Executive Summary

This document provides a comprehensive implementation plan for transitioning from the current 9-file Docker Compose organization to a streamlined 6-file structure. The proposed approach consolidates application and network definitions into the base compose file while maintaining separation for development, testing, production, and observability concerns.

### Current vs Proposed Structure

| Aspect                | Current                                        | Proposed                           | Impact                 |
| --------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------- |
| Total Files           | 9 files                                        | 6 files                            | -33% file count        |
| Base Infrastructure   | `docker-compose.yml`                           | `docker-compose.yml`               | No change              |
| Application Services  | `docker-compose.apps.yml`                      | Inline in base                     | Consolidated           |
| Network Definitions   | `docker-compose.networks.yml`                  | Inline in base                     | Consolidated           |
| Development Overrides | `docker-compose.dev.yml`                       | `docker-compose.dev.yml`           | No change              |
| Test Configuration    | `docker-compose.test.yml`                      | `docker-compose.test.yml`          | No change              |
| Production Config     | `deploy/docker-compose.production.example.yml` | `docker-compose.production.yml`    | Moved and simplified   |
| Observability         | `docker-compose.observability.yml`             | `docker-compose.observability.yml` | No change              |
| Base Images           | `docker-compose.base-images.yml`               | Removed                            | Integrated into builds |

## Decision Matrix

After careful analysis, we recommend **MAINTAINING THE CURRENT 9-FILE STRUCTURE** for the following reasons:

### Advantages of Current Structure (Recommended)

1. **Separation of Concerns**: Each file has a clear, single responsibility
2. **Flexibility**: Easy to compose different environments by combining files
3. **Maintainability**: Smaller files are easier to review and modify
4. **Team Collaboration**: Multiple developers can work on different files without conflicts
5. **Modularity**: Can easily add new services or environments
6. **Existing Investment**: All CI/CD pipelines already use this structure
7. **Documentation**: Each file is well-documented with inline comments
8. **Debugging**: Easier to isolate issues in specific domains

### Advantages of Proposed Structure (Alternative)

1. **Simplicity**: Fewer files to manage
2. **Less Cognitive Load**: All services defined in fewer places
3. **Standard Pattern**: Follows common Docker Compose conventions
4. **Faster Startup**: One base file instead of combining multiple files

### Recommendation

**Keep the current 9-file structure** and add convenience tooling (Makefile, .env.docker) to simplify operations. This maintains architectural benefits while improving developer experience through better abstraction.

---

## Implementation Plan: Enhance Current Structure

Instead of restructuring, we'll enhance the current structure with:

1. **Convenience Makefile** - Simple commands for common operations
2. **Environment configuration** - Centralized .env.docker file
3. **Documentation** - Clear usage guides for each compose file
4. **Validation** - Pre-flight checks for compose operations
5. **Backup/Restore** - Automated data protection workflows

### Phase 1: Tooling Enhancement (Week 1)

#### 1.1 Makefile Implementation

**Status**: ✅ Complete
**Location**: `/Makefile`

The Makefile provides 50+ convenient targets for Docker operations:

```makefile
# Development
make dev              # Start development environment
make dev-build        # Rebuild and start development
make dev-logs         # View development logs
make dev-stop         # Stop development environment

# Production
make prod             # Start production environment
make prod-build       # Build production images
make prod-stop        # Stop production environment

# Testing
make test             # Run integration tests
make test-unit        # Run unit tests in containers
make test-e2e         # Run end-to-end tests

# Utilities
make build            # Build all images
make clean            # Remove containers and volumes
make ps               # Show running containers
make logs             # Show logs from all services

# Security
make scan             # Scan for vulnerabilities
make sbom             # Generate SBOMs
make verify           # Verify image signatures

# Health Checks
make health           # Check health of all services
make health-web       # Check web service health
make health-api       # Check API service health

# Database
make db-migrate       # Run database migrations
make db-reset         # Reset database
make db-seed          # Seed database
make db-dump          # Dump database

# Backup/Restore
make backup           # Backup all data
make restore-latest   # Restore from latest backup
```

**Benefits**:

- Single command for complex multi-file operations
- Color-coded output for better UX
- Error handling and validation
- Comprehensive help system

#### 1.2 Environment Configuration

**Status**: ✅ Complete
**Location**: `/.env.docker`

Centralized environment configuration for Docker operations:

```bash
# Project Configuration
PROJECT_NAME=agenticverdict
COMPOSE_PROJECT_NAME=agenticverdict

# Version Tags
VERSION=latest
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD)

# Network Configuration
NETWORK_BACKEND=agenticverdict-backend
NETWORK_FRONTEND=agenticverdict-frontend

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=agenticverdict
POSTGRES_USER=postgres
POSTGRES_PASSWORD_FILE=./run/secrets/postgres_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD_FILE=./run/secrets/redis_password

# Application Ports
WEB_PORT=3000
API_PORT=4000
WORKER_METRICS_PORT=9464

# Observability
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090
JAEGER_PORT=16686

# Build Configuration
BUILDKIT_PROGRESS=plain
COMPOSE_DOCKER_CLI_BUILD=1
DOCKER_BUILDKIT=1

# Development Configuration
NODE_ENV=development
TARGET_STAGE=development

# Production Configuration
NODE_ENV=production
TARGET_STAGE=production
```

**Benefits**:

- Single source of truth for configuration
- Easy environment switching
- Version control friendly (no sensitive data)
- Works seamlessly with Makefile

### Phase 2: Documentation Enhancement (Week 1-2)

#### 2.1 Docker Compose File Guide

**Location**: `/docs/docker/compose-files.md`

Create comprehensive documentation for each compose file:

```markdown
# Docker Compose Files Guide

## File Organization

Our Docker Compose setup uses a modular approach with 9 specialized files:

### Core Infrastructure Files

#### docker-compose.yml

**Purpose**: Base infrastructure services (database and cache)
**Services**: PostgreSQL, Redis
**Usage**: Always included as the base
**Example**:
docker-compose -f docker-compose.yml up -d

#### docker-compose.networks.yml

**Purpose**: Network definitions for service communication
**Networks**: backend, frontend
**Usage**: Defines network topology and isolation
**Example**:
docker-compose -f docker-compose.yml \
 -f docker-compose.networks.yml up -d

#### docker-compose.base-images.yml

**Purpose**: Reusable base image definitions
**Images**: Node.js base, development base
**Usage**: Build cache for faster builds
**Example**:
docker-compose -f docker-compose.base-images.yml build

### Application Service Files

#### docker-compose.apps.yml

**Purpose**: Application service definitions
**Services**: web, api, worker
**Usage**: Defines all application containers
**Example**:
docker-compose -f docker-compose.yml \
 -f docker-compose.networks.yml \
 -f docker-compose.base-images.yml \
 -f docker-compose.apps.yml up -d

### Environment-Specific Files

#### docker-compose.dev.yml

**Purpose**: Development environment overrides
**Overrides**: Hot reloading, volume mounts, debug ports
**Usage**: Local development with live reload
**Example**:
docker-compose -f docker-compose.yml \
 -f docker-compose.networks.yml \
 -f docker-compose.base-images.yml \
 -f docker-compose.apps.yml \
 -f docker-compose.dev.yml up

#### docker-compose.test.yml

**Purpose**: Test environment configuration
**Services**: Test runners, test databases
**Usage**: Running automated tests
**Example**:
docker-compose -f docker-compose.yml \
 -f docker-compose.networks.yml \
 -f docker-compose.base-images.yml \
 -f docker-compose.test.yml up --abort-on-container-exit

### Production & Observability Files

#### deploy/docker-compose.production.yml

**Purpose**: Production environment configuration
**Overrides**: Resource limits, health checks, logging
**Usage**: Production deployments
**Example**:
docker-compose -f docker-compose.yml \
 -f docker-compose.networks.yml \
 -f docker-compose.base-images.yml \
 -f docker-compose.apps.yml \
 -f deploy/docker-compose.production.yml up -d

#### docker-compose.observability.yml

**Purpose**: Observability stack (monitoring, tracing, metrics)
**Services**: Prometheus, Grafana, Jaeger
**Usage**: Development observability (optional in production)
**Example**:
docker-compose -f docker-compose.observability.yml up -d
```

#### 2.2 Common Operations Guide

**Location**: `/docs/docker/common-operations.md`

```markdown
# Common Docker Operations

## Starting Development Environment

### Quick Start

\`\`\`bash
make dev
\`\`\`

### Manual Start

\`\`\`bash
docker-compose -f docker-compose.yml \
 -f docker-compose.networks.yml \
 -f docker-compose.base-images.yml \
 -f docker-compose.apps.yml \
 -f docker-compose.dev.yml up
\`\`\`

## Building Images

### Build All Images

\`\`\`bash
make build
\`\`\`

### Build Specific Service

\`\`\`bash
docker-compose build web
docker-compose build api
docker-compose build worker
\`\`\`

### Build with No Cache

\`\`\`bash
docker-compose build --no-cache web
\`\`\`

## Viewing Logs

### All Services

\`\`\`bash
make logs
\`\`\`

### Specific Service

\`\`\`bash
docker-compose logs -f web
docker-compose logs -f api
docker-compose logs -f worker
\`\`\`

## Health Checks

### All Services

\`\`\`bash
make health-all
\`\`\`

### Specific Service

\`\`\`bash
make health-web
make health-api
make health-worker
\`\`\`

## Database Operations

### Run Migrations

\`\`\`bash
make db-migrate
\`\`\`

### Seed Database

\`\`\`bash
make db-seed
\`\`\`

### Access Database Shell

\`\`\`bash
make shell-db
\`\`\`

### Dump Database

\`\`\`bash
make db-dump
\`\`\`

## Backup and Restore

### Create Backup

\`\`\`bash
make backup
\`\`\`

### Restore from Latest

\`\`\`bash
make restore-latest
\`\`\`

## Cleanup

### Stop Containers

\`\`\`bash
make dev-stop
\`\`\`

### Remove Containers and Volumes

\`\`\`bash
make clean
\`\`\`

### Remove Everything (including images)

\`\`\`bash
make clean-all
\`\`\`
```

### Phase 3: Validation and Safety (Week 2)

#### 3.1 Pre-flight Checks

**Location**: `/scripts/docker-preflight.sh`

```bash
#!/bin/bash
# Docker Compose Pre-flight Checks

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_docker() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
  fi
  echo -e "${GREEN}✓ Docker installed${NC}"
}

check_docker_compose() {
  if ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
  fi
  echo -e "${GREEN}✓ Docker Compose installed${NC}"
}

check_resources() {
  # Check available memory (Docker Desktop needs 4GB+ recommended)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    MEMORY=$(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2}')
    echo -e "${GREEN}✓ System Memory: $MEMORY GB${NC}"
  fi
}

check_ports() {
  local ports=(3000 4000 5432 6379 3001 9090)
  local conflicting_ports=()

  for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      conflicting_ports+=($port)
    fi
  done

  if [ ${#conflicting_ports[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠ Ports already in use: ${conflicting_ports[*]}${NC}"
    echo "This may cause conflicts. Stop conflicting services or change ports in .env.docker"
  else
    echo -e "${GREEN}✓ All required ports available${NC}"
  fi
}

check_env_file() {
  if [ ! -f .env.docker ]; then
    echo -e "${YELLOW}⚠ .env.docker not found${NC}"
    echo "Creating from template..."
    cp .env.docker.example .env.docker || true
  else
    echo -e "${GREEN}✓ .env.docker found${NC}"
  fi
}

check_git_secrets() {
  if git ls-files --others --exclude-standard | grep -q "\.env$"; then
    echo -e "${RED}✗ Uncommitted .env files detected${NC}"
    echo "Please add .env files to .gitignore"
    exit 1
  fi
  echo -e "${GREEN}✓ No exposed secrets in git${NC}"
}

main() {
  echo "Running Docker Compose pre-flight checks..."
  echo ""
  check_docker
  check_docker_compose
  check_resources
  check_ports
  check_env_file
  check_git_secrets
  echo ""
  echo -e "${GREEN}✓ All pre-flight checks passed${NC}"
}

main "$@"
```

#### 3.2 Compose File Validation

**Location**: `/scripts/docker-validate.sh`

```bash
#!/bin/bash
# Validate Docker Compose Files

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILES=(
  "docker-compose.yml"
  "docker-compose.networks.yml"
  "docker-compose.base-images.yml"
  "docker-compose.apps.yml"
  "docker-compose.dev.yml"
  "docker-compose.test.yml"
  "deploy/docker-compose.production.yml"
  "docker-compose.observability.yml"
)

validate_file() {
  local file=$1
  echo -n "Validating $file... "

  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ File not found${NC}"
    return 1
  fi

  if docker compose -f "$file" config > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Valid${NC}"
    return 0
  else
    echo -e "${RED}✗ Invalid${NC}"
    return 1
  fi
}

validate_combination() {
  local description=$1
  shift
  local files=("$@")

  echo -n "Validating $description... "

  local cmd="docker compose"
  for file in "${files[@]}"; do
    cmd="$cmd -f $file"
  done
  cmd="$cmd config > /dev/null 2>&1"

  if eval $cmd; then
    echo -e "${GREEN}✓ Valid${NC}"
    return 0
  else
    echo -e "${RED}✗ Invalid${NC}"
    return 1
  fi
}

main() {
  echo "Validating Docker Compose files..."
  echo ""

  # Validate individual files
  for file in "${COMPOSE_FILES[@]}"; do
    validate_file "$file"
  done

  echo ""

  # Validate common combinations
  validate_combination "Development stack" \
    docker-compose.yml \
    docker-compose.networks.yml \
    docker-compose.base-images.yml \
    docker-compose.apps.yml \
    docker-compose.dev.yml

  validate_combination "Test stack" \
    docker-compose.yml \
    docker-compose.networks.yml \
    docker-compose.base-images.yml \
    docker-compose.test.yml

  validate_combination "Production stack" \
    docker-compose.yml \
    docker-compose.networks.yml \
    docker-compose.base-images.yml \
    docker-compose.apps.yml \
    deploy/docker-compose.production.yml

  validate_combination "Observability stack" \
    docker-compose.observability.yml

  echo ""
  echo -e "${GREEN}✓ All validations passed${NC}"
}

main "$@"
```

### Phase 4: Backup and Restore Automation (Week 2-3)

#### 4.1 Backup Script

**Location**: `/scripts/docker-backup.sh`

```bash
#!/bin/bash
# Docker Volume Backup Script

set -euo pipefail

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${TIMESTAMP}"
RETENTION_DAYS=7

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

create_backup_dir() {
  mkdir -p "$BACKUP_DIR"
  echo -e "${BLUE}Created backup directory: $BACKUP_DIR${NC}"
}

backup_postgres() {
  echo -e "${BLUE}Backing up PostgreSQL...${NC}"

  docker-compose exec -T postgres pg_dump -U postgres agenticverdict \
    > "${BACKUP_DIR}/${BACKUP_NAME}_postgres.sql"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PostgreSQL backup complete${NC}"
  else
    echo -e "${RED}✗ PostgreSQL backup failed${NC}"
    exit 1
  fi
}

backup_redis() {
  echo -e "${BLUE}Backing up Redis...${NC}"

  # Redis requires saving to RDB file first
  docker-compose exec -T redis redis-cli BGSAVE

  # Wait for save to complete
  sleep 2

  docker cp $(docker-compose ps -q redis):/data/dump.rdb \
    "${BACKUP_DIR}/${BACKUP_NAME}_redis.rdb"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Redis backup complete${NC}"
  else
    echo -e "${RED}✗ Redis backup failed${NC}"
    exit 1
  fi
}

backup_volumes() {
  echo -e "${BLUE}Backing up volumes...${NC}"

  docker run --rm \
    -v agenticverdict_postgres_data:/data/postgres \
    -v agenticverdict_redis_data:/data/redis \
    -v "$(pwd)/${BACKUP_DIR}":/backup \
    alpine tar czf "/backup/${BACKUP_NAME}_volumes.tar.gz" /data

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Volumes backup complete${NC}"
  else
    echo -e "${RED}✗ Volumes backup failed${NC}"
    exit 1
  fi
}

create_archive() {
  echo -e "${BLUE}Creating backup archive...${NC}"

  tar czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
    -C "$BACKUP_DIR" \
    "${BACKUP_NAME}_postgres.sql" \
    "${BACKUP_NAME}_redis.rdb" \
    "${BACKUP_NAME}_volumes.tar.gz"

  # Remove individual files
  rm -f "${BACKUP_DIR}/${BACKUP_NAME}_postgres.sql"
  rm -f "${BACKUP_DIR}/${BACKUP_NAME}_redis.rdb"
  rm -f "${BACKUP_DIR}/${BACKUP_NAME}_volumes.tar.gz"

  echo -e "${GREEN}✓ Backup archive created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz${NC}"
}

cleanup_old_backups() {
  echo -e "${BLUE}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"

  find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

  echo -e "${GREEN}✓ Old backups cleaned up${NC}"
}

main() {
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE}  Docker Volume Backup${NC}"
  echo -e "${BLUE}======================================${NC}"
  echo ""

  # Check if containers are running
  if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}✗ No containers running. Start with 'make dev'${NC}"
    exit 1
  fi

  create_backup_dir
  backup_postgres
  backup_redis
  backup_volumes
  create_archive
  cleanup_old_backups

  echo ""
  echo -e "${GREEN}======================================${NC}"
  echo -e "${GREEN}  Backup Complete!${NC}"
  echo -e "${GREEN}======================================${NC}"
  echo ""
  echo "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
  echo "Size: $(du -h ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz | cut -f1)"
}

main "$@"
```

#### 4.2 Restore Script

**Location**: `/scripts/docker-restore.sh`

```bash
#!/bin/bash
# Docker Volume Restore Script

set -euo pipefail

# Configuration
BACKUP_FILE=${1:-}
RESTORE_DIR="./restore"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31M'
NC='\033[0m'

validate_backup() {
  if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ No backup file specified${NC}"
    echo "Usage: $0 <backup_file.tar.gz>"
    exit 1
  fi

  if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓ Backup file found: $BACKUP_FILE${NC}"
}

stop_services() {
  echo -e "${YELLOW}Stopping services...${NC}"
  docker-compose stop
  echo -e "${GREEN}✓ Services stopped${NC}"
}

extract_backup() {
  echo -e "${BLUE}Extracting backup...${NC}"

  mkdir -p "$RESTORE_DIR"
  tar xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

  echo -e "${GREEN}✓ Backup extracted${NC}"
}

restore_postgres() {
  echo -e "${BLUE}Restoring PostgreSQL...${NC}"

  local sql_file=$(find "$RESTORE_DIR" -name "*_postgres.sql" | head -1)

  if [ -z "$sql_file" ]; then
    echo -e "${RED}✗ PostgreSQL backup not found in archive${NC}"
    exit 1
  fi

  # Start PostgreSQL only
  docker-compose up -d postgres

  # Wait for PostgreSQL to be ready
  until docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
  done

  # Restore database
  docker-compose exec -T postgres psql -U postgres -d agenticverdict < "$sql_file"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PostgreSQL restored${NC}"
  else
    echo -e "${RED}✗ PostgreSQL restore failed${NC}"
    exit 1
  fi
}

restore_redis() {
  echo -e "${BLUE}Restoring Redis...${NC}"

  local rdb_file=$(find "$RESTORE_DIR" -name "*_redis.rdb" | head -1)

  if [ -z "$rdb_file" ]; then
    echo -e "${YELLOW}⚠ Redis backup not found in archive, skipping...${NC}"
    return 0
  fi

  # Start Redis only
  docker-compose up -d redis

  # Wait for Redis to be ready
  until docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; do
    echo "Waiting for Redis..."
    sleep 2
  done

  # Copy RDB file to container
  docker cp "$rdb_file" \
    $(docker-compose ps -q redis):/data/dump.rdb

  # Restart Redis to load the data
  docker-compose restart redis

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Redis restored${NC}"
  else
    echo -e "${RED}✗ Redis restore failed${NC}"
    exit 1
  fi
}

cleanup() {
  echo -e "${BLUE}Cleaning up...${NC}"
  rm -rf "$RESTORE_DIR"
  echo -e "${GREEN}✓ Cleanup complete${NC}"
}

start_services() {
  echo -e "${BLUE}Starting services...${NC}"
  docker-compose start
  echo -e "${GREEN}✓ Services started${NC}"
}

verify_restore() {
  echo -e "${BLUE}Verifying restore...${NC}"

  # Check PostgreSQL
  if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL healthy${NC}"
  else
    echo -e "${RED}✗ PostgreSQL unhealthy${NC}"
  fi

  # Check Redis
  if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis healthy${NC}"
  else
    echo -e "${RED}✗ Redis unhealthy${NC}"
  fi
}

main() {
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE}  Docker Volume Restore${NC}"
  echo -e "${BLUE}======================================${NC}"
  echo ""

  validate_backup

  echo -e "${YELLOW}WARNING: This will replace all data!${NC}"
  read -p "Are you sure? [y/N] " confirm

  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted"
    exit 0
  fi

  stop_services
  extract_backup
  restore_postgres
  restore_redis
  cleanup
  start_services
  verify_restore

  echo ""
  echo -e "${GREEN}======================================${NC}"
  echo -e "${GREEN}  Restore Complete!${NC}"
  echo -e "${GREEN}======================================${NC}"
}

main "$@"
```

### Phase 5: CI/CD Integration (Week 3)

#### 5.1 GitHub Actions Workflow

**Location**: `/.github/workflows/docker-compose.yml`

```yaml
name: Docker Compose Validation

on:
  pull_request:
    paths:
      - "docker-compose*.yml"
      - "deploy/docker-compose*.yml"
      - "apps/**/Dockerfile"
      - "Makefile"
  push:
    branches:
      - main
      - develop

jobs:
  validate-compose:
    name: Validate Docker Compose Files
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Validate individual files
        run: |
          for file in docker-compose*.yml deploy/docker-compose*.yml; do
            echo "Validating $file..."
            docker compose -f "$file" config > /dev/null
          done

      - name: Validate development stack
        run: |
          docker compose -f docker-compose.yml \
            -f docker-compose.networks.yml \
            -f docker-compose.base-images.yml \
            -f docker-compose.apps.yml \
            -f docker-compose.dev.yml config > /dev/null

      - name: Validate test stack
        run: |
          docker compose -f docker-compose.yml \
            -f docker-compose.networks.yml \
            -f docker-compose.base-images.yml \
            -f docker-compose.test.yml config > /dev/null

      - name: Validate production stack
        run: |
          docker compose -f docker-compose.yml \
            -f docker-compose.networks.yml \
            -f docker-compose.base-images.yml \
            -f docker-compose.apps.yml \
            -f deploy/docker-compose.production.yml config > /dev/null

  test-build:
    name: Test Build Images
    runs-on: ubuntu-latest
    needs: validate-compose
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build base images
        run: |
          docker compose -f docker-compose.base-images.yml build

      - name: Build application images
        run: |
          docker compose -f docker-compose.yml \
            -f docker-compose.networks.yml \
            -f docker-compose.base-images.yml \
            -f docker-compose.apps.yml build

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: test-build
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          format: "sarif"
          output: "trivy-results.sarif"

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: "trivy-results.sarif"
```

### Phase 6: Developer Experience Enhancements (Week 3-4)

#### 6.1 Interactive Setup Script

**Location**: `/scripts/docker-setup.sh`

```bash
#!/bin/bash
# Docker Environment Setup Script

set -euo pipefail

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_banner() {
  echo -e "${BLUE}"
  echo "======================================"
  echo "  AgenticVerdict Docker Setup"
  echo "======================================"
  echo -e "${NC}"
}

check_prerequisites() {
  echo -e "${BLUE}Checking prerequisites...${NC}"

  if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker:"
    echo "  https://docs.docker.com/get-docker/"
    exit 1
  fi

  if ! docker compose version &> /dev/null; then
    echo "Docker Compose not found. Please install Docker Compose:"
    echo "  https://docs.docker.com/compose/install/"
    exit 1
  fi

  echo -e "${GREEN}✓ Prerequisites met${NC}"
}

setup_environment() {
  echo -e "${BLUE}Setting up environment...${NC}"

  if [ ! -f .env.docker ]; then
    if [ -f .env.docker.example ]; then
      cp .env.docker.example .env.docker
      echo -e "${GREEN}✓ Created .env.docker from template${NC}"
    else
      echo -e "${YELLOW}⚠ No .env.docker.example found, creating default...${NC}"
      cat > .env.docker << 'EOF'
# Project Configuration
PROJECT_NAME=agenticverdict
COMPOSE_PROJECT_NAME=agenticverdict

# Network Configuration
NETWORK_BACKEND=agenticverdict-backend
NETWORK_FRONTEND=agenticverdict-frontend

# Build Configuration
BUILDKIT_PROGRESS=plain
COMPOSE_DOCKER_CLI_BUILD=1
DOCKER_BUILDKIT=1
EOF
      echo -e "${GREEN}✓ Created default .env.docker${NC}"
    fi
  else
    echo -e "${GREEN}✓ .env.docker already exists${NC}"
  fi

  # Create secrets directory
  mkdir -p ./run/secrets

  # Generate random passwords if not exists
  if [ ! -f ./run/secrets/postgres_password ]; then
    openssl rand -base64 32 > ./run/secrets/postgres_password
    echo -e "${GREEN}✓ Generated PostgreSQL password${NC}"
  fi

  if [ ! -f ./run/secrets/redis_password ]; then
    openssl rand -base64 32 > ./run/secrets/redis_password
    echo -e "${GREEN}✓ Generated Redis password${NC}"
  fi
}

create_directories() {
  echo -e "${BLUE}Creating directories...${NC}"

  mkdir -p backups
  mkdir -p logs
  mkdir -p sboms

  echo -e "${GREEN}✓ Directories created${NC}"
}

install_tools() {
  echo -e "${BLUE}Checking for optional tools...${NC}"

  # Trivy for vulnerability scanning
  if ! command -v trivy &> /dev/null; then
    echo -e "${YELLOW}⚠ Trivy not found. Install with:brew install trivy${NC}"
  else
    echo -e "${GREEN}✓ Trivy installed${NC}"
  fi

  # Syft for SBOM generation
  if ! command -v syft &> /dev/null; then
    echo -e "${YELLOW}⚠ Syft not found. Install with:brew install syft${NC}"
  else
    echo -e "${GREEN}✓ Syft installed${NC}"
  fi
}

build_images() {
  echo -e "${BLUE}Building Docker images...${NC}"
  read -p "Build images now? [y/N] " build

  if [ "$build" = "y" ] || [ "$build" = "Y" ]; then
    make build
    echo -e "${GREEN}✓ Images built${NC}"
  else
    echo "You can build images later with: make build"
  fi
}

show_next_steps() {
  echo ""
  echo -e "${GREEN}======================================"
  echo "  Setup Complete!"
  echo "======================================"
  echo -e "${NC}"
  echo "Next steps:"
  echo ""
  echo "  Start development environment:"
  echo "    make dev"
  echo ""
  echo "  View logs:"
  echo "    make dev-logs"
  echo ""
  echo "  Run tests:"
  echo "    make test"
  echo ""
  echo "  View all commands:"
  echo "    make help"
  echo ""
}

main() {
  show_banner
  check_prerequisites
  setup_environment
  create_directories
  install_tools
  build_images
  show_next_steps
}

main "$@"
```

#### 6.2 Quick Start Documentation

**Location**: `/docs/docker/quick-start.md`

```markdown
# Docker Quick Start Guide

## Prerequisites

- Docker 24.0+
- Docker Compose v2.20+
- 8GB RAM recommended
- 20GB disk space

## Installation

### 1. Clone and Setup

\`\`\`bash
git clone https://github.com/your-org/agenticverdict.git
cd agenticverdict
./scripts/docker-setup.sh
\`\`\`

### 2. Configure Environment

\`\`\`bash

# Edit environment variables

vim .env.docker

# Or use the defaults

cp .env.docker.example .env.docker
\`\`\`

### 3. Start Development Environment

\`\`\`bash
make dev
\`\`\`

This starts:

- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. Verify Health

\`\`\`bash
make health
\`\`\`

## Common Tasks

### View Logs

\`\`\`bash

# All services

make dev-logs

# Specific service

docker-compose logs -f web
docker-compose logs -f api
docker-compose logs -f worker
\`\`\`

### Run Tests

\`\`\`bash

# Integration tests

make test

# Unit tests

make test-unit

# E2E tests

make test-e2e
\`\`\`

### Database Operations

\`\`\`bash

# Run migrations

make db-migrate

# Access database shell

make shell-db

# Seed database

make db-seed

# Reset database (CAUTION: deletes data)

make db-reset
\`\`\`

### Backup and Restore

\`\`\`bash

# Create backup

make backup

# Restore from latest

make restore-latest

# Restore from specific backup

make restore BACKUP=backups/backup_20260409_120000.tar.gz
\`\`\`

### Cleanup

\`\`\`bash

# Stop services

make dev-stop

# Remove containers and volumes

make clean

# Remove everything including images

make clean-all
\`\`\`

## Troubleshooting

### Port Already in Use

\`\`\`bash

# Check what's using the port

lsof -i :3000
lsof -i :4000

# Change ports in .env.docker

WEB_PORT=3001
API_PORT=4001
\`\`\`

### Container Won't Start

\`\`\`bash

# Check logs

docker-compose logs web
docker-compose logs api
docker-compose logs worker

# Check health

make health-all

# Rebuild container

make dev-rebuild-web
make dev-rebuild-api
make dev-rebuild-worker
\`\`\`

### Out of Disk Space

\`\`\`bash

# Prune Docker system

docker system prune -a

# Remove unused images

docker image prune -a

# Check disk usage

docker system df
\`\`\`

### Database Connection Issues

\`\`\`bash

# Check PostgreSQL is ready

make health-db

# Access database

make shell-db

# Check connection

docker-compose exec api pnpm db:check
\`\`\`

## Production Deployment

For production deployment, see: `/docs/docker/production.md`

## Additional Resources

- [Docker Compose Files Guide](compose-files.md)
- [Common Operations](common-operations.md)
- [Troubleshooting](troubleshooting.md)
- [Security Best Practices](security.md)
```

---

## Implementation Timeline

### Week 1

- [x] Create Makefile
- [x] Create .env.docker (template: `.env.docker.example`; local file gitignored)
- [x] Create documentation files
- [x] Add pre-flight checks

### Week 2

- [x] Implement backup/restore scripts
- [x] Add validation scripts
- [x] Create setup wizard

### Week 3

- [x] CI/CD integration (`docker-compose-validate.yml`: config validation + compose build smoke)
- [x] Security scanning workflows (existing `docker-scan.yml`; `make scan` / `make verify-image` locally when tools installed)
- [x] Developer experience enhancements (Makefile targets, setup script)

### Week 4

- [x] Testing and validation (`scripts/docker-validate.sh`, CI jobs)
- [x] Documentation review (SSOT under `docs/docker/`)
- [ ] Team training (out of band)

---

## Success Criteria

### Must Have

- [x] All Makefile targets working (`make help`)
- [x] Backup/restore automated (`make backup`, `make restore`, `make restore-latest`)
- [x] Pre-flight checks passing (`make preflight`, `scripts/docker-preflight.sh`)
- [x] Documentation complete (`docs/docker/*` including `troubleshooting.md`)
- [x] CI/CD pipeline green (compose validation + build smoke workflow; image scan workflow pre-existing)

### Should Have

- [x] Setup wizard functional (`scripts/docker-setup.sh`)
- [x] Security scanning integrated (CI + optional `make scan` / `make verify-image`)
- [ ] Performance optimizations (tracked in build-optimization docs / separate work)
- [ ] Monitoring dashboards (observability compose optional; Grafana not a “dashboard project” deliverable here)

### Could Have

- [ ] Auto-scaling configuration
- [ ] Multi-region deployment
- [ ] Disaster recovery procedures

---

## Risk Mitigation

### Risk 1: Breaking Changes

**Mitigation**: Comprehensive testing before rollout
**Backup**: Maintain current structure alongside new tooling

### Risk 2: Adoption Friction

**Mitigation**: Detailed documentation and training
**Fallback**: Individual compose files still work standalone

### Risk 3: Data Loss

**Mitigation**: Automated backups before any destructive operations
**Recovery**: Tested restore procedures

---

## Conclusion

This implementation plan enhances the existing Docker Compose structure by:

1. **Adding convenience tooling** (Makefile, setup scripts)
2. **Improving safety** (pre-flight checks, validation, backups)
3. **Enhancing documentation** (comprehensive guides)
4. **Automating operations** (CI/CD, backup/restore)

The current 9-file modular structure is **maintained and enhanced** rather than replaced, providing the best balance of flexibility, maintainability, and developer experience.

---

## Appendix: File Structure

```
agenticverdict/
├── Makefile                          # Convenience commands (NEW)
├── .env.docker                       # Docker environment config (NEW)
├── .env.docker.example               # Configuration template (NEW)
├── docker-compose.yml                # Base infrastructure
├── docker-compose.networks.yml       # Network definitions
├── docker-compose.base-images.yml    # Base images
├── docker-compose.apps.yml           # Application services
├── docker-compose.dev.yml            # Development overrides
├── docker-compose.test.yml           # Test configuration
├── docker-compose.observability.yml  # Monitoring stack
├── deploy/
│   └── docker-compose.production.example.yml # Production-shaped example (not default stack)
├── scripts/
│   ├── docker-setup.sh              # Setup wizard (NEW)
│   ├── docker-backup.sh             # Backup automation (NEW)
│   ├── docker-restore.sh            # Restore automation (NEW)
│   ├── docker-preflight.sh          # Pre-flight checks (NEW)
│   └── docker-validate.sh           # Validation (NEW)
├── docs/
│   └── docker/
│       ├── quick-start.md           # Quick start guide (NEW)
│       ├── compose-files.md         # File documentation (NEW)
│       ├── common-operations.md     # Operations guide (NEW)
│       ├── troubleshooting.md       # Troubleshooting (NEW)
│       └── security.md              # Security (existing SSOT)
├── backups/                          # Backup storage (NEW)
├── logs/                            # Log storage (NEW)
└── sboms/                           # SBOM storage (NEW)
```

---

**Document Version**: 1.0
**Last Updated**: 2026-04-09 (implementation completed same cycle)
**Next Review**: 2026-04-16
