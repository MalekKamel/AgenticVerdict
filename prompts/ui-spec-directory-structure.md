# Prompt: UI Specification Directory Structure Planning

**Created**: 2026-04-14
**Status**: Active
**Target**: Specification Team, Architects, Developers

---

## Context

The AgenticVerdict platform requires a comprehensive UI specification structure that aligns with the documented UI architecture at `/docs/architecture/ui/00-overview.md`. The specification directories under `/specs/01-ui/` must encapsulate the complete UI system with professional organization that supports the development lifecycle from foundation to production hardening.

The UI system is built on TanStack Start with Mantine UI v9, emphasizing accessibility (WCAG 2.1 AA), internationalization (full Arabic RTL support), and performance optimization. The platform is insight-centric rather than metric-centric, delivering AI-powered business intelligence through configurable Insights, automated data collection via Connectors, and multi-tenant support for agency partners.

## Current State

- **Existing**: `/specs/01-ui/00-foundation/` contains foundation specifications for UI components shared across web and desktop
- **Required**: Additional specification directories organized by pages and entities as defined in the UI architecture

## Objective

Create a comprehensive directory structure under `/specs/01-ui/` that:

1. Aligns with the pages and entities defined in `/docs/architecture/ui/00-overview.md`
2. Supports the insight-centric business model
3. Follows a logical development sequence
4. Maintains consistency with the existing `/specs/00-core/` structure

## Initial Directory Proposals

The following initial directories have been proposed:

1. **00-foundation**: Existing foundation specifications for UI components (atoms, molecules, organisms, templates, pages)
2. **01-scaffold**: Application scaffolding, routing structure, layout framework
3. **02-auth**: Authentication flows, user management, tenant switching
4. **03-connectors**: Connector management UI, health monitoring, configuration
5. **04-insights**: Insight creation, management, feed, and delivery UI
6. **05-settings**: User preferences, tenant configuration, branding
7. **06-templates**: Template library, template customization

## Task

Review the initial directory proposals and provide:

1. **Recommended Structure**: A final directory structure that best serves the development lifecycle
2. **Rationale**: Justification for each directory and its placement in the sequence
3. **Development Sequence**: Optimal ordering for implementation based on dependencies
4. **Entity Mapping**: Alignment between directories and key entities (Insight, Connector, Template, Schedule, Delivery, Tenant)
5. **Consistency Check**: How the structure aligns with `/docs/architecture/ui/00-overview.md` and `/specs/01-ui/spec.md`

## Key Entities from UI Architecture

Based on `/specs/01-ui/spec.md`, the following entities drive the UI:

- **Insight**: Core entity for business intelligence configuration
- **Connector**: Data integration health and monitoring
- **Template**: Pre-built insight configurations
- **Schedule**: Insight execution timing
- **Delivery Configuration**: Report delivery settings
- **Tenant (Tenant)**: Multi-tenant management
- **Insight Report**: AI-generated output consumption

## Key Pages from User Stories

Based on user stories in `/specs/01-ui/spec.md`:

1. Insight creation and configuration
2. Insight feed and consumption
3. Connector health dashboard
4. Tenant switching and management
5. Scheduling and delivery settings
6. Authentication and authorization

## Deliverable

Provide a comprehensive recommendation document that includes:

1. **Final Directory Structure**: Complete list with numbering and descriptions
2. **Development Sequence**: Recommended implementation order with dependency rationale
3. **Directory Contents**: What each directory should contain (README.md, tasks.md, acceptance-criteria.md, etc.)
4. **Cross-Reference Mapping**: How directories map to the UI architecture overview
5. **Consistency Notes**: How the structure maintains consistency with existing specs

## Considerations

- Maintain consistency with `/specs/00-core/` directory structure where applicable
- Support the insight-centric (not metric-centric) business model
- Enable parallel development workstreams where possible
- Facilitate clear ownership and responsibility assignment
- Support progressive enhancement from foundation to production hardening
- Align with the four-phase implementation timeline defined in `/docs/architecture/ui/00-overview.md`

## Success Criteria

- The directory structure comprehensively covers all UI pages and entities
- The development sequence minimizes dependencies and enables parallel work
- The structure is intuitive and maintainable for the development team
- The structure aligns with the documented UI architecture
- The structure supports the multi-business-domain nature of the platform
