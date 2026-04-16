# Prompt: UI Foundation Work Order — `.pen` Libraries First, Then `@agenticverdict/ui`

## Purpose

Define the **mandatory execution order** for user stories and tasks under `/specs/01-ui/00-foundation/`: design is authored in shared Pencil libraries **before** React implementation, because **`.pen` files are the single source of truth** for visual design.

## Scope

Applies to **planning, story writing, and task breakdown** for `/specs/01-ui/00-foundation/`, and to any work that implements those tasks.

## Required sequence

1. **Atomic design system** — Implement and evolve primitives in `/design/system/atoms.lib.pen` (atomic-level tokens and elements as defined by the design system).
2. **Molecular design system** — Build composite UI patterns in `/design/system/molecules.lib.pen`, composed from the atoms library.
3. **React implementation** — Implement corresponding components in the **`@agenticverdict/ui`** package so that code **reflects the `.pen` design** (structure, tokens, spacing, and layout per repo design-to-code workflow).

Stories and tasks **must** reflect this order: **atoms → molecules → React**. Do not treat React as the primary design surface for foundation UI.

## Rationale

React components are **derived from** the `.pen` implementation, not the reverse. The `.pen` libraries establish **one authoritative design record**; the UI package implements that record for the application.

## Governance (summary)

- Edit `.pen` files **only** with **Pencil MCP** tools, per repository policy.
- Follow **MCP-first** design-to-code guidance in `/design/docs/DESIGN-SSOT.md` and `/design/docs/generation/ui-generation-cheatsheet.md`.

## Out of scope

This prompt defines **ordering and SSOT** only. It does not replace detailed acceptance criteria, accessibility, or RTL/LTR requirements elsewhere in foundation specs.
