# Task: Simplify UI package structure in foundation specs

## Objective

Update the documentation under `specs/01-ui/00-foundation/` so it defines a **clear, minimal directory layout** for the `@agenticverdict/ui` package (or equivalent UI package), replacing an overly complex structure with one that is easy to navigate and maintain.

## Scope

- **In scope:** Specs, plans, data models, contracts, checklists, and any other foundation artifacts that describe **where code lives** in the UI package (folder taxonomy, naming, and rationale).
- **Out of scope unless explicitly required:** Implementing the refactor in application code (unless a follow-on task is agreed).

## Required layout elements

The simplified structure must explicitly account for:

| Area                            | Purpose                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Atoms**                       | Smallest reusable UI primitives.                                                                                                                                               |
| **Molecules**                   | Composed patterns built from atoms (and other molecules where appropriate).                                                                                                    |
| **Design tokens**               | Centralized token definitions (colors, spacing, typography, etc.) aligned with the design system.                                                                              |
| **Other necessary directories** | Only additional top-level buckets that are justified by the product (e.g. hooks, providers, utilities)—document **why** each exists and avoid redundant or nested duplication. |

## Quality bar

- **Simplicity:** Prefer a shallow, predictable tree over deep or parallel hierarchies that duplicate concerns.
- **Consistency:** Terminology and paths in specs should match how engineers and design tooling refer to atoms, molecules, and tokens.
- **Traceability:** Where the old structure is replaced, note the mapping (old path → new path) or a short migration note so implementers can adopt changes safely.

## Deliverables

1. Revised foundation specs that describe the **target** UI package directory structure.
2. Updated cross-references so related docs (e.g. component API, tasks, quickstart) stay aligned with the new layout.
3. A brief rationale for non-obvious directory choices (one short subsection or bullet list is sufficient).

## Success criteria

- A reader can infer **exactly** where to add a new atom, molecule, or token without guessing among competing folders.
- The documented structure is **no more complex** than needed for the current design system and app architecture.
