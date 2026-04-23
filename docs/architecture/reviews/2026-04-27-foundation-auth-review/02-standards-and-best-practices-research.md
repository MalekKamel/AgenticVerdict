# Standards and Best Practices Research

## Purpose

Benchmark the current infrastructure and authentication implementation against:

- Repository governance and architecture standards
- Common industry best practices for modern TypeScript SaaS platforms

## Benchmark Matrix

| Area                             | Expected Standard                                                           | Current Status                                           | Assessment                                                   |
| -------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| Tenant isolation                 | Tenant context propagation + tenant-scoped DB access + RLS-aligned behavior | Core primitives present                                  | Strong direction; continue convergence across all code paths |
| Auth routing and redirect safety | Central route policy + open redirect protection + loop prevention           | Policy kernel present with tests                         | Strong, but not uniformly applied route-by-route             |
| Secrets handling in frontend     | Never persist credentials/passwords in web storage                          | Password fields persisted in register draft              | Critical deviation                                           |
| Protected route enforcement      | Consistent route-level auth guards for protected surfaces                   | Mixed route-level and client-only enforcement            | High-priority deviation                                      |
| Frontend architecture boundaries | Route -> page -> component -> hook/service -> API with shared UI primitives | Largely aligned                                          | Good baseline; reduce hook duplication                       |
| Accessibility                    | WCAG 2.1 AA for auth flows and key pages                                    | Governance present; execution appears good in auth shell | Keep a11y checks continuously enforced                       |
| RTL/LTR localization             | Logical direction-safe UI and localized copy via i18n                       | Governance present and applied in auth areas             | Good baseline; keep parity testing                           |
| CI quality gates                 | Mandatory typecheck, targeted tests, risk-based coverage thresholds         | Coverage/security gates partially permissive             | High-priority governance gap                                 |
| Runtime artifact integrity       | Deployed runtime artifact should match verified production bundle path      | Verification and runtime entry paths not fully aligned   | High-priority infra gap                                      |
| API security hardening           | Security headers and baseline secure defaults                               | No explicit security-header middleware baseline          | Medium-priority gap                                          |

## Industry Comparison Summary

- The project is **above average** in architectural documentation quality and policy intent.
- The project is **near production-ready** at structural level, but has a **small set of high-impact operational and security gaps**.
- The largest deviations are not architectural absence, but **policy-to-implementation consistency issues**.

## Risk Scoring Model

Use this formula for each finding:

`Risk Score = Likelihood (1-5) x Impact (1-5) x Exposure (1-3) - Control Strength (0-3)`

Severity bands:

- **Critical:** `>= 18`
- **High:** `12-17`
- **Medium:** `7-11`
- **Low:** `<= 6`

Recommended default ordering for this project stage:

1. Secrets handling and tenant/auth correctness
2. Route-guard consistency and redirect safety
3. CI enforcement for coverage/security
4. API hardening and maintainability cleanup

## Research Conclusion

The current implementation aligns with many modern standards in design intent and foundational architecture. To fully meet industry-grade reliability, the next step is enforcing consistency in runtime paths, auth guard application, sensitive data handling, and CI gate strictness.

## Governance Update

- Route-guard governance is now centralized in: `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`.
- Route-guard implementation sequencing is tracked in: `docs/architecture/reviews/2026-04-27-route-guard-single-source-of-truth-implementation-plan.md`.
