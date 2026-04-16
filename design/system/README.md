# System library (`.lib.pen`)

Authoritative Pencil sources for **design tokens** and **reusable primitives** (atoms and molecules).

## Files

| File                    | Contents                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design-tokens.lib.pen` | Three-tier token variables (global / brand / component)                                                                                                                                           |
| `atoms.lib.pen`         | Atomic components only (Button, Input, Badge, …)                                                                                                                                                  |
| `molecules.lib.pen`     | Atom children **plus** molecular compositions, in one document so same-document `ref` links (e.g. Toast → `button-base`) resolve. Atoms are duplicated here from `atoms.lib.pen` for that reason. |

## Rules

- `type: "ref"` resolves to `reusable` masters **in the same `.lib.pen` file** — see [pen-architecture-implementation-plan.md](../docs/research/pen-architecture-implementation-plan.md) §1.2.

## Related

- [Target architecture](../docs/research/target-architecture.md)
- [Implementation plan](../docs/research/pen-architecture-implementation-plan.md)
- [Design system README](../README.md)
