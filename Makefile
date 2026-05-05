# Docker-focused convenience targets. Underlying commands match docs/docker/getting-started.md.
# Optional: copy .env.docker.example to .env.docker for COMPOSE_PROJECT_NAME and DATABASE_URL.
-include .env.docker
export

# Prefer .env.local for local app runtime vars (e.g. VITE_PUBLIC_DEFAULT_TENANT_ID),
# then fallback to .env when present.
ENV_FILE_FLAG := $(if $(wildcard .env.local),--env-file .env.local,$(if $(wildcard .env),--env-file .env,))
DC := docker compose $(ENV_FILE_FLAG)
BASE := -f docker-compose.yml
APPS := $(BASE) -f docker-compose.apps.yml
DEV_STACK := $(APPS) -f docker-compose.dev.yml -f docker-compose.observability.yml -f docker-compose.pgadmin.yml
PROD_LIKE := $(APPS)
PGADMIN_STACK := $(BASE) -f docker-compose.pgadmin.yml

.PHONY: help preflight validate setup build-base build-apps build dev dev-build dev-stop dev-logs \
	dev-up dev-watch apps-up apps-down infra-up infra-down infra-logs dev-logs apps-logs logs ps ps-apps \
	pgadmin-up pgadmin-down pgadmin-logs \
	seaweedfs-up seaweedfs-down seaweedfs-logs seaweedfs-shell \
	health health-frontend health-api health-worker backup db-dump restore restore-latest \
	db-migrate db-seed db-reset shell-db test test-integration test-e2e test-scripts test-scripts-all \
	test-scripts-scenario test-scripts-group test-scripts-validate test-scripts-verify-artifacts \
	test-scripts-capture clean clean-volumes clean-all \
	prod-validate prod-example-up prod-example-down obs-up scan sbom verify-image

help: ## Show available targets
	@echo "Docker / Compose (see docs/docker/quick-start.md)"
	@grep -E '^[a-zA-Z0-9_.-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

preflight: ## Host checks (Docker, ports, .env.docker hint)
	bash scripts/docker-preflight.sh

validate: ## Validate compose files and common merges
	bash scripts/docker-validate.sh

setup: ## Secrets, dirs, optional .env.docker
	bash scripts/docker-setup.sh

build-base: ## Build deps + chromium base images
	$(DC) -f docker-compose.base-images.yml build

build-apps: ## Build frontend, api, worker against local base images
	$(DC) $(APPS) build

build: build-base build-apps ## build-base + build-apps

dev: build-base ## Infra + apps with api/worker dev stage and mock-friendly env
	$(DC) $(DEV_STACK) up -d --build

dev-up: build-base ## Start/update dev stack without forcing image rebuild
	$(DC) $(DEV_STACK) up -d

dev-build: build ## Rebuild all images then recreate dev stack containers
	$(DC) $(DEV_STACK) up -d --build

dev-watch: ## Start compose watch loop for rebuild-on-change
	$(DC) $(DEV_STACK) watch

dev-stop: ## Stop dev stack (containers only; keeps volumes)
	$(DC) $(DEV_STACK) down

dev-logs: ## Follow logs for dev stack
	$(DC) $(DEV_STACK) logs -f

logs: dev-logs ## Alias: follow dev stack logs (use apps-logs for prod-like)

apps-up: build-base ## Production-like app images (NODE_ENV=production in compose)
	$(DC) $(PROD_LIKE) up -d --build

apps-down: ## Stop production-like app stack
	$(DC) $(PROD_LIKE) down

infra-up: ## Postgres + Redis only
	$(DC) up -d

infra-down: ## Stop infra-only project
	$(DC) down

infra-logs: ## Follow logs for Postgres + Redis
	$(DC) $(BASE) logs -f

apps-logs: ## Follow logs for production-like stack
	$(DC) $(PROD_LIKE) logs -f

pgadmin-up: ## Optional local pgAdmin UI on top of base stack
	$(DC) $(PGADMIN_STACK) up -d

