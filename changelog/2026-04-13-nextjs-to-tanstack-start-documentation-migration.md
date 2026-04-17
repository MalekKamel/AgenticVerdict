# Next.js to TanStack Start Documentation Migration

**Date:** 2026-04-13
**Status:** Phase 1-4 Complete, Phase 5 Pending
**Author:** Claude Code (AgenticVerdict Development Team)

---

## Executive Summary

This change documents the systematic migration of AgenticVerdict documentation from Next.js 15 to TanStack Start as the primary frontend framework. This migration reflects an architectural decision to adopt TanStack Start for enhanced type safety, better developer experience, and improved architectural alignment.

**Migration Status:**

- ✅ **Phase 1:** Analysis & Audit — Complete
- ✅ **Phase 2:** Primary Documents — Complete (2/2 documents)
- ✅ **Phase 3:** Secondary Documents — Complete (7/7 documents)
- ✅ **Phase 4:** Quality Assurance — Complete (with findings documented)
- 📋 **Phase 5:** Remaining Updates — Pending (16 documents identified)

---

## Documents Updated

### Primary Documents (Critical Path) — ✅ Complete

| Document                               | Changes                                                                                            | Status      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- |
| `/CLAUDE.md`                           | Updated technology stack, repository structure, Docker configuration                               | ✅ Complete |
| `/docs/architecture/ui/00-overview.md` | Updated framework reference, technology stack table, performance strategy, implementation timeline | ✅ Complete |

### Secondary Documents — ✅ Complete

| Document                                                                    | Changes                                                                                                                       | Status      |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `/docs/architecture/ui/01-research-findings/technology-evaluation.md`       | Replaced 24 Next.js references with TanStack Start, updated comparison tables, revised tooling references (Vite vs Turbopack) | ✅ Complete |
| `/docs/architecture/ui/02-design-system-specification/patterns.md`          | Updated routing code examples (Link, useRouter, useLocation patterns)                                                         | ✅ Complete |
| `/docs/architecture/ui/02-design-system-specification/design-tokens.md`     | Fixed `createFileRoute` usage, updated root layout pattern, removed incorrect imports                                         | ✅ Complete |
| `/docs/architecture/ui/02-design-system-specification/theming.md`           | Added TanStack Start framework note, replaced "use client" directives with explanatory comments                               | ✅ Complete |
| `/docs/architecture/ui/02-design-system-specification/component-library.md` | Updated framework references in introductory text                                                                             | ✅ Complete |
| `/docs/architecture/business/technical-architecture.md`                     | Updated architecture diagrams, technology stack tables, monorepo structure                                                    | ✅ Complete |
| `/docs/architecture/business/implementation-guide.md`                       | Updated application structure, routing references                                                                             | ✅ Complete |

---

## Key Terminology Changes

| Next.js 15 Term    | TanStack Start Equivalent                  |
| ------------------ | ------------------------------------------ |
| `next`             | `@tanstack/start`                          |
| `next/navigation`  | `@tanstack/react-router`                   |
| `next/link`        | `Link` from `@tanstack/react-router`       |
| `next/image`       | Standard `<img>` with optimization         |
| `next-intl`        | TanStack Router i18n (to be implemented)   |
| `usePathname()`    | `useLocation().pathname`                   |
| `router.push(url)` | `router.navigate({ to: url })`             |
| `app/` directory   | `routes/` directory                        |
| `page.tsx`         | Route configuration with `createFileRoute` |
| `Turbopack`        | Vite                                       |
| `next.config.ts`   | `vite.config.ts`                           |

---

## Technical Corrections Made

### 1. Fixed `createFileRoute` Import in Non-Route Components

**File:** `design-tokens.md`
**Issue:** Logo component incorrectly imported `createFileRoute`
**Fix:** Removed the import — `createFileRoute` is only for route files

### 2. Fixed Root Layout Pattern

