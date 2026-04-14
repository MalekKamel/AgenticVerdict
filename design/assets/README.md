# Design assets

Shared **raster / SVG** files referenced from `.pen` designs and documentation.

## Layout

| Path             | Use                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `icons/`         | SVG or PNG icons (navigation, actions, status, brand)                                                              |
| `illustrations/` | Product illustrations, empty states                                                                                |
| `images/`        | Photography, backgrounds, tenant logos (`images/logos/` — selection via `CompanyConfig`, not hardcoded components) |

## Referencing from `.pen` files

Use paths **relative to the `.pen` file** (see [target architecture](../docs/research/target-architecture.md) §2.4), e.g. from `design/features/auth.pen`:

`../assets/icons/action-close-24.svg`

## Naming

Prefer `<category>-<purpose>-<size>.<ext>` (e.g. `action-add-24.svg`). Mirror directional icons for RTL where semantics require it.

## Related

- [Implementation plan](../docs/research/pen-architecture-implementation-plan.md) §5
- [Design system README](../README.md)
