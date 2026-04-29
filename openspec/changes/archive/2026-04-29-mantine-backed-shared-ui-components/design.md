## Context

`@agenticverdict/ui` is the shared UI contract consumed by product surfaces, but component internals are not consistently Mantine-backed today. This increases implementation drift, makes theme evolution more expensive, and causes uneven accessibility and localization behavior. The repository already standardizes on Mantine v9 patterns for frontend governance, so this change formalizes that foundation across all exported shared components.

Stakeholders include frontend platform maintainers (component ownership), feature teams consuming `@agenticverdict/ui`, and design system governance reviewers.

## Goals / Non-Goals

**Goals:**

- Ensure every exported `@agenticverdict/ui` component is implemented with Mantine-backed primitives.
- Standardize component API composition patterns and state handling across atoms/molecules.
- Preserve or improve accessibility (WCAG 2.1 AA) and RTL/LTR behavior for all shared components.
- Provide a migration path for consumers where APIs must evolve.

**Non-Goals:**

- Redesigning product-specific page layouts in `apps/frontend`.
- Introducing tenant-specific UI behavior in shared component logic.
- Replacing Mantine with a different UI framework.

## Decisions

1. **Mantine-backed implementation as a hard requirement for all exported components**
   - Decision: Every component in `packages/ui` must compose Mantine primitives directly or through approved internal wrappers.
   - Rationale: Enables consistent styling, interaction semantics, and theme control through one ecosystem.
   - Alternative considered: Allow mixed internal implementations. Rejected due to long-term maintenance and design drift risk.

2. **Two-phase migration model (compatibility-first, cleanup-second)**
   - Decision: Introduce compatibility adapters/deprecations where needed, then remove deprecated APIs in a later, explicitly scoped follow-up.
   - Rationale: Reduces breaking-change risk and lets consuming teams upgrade incrementally.
   - Alternative considered: Single hard cutover. Rejected due to higher regression risk and larger rollout coordination burden.

3. **Shared quality gates for accessibility, directionality, and interaction states**
   - Decision: Add/expand tests to cover keyboard access, focus visibility, semantic labeling, and RTL/LTR layout behavior for component variants.
   - Rationale: Prevents regressions while refactoring internals and ensures governance compliance.
   - Alternative considered: Manual QA only. Rejected because coverage would be inconsistent and difficult to enforce.

4. **Token-driven styling over one-off component styles**
   - Decision: Route visual styling through design tokens and Mantine theme contracts, avoiding isolated one-off styles.
   - Rationale: Simplifies future redesigns and keeps shared component behavior predictable.
   - Alternative considered: Allow local style exceptions by default. Rejected to preserve consistency.

## Risks / Trade-offs

- **[Risk]** Hidden consumer coupling to undocumented props or DOM structure.  
  **Mitigation:** Audit usage, provide compatibility wrappers, and communicate deprecation paths.
- **[Risk]** Broad refactor scope across many components can create rollout instability.  
  **Mitigation:** Implement in prioritized batches (high-usage components first) with per-batch verification.
- **[Risk]** Increased short-term maintenance overhead while both old and compatibility APIs coexist.  
  **Mitigation:** Time-box compatibility period and track removals in follow-up cleanup change(s).
- **[Trade-off]** Strict Mantine backing may reduce flexibility for ad hoc custom implementations.  
  **Mitigation:** Support extension via documented composition APIs instead of bespoke internals.

## Migration Plan

1. Inventory all exports from `packages/ui` and classify by complexity and consumer usage.
2. Migrate components in batches to Mantine-backed internals, starting with high-traffic shared primitives.
3. Add compatibility shims/deprecations for changed props where strict parity is not possible.
4. Update stories/examples and consumer usage in `apps/frontend` where required.
5. Validate with typecheck, tests, and accessibility/RTL checks per batch.
6. Publish migration notes and track deprecated API removal in a follow-up cleanup window.

Rollback strategy: preserve compatibility layer and retain prior component entry points until migration validation passes; if regressions occur, revert the affected batch while keeping stable migrated batches.

## Open Questions

- Which component subsets should be prioritized in the first migration batch based on usage telemetry?
- What deprecation window is acceptable for consumer teams before removing compatibility props?
- Are there any existing shared components that should be split before migration to reduce API complexity?
