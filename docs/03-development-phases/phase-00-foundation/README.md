# Phase 0: Foundation - Index & Quick Reference

**Duration**: Weeks 1-2  
**Status**: 🟡 In Progress  
**Last Updated**: 2026-04-03

---

## Phase Summary

Phase 0 establishes the foundational infrastructure for the entire AgenticVerdict system. This includes the monorepo structure, configuration management, database layer, UI components, internationalization, and testing infrastructure. The phase ensures that all subsequent development can proceed on a stable, well-architected foundation with multi-tenancy support built in from the start.

### Key Objectives

1. **Monorepo Infrastructure**: Set up Turborepo with pnpm workspaces for efficient development
2. **Multi-Tenancy Core**: Implement tenant context propagation and row-level security patterns
3. **Database Layer**: Establish Drizzle ORM with PostgreSQL 16 and migration system
4. **Configuration Management**: Build the CompanyConfig schema and injection system
5. **UI Foundation**: Create Mantine-based component library with RTL/LTR support
6. **Testing Infrastructure**: Set up Vitest, Playwright, and coverage tracking
7. **Internationalization**: Implement i18n system for Arabic/English with RTL support

### Success Criteria

- All packages build successfully with zero TypeScript errors
- Multi-tenant context propagation works end-to-end
- Database schema migrations can be applied and rolled back
- Test suite runs with 70%+ coverage across core packages
- Development environment starts with a single command
- RTL layout renders correctly for Arabic locale

---

## Documentation Navigation

### Core Phase Documents

| Document                                          | Description                                                     | Status         |
| ------------------------------------------------- | --------------------------------------------------------------- | -------------- |
| [Overview](./overview.md)                         | Phase objectives, scope, timeline, and risk assessment          | 🟡 In Progress |
| [Tasks](./tasks.md)                               | Complete task breakdown with dependencies and estimates         | 🟡 In Progress |
| [Acceptance Criteria](./acceptance-criteria.md)   | Quality gates, exit criteria, and phase transition requirements | 🟡 In Progress |
| [Implementation scope](./implementation-scope.md) | Waves, config source of truth, deferrals vs. `tasks.md`         | 🟡 Active      |
| [Execution plan](./EXECUTION-PLAN.md)             | Phased execution groupings, sequencing, verification            | 🟡 Active      |

### Related Documentation

| Document            | Location                                                |
| ------------------- | ------------------------------------------------------- |
| Testing Strategy    | `/docs/02-planning-and-methodology/testing-strategy.md` |
| Technology Research | `/docs/04-technology-research/research-overview.md`     |
| Project Charter     | `/docs/05-project-management/project-charter.md`        |
| CLAUDE.md           | `/CLAUDE.md` (root directory)                           |

---

## Quick Start Checklist

Use this checklist to verify your environment is properly configured for Phase 0 development.

### Prerequisites

- [ ] Node.js 20 LTS installed (`node --version` should show v20.x.x)
- [ ] pnpm 8+ installed (`pnpm --version` should show 8.x.x or higher)
- [ ] PostgreSQL 16 installed and running
- [ ] Git initialized and configured
- [ ] VS Code or preferred IDE with TypeScript support

### Initial Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd AgenticVerdict

# Install all dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Optional: Postgres + Redis via Docker (see repo-root docker-compose.yml)
pnpm run db:up

# Initialize the database
pnpm --filter=@agenticverdict/database db:push
```

### Verification

- [ ] Dependencies installed without errors
- [ ] `pnpm dev` starts all applications successfully
- [ ] `pnpm build` completes with zero TypeScript errors
- [ ] `pnpm test` runs the test suite (even if minimal tests exist)
- [ ] Database connection works and migrations apply
- [ ] You can access the web application at `http://localhost:3000`

---

## Common Workflows & Commands

### Development

```bash
# Start all applications in development mode
pnpm dev

# Start specific application
pnpm --filter @agenticverdict/web dev
pnpm --filter @agenticverdict/api dev
pnpm --filter @agenticverdict/worker dev

# Run with hot reload (Turbo)
turbo run dev --parallel
```

### Building

```bash
# Build all packages in dependency order
turbo run build

# Build specific package
turbo run build --filter=@agenticverdict/core

# Clean all build artifacts
turbo run clean
```

### Testing

```bash
# Unit tests (root Vitest workspace)
pnpm run test:unit

# Coverage (thresholds in repo-root vitest.config.ts)
pnpm run test:coverage

# Package-scoped tests via Turbo
turbo run test

# Database integration tests (Docker / Testcontainers)
pnpm run test:integration

# E2E (Playwright, web app)
pnpm run test:e2e

# Run a single test file (example)
pnpm exec vitest run packages/config/src/schemas/company.test.ts

# Coverage HTML (after pnpm run test:coverage)
open coverage/index.html
```

### Database Operations

```bash
# Generate migration from schema changes
pnpm --filter=@agenticverdict/database db:generate

# Apply migrations to database
pnpm --filter=@agenticverdict/database db:push

# Rollback last migration
pnpm --filter=@agenticverdict/database db:rollback

# Open database studio (Drizzle Kit)
pnpm --filter=@agenticverdict/database db:studio
```

### Code Quality

```bash
# Lint all packages
turbo run lint

# Fix linting issues automatically
turbo run lint --fix

# Type check all packages
turbo run type-check

# Format code with Prettier
turbo run format
```

