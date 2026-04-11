# Legacy Code Removal Implementation Plan

**Date:** 2026-04-11
**Status:** Ready for Execution
**Type:** Comprehensive Cleanup Plan
**Scope:** Entire AgenticVerdict monorepo

---

## Executive Summary

This implementation plan provides a comprehensive, phased approach to removing all legacy, deprecated, and dead code from the AgenticVerdict codebase following the connector-centric architecture refactoring completed on 2026-04-10.

**Key Finding:** The TypeScript codebase is **100% clean** - all production code has been successfully migrated to the new connector-centric architecture. The cleanup work is primarily:

1. **Documentation updates** (100+ instances across 42+ files)
2. **Package removal** (4 unused packages)
3. **Deprecated export cleanup** (2 deprecated symbols)
4. **Minor naming improvements** (1 filename)

**Risk Level:** LOW - No production code changes required, only cleanup of documentation and unused packages.

**Estimated Timeline:** 1-2 weeks

---

## Analysis Summary

### Architecture Analysis Results

**Document Created:** `docs/architecture/NEW_ARCHITECTURE_SUMMARY.md`

The new connector-centric architecture has been documented with comprehensive reference material covering:

- Architectural principles and patterns
- Package structure and responsibilities
- Database schema changes (core schema, insights tables, connector registry)
- Type system and interface contracts
- Multi-tenancy patterns
- Connector abstraction layer design
- Insight configuration model
- AI configuration model

### Audit Results Summary

| Audit Category      | Files Scanned    | Findings      | Critical | High   | Medium    | Low     |
| ------------------- | ---------------- | ------------- | -------- | ------ | --------- | ------- |
| **Terminology**     | 612 TS/TSX files | 0 code issues | 0        | 3      | 100+ docs | 10+     |
| **Legacy Patterns** | 612 TS/TSX files | 47 findings   | 8        | 15     | 16        | 8       |
| **Dead Code**       | 15 packages      | 7 findings    | 0        | 4      | 2         | 1       |
| **Import/Export**   | 612 TS/TSX files | 0 code issues | 0        | 7 docs | 15 docs   | 20 docs |

**Critical Finding:** All production TypeScript code successfully migrated. Zero legacy terminology, deprecated symbols, or old imports found in application code.

---

## Classification of Legacy Code

### Category 1: Safe to Remove (HIGH CONFIDENCE)

**Priority:** Phase 1
**Risk:** LOW
**Impact:** Code reduction, clearer dependencies

| Item                            | Location                                | Reason                               | Dependencies         |
| ------------------------------- | --------------------------------------- | ------------------------------------ | -------------------- |
| `@agenticverdict/ui`            | `packages/ui/`                          | Stub only (exports version constant) | None                 |
| `@agenticverdict/queueing`      | `packages/queueing/`                    | Unused re-export wrapper             | None                 |
| `@agenticverdict/multi-tenancy` | `packages/multi-tenancy/`               | Unused re-export layer               | None                 |
| `@agenticverdict/docker`        | `packages/docker/`                      | Misclassified (Dockerfiles only)     | Move to `docker/`    |
| `LlmProviderEnv` export         | `packages/agent-runtime/src/llm-env.ts` | Explicitly `@deprecated`             | Remove from index.ts |
| `InMemoryAgentMemory`           | `packages/agent-runtime/src/memory.ts`  | Marked "legacy" in JSDoc             | Remove from exports  |

### Category 2: Documentation Updates (MEDIUM CONFIDENCE)

**Priority:** Phase 2
**Risk:** LOW
**Impact:** Developer clarity, onboarding

| Subcategory             | Files     | Issue                                 | Action                           |
| ----------------------- | --------- | ------------------------------------- | -------------------------------- |
| **Phase 01 Operations** | 7 files   | Code examples use deprecated patterns | Update all code examples         |
| **Migration Guides**    | 2 files   | Guides show deprecated patterns       | Update to current best practices |
| **Architecture Docs**   | 15 files  | References to old package names       | Update terminology               |
| **Reference Docs**      | 10 files  | Deprecated symbols in examples        | Update examples                  |
| **Planning Docs**       | 15+ files | Historical references                 | Add version notices or update    |

