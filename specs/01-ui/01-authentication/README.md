# Phase 01: Authentication

**Status**: Draft | **Created**: 2026-04-14 | **Priority**: P1 (Critical Foundation)

---

## Overview

Phase 01 implements the complete user authentication flow for AgenticVerdict, serving as the gateway to all platform functionality. This phase delivers secure, accessible, and internationalized authentication pages including login, registration with email verification, password reset, and a consistent auth layout wrapper.

**Duration**: 3-5 days (8-12 days including testing) | **Dependencies**: Phase 00-foundation must be complete

---

## Quick Links

- [**Feature Specification**](./spec.md) - User stories, requirements, and acceptance criteria
- [**Implementation Plan**](./plan.md) - Technical architecture and design decisions
- [**Task Breakdown**](./tasks.md) - 130 implementation tasks organized by user story
- [**tRPC Contracts**](./contracts/trpc-contracts.md) - API procedure schemas (input/output)
- [**Pre-Flight Checklist**](./checklists/pre-flight.md) - Must complete before starting implementation
- [**Completion Checklist**](./checklists/completion.md) - Must complete before marking phase done

---

## What's Included

### User Stories

1. **User Story 0**: Auth Layout Wrapper (P0) - Foundation for all auth pages
2. **User Story 1**: Login with Email/Password (P1) - Core authentication
3. **User Story 2**: Registration with Email Verification (P1) - User onboarding
4. **User Story 3**: Password Reset Request (P2) - Self-service recovery
5. **User Story 4**: Password Reset Confirm (P2) - Complete recovery flow
6. **User Story 5**: Error Handling and User Feedback (P1) - Cross-cutting UX

### Key Features

- **Secure Authentication**: Email/password login with session management via HTTP-only cookies
- **Email Verification**: Required verification before account access (24-hour token expiry)
- **Password Reset**: Self-service password reset with 1-hour token expiry
- **Multi-Language Support**: English, Arabic, French with automatic RTL/LTR layouts
- **Accessibility First**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Performance Optimized**: <1.5s page load on 3G, <300KB initial bundle
- **Security Hardened**: Generic error messages, rate limiting, CSRF protection

---

## Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | TanStack Start | File-based routing, SSR/SSG, type-safe navigation |
| **UI Library** | Mantine v9 | Components with built-in RTL and accessibility |
| **Forms** | @mantine/form + Zod | Form state management and validation |
| **State** | TanStack Store | Lightweight auth state management |
| **API** | tRPC v11 | Type-safe API calls |
| **i18n** | TanStack Router i18n | Multi-language with RTL support |
| **Testing** | Playwright + Vitest | E2E and unit testing |
| **Accessibility** | @axe-core/playwright | Automated accessibility testing |

---

## File Structure

```
specs/01-ui/01-authentication/
├── README.md                    # This file
├── spec.md                      # Feature specification (user stories, requirements)
├── plan.md                      # Implementation plan (architecture, decisions)
├── tasks.md                     # 130 implementation tasks
├── contracts/
│   └── trpc-contracts.md        # tRPC procedure schemas
└── checklists/
    ├── pre-flight.md            # Pre-implementation checklist
    └── completion.md            # Post-implementation checklist
```

---

## Implementation Summary

### Route Structure (TanStack Start)

```
routes/auth/
├── __root.tsx              # Auth layout wrapper
├── login.tsx               # /auth/login
├── register.tsx            # /auth/register
├── verify-email.tsx        # /auth/verify-email?token=xxx
├── forgot-password.tsx     # /auth/forgot-password
└── reset-password.tsx      # /auth/reset-password?token=xxx
```

### Component Structure

```
components/auth/
├── AuthLayout.tsx          # Full-page layout wrapper
├── LoginForm.tsx           # Login form component
├── RegisterForm.tsx        # Registration form component
├── ForgotPasswordForm.tsx  # Password reset request form
├── ResetPasswordForm.tsx   # Password reset confirm form
├── PasswordInput.tsx       # Password input with visibility toggle
├── AuthError.tsx           # Error display component
└── AuthSuccess.tsx         # Success message component
```

### State Management

```
stores/auth-store.ts        # TanStack Store for auth state
  - isAuthenticated
  - user
  - tenantId
  - isLoading
  - error
```

---

## Success Criteria

### Performance
- ✅ Auth pages load in <1.5s on 3G connection
- ✅ Form submissions complete in <2s
- ✅ Initial bundle <300KB gzipped

### Quality
- ✅ 70%+ unit test coverage (80%+ for auth logic)
- ✅ Zero axe-core accessibility violations
- ✅ All pages pass WCAG 2.1 AA audit
- ✅ Zero console errors in production

### User Experience
- ✅ 95%+ successful registration rate
- ✅ 90%+ successful login rate
- ✅ All auth flows work via keyboard only
- ✅ RTL layouts work correctly for Arabic

---

## Getting Started

### 1. Review Documentation

Start by reading the specification documents in order:

1. [spec.md](./spec.md) - Understand user stories and requirements
2. [plan.md](./plan.md) - Understand technical approach
3. [tasks.md](./tasks.md) - Understand implementation breakdown

### 2. Complete Pre-Flight Checklist

Before writing any code, complete the [Pre-Flight Checklist](./checklists/pre-flight.md):

- Environment setup
- Backend prerequisites
- Documentation review
- Testing setup
- Design system assets
- Internationalization setup
- Accessibility tools

### 3. Start Implementation

Begin with Phase 1 (Setup) in [tasks.md](./tasks.md):

```bash
# Create feature branch
git checkout -b 01-ui-authentication

# Start with setup tasks (T001-T005)
# Then foundational tasks (T006-T014)
# Then User Story 0 (T015-T021)
# Then proceed with remaining user stories
```