---

## Architecture Overview

### Package Structure (Phase 0)

```
agenticverdict/
├── apps/
│   ├── web/              # Next.js application (Phase 0)
│   ├── api/              # Fastify API (Phase 0 late or Phase 1)
│   └── worker/           # BullMQ worker (Phase 3; optional stub in Phase 0)
├── packages/
│   ├── core/             # Tenant context, domain helpers
│   ├── config/           # CompanyConfig schema, file loading
│   ├── database/         # Drizzle schema, migrations, dbScoped
│   ├── platform-adapters/  # Plugin interfaces (Phase 1-heavy)
│   ├── agent-runtime/    # LangChain/LangGraph (Phase 2-heavy)
│   ├── report-generator/ # Reports (Phase 3)
│   ├── ui/               # Shared Mantine-based components
│   ├── i18n/             # Shared messages/helpers (optional vs app-local)
│   └── types/            # Shared TypeScript types
```

See [implementation-scope.md](./implementation-scope.md) for what must exist in Phase 0 versus later phases.

### Multi-Tenancy Pattern

All database operations in Phase 0 must use the tenant-scoped pattern:

```typescript
// Set tenant context (middleware)
tenantContext.run({ tenantId, config, requestId }, async () => {
  // All operations here have tenant context
  const data = await dbScoped((db) => db.query.companies.findFirst());
});
```

---

## Troubleshooting

### Build Failures

**Symptom**: TypeScript errors during build

**Solutions**:

1. Clear all caches: `rm -rf node_modules .turbo && pnpm install`
2. Check for circular dependencies between packages
3. Verify `tsconfig.json` paths are correctly configured
4. Ensure all exports are properly typed in `package.json`

**Common Error**: "Cannot find module '@agenticverdict/xxx'"

- Run `turbo run build` to build dependencies first
- Check that the package exists in `packages/` directory
- Verify workspace configuration in `pnpm-workspace.yaml`

### Dependency Issues

**Symptom**: Installation fails with peer dependency errors

**Solutions**:

1. Update pnpm: `npm install -g pnpm@latest`
2. Clear pnpm store: `pnpm store prune`
3. Delete `pnpm-lock.yaml` and reinstall: `rm pnpm-lock.yaml && pnpm install`
4. Check Node.js version: `node --version` (must be 20 LTS)

**Common Error**: "ENOSPC: no space left on device"

- Free up disk space or change temp directory: `export TMPDIR=/tmp`

### Database Connection Problems

**Symptom**: "Connection refused" or timeout errors

**Solutions**:

1. Verify PostgreSQL is running: `pg_isready` or `brew services list`
2. Check connection string in `.env.local`
3. Ensure database exists: `psql -U postgres -c "CREATE DATABASE agenticverdict;"`
4. Test connection: `psql postgresql://user:pass@localhost:5432/agenticverdict`

**Common Error**: "relation does not exist"

- Run migrations: `pnpm --filter=@agenticverdict/database db:push`
- Verify Drizzle schema files exist in `packages/database/src/schema`

### TypeScript Errors

**Symptom**: Type errors in IDE or during build

**Solutions**:

1. Restart TypeScript server in VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
2. Check `tsconfig.json` extends correct base configuration
3. Verify all workspace packages have `compilerOptions.paths` configured
4. Look for `any` types (forbidden by project standards)

**Common Error**: "Property 'xxx' does not exist on type 'yyy'"

- Ensure proper type imports from packages
- Check that types are exported in package `index.ts`
- Verify Zod schemas are properly typed

### Dev Server Issues

**Symptom**: Port already in use errors

**Solutions**:

1. Find process using port: `lsof -i :3000`
2. Kill process: `kill -9 <PID>`
3. Or change port in `.env.local`: `PORT=3001`

**Common Error**: "Module not found: Can't resolve '@agenticverdict/xxx'"

- Ensure the package is built: `turbo run build --filter=@agenticverdict/xxx`
- Check Next.js `experimental.appDir` configuration
- Verify Turbopack is properly configured for Next.js 15

---

## Phase Exit Criteria

Before transitioning to Phase 1, verify:

1. **All tasks completed** with status documented in [tasks.md](./tasks.md)
2. **All acceptance criteria met** as defined in [acceptance-criteria.md](./acceptance-criteria.md)
3. **Test coverage** meets targets:
   - Core packages: 70%+ coverage
   - Business logic: 85%+ coverage
4. **No critical bugs** or blocking issues
5. **Documentation updated** with all Phase 0 decisions
6. **Code review approved** for all merged PRs
7. **Zero TypeScript errors** across all packages
8. **Multi-tenancy verified** with tenant isolation tests passing

---

## Contact & Support

### Phase Lead

To be assigned

### Escalation Path

1. Check [troubleshooting section](#troubleshooting) above
2. Review [CLAUDE.md](/CLAUDE.md) for architectural patterns
3. Consult [Technology Research](/docs/04-technology-research/) for tool-specific issues
4. Open issue in project tracker with `phase-0` label

### Related Resources

- [Project Charter](/docs/05-project-management/project-charter.md)
- [Development Roadmap](/docs/05-project-management/roadmap-development.md)
- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)

---

**Next Phase**: [Phase 1: Platform Integration](../phase-01-platform-integration/README.md)

_This document is maintained as part of the Phase 0 deliverables. Last updated: 2026-04-03_
