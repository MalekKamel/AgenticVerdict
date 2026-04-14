# Migration Specification: Next.js to TanStack Stack

**Document Version:** 1.0  
**Date:** 2026-04-13  
**Status:** Active  
**Prepared For:** AgenticVerdict Development Team  
**Priority:** High

---

## Executive Summary

This specification outlines the comprehensive migration of the AgenticVerdict web application from Next.js 15 to **TanStack Start**, a modern, React-focused full-stack framework that provides superior developer experience, type safety, and architectural alignment with our project's goals.

**Rationale:** After careful evaluation of our project requirements, TanStack Start emerges as a more suitable foundation for AgenticVerdict due to:

1. **Enhanced Type Safety** — End-to-end TypeScript coverage with superior inference
2. **Architectural Alignment** — Better separation of concerns with explicit routing and data fetching patterns
3. **Developer Experience** — Superior debugging, error handling, and development tooling
4. **Performance Characteristics** — More predictable bundle sizes and loading strategies
5. **Future Scalability** — Better positioned for desktop application targets via Electron/Tauri

---

## 1. Background & Context

### 1.1 Current State Assessment

The current web implementation (`apps/web/`) is a **demonstration prototype only** and does not reflect production architecture. It was built with Next.js 15 to expedite initial development but requires complete reconstruction using appropriate tooling.

**Key Points:**

- The existing Next.js codebase should be considered disposable
- No production features are implemented; only mock/demo functionality exists
- No migration of business logic is required—this is a greenfield implementation
- The architecture, components, and patterns documented in `/docs/architecture/ui/` remain valid

### 1.2 Migration Scope

This specification encompasses updates to **all documentation** to accurately reflect TanStack Start as the primary framework. The actual implementation work will proceed in subsequent phases following documentation updates.

**In Scope:**

- All architectural documentation references to Next.js
- Technology stack specifications
- Development workflow documentation
- Deployment and build configurations
- Component architecture patterns (where framework-specific)
- Routing and data fetching strategies
- Testing approaches (where framework-specific)

**Out of Scope (for this specification):**

- Actual code implementation (addressed in future specifications)
- Database schema changes (none required)
- Backend API changes (none required)
- Third-party integrations (mostly unaffected)

---

## 2. Technical Rationale

### 2.1 Framework Comparison

| Criterion                | Next.js 15                       | TanStack Start                 | Recommendation |
| ------------------------ | -------------------------------- | ------------------------------ | -------------- |
| **Type Safety**          | Good                             | Excellent                      | TanStack Start |
| **Routing**              | File-based (convention)          | File-based with explicit types | TanStack Start |
| **Data Fetching**        | Server Components (experimental) | Explicit loaders/actions       | TanStack Start |
| **Bundle Optimization**  | Automatic (opaque)               | Transparent and configurable   | TanStack Start |
| **Desktop Target**       | Possible (via Electron)          | Designed for multi-platform    | TanStack Start |
| **Ecosystem Maturity**   | Very mature                      | Growing rapidly                | Neutral        |
| **Learning Curve**       | Moderate                         | Moderate for React devs        | Neutral        |
| **Debugging Experience** | Good                             | Superior (explicit patterns)   | TanStack Start |

### 2.2 Strategic Alignment

TanStack Start better aligns with AgenticVerdict's architectural principles:

1. **Explicit Over Implicit** — Clear, visible data flow and routing patterns
2. **Type Safety First** — End-to-end TypeScript with no escape hatches
3. **Multi-Platform Readiness** — Architecture supports future desktop targets
4. **Developer Productivity** — Better tooling and error messages

---

## 3. Documentation Updates Required

### 3.1 Primary Documents (Critical Path)

The following documents require immediate updates:

#### A. `/docs/architecture/ui/00-overview.md`

- Update technology stack table (line 24)
- Replace Next.js-specific references with TanStack Start equivalents
- Update implementation timeline phases
- Revise "Performance Strategy" section for TanStack patterns
- Update all code examples showing Next.js patterns

#### B. `/CLAUDE.md`

- Update "Technology Stack" section to reflect TanStack Start
- Replace Next.js build/dev commands with TanStack equivalents
- Update Docker build instructions for TanStack
- Revise development workflow commands

### 3.2 Secondary Documents (Important)

The following documents should be reviewed and updated where Next.js is referenced:

#### A. `/docs/architecture/ui/01-research-findings/technology-evaluation.md`

- Add comprehensive TanStack Start analysis
- Update comparison matrices
- Revise recommendation sections

#### B. `/docs/architecture/ui/02-design-system-specification/*.md`

- Update any framework-specific patterns
- Ensure component examples are framework-agnostic where possible
- Update routing/navigation patterns for TanStack Router

