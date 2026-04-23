# Frontend authentication: production readiness

## Context

The initial authentication experience lives under `apps/frontend/src/routes/$locale/auth`. It is sufficient for early integration but is not yet production-complete: supporting routes, disclosures, and product expectations for a shipped login/sign-up surface are likely incomplete.

## Objective

Bring the localized authentication area to a **production-ready** standard by closing functional and UX gaps (including missing legal/supporting pages where appropriate), improving consistency with the rest of the product, and preferring **Mantine v9** primitives and existing **`@agenticverdict/ui`** patterns instead of bespoke components.

## Scope

- **In scope:** `apps/frontend/src/routes/$locale/auth` and tightly related shared UI used only to support those routes (for example shared layout, links, or small helpers), when necessary for consistency.
- **Representative gaps to evaluate:** privacy policy, terms and conditions, and other standard auth-adjacent pages or deep links your product requires (for example password reset confirmation, help/contact, session messaging), plus missing UI states and affordances typical of production auth.

## Requirements

1. **Discovery and gap analysis** — Review routing, forms, validation, error handling, loading states, navigation between auth screens, and cross-links (marketing site, help, legal). Document concrete gaps before implementing.
2. **Implementation** — Address identified gaps with minimal, purposeful changes: add missing pages/routes, wire navigation from login/sign-up flows, and align copy, layout, and components with existing design-system guidance.
3. **UI stack** — Use Mantine and established repo patterns; reuse atoms/molecules from `@agenticverdict/ui` when they fit. Avoid duplicate one-off components where an existing primitive exists.
4. **Accessibility and localization** — Meet WCAG 2.1 AA expectations (contrast, focus, keyboard operation, labels). Support RTL/LTR via logical properties and tenant/theme configuration (`TenantConfig`), not hardcoded direction.
5. **Governance** — Follow `design-system/README.md`, `.cursor/rules/ui-guidelines.mdc`, and `/docs/architecture/business/design-system/` as applicable. Do not hand-edit `.pen` files unless the task explicitly includes design work via Pencil MCP.

## Outcomes (definition of done)

- Auth flows expose the disclosures and supporting pages the product needs (at minimum: routes and UI scaffolding for privacy and terms, unless the project already defines a different canonical location—then link consistently).
- No obvious dead ends: errors, empty states, and pending actions are communicated clearly.
- Visual and interaction patterns match the design system and remain maintainable (Mantine-first, shared components where they already exist).
- Changes are scoped to authentication and its immediate dependencies; unrelated refactors are avoided.

## Non-goals

- Redesigning backend auth contracts or tenant security models unless a small, unavoidable change is required to support a route or link.
- Broad application-wide navigation or marketing-site work outside what auth screens must link to.

## Deliverable

A merge-ready change set with a concise summary of: gaps found, what was added or changed, how it was verified (manual checks for focus/keyboard and basic responsive layout), and any follow-ups explicitly deferred.