**File:** `design-tokens.md`
**Issue:** `__root.tsx` used incorrect export pattern
**Fix:** Updated to use proper TanStack Router route configuration with `Outlet` component

---

## Remaining Work (Phase 5)

### Critical Priority (8 documents)

1. `/docs/architecture/ui/03-implementation-guide/migration-guide.md`
2. `/docs/architecture/ui/03-implementation-guide/getting-started.md`
3. `/docs/architecture/ui/03-implementation-guide/testing-strategy.md`
4. `/docs/architecture/ui/UI_IMPLEMENTATION_DETAILS.md`
5. `/docs/architecture/ui/04-decision-record.md`
6. `/docs/architecture/ui/spec-kit-specification-prompt.md`
7. `/docs/architecture/ui/UI_SYSTEM_SPECIFICATION_PROMPT.md`
8. `/docs/03-technology-research/frontend/ui-libraries.md`

### Medium Priority (8 documents)

9. `/docs/architecture/ui/01-research-findings/best-practices.md`
10. `/docs/architecture/ui/01-research-findings/design-system-landscape.md`
11. `/docs/architecture/ui/01-research-findings/performance-optimization.md`
12. `/docs/00-overview/development-status-summary.md`
13. `/docs/04-project-management/requirements.md`
14. `/docs/docker/container-images.md`
15. `/docs/README.md`
16. `next-intl` import replacements (theming.md, getting-started.md)

---

## Known Issues

### next-intl References Still Present

Several documents still reference `next-intl` for internationalization. These need to be replaced with TanStack Router's built-in i18n patterns or a framework-agnostic solution.

**Affected Files:**

- `/docs/architecture/ui/02-design-system-specification/theming.md` (lines 612, 1052, 1512)
- `/docs/architecture/ui/03-implementation-guide/getting-started.md` (line 254)

### Build Tool References

Some documents still reference Turbopack instead of Vite (TanStack Start's build tool).

### Configuration File References

Several documents reference `next.config.ts` which should be removed or replaced with `vite.config.ts` references.

---

## Migration Methodology

### Phase 1: Analysis & Audit

- Conducted comprehensive audit of 143 markdown files
- Identified 45 documents with Next.js references
- Categorized by severity: 4 critical, 12 important, 29 optional

### Phase 2: Primary Documents

- Updated `/CLAUDE.md` (3 changes)
- Updated `/docs/architecture/ui/00-overview.md` (5 changes)

### Phase 3: Secondary Documents

- Updated 7 documents using parallel sub-agents
- Addressed routing patterns, code examples, architecture diagrams

### Phase 4: Quality Assurance

- Consistency check: Found remaining Next.js references in Phase 5 documents
- Completeness check: Verified 9 core documents, identified 16 remaining gaps
- Accuracy check: Found and fixed 2 critical technical inaccuracies

---

## Success Criteria

### Completed

- ✅ All critical and important primary documents updated
- ✅ Code examples use TanStack Router patterns
- ✅ Technical inaccuracies corrected
- ✅ Cross-references remain valid
- ✅ TanStack Start terminology used consistently in updated documents

### Pending

- ⏳ Remaining implementation guides updated
- ⏳ next-intl imports replaced with TanStack Router i18n
- ⏳ Decision record reflects TanStack Start decision

---

## References

- **Migration Specification:** `/prompts/migrate-to-tanstack-start.md`
- **TanStack Start Documentation:** https://tanstack.com/start/latest
- **TanStack Router Documentation:** https://tanstack.com/router/latest
- **Reference Implementation:** https://github.com/amruthpillai/reactive-resume

---

## Notes

- The existing Next.js codebase (`apps/frontend/`) was noted as a **demonstration prototype only** and is disposable
- No production features were implemented in Next.js — this is a greenfield implementation
- The UI architecture and component patterns documented remain valid
- All business logic, multi-tenancy patterns, and backend architecture are unaffected

---

**Last Updated:** 2026-04-13
**Next Review:** After Phase 5 completion
