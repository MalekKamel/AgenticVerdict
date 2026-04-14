# Architecture Documentation

**AgenticVerdict Platform** — Complete architectural reference for developers, architects, and stakeholders.

---

## Overview

This directory contains the authoritative architecture documentation for the AgenticVerdict multi-business-domain intelligence platform. The documentation is organized by concern area and maintained as the single source of truth for architectural decisions, patterns, and implementation guidance.

---

## Core Architecture Documents

### 📋 [Business Architecture](./business-architecture.md)

**Audience:** Business Stakeholders, Product Managers, Architects

Defines the business domain, value proposition, and business entity relationships:

- **Business Domain** — Problem statement and value proposition
- **Core Entities** — Companies, Insights, Data Connectors, Templates
- **Business Processes** — Intelligence pipeline and workflows
- **Stakeholder Requirements** — User roles and needs
- **Business Metrics Framework** — Domain-specific metrics
- **Multi-Tenancy Model** — Direct business and agency partner support

**Key Highlights:**

- Multi-business-domain platform (Marketing, Finance, Operations)
- Connector-centric architecture with reusable data integrations
- Template-based configuration with full customization
- Agency partner program with tenant isolation

---

### 🏗️ [Technical Architecture](./technical-architecture.md)

**Audience:** Technical Architects, Senior Developers, DevOps Engineers

Comprehensive technical architecture covering all system layers:

- **System Architecture Overview** — High-level architecture and technology stack
- **Component Architecture** — Monorepo structure and package responsibilities
- **Data Architecture** — Database schema, RLS, and data flow
- **Multi-Tenancy Architecture** — Tenant context propagation and isolation
- **Integration Patterns** — Connector adapter pattern and authentication
- **Security Architecture** — Defense-in-depth security layers
- **Deployment Architecture** — Docker, production infrastructure
- **Observability** — Logging, metrics, and distributed tracing

**Key Highlights:**

- AsyncLocalStorage for tenant context propagation
- Row-Level Security for database isolation
- Connector adapter pattern for platform integrations
- Defense-in-depth security model

---

### 📖 [Implementation Guide](./implementation-guide.md)

**Audience:** Developers, Implementation Teams

Practical guidance for working with the codebase:

- **Current Implementation Status** — What's complete and what's pending
- **Module Organization** — Package and application structure
- **Key Design Patterns** — Adapter, tenant context, database access
- **Development Conventions** — Code organization, TypeScript, testing
- **Deployment Operations** — Local development, Docker, CI/CD

**Key Highlights:**

- Phase 0 foundation complete (100%)
- Phase 1 platform integration in progress (60%)
- Detailed pattern explanations with examples
- Operational considerations and monitoring

---

## Research & Analysis

The `/research/` subdirectory contains detailed research findings that informed the architecture:

### Business Research

- **[Multi-Tenant SaaS Business Models](./research/multi-tenant-saas-business-models.md)** — Pricing strategies, agency programs, go-to-market
- **[Business Domains & Metrics](./research/business-domains-and-metrics.md)** — Standard metrics by business domain
- **[Competitive Landscape](./research/competitive-landscape-analytics-platforms.md)** — Market analysis and positioning

### Technical Research

- **[Connector Integration Patterns](./research/connector-integration-patterns.md)** — API integration best practices
- **[AI Configuration Models](./research/ai-configuration-models.md)** — LLM configuration and cost management
- **[Report Generation & Delivery](./research/report-generation-delivery-patterns.md)** — Report formats and delivery channels

### Research Index

See **[Research README](./research/README.md)** for complete research documentation index.

---

## Navigation by Topic

### Business & Product

| Topic             | Document                    | Section                       |
| ----------------- | --------------------------- | ----------------------------- |
| Business model    | Business Architecture       | §1 Business Domain            |
| Pricing strategy  | Research: Multi-Tenant SaaS | §2 Proven Business Models     |
| Agency partners   | Business Architecture       | §6 Multi-Tenancy Model        |
| Metrics framework | Business Architecture       | §5 Business Metrics Framework |
| Templates         | Business Architecture       | Appendix A                    |

### Technical Architecture

| Topic           | Document               | Section                         |
| --------------- | ---------------------- | ------------------------------- |
| System overview | Technical Architecture | §1 System Architecture Overview |
| Multi-tenancy   | Technical Architecture | §4 Multi-Tenancy Architecture   |
| Connectors      | Technical Architecture | §5 Integration Patterns         |
| Security        | Technical Architecture | §6 Security Architecture        |
| Data flow       | Technical Architecture | §3 Data Architecture            |

### Development & Operations