pgadmin-down: ## Stop optional pgAdmin overlay
	$(DC) $(PGADMIN_STACK) down

pgadmin-logs: ## Follow optional pgAdmin logs
	$(DC) $(PGADMIN_STACK) logs -f pgadmin

seaweedfs-up: ## Start SeaweedFS S3-compatible storage
	$(DC) up -d seaweedfs

seaweedfs-down: ## Stop SeaweedFS storage
	$(DC) down seaweedfs

seaweedfs-logs: ## Follow SeaweedFS logs
	$(DC) logs -f seaweedfs

seaweedfs-shell: ## Open shell in SeaweedFS container
	$(DC) exec seaweedfs /bin/sh

ps: ## docker compose ps for dev stack
	$(DC) $(DEV_STACK) ps

ps-apps: ## docker compose ps for prod-like stack
	$(DC) $(PROD_LIKE) ps

health: ## HTTP checks + scripts/health-check.sh
	./scripts/health-check.sh

health-frontend: ## curl frontend /api/health
	curl -fsS http://127.0.0.1:3000/api/health && echo

health-web: health-frontend ## Backward-compatible alias for health-frontend

health-api: ## curl API /health
	curl -fsS http://127.0.0.1:4000/health && echo

health-worker: ## wget worker in-container healthz (dev stack)
	$(DC) $(DEV_STACK) exec -T worker wget -q -O- http://127.0.0.1:9465/healthz >/dev/null
	@echo OK worker

backup: ## Postgres gzip dump (+ Redis RDB when redis is up)
	bash scripts/docker-backup.sh

db-dump: ## Postgres-only gzip dump (scripts/backup-postgres.sh)
	bash scripts/backup-postgres.sh

restore: ## Restore BACKUP=path/to.sql.gz (set CONFIRM=1 to skip prompt)
	@test -n "$(BACKUP)" || (echo "Usage: make restore BACKUP=backups/backup-....sql.gz" && exit 1)
	bash scripts/docker-restore.sh "$(BACKUP)"

restore-latest: ## Restore newest backups/backup-*.sql.gz (non-interactive)
	@latest=$$(ls -t backups/backup-*.sql.gz 2>/dev/null | head -1); \
	if [ -z "$$latest" ]; then echo "No backups/backup-*.sql.gz found."; exit 1; fi; \
	echo "Using $$latest"; \
	CONFIRM=1 bash scripts/docker-restore.sh "$$latest"

db-migrate: ## Sync DB schema via drizzle-kit push (requires DATABASE_URL; no SQL migration journal)
	pnpm --filter @agenticverdict/database db:push

db-seed: ## Seed test data via package script
	pnpm db:seed:test

db-seed-dev: ## Seed development data via package script (requires running PostgreSQL)
	pnpm --filter @agenticverdict/database db:seed:dev

db-seed-dev-full: ## Full reset and seed for development (destructive; drops all data)
	pnpm --filter @agenticverdict/database db:reset && pnpm --filter @agenticverdict/database db:seed:dev

db-reset: ## Drop/recreate public, drizzle-kit push, seed (destructive; local dev)
	pnpm --filter @agenticverdict/database db:reset && pnpm --filter @agenticverdict/database db:seed:dev

shell-db: ## psql into compose Postgres
	$(DC) $(BASE) exec postgres psql -U postgres -d agenticverdict

test: ## Monorepo unit tests (host)
	pnpm test

test-integration: ## Integration tests (host)
	pnpm test:integration

test-e2e: ## Playwright E2E (host; see package.json)
	pnpm test:e2e

# tests/scripts — production-flow scenarios and artifact helpers (see tests/scripts/README.md)
test-scripts: test-scripts-all ## Alias: run all tests/scripts production-flow scenarios

test-scripts-all: ## Run tests/scripts/run-all-scenarios.sh (optional ARGS= passed through)
	bash tests/scripts/run-all-scenarios.sh $(ARGS)