### Category 3: Naming Improvements (LOW CONFIDENCE)

**Priority:** Phase 3
**Risk:** LOW
**Impact:** Consistency

| Item         | Location           | Current                       | Proposed               |
| ------------ | ------------------ | ----------------------------- | ---------------------- |
| Factory file | `apps/worker/src/` | `platform-adapter-factory.ts` | `connector-factory.ts` |

### Category 4: Intentionally Retained (NO ACTION)

| Item                              | Reason                                               |
| --------------------------------- | ---------------------------------------------------- |
| `PlatformError` class hierarchy   | Platform-facing errors (rate limits, auth failures)  |
| `PlatformFetchToolDeps` interface | Agent-domain terminology vs technical implementation |
| `MarketingPipeline` terminology   | Business process flow (multi-stage workflow)         |
| `platform` variable names         | Semantically appropriate for business domain         |
| Test factory naming               | Test data generation for platform-specific payloads  |

---

## Phased Implementation Plan

### Phase 1: Package Removal (Days 1-2)

**Objective:** Remove 4 unused packages and 2 deprecated exports

**Steps:**

#### 1.1 Remove `@agenticverdict/ui` Package

```bash
# Remove package directory
rm -rf packages/ui/

# Remove from root package.json (if present)
# Update turbo.json (if referenced)
# Update any documentation references
```

**Files to modify:**

- `packages/ui/` (DELETE)
- `package.json` (remove dependency if present)
- `turbo.json` (remove task if present)
- `CLAUDE.md` (remove from package structure if listed)

#### 1.2 Remove `@agenticverdict/queueing` Package

```bash
# Remove package directory
rm -rf packages/queueing/

# Verify no imports exist (already confirmed by audit)
# Update documentation
```

**Files to modify:**

- `packages/queueing/` (DELETE)
- `CLAUDE.md` (remove from package structure if listed)
- Architecture docs (update package structure)

#### 1.3 Remove `@agenticverdict/multi-tenancy` Package

```bash
# Remove package directory
rm -rf packages/multi-tenancy/

# Verify no imports exist (already confirmed by audit)
# Update documentation
```

**Files to modify:**

- `packages/multi-tenancy/` (DELETE)
- `CLAUDE.md` (remove from package structure if listed)
- Architecture docs (update package structure)

#### 1.4 Relocate `@agenticverdict/docker`

```bash
# Move Dockerfiles to proper location
mv packages/docker/base docker/
# OR integrate into existing docker/ directory at repo root

# Remove empty package directory
rm -rf packages/docker/

# Update Docker Compose files to reference new location
# Update CI/CD workflows
```

**Files to modify:**

- `docker-compose*.yml` (update Dockerfile paths)
- `.github/workflows/*.yml` (update Dockerfile paths)
- `CLAUDE.md` (update package structure)

#### 1.5 Remove Deprecated Exports

**File:** `packages/agent-runtime/src/index.ts`

```typescript
// Remove these exports:
export type { LlmProviderEnv } from "./llm-env.js"; // @deprecated
export { InMemoryAgentMemory } from "./memory.js"; // legacy
```

**Files to modify:**

- `packages/agent-runtime/src/index.ts`
- Verify no imports exist (already confirmed by audit)

#### 1.6 Verification

```bash
# Reinstall dependencies
pnpm install

# Build all packages
turbo run build

# Type check
turbo run typecheck

# Run tests
turbo run test
```

**Success Criteria:**

- [ ] All packages build successfully
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] No import errors for removed packages
- [ ] Clean `pnpm-lock.yaml`

---

### Phase 2: Documentation Updates (Days 3-7)

**Objective:** Update all documentation to reflect current architecture

#### 2.1 Critical Documentation (Days 3-4)

**Priority 1 - Breaking Documentation**

