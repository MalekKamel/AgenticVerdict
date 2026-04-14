# UI Specs Organization: Quick Reference

**Full Recommendation:** [`ui-specs-organization-recommendation.md`](./ui-specs-organization-recommendation.md)

---

## Directory Structure

```
specs/01-ui/
├── README.md                           # Navigation hub
├── spec.md                             # User stories, requirements
├── plan.md                             # Technical architecture
├── tasks.md                            # Master task list
├── checklists/requirements.md          # Quality validation
│
├── 00-foundation/                      # TanStack Start, tRPC, routing
├── 01-design-system/                   # Tokens, theming, Mantine v9
├── 02-components/                      # Atoms + Molecules (55 components)
├── 03-organisms/                       # Complex business components (15)
├── 04-data-visualization/              # Charts, analytics viz
├── 05-pages/                           # Page layouts, routes
├── 06-internationalization/            # RTL, i18n, multi-language
├── 07-accessibility/                   # WCAG 2.1 AA compliance
├── 08-performance/                     # Optimization, lazy loading
├── 09-documentation/                   # Ladle/Storybook setup
├── 10-testing/                         # Unit, integration, E2E
└── 11-production-hardening/            # Deployment, monitoring
```

---

## Key Principles

| Principle             | Description                                        |
| --------------------- | -------------------------------------------------- |
| **Insight-Centric**   | AI recommendations first, not dashboards           |
| **Multi-Domain**      | Marketing, Finance, Operations, SEO, Social, Local |
| **Multi-Tenant**      | Direct businesses + agency partners                |
| **RTL First-Class**   | Arabic support from day one                        |
| **Atomic Design**     | Atoms → Molecules → Organisms                      |
| **Platform-Agnostic** | Ready for web, mobile, desktop                     |

---

## Sub-Phase Summary

| ID  | Sub-Phase     | Focus               | Key Deliverables                     |
| --- | ------------- | ------------------- | ------------------------------------ |
| 00  | Foundation    | Base setup          | TanStack Start, tRPC client, routing |
| 01  | Design System | Tokens, theming     | 3-tier token system, Mantine theme   |
| 02  | Components    | Atoms + Molecules   | 55 basic components                  |
| 03  | Organisms     | Complex components  | 15 business components               |
| 04  | Data Viz      | Charts              | Recharts integration                 |
| 05  | Pages         | Page layouts        | 7 page types                         |
| 06  | i18n          | RTL, i18n           | Arabic RTL, multi-language           |
| 07  | Accessibility | WCAG 2.1 AA         | Keyboard nav, screen readers         |
| 08  | Performance   | Optimization        | <2s page load, <500KB bundle         |
| 09  | Documentation | Component docs      | Ladle/Storybook                      |
| 10  | Testing       | Test infrastructure | 70%+ coverage                        |
| 11  | Production    | Hardening           | Deployment, monitoring               |

---

## Migration Timeline

| Week | Activity           | Deliverable                    |
| ---- | ------------------ | ------------------------------ |
| 1    | Structure Creation | Directory setup, root files    |
| 2    | Content Migration  | Migrate existing content       |
| 3    | Enhancement        | Add missing docs, enhance a11y |
| 4    | Integration        | Update navigation, cross-refs  |
| 5    | Validation         | Team review, usability test    |

---

## Industry References

- **Material Design 3**: https://m3.material.io/
- **Fluent UI**: https://learn.microsoft.com/en-us/fluent-ui/web-components/
- **Ant Design**: https://ant.design/
- **Carbon**: https://carbondesignsystem.com/
- **W3C Design Tokens**: https://www.design-tokens.org/

---

## Success Metrics

| Metric          | Target             |
| --------------- | ------------------ |
| Navigation Time | < 2 minutes        |
| Update Time     | < 15 minutes       |
| Link Integrity  | 100% working       |
| Team Adoption   | 90% within 1 month |
| Clarity Rating  | > 4.5/5            |

---

**Status:** ✅ Ready for Implementation
**Duration:** 5 weeks
**Maintainer:** Architecture Team