test-scripts-scenario: ## Run one scenario: make test-scripts-scenario SCENARIO=R01 [ARGS='vitest extra args']
	@test -n "$(SCENARIO)" || (echo "Usage: make test-scripts-scenario SCENARIO=R01 [ARGS='...']" && exit 1)
	bash tests/scripts/run-scenario.sh "$(SCENARIO)" $(ARGS)

test-scripts-group: ## Run a scenario group: make test-scripts-group GROUP=generation [ARGS='...']
	@test -n "$(GROUP)" || (echo "Usage: make test-scripts-group GROUP=generation|integration|delivery|scheduling|system [ARGS='...']" && exit 1)
	bash tests/scripts/run-scenario-group.sh "$(GROUP)" $(ARGS)

test-scripts-validate: ## Validate scenario layout: make test-scripts-validate SCENARIO=R01
	@test -n "$(SCENARIO)" || (echo "Usage: make test-scripts-validate SCENARIO=R01" && exit 1)
	bash tests/scripts/validate-scenario.sh "$(SCENARIO)"

test-scripts-verify-artifacts: ## Needs TOKEN; optional EXECUTION_ID=workflow-… (see tests/scripts/README.md)
	bash tests/scripts/verify-artifacts.sh $(EXECUTION_ID)

test-scripts-capture: ## Needs TOKEN; capture artifacts via tests/scripts/capture-test-artifacts.sh
	bash tests/scripts/capture-test-artifacts.sh

clean: ## Stop dev and prod-like stacks (no volume removal)
	-$(DC) $(DEV_STACK) down
	-$(DC) $(PROD_LIKE) down

clean-volumes: ## Stop dev stack and remove its volumes (data loss)
	$(DC) $(DEV_STACK) down -v --remove-orphans

clean-all: ## Stop dev + prod-like stacks and remove volumes (data loss)
	-$(DC) $(DEV_STACK) down -v --remove-orphans
	-$(DC) $(PROD_LIKE) down -v --remove-orphans

prod-validate: ## Syntax-check deploy/docker-compose.production.example.yml
	POSTGRES_PASSWORD=ci_validate_dummy $(DC) -f deploy/docker-compose.production.example.yml config >/dev/null
	@echo "OK: production example compose config"

prod-example-up: ## Start production *example* stack (requires POSTGRES_PASSWORD and secrets/jwt_secret.txt)
	@test -n "$${POSTGRES_PASSWORD}" || (echo "Set POSTGRES_PASSWORD in the environment." && exit 1)
	@test -f secrets/jwt_secret.txt || (echo "Missing secrets/jwt_secret.txt — run make setup or scripts/generate-secrets.sh" && exit 1)
	$(DC) -f deploy/docker-compose.production.example.yml up -d

prod-example-down: ## Stop production example stack
	$(DC) -f deploy/docker-compose.production.example.yml down

obs-up: build-base ## Add observability overlay (Prometheus, Grafana, Loki, …)
	$(DC) $(PROD_LIKE) -f docker-compose.observability.yml up -d

scan: ## Filesystem scan with trivy when installed
	@command -v trivy >/dev/null 2>&1 || (echo "Install Trivy (https://aquasecurity.github.io/trivy/) or use .github/workflows/docker-scan.yml"; exit 1)
	trivy fs --severity HIGH,CRITICAL .

sbom: ## SPDX JSON SBOM under sboms/ (requires syft)
	@command -v syft >/dev/null 2>&1 || (echo "Install Syft (https://github.com/anchore/syft) or use SBOM artifacts from .github/workflows/docker-scan.yml"; exit 1)
	@mkdir -p sboms
	syft scan dir:. -o spdx-json=sboms/sbom-$$(date +%Y%m%d-%H%M%S).json

verify-image: ## Cosign verify IMAGE=repo/name@sha256:... (requires cosign)
	@test -n "$(IMAGE)" || (echo "Usage: make verify-image IMAGE=ghcr.io/org/repo/frontend@sha256:..." && exit 1)
	@command -v cosign >/dev/null 2>&1 || (echo "Install Cosign (https://docs.sigstore.dev/cosign/install/); release images are signed in docker-release.yml"; exit 1)
	cosign verify "$(IMAGE)"