| File                                                                                    | Lines            | Changes                                                                                                                           |
| --------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `docs/03-development-phases/phase-01-platform-integration/operations/API-REFERENCE.md`  | Multiple         | Replace all `@agenticverdict/platform-adapters` → `@agenticverdict/data-connectors`, `PlatformAdapter` → `ConnectorAdapter`, etc. |
| `docs/03-development-phases/phase-01-platform-integration/operations/USAGE-EXAMPLES.md` | 9, 13, 48-49, 67 | Update code examples to use current API                                                                                           |
| `docs/06-reference/migration-guide-compiler-driven-config.md`                           | 36, 56           | Update migration guide examples                                                                                                   |

**Search and replace pattern:**

```bash
# For each file, perform replacements:
@agenticverdict/platform-adapters → @agenticverdict/data-connectors
PlatformAdapter → ConnectorAdapter
PlatformType → ConnectorType
BasePlatformAdapter → BaseConnectorAdapter
NormalizedPlatformSnapshot → NormalizedConnectorSnapshot
PlatformCredentials → ConnectorCredentials
PlatformDataNormalizer → ConnectorDataNormalizer
createPlatformAdapter → createConnectorAdapter
MockPlatformAdapter → MockConnectorAdapter
platformAdapterTypes → connectorAdapterTypes
isMockEnabledForPlatform → isMockEnabledForConnector
```

#### 2.2 High-Priority Documentation (Day 5)

**Priority 2 - Confusing Documentation**

| File                                                                                | Changes                                        |
| ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| `docs/06-reference/mock-adapter-pipeline-remediation-plan.md`                       | Update imports at lines 571-572                |
| `docs/06-reference/agent-architecture-consolidation-analysis.md`                    | Update import at line 489                      |
| `docs/06-reference/mock-adapter-integration.md`                                     | Update all references to `MockPlatformAdapter` |
| `docs/04-technology-research/compiler-driven-adapter-config-examples.md`            | Update code examples                           |
| `docs/04-technology-research/compiler-driven-adapter-config-implementation-plan.md` | Update code examples                           |

#### 2.3 Architecture Documentation (Day 6)

**Priority 3 - Architecture Reference**

| Files                                                    | Changes              |
| -------------------------------------------------------- | -------------------- |
| `docs/architecture/connector-refactoring-*.md` (4 files) | Update code examples |
| `docs/architecture/connector-centric-*.md` (2 files)     | Update code examples |
| `docs/architecture/MASTER-REFACTORING-PLAN.md`           | Update code examples |

#### 2.4 Planning and Research Docs (Day 7)

**Priority 4 - Historical References**

Options for handling these files:

**Option A:** Update code examples to show current best practices
**Option B:** Add migration notices at top of files

Recommended: **Option A** for planning documents, **Option B** for historical changelogs.

| Files                                             | Changes                                              |
| ------------------------------------------------- | ---------------------------------------------------- |
| `docs/05-project-management/*.md` (3 files)       | Update code examples or add notices                  |
| `docs/02-planning-and-methodology/*.md` (2 files) | Update code examples or add notices                  |
| `changelog/2026-04-*.md` (10+ files)              | Add "historical reference" notices where appropriate |

#### 2.5 Documentation Verification

```bash
# Search for remaining legacy package references in docs
grep -r "platform-adapters" docs/ --include="*.md" | grep -v "historical"

# Search for deprecated symbol references in docs
grep -r "PlatformAdapter\|PlatformType" docs/ --include="*.md" | grep -v "historical"

# Verify critical docs have been updated
grep "@agenticverdict/data-connectors" docs/03-development-phases/phase-01-platform-integration/operations/*.md
```

**Success Criteria:**

- [ ] All Phase 01 operations docs use current API
- [ ] All migration guides show current best practices
- [ ] All architecture docs updated
- [ ] Zero code examples that won't compile
- [ ] Historical docs have version notices

---

### Phase 3: Naming Improvements (Day 8)

**Objective:** Improve naming consistency

#### 3.1 Rename Factory File

**File rename:**

```bash
mv apps/worker/src/platform-adapter-factory.ts apps/worker/src/connector-factory.ts
```

