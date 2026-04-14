# Design tokens (`tokens/`)

Canonical token definitions live in the parent design-system root:

- **`design-tokens.pen`** — Pencil source for colors, spacing, typography, and related variables.
- **`design-tokens-implementation.md`** — Three-tier token model (`--av-*`, `--brand-*`, component-scoped) and usage notes.

Implementations in application code should reference these tiers and tenant theme overrides, not ad hoc literals.
