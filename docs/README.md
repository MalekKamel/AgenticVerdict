# AgenticVerdict Documentation

Welcome to the consolidated documentation hub for the AgenticVerdict project. This documentation provides comprehensive guidance for understanding, planning, and implementing the multi-platform marketing analytics agent system.

---

## Quick Navigation

| Section                                                    | Audience                        | Description                                                   |
| ---------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| [**Overview & meta**](00-overview/)                        | Maintainers, leads              | Documentation taxonomy, migration notes, repo status snapshot |
| [**Getting Started**](01-getting-started/)                 | New team members, stakeholders  | Project overview, quick start, and navigation                 |
| [**Planning & Methodology**](02-planning-and-methodology/) | Tech leads, architects          | Development approach, testing strategy, quality gates         |
| [**Development Phases**](03-development-phases/)           | Developers, implementers        | Detailed phase documentation (00-04)                          |
| [**Technology Research**](04-technology-research/)         | Engineers making tech decisions | Comprehensive technology analysis and recommendations         |
| [**Project Management**](05-project-management/)           | PMs, leadership                 | Project charter, requirements, roadmap                        |
| [**Reference**](06-reference/)                             | All team members                | Prompts, templates, and resources                             |

---

## Directory Structure

```
docs/
├── README.md                        # This hub (start here)
├── 00-overview/                     # Meta: structure plan, development status snapshot
├── 01-getting-started/              # New team members
├── 02-planning-and-methodology/     # Methodology, testing, quality gates
├── 03-development-phases/           # Phases 00–04 (+ phase-overview.md)
├── 04-technology-research/          # Technology decisions
├── 05-project-management/         # Charter, requirements, roadmap
└── 06-reference/                    # Templates and resources
```

---

## How to Use This Documentation

### For New Team Members

1. Start with [Getting Started](01-getting-started/project-overview.md)
2. Review the [Project Charter](05-project-management/project-charter.md)
3. Explore [Development Phases](03-development-phases/) to understand the implementation roadmap

### For Developers

1. Review the [Testing Strategy](02-planning-and-methodology/testing-strategy.md)
2. Navigate to your assigned [Development Phase](03-development-phases/)
3. Consult [Technology Research](04-technology-research/) for implementation guidance

### For Architects and Tech Leads

1. Review [Methodology Overview](02-planning-and-methodology/methodology-overview.md)
2. Study [Project charter](05-project-management/project-charter.md) and [requirements](05-project-management/requirements.md)
3. Reference [Technology Research](04-technology-research/) for technical decisions

### For Project Managers

1. Start with [Project Charter](05-project-management/project-charter.md)
2. Review [Requirements](05-project-management/requirements.md)
3. Track progress via [Development Phases](03-development-phases/)

---

## Documentation Architecture

### Design Principles

This documentation follows these key principles:

1. **Hierarchical Organization** — Numbered prefixes ensure logical ordering
2. **Audience-Based Segmentation** — Content organized by intended audience
3. **Progressive Detail** — High-level overviews → specific implementation details
4. **Isolation & Encapsulation** — Each directory is self-contained
5. **Scalability** — Structure accommodates growth without reorganization

### Naming Conventions

- **Directories**: Numbered prefixes with kebab-case (e.g., `01-getting-started`)
- **Files**: Lowercase with hyphens (e.g., `project-overview.md`)
- **Phases**: Numbered with descriptive names (e.g., `phase-00-foundation`)

---

## Development Phases Overview

| Phase | Name                 | Focus Area                                        | Status (snapshot 2026-04-04)                                    |
| ----- | -------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| 00    | Foundation           | Core domain models, configuration, infrastructure | In progress (major pieces landed; see phase acceptance)         |
| 01    | Platform Integration | Multi-platform adapters, data normalization       | Largely implemented in code + ops docs; exit criteria vs review |
| 02    | Agent Intelligence   | AI orchestration, LangChain integration           | Planned                                                         |
| 03    | Report Generation    | Template-driven reporting, multi-format output    | Planned                                                         |
| 04    | Production Hardening | Performance, security, operational excellence     | Planned (overlaps prior phases)                                 |

See [Development Phases](03-development-phases/) for detailed documentation.

---

## Technology Stack Highlights

### Core Technologies

- **Build Tools**: Turborepo, pnpm workspaces
- **Backend**: tRPC (internal), Drizzle ORM, Fastify (target for external API), Next.js route handlers where used
- **AI Frameworks**: LangChain.js / LangGraph.js (target stack per `CLAUDE.md`)
- **Frontend**: Next.js 15, Mantine (see `apps/web`)
- **Testing**: Vitest, Playwright (target), Testing Library
- **Observability**: OpenTelemetry, Prometheus, Grafana (targets per research docs)

See [Technology Research](04-technology-research/) for comprehensive analysis.

---

## Contributing to Documentation

### Adding New Documentation

1. **Identify the appropriate directory** based on content type and audience
2. **Follow naming conventions** (kebab-case, descriptive names)
3. **Update the relevant README.md** to include the new document
4. **Maintain consistent formatting** with existing documents

### Documentation Standards

- Use Markdown format
- Include table of contents for documents >500 lines
- Add metadata headers (title, last updated, author)
- Use descriptive headings and subheadings
- Include code examples where applicable

---

## Migration Information

This documentation was consolidated from three separate directories:

- `/docs` — Previously empty, now the consolidated documentation hub
- `/roadmap` — Roadmap, phase documentation, methodology (20 files)
- `/task` — Project context, requirements, technology research (17 files)

**Migration Date**: April 3, 2026
**Total Files Migrated**: 37 markdown documents
**See**: [documentation-structure.md](00-overview/documentation-structure.md) for full migration details.

---

## Quick Links

### Essential Documents

- [Project Overview](01-getting-started/project-overview.md) — Executive summary
- [Project Charter](05-project-management/project-charter.md) — Project mission and scope
- [Requirements](05-project-management/requirements.md) — Technical requirements
- [Methodology](02-planning-and-methodology/methodology-overview.md) — Development approach
- [Navigation Guide](01-getting-started/navigation.md) — How to navigate this documentation

### Key Resources

- [Technology Stack Summary](04-technology-research/research-overview.md)
- [Testing Strategy](02-planning-and-methodology/testing-strategy.md)
- [Quality Gates](02-planning-and-methodology/phase-transitions.md)
- [Phase overview](03-development-phases/phase-overview.md) — Cross-phase dependencies and sequence
- [Development status snapshot](00-overview/development-status-summary.md) — Inventory vs plan (update periodically)

---

## Support & Questions

For questions about:

- **Documentation structure**: See [Navigation Guide](01-getting-started/navigation.md)
- **Implementation details**: Consult relevant [Development Phase](03-development-phases/)
- **Technology choices**: Review [Technology Research](04-technology-research/)
- **Project scope**: See [Project Charter](05-project-management/project-charter.md)

---

**Documentation Version**: 1.1  
**Last Updated**: April 4, 2026  
**Maintained By**: AgenticVerdict Development Team

---

## Migration Status

**✅ Documentation Consolidation Complete** — All project documentation has been successfully migrated from scattered directories (`/roadmap`, `/task`) into this unified structure.

Consolidation history and file-level mapping: [documentation-structure.md](00-overview/documentation-structure.md).