**Update import:**
**File:** `apps/worker/src/queues/report-queues.ts`

```typescript
// OLD:
import { createWorkerPlatformFetchToolDeps } from "../connector-factory.js";

// NEW:
import { createWorkerPlatformFetchToolDeps } from "../connector-factory.js";
```

**Verification:**

```bash
# Build worker app
pnpm --filter @agenticverdict/worker build

# Type check
pnpm --filter @agenticverdict/worker typecheck
```

**Success Criteria:**

- [ ] File renamed
- [ ] Import updated
- [ ] Worker builds successfully
- [ ] No broken imports

---

### Phase 4: Final Validation (Day 9)

**Objective:** Comprehensive validation of all changes

#### 4.1 Build Validation

```bash
# Clean build
turbo run clean

# Rebuild all packages
turbo run build

# Verify all packages build
turbo run build --filter=@agenticverdict/*
turbo run build --filter=@agenticverdict/web
turbo run build --filter=@agenticverdict/api
turbo run build --filter=@agenticverdict/worker
```

#### 4.2 Type Validation

```bash
# Type check all packages
turbo run typecheck

# Verify no TypeScript errors
```

#### 4.3 Test Validation

```bash
# Run all tests
turbo run test

# Verify coverage
turbo run test --coverage

# Check coverage meets targets:
# - Overall: 70%+
# - Business logic: 85%+
```

#### 4.4 Circular Dependency Check

```bash
# Check for circular dependencies
npx madge --circular packages/*/src
```

#### 4.5 Documentation Validation

```bash
# Verify no broken documentation links
# (Manual review of updated docs)

# Test code examples from documentation
# (Extract and compile examples from updated docs)
```

#### 4.6 Dependency Validation

```bash
# Check for unused dependencies
npx depcheck

# Verify pnpm-lock.yaml is clean
pnpm install --frozen-lockfile
```

**Success Criteria:**

- [ ] All packages build successfully
- [ ] Zero TypeScript errors
- [ ] All tests pass with adequate coverage
- [ ] Zero circular dependencies
- [ ] No unused dependencies
- [ ] Documentation examples compile
- [ ] Clean dependency graph

---

## Risk Assessment

### Overall Risk Level: LOW

| Risk                                      | Probability | Impact | Mitigation                       |
| ----------------------------------------- | ----------- | ------ | -------------------------------- |
| **Breaking changes from package removal** | LOW         | LOW    | No active consumers found        |
| **Documentation errors**                  | MEDIUM      | LOW    | Multiple review passes           |
| **Import errors after file rename**       | LOW         | LOW    | Single file, verified imports    |
| **Test failures**                         | LOW         | LOW    | Tests don't use removed packages |
| **Build failures**                        | LOW         | LOW    | Clean rebuild possible           |

### Mitigation Strategies

1. **Backup Before Changes**: Create git branch for all changes
2. **Incremental Changes**: One phase at a time with validation
3. **Rollback Plan**: Git revert available for each phase
4. **Testing**: Full test suite after each phase
5. **Code Review**: Peer review before merge

---

## Success Criteria

### Package Removal

- [ ] 4 unused packages removed
- [ ] 2 deprecated exports removed
- [ ] Dockerfiles relocated to proper location
- [ ] All remaining packages build successfully

### Documentation

- [ ] 42+ documentation files updated
- [ ] Zero code examples that won't compile
- [ ] All critical docs (Phase 01 operations) updated
- [ ] Historical docs have version notices

### Naming Consistency

- [ ] Factory file renamed
- [ ] All imports updated
- [ ] Consistent terminology across codebase

### Quality Gates

- [ ] All packages build successfully
- [ ] Zero TypeScript errors
- [ ] All tests pass (70%+ coverage)
- [ ] Zero circular dependencies
- [ ] Documentation examples verified

### Developer Experience

- [ ] No confusion from outdated documentation
- [ ] Clear package structure
- [ ] Consistent terminology
- [ ] Accurate code examples

---

## Rollback Procedures

### Phase 1 Rollback