#### C. `/docs/architecture/business/technical-architecture.md`

- Update frontend architecture sections
- Revise system diagrams to reflect TanStack Start

#### D. `/docs/architecture/business/implementation-guide.md`

- Update development setup instructions
- Replace Next.js commands with TanStack equivalents
- Update project structure documentation

### 3.3 Supplementary Documents (Review for References)

The following documents may contain Next.js references that require updating:

- `/docs/02-planning-and-methodology/testing-strategy.md`
- `/docs/04-technology-research/*.md` (various research documents)
- `/docs/06-reference/*.md` (templates and resources)
- Any specification documents under `/specs/`

---

## 4. Detailed Update Guidelines

### 4.1 Consistent Terminology

When updating documentation, use the following terminology:

| Next.js Term      | TanStack Start Equivalent                      |
| ----------------- | ---------------------------------------------- |
| App Router        | File-based routing (TanStack Router)           |
| Server Components | Loaders and Actions                            |
| Server Actions    | Route actions                                  |
| `next/navigation` | `@tanstack/react-router`                       |
| `next/image`      | Standard `<img>` with optimization strategies  |
| `next/link`       | `<Link>` from `@tanstack/react-router`         |
| `next-intl`       | TanStack Start i18n patterns (to be evaluated) |
| Middleware        | Route middleware functions                     |

### 4.2 Code Example Updates

When updating code examples:

**BEFORE (Next.js):**

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchDashboardData();
  return <DashboardView data={data} />;
}
```

**AFTER (TanStack Start):**

```typescript
// routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  loader: async () => fetchDashboardData(),
  component: DashboardView,
});
```

### 4.3 Performance Strategy Updates

Update performance sections to reflect TanStack Start patterns:

- Replace Next.js Image optimization with appropriate strategies
- Update bundle splitting documentation
- Revise code splitting examples
- Update lazy loading patterns

---

## 5. Reference Implementation

### 5.1 Primary Reference: Reactive Resume

**Repository:** https://github.com/amruthpillai/reactive-resume

This production application demonstrates:

- TanStack Start in a real-world multi-tenant SaaS context
- Authentication flows
- Internationalization patterns
- Deployment configurations
- Build and development workflows

**Key Patterns to Reference:**

- Project structure and organization
- Route definitions and loaders
- Error handling patterns
- Environment configuration
- Docker setup

### 5.2 Additional References

- **TanStack Start Documentation:** https://tanstack.com/start/latest
- **TanStack Router Documentation:** https://tanstack.com/router/latest
- **TanStack Query Documentation:** https://tanstack.com/query/latest

---

## 6. Execution Methodology

### 6.1 Analysis Phase (Required First Step)

Before making any documentation updates:

1. **Comprehensive Audit**
   - Search all documentation for "Next.js" references
   - Search for `next-` package imports
   - Identify all framework-specific code examples
   - Catalog all routing/data fetching patterns

2. **Impact Assessment**
   - Categorize changes by severity (critical/important/optional)
   - Identify dependent documents that must be updated together
   - Create a dependency map of documentation updates

3. **Update Strategy**
   - Determine optimal update order to minimize inconsistencies
   - Identify any sections that require rewriting (not just find/replace)
   - Plan for consistency checks across all documents

### 6.2 Documentation Update Process

For each document requiring updates:

1. **Read and understand** the full context of the document
2. **Identify all sections** referencing Next.js or framework-specific patterns
3. **Plan the updates** required to maintain consistency
4. **Execute updates** maintaining the original document structure and intent
5. **Verify** that all references are updated consistently
6. **Cross-reference** related documents to ensure alignment

### 6.3 Quality Assurance

After completing documentation updates:

1. **Consistency Check**
   - Verify all Next.js references are replaced or explained
   - Ensure TanStack Start terminology is used consistently
   - Confirm code examples follow TanStack patterns

2. **Completeness Check**
   - Validate all referenced documents are updated
   - Ensure no orphaned references to old patterns remain
   - Verify cross-references between documents remain accurate

3. **Accuracy Check**
   - Confirm technical accuracy of TanStack Start information
   - Verify code examples are syntactically correct
   - Ensure alignment with TanStack Start best practices

---

## 7. Deliverables

### 7.1 Required Outputs

Upon completion of this specification, the following must be delivered:

1. **Updated Primary Documents**
   - `/docs/architecture/ui/00-overview.md` (complete TanStack Start migration)
   - `/CLAUDE.md` (framework references updated)

2. **Updated Secondary Documents**
   - All documents in `/docs/architecture/ui/01-research-findings/`
   - `/docs/architecture/ui/02-design-system-specification/*.md`
   - `/docs/architecture/business/technical-architecture.md`
   - `/docs/architecture/business/implementation-guide.md`

3. **Analysis Summary**
   - List of all documents reviewed
   - Summary of changes made to each document
   - Any issues or inconsistencies discovered during analysis

4. **Consistency Verification**
   - Confirmation that all framework references are updated
   - No remaining inconsistencies between documents
   - All cross-references remain valid

### 7.2 Documentation of Changes

Maintain a changelog entry documenting:

- Date of documentation updates
- Summary of changes made
- Documents updated
- Any decisions made during the update process

---

## 8. Success Criteria

The documentation migration will be considered successful when:

1. **Completeness**
   - ✓ All critical and important documents are updated
   - ✓ No unexplained Next.js references remain in core documentation
   - ✓ All technology stack tables reflect TanStack Start

2. **Consistency**
   - ✓ TanStack Start terminology is used uniformly across documents
   - ✓ Code examples follow TanStack patterns
   - ✓ Cross-references between documents remain accurate

3. **Accuracy**
   - ✓ All technical information about TanStack Start is correct
   - ✓ Code examples are syntactically valid
   - ✓ Best practices align with TanStack Start documentation

4. **Clarity**
   - ✓ Documentation maintains its original structure and readability
   - ✓ New framework patterns are explained clearly
   - ✓ Migration rationale is well-articulated

---

## 9. Timeline & Dependencies

### 9.1 Recommended Sequence

1. **Week 1:** Analysis and audit of all documentation
2. **Week 1-2:** Update primary documents (00-overview.md, CLAUDE.md)
3. **Week 2-3:** Update secondary documents
4. **Week 3:** Consistency verification and final review

### 9.2 Prerequisites

- Familiarity with TanStack Start architecture and patterns
- Access to reference implementation (reactive-resume)
- Understanding of AgenticVerdict business architecture
- Git branch for documentation updates (feature branch)

### 9.3 Dependencies

This documentation update must precede:

- Any actual implementation work with TanStack Start
- Updates to build and deployment configurations
- Developer onboarding documentation updates

---

## 10. Open Questions & Considerations

### 10.1 Technical Decisions Required

1. **Internationalization Library**
   - Should we retain `next-intl` or migrate to a framework-agnostic solution?
   - Recommendation: Evaluate `@tanstack/react-i18n` or similar

2. **Image Optimization**
   - What strategy will replace Next.js Image component?
   - Consider: Custom optimization service, CDN solutions, or framework-agnostic libraries

3. **State Management**
   - Confirm TanStack Query is the preferred choice for server state
   - Validate integration patterns with TanStack Start

### 10.2 Documentation Structure Considerations

1. Should we create a dedicated "TanStack Start Migration" document?
2. Do we need a quick-start guide specific to TanStack Start?
3. Should common patterns be documented in a separate cookbook?

---

## 11. Appendix: Quick Reference Mapping

### A.1 Package Replacements

| Next.js Package   | TanStack Start Replacement                         |
| ----------------- | -------------------------------------------------- |
| `next`            | `@tanstack/start`                                  |
| `next/navigation` | `@tanstack/react-router`                           |
| `next/image`      | Custom or third-party solution                     |
| `next/link`       | `@tanstack/react-router` Link                      |
| `next/font`       | `@tanstack/react-router` loadScript or CSS imports |
| `next-intl`       | TBD (evaluate options)                             |

### A.2 Command Replacements

| Next.js Command                                | TanStack Start Equivalent                      |
| ---------------------------------------------- | ---------------------------------------------- |
| `pnpm dev`                                     | `pnpm dev`                                     |
| `pnpm build`                                   | `pnpm build`                                   |
| `pnpm start`                                   | `pnpm start`                                   |
| `turbo run build --filter=@agenticverdict/web` | `turbo run build --filter=@agenticverdict/web` |

### A.3 File Structure Mapping

| Next.js               | TanStack Start                   |
| --------------------- | -------------------------------- |
| `app/` directory      | `app/` directory                 |
| `app/*/page.tsx`      | `routes/*.tsx`                   |
| `app/*/layout.tsx`    | Routes with `component` wrapping |
| `app/*/loading.tsx`   | Route pending components         |
| `app/*/error.tsx`     | Route error components           |
| `app/*/not-found.tsx` | Route not-found components       |

---

## 12. Approval & Sign-Off

**Prepared By:** [To be completed]  
**Date:** 2026-04-13  
**Status:** Pending Review

**Required Approvals:**

- [ ] Technical Architect
- [ ] Engineering Lead
- [ ] Product Owner (for functional impact verification)

---

**Document Control:**

| Version | Date       | Changes               | Author   |
| ------- | ---------- | --------------------- | -------- |
| 1.0     | 2026-04-13 | Initial specification | [Author] |

---

_This specification is a living document and will be updated as new information becomes available or as requirements evolve._
