# Feature compositions (`.pen`)

Domain-specific screens and organisms (auth, dashboard, reports, …). Prefer **one file per domain** (e.g. `auth.pen`). Split only when size or parallel ownership requires it (e.g. `auth-onboarding.pen`) and document the split here.

## Rules

- Do **not** fork primitive specs from `system/`; align layouts with `system/atoms.lib.pen` / `system/molecules.lib.pen`. Pencil `ref` only resolves **within** the same file; cross-file parity is enforced by process and by **React** in `@agenticverdict/ui` as the shipped SSOT.
- Shared media lives under `design/assets/` (see [assets README](../assets/README.md)).

## Inventory

| File       | Domain                                     | System alignment (conceptual)                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.pen` | Authentication (login, register, reset, …) | Reusable masters are domain-prefixed (`Auth/...`). Buttons, form field, card, checkbox, and error alert mirror structure intent of `system/atoms.lib.pen` / `system/molecules.lib.pen` (e.g. `Button/*`, `FormField/*`); same-document `ref` used for repeated cards and button variants. |

Add rows as new feature `.pen` files land. Each row should briefly state how the file stays aligned with `design/system/` (per [pen-feature-ref-reusability-implementation-plan.md](../docs/research/pen-feature-ref-reusability-implementation-plan.md) §4.4).

### Reusable masters in `auth.pen` (audit)

| Name               | Notes                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| `Auth/Button/Base` | Base chrome for primary/secondary/ghost `ref` instances                       |
| `Auth/FormField`   | Label + input + helper; aligns with `FormField/*` in system                   |
| `Auth/Card`        | Card shell for auth screens; aligns with Card patterns in markdown blueprints |
| `Auth/Checkbox`    | Aligns with `Checkbox/*` in system                                            |
| `Auth/Alert/Error` | Inline error alert; aligns with Alert patterns                                |

## Related

- [Implementation plan](../docs/research/pen-architecture-implementation-plan.md)
- [Feature reuse & ref governance](../docs/research/pen-feature-ref-reusability-implementation-plan.md)
- [Design system README](../README.md)
