# UI Foundation Spec: Remove Accessibility and Testing Content

## Objective

Edit the markdown specifications under `specs/01-ui/00-foundation/` so they no longer define, prescribe, or elaborate **accessibility** (e.g. WCAG, axe-core, screen readers, keyboard audits) or **testing** (e.g. unit, E2E, visual regression, TDD checkpoints, coverage targets, CI test pipelines). The documents should remain coherent, internally consistent, and useful as foundation specs for UI work that excludes those tracks.

## Scope

- **In scope:** All specification files in `specs/01-ui/00-foundation/`, including nested paths (e.g. `checklists/`, `contracts/`).
- **Out of scope:** Code, tests, or documentation outside this directory unless a minimal cross-reference fix is required to avoid broken links after edits.

## Required actions

1. **Identify and remove** sections, subsections, bullet lists, tables, task checklists, acceptance criteria, and narrative paragraphs whose primary purpose is accessibility or testing.
2. **Trim integrated mentions** where a sentence or requirement bundles accessibility or testing with other topics—rewrite so the non–a11y/non-test intent remains, or delete the item if it exists only to support those tracks.
3. **Adjust structure** after removals: fix headings, numbering (requirements IDs, task IDs if present), and phase/user-story flow so the spec reads naturally without gaps or orphan references.
4. **Update references** inside this directory (and only as needed) so internal links, “see also” pointers, and dependency notes do not point to removed content.
5. **Preserve** unrelated foundation content: architecture decisions, component scope, tokens, Pencil/MCP workflow, contracts for props and behavior that are not solely about accessibility or testing—unless a property exists only for a11y or testing (e.g. `testId` solely for tests, `aria-*` documentation blocks); in those cases remove or narrow per the sections above.

## Constraints

- Do not relocate accessibility or testing guidance to other spec paths unless the user explicitly requests that.
- Avoid drive-by edits to files outside `specs/01-ui/00-foundation/`.
- Keep tone factual and specification-appropriate; do not add replacement process (e.g. “testing will be handled later”) unless it is already part of the repo’s spec style.

## Success criteria

- No remaining primary specification content in `specs/01-ui/00-foundation/` is dedicated to accessibility standards, a11y tooling, or automated/manual accessibility audits.
- No remaining primary specification content in that tree is dedicated to test strategy, test infrastructure, TDD mandates, coverage percentages, or CI test workflows.
- Documents remain logically ordered, with consistent terminology and no dangling references to deleted sections within the edited scope.