If package removal causes issues:

```bash
# Restore from git
git checkout HEAD~1 -- packages/

# Reinstall dependencies
pnpm install

# Rebuild
turbo run build
```

### Phase 2 Rollback

If documentation updates cause issues:

```bash
# Revert documentation changes
git checkout HEAD~1 -- docs/

# Review specific files
git diff HEAD~1 docs/
```

### Phase 3 Rollback

If file rename causes issues:

```bash
# Restore file
git checkout HEAD~1 -- apps/worker/src/connector-factory.ts

# Rename back
mv apps/worker/src/connector-factory.ts apps/worker/src/platform-adapter-factory.ts
```

---

## Timeline Summary

| Phase       | Duration   | Focus             | Deliverables                 |
| ----------- | ---------- | ----------------- | ---------------------------- |
| **Phase 1** | Days 1-2   | Package Removal   | Remove 4 packages, 2 exports |
| **Phase 2** | Days 3-7   | Documentation     | Update 42+ files             |
| **Phase 3** | Day 8      | Naming            | Rename 1 file                |
| **Phase 4** | Day 9      | Validation        | Full validation              |
| **Buffer**  | Days 10-14 | Unforeseen issues | Handle edge cases            |

**Total Duration:** 1-2 weeks

---

## Next Steps

### Immediate Actions

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/legacy-code-cleanup-2026-04-11
   ```

2. **Review This Plan**
   - Team review and approval
   - Risk assessment validation
   - Timeline confirmation

3. **Begin Phase 1**
   - Start with `@agenticverdict/ui` removal
   - Validate after each package removal
   - Commit after each successful removal

### Execution Checklist

- [ ] Branch created from main
- [ ] Plan reviewed and approved
- [ ] Phase 1 started
- [ ] Phase 1 validation complete
- [ ] Phase 2 started
- [ ] Phase 2 validation complete
- [ ] Phase 3 started
- [ ] Phase 3 validation complete
- [ ] Phase 4 started
- [ ] Phase 4 validation complete
- [ ] Documentation updated
- [ ] Pull request created
- [ ] Code review approved
- [ ] Merged to main

---

## Appendix A: Audit Reports

For detailed findings, refer to these audit reports:

1. **New Architecture Summary**
   - `docs/architecture/NEW_ARCHITECTURE_SUMMARY.md`

2. **Legacy Terminology Audit**
   - `docs/06-reference/LEGACY_TERMINOLOGY_AUDIT.md`

3. **Legacy Code Patterns Audit**
   - `docs/06-reference/LEGACY_PATTERNS_AUDIT.md`

4. **Dead Code Inventory**
   - `docs/06-reference/DEAD_CODE_INVENTORY.md`

5. **Import/Export Audit**
   - `docs/06-reference/IMPORT_EXPORT_AUDIT.md`

---

## Appendix B: Search Commands for Verification

```bash
# Verify no legacy terminology in TypeScript code
grep -r "PlatformAdapter\|PlatformType\|NormalizedPlatformSnapshot" \
  --include="*.ts" --include="*.tsx" packages/ apps/ | grep -v node_modules

# Verify no old package names in TypeScript code
grep -r "@agenticverdict/platform-adapters" \
  --include="*.ts" --include="*.tsx" packages/ apps/ | grep -v node_modules

# Verify no unused package imports
grep -r "@agenticverdict/ui\|@agenticverdict/queueing\|@agenticverdict/multi-tenancy" \
  --include="*.ts" --include="*.tsx" packages/ apps/ | grep -v node_modules

# Check for remaining documentation issues
grep -r "platform-adapters\|createPlatformAdapter\|PlatformAdapter" \
  --include="*.md" docs/ | grep -v "historical"
```

**Expected Results:**

- TypeScript code searches: 0 results
- Unused package imports: 0 results
- Documentation searches: Only intentional historical references

---

**Document Status:** ✅ Ready for Execution
**Next Review:** After Phase 1 completion
**Maintained By:** Engineering Team
**Last Updated:** 2026-04-11