### 4. Follow Test-Driven Development

For each user story:
1. Write tests FIRST (ensure they FAIL)
2. Implement components
3. Verify tests PASS
4. Move to next task

### 5. Complete Completion Checklist

Before marking the phase done, complete the [Completion Checklist](./checklists/completion.md):

- All user stories acceptance criteria
- All functional requirements
- All success criteria
- Code quality checks
- Documentation updates
- Security validation
- Accessibility validation
- Internationalization validation
- Performance validation
- Smoke testing

---

## Task Breakdown Summary

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| **1. Setup** | 5 tasks | 0.5 day | None |
| **2. Foundational** | 9 tasks | 1-1.5 days | Setup (BLOCKING) |
| **3. User Story 0** (Auth Layout) | 7 tasks | 0.5-1 day | Foundational |
| **4. User Story 1** (Login) | 20 tasks | 1-2 days | Foundational + US0 |
| **5. User Story 2** (Registration) | 21 tasks | 1.5-2.5 days | Foundational + US0 |
| **6. User Story 3** (PW Reset Request) | 13 tasks | 0.5-1 day | Foundational + US0 |
| **7. User Story 4** (PW Reset Confirm) | 16 tasks | 1-1.5 days | Foundational + US0 + US3 |
| **8. User Story 5** (Error Handling) | 15 tasks | 1 day | All previous stories |
| **9. Polish** | 24 tasks | 1 day | All previous stories |

**Total**: 130 tasks, 8-12 days (1 developer)

---

## Parallel Development Opportunities

With multiple developers, after completing Setup + Foundational + US0:

- **Developer A**: User Story 1 (Login) - P1
- **Developer B**: User Story 2 (Registration) - P1
- **Developer C**: User Story 3 (Password Reset Request) - P2

Then:
- **Developer A**: User Story 4 (Password Reset Confirm) - P2 (depends on US3)
- **Developer B**: User Story 5 (Error Handling) - P1
- **Developer C**: Polish phase

**With 3 developers**: 4-6 days total

---

## Dependencies

### Required Before Starting

- ✅ Phase 00-foundation complete (design tokens, base UI components, RTL/LTR support)
- ✅ TanStack Start project initialized
- ✅ Mantine v9 installed and configured
- ✅ tRPC v11 API server running with auth procedures
- ✅ Database tables created (users, sessions, tokens)
- ✅ Email delivery service configured

### Blocked by This Phase

- ⏳ Phase 02: Scaffold (depends on auth layout patterns)
- ⏳ All subsequent UI phases (depend on authentication)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email delivery failures | High | Retry logic, "resend email" option, monitor delivery rates |
| RTL layout issues | Medium | Continuous Arabic testing, Mantine built-in RTL |
| Accessibility regressions | High | Automated axe-core testing in CI, manual screen reader testing |
| tRPC type mismatches | Medium | Strict TypeScript, end-to-end type checking |
| Session management bugs | High | Comprehensive E2E tests, manual testing |
| Password reset link abuse | Medium | 1-hour expiry, single-use tokens, rate limiting |

---

## Out of Scope (Future Enhancements)

The following features are explicitly out of scope for Phase 01:

- Two-factor authentication (2FA)
- Social login (Google, Microsoft)
- Single sign-on (SSO) for enterprise
- Passwordless authentication (magic links)
- Biometric authentication
- Account deletion/self-service account closure
- Profile picture upload
- Session management UI (view active sessions, revoke sessions)
- OAuth 2.0 / OpenID Connect provider features
- WebAuthn / passkey support

---

## Support & Questions

### Documentation Issues
If you find errors or ambiguities in this specification:

1. Check the parent documents: `/specs/01-ui/PHASES.md`, `/docs/architecture/ui/00-overview.md`
2. Review the implementation plan: `plan.md`
3. Consult the task breakdown: `tasks.md`
4. Contact the architecture team for clarification

### Implementation Issues
If you encounter blockers during implementation:

1. Check the completion checklist for guidance: `checklists/completion.md`
2. Review the tRPC contracts: `contracts/trpc-contracts.md`
3. Consult the base UI components from Phase 00-foundation
4. Reach out to the development team for support

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-14 | Initial specification generation | Claude Code |

---

**Status**: Draft (Ready for Review)  
**Next Step**: Complete pre-flight checklist and begin implementation  
**Maintainer**: UI Development Team

---

## Quick Reference

### Critical Paths

- **Must Read First**: [spec.md](./spec.md), [plan.md](./plan.md)
- **Must Complete Before Starting**: [checklists/pre-flight.md](./checklists/pre-flight.md)
- **Must Complete Before Done**: [checklists/completion.md](./checklists/completion.md)
- **Implementation Guide**: [tasks.md](./tasks.md)
- **API Reference**: [contracts/trpc-contracts.md](./contracts/trpc-contracts.md)

### Key Metrics

- **Total Tasks**: 130
- **Estimated Duration**: 8-12 days (1 developer), 4-6 days (3 developers)
- **Test Coverage Target**: 70%+ (80%+ for auth logic)
- **Performance Target**: <1.5s load time, <300KB bundle
- **Accessibility Target**: WCAG 2.1 AA (zero violations)

### Priority Order

1. **P0**: User Story 0 (Auth Layout) - Foundation
2. **P1**: User Story 1 (Login) - Core auth
3. **P1**: User Story 2 (Registration) - Core auth
4. **P1**: User Story 5 (Error Handling) - Cross-cutting
5. **P2**: User Story 3 (Password Reset Request) - Enhancement
6. **P2**: User Story 4 (Password Reset Confirm) - Enhancement