| Topic                | Document             | Section                          |
| -------------------- | -------------------- | -------------------------------- |
| Current status       | Implementation Guide | §1 Current Implementation Status |
| Design patterns      | Implementation Guide | §3 Key Design Patterns           |
| Development workflow | Implementation Guide | §7 Development Workflow          |
| Deployment           | Implementation Guide | §5 Deployment Operations         |
| Monitoring           | Implementation Guide | §6.1 Monitoring                  |

---

## Quick Reference

### For Business Stakeholders

1. **Understanding the platform:** Start with [Business Architecture §1-2](./business-architecture.md#1-business-domain)
2. **Value proposition:** [Business Architecture §1.2](./business-architecture.md#12-value-proposition)
3. **Business benefits:** [Business Architecture §7](./business-architecture.md#7-business-benefits)
4. **Deployment options:** [Business Architecture §8](./business-architecture.md#8-deployment-flexibility)

### For Technical Architects

1. **System overview:** [Technical Architecture §1-2](./technical-architecture.md#1-system-architecture-overview)
2. **Multi-tenancy:** [Technical Architecture §4](./technical-architecture.md#4-multi-tenancy-architecture)
3. **Integration patterns:** [Technical Architecture §5](./technical-architecture.md#5-integration-patterns)
4. **Security model:** [Technical Architecture §6](./technical-architecture.md#6-security-architecture)

### For Developers

1. **Getting started:** [Implementation Guide §5.1](./implementation-guide.md#51-local-development)
2. **Code organization:** [Implementation Guide §2](./implementation-guide.md#2-module-organization)
3. **Design patterns:** [Implementation Guide §3](./implementation-guide.md#3-key-design-patterns)
4. **Conventions:** [Implementation Guide §4](./implementation-guide.md#4-development-conventions)

---

## Related Documentation

### Project Documentation

| Document                | Location                                             | Purpose                        |
| ----------------------- | ---------------------------------------------------- | ------------------------------ |
| **System Overview**     | `/docs/00-overview/system-overview.md`               | Comprehensive system reference |
| **Requirements**        | `/docs/04-project-management/requirements.md`        | Product requirements           |
| **Project Charter**     | `/docs/04-project-management/project-charter.md`     | Project vision and scope       |
| **Development Roadmap** | `/docs/04-project-management/roadmap-development.md` | Phase-by-phase plan            |

### Development Phases

| Phase                                   | Location                                  | Status         |
| --------------------------------------- | ----------------------------------------- | -------------- |
| **Core platform: Foundation**           | `/specs/00-core/00-foundation/`           | ✅ Complete    |
| **Core platform: Connectors**           | `/specs/00-core/01-connectors/`           | 🟡 In Progress |
| **Core platform: Intelligence**         | `/specs/00-core/02-intelligence/`         | 📋 Planned     |
| **Core platform: Insights**             | `/specs/00-core/03-insights/`             | 📋 Planned     |
| **Core platform: Production hardening** | `/specs/00-core/04-production-hardening/` | 📋 Planned     |

### Technology Research

| Topic                            | Location                                                |
| -------------------------------- | ------------------------------------------------------- |
| **Technology Research Overview** | `/docs/03-technology-research/research-overview.md`     |
| **Testing Strategy**             | `/docs/02-planning-and-methodology/testing-strategy.md` |
| **Docker Documentation**         | `/docs/docker/README.md`                                |

---

## Document Standards

### Maintenance

- **Business Architecture:** Updated by Product Team on business model changes
- **Technical Architecture:** Updated by Architecture Team on architectural decisions
- **Implementation Guide:** Updated by Development Team as implementation progresses

### Version Control

All architecture documents are version-controlled in git. Major updates should:

1. Update the `Last Updated` date in the document header
2. Add a changelog entry describing the change
3. Reference related pull requests or issues

### Quality Standards

- **Clarity:** Concise, actionable descriptions without ambiguity
- **Completeness:** All decisions documented with rationale
- **Accuracy:** Technical details verified against codebase
- **Cross-References:** Clear links to related concepts

---

## Contributing

When updating architecture documentation:

1. **Identify the appropriate document** — Business, Technical, or Implementation Guide
2. **Maintain consistency** — Follow existing structure and formatting
3. **Cross-reference** — Link to related sections and documents
4. **Version header** — Update the `Last Updated` date
5. **Review** — Ensure accuracy and completeness

---

## Support & Feedback

For questions or feedback on architecture documentation:

- **Technical issues:** Open a GitHub issue
- **Documentation updates:** Submit a pull request
- **Architecture discussions:** Contact the Architecture Team

---

**Index Last Updated:** 2026-04-11
**Documentation Status:** ✅ Active
**Maintainer:** Architecture & Product Teams
