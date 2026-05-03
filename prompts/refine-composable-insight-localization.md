# Prompt: Refine Composable Insight Localization for Business Architecture Alignment

## Context

The implementation plan at `/docs/implementation-plans/composable-insight-localization.md` proposes a composable localization system for dashboard insights. However, the current plan contains hardcoded business metric types (e.g., `roi`, `conversion`, `performance`) that violate the platform's core architectural principle: **business-agnostic flexibility**.

Per `/docs/architecture/business/business-architecture.md`, AgenticVerdict must support:

- **Multi-domain intelligence** (Marketing, Finance, Operations, SEO, Social, Local)
- **Configurable metric selection** per connector
- **Template-based initialization** with full customization
- **No hardcoding of business types** at the API or platform layer

## Problem Statement

The proposed `InsightDTO` schema (lines 88-108) and i18n structure (lines 213-249) embed specific metric classes and insight types, creating:

1. **Architectural coupling** between platform code and business domain specifics
2. **Maintenance overhead** requiring code changes for each new metric type
3. **Violation of separation of concerns** where platform dictates business taxonomy
4. **Inflexibility** for tenants who define custom metrics or business domains

## Task

Conduct a comprehensive analysis and refactor the implementation plan to achieve **complete business-agnostic localization** by:

### 1. Architecture Analysis

- Identify all hardcoded business types, metric classes, and domain assumptions
- Map proposed types against the business architecture's multi-domain framework
- Document where platform code makes assumptions about business semantics

### 2. Schema Redesign

- Replace hardcoded `InsightType` enum with tenant-configurable identifiers
- Design metadata structure that accommodates arbitrary business domains
- Ensure type safety without embedding business taxonomy in code

### 3. Localization Strategy

- Define composable patterns that work for any business domain
- Create fallback mechanisms for custom/unknown insight types
- Maintain translation quality without hardcoding key hierarchies

### 4. Alignment Verification

- Cross-reference every proposed change against business architecture requirements
- Ensure tenant isolation extends to business metric definitions
- Validate that agency partners can define client-specific insight types

## Deliverables

1. **Updated Implementation Plan** with:
   - Business-agnostic type definitions
   - Tenant-scoped insight type configuration
   - Generic composition patterns for localization keys
   - Migration strategy for existing hardcoded types

2. **Architecture Decision Record** documenting:
   - Trade-offs analyzed
   - Business requirements addressed
   - Future extensibility considerations

3. **Type Safety Strategy** that:
   - Avoids `any` types while remaining generic
   - Uses TypeScript generics or mapped types appropriately
   - Maintains compile-time validation without hardcoded values

## Success Criteria

The refined plan must demonstrate:

- ✅ **Zero hardcoded business types** in API or platform code
- ✅ **Full alignment** with business architecture multi-domain model
- ✅ **Tenant-scoped customization** of insight types and metrics
- ✅ **Type-safe implementation** without runtime string concatenation
- ✅ **Backward compatibility** with existing insight configurations
- ✅ **Clear migration path** from hardcoded to configurable types

## Constraints

- Maintain strict TypeScript mode (no `any` types)
- Preserve separation of concerns (API returns data, frontend handles presentation)
- Support all three locales (EN, AR, FR) with RTL compatibility
- Keep implementation estimate under 3 days

## References

- **Business Architecture:** `/docs/architecture/business/business-architecture.md`
- **Current Implementation Plan:** `/docs/implementation-plans/composable-insight-localization.md`
- **Multi-Tenant Guardrails:** `/docs/05-reference/multi-tenant-guardrails.md`
- **TypeScript Best Practices:** `/docs/05-reference/typescript-guidelines.md`

---

**Output Format:** Markdown document with clear sections for analysis, proposed changes, and implementation tasks.
