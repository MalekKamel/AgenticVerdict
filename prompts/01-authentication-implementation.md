# Implementation Prompt: Authentication UI Phase

## Context

The AgenticVerdict platform has completed two foundational phases:

1. **Core Platform** (`/specs/00-core`) — Fully implemented with multi-tenant infrastructure, data connectors, and AI agent orchestration
2. **UI Foundation** (`/specs/01-ui/00-foundation`) — Design system implemented with:
   - Three-tier design token system (Global → Brand → Component)
   - Multi-tenant theming with runtime switching
   - RTL/LTR support for internationalization
   - WCAG 2.1 AA accessibility compliance
   - Atomic design component library (atoms, molecules)
   - Comprehensive documentation at `/changelog/2026-04-14-ui-foundation-design-system.md`

## Objective

Implement `/specs/01-ui/01-authentication` — the complete user authentication flow serving as the gateway to all platform functionality.

## Scope Overview

**Duration**: 8-12 days (single developer) | 130 total tasks across 9 phases

**User Stories**:

- US0 (P0): Auth Layout Wrapper — Foundation for all auth pages
- US1 (P1): Login with Email/Password — Core authentication
- US2 (P1): Registration with Email Verification — User onboarding
- US3 (P2): Password Reset Request — Self-service recovery
- US4 (P2): Password Reset Confirm — Complete recovery flow
- US5 (P1): Error Handling and User Feedback — Cross-cutting UX

**Technology Stack**:

- Framework: TanStack Start (file-based routing, SSR/SSG)
- UI Library: Mantine v9 (from `@agenticverdict/ui`)
- Forms: @mantine/form + Zod validation
- State: TanStack Store
- API: tRPC v11
- Testing: Playwright (E2E) + Vitest (unit)

## Execution Guidelines

### 1. Pre-Implementation

Before starting implementation:

1. Complete the pre-flight checklist: `/specs/01-ui/01-authentication/checklists/pre-flight.md`
2. Review the task breakdown: `/specs/01-ui/01-authentication/tasks.md`
3. Understand dependencies and execution order

### 2. Implementation Approach

Follow the systematic phase order:

```
Phase 1: Setup (5 tasks)
  ↓
Phase 2: Foundational (9 tasks) — BLOCKS all user stories
  ↓
Phase 3: User Story 0 — Auth Layout (7 tasks) — BLOCKS all other user stories
  ↓
Phase 4-8: User Stories 1-5 (parallelizable after US0)
  ↓
Phase 9: Polish & Cross-Cutting Concerns
```

**Critical Rules**:

- Complete Phase 2 (Foundational) before any user story work
- Complete User Story 0 (Auth Layout) before other user stories
- Write tests FIRST (TDD) — ensure they FAIL before implementation
- Each user story must be independently testable

### 3. Specification Updates

If implementation requires specification changes:

1. Follow the SpecKit guide: `/docs/02-planning-and-methodology/speckit-commands-guide.md`
2. Use commands in sequence: `specify` → `plan` → `tasks` → `implement`
3. Update changelog with rationale for changes

### 4. Quality Standards

**Code Quality**:

- TypeScript strict mode, zero `any` types
- Component composition over inheritance
- Proper error boundaries and loading states

**Accessibility**:

- WCAG 2.1 AA compliance minimum
- Keyboard navigation for all interactive elements
- ARIA attributes and semantic HTML
- Test with axe-core and screen readers

**Performance**:

- <1.5s page load on 3G
- <300KB initial bundle size
- Route-based code splitting

**Security**:

- Generic error messages (prevent email enumeration)
- CSRF protection on all mutations
- HTTP-only cookies for session tokens
- Rate limiting on auth endpoints

## File Structure Conventions

```
apps/frontend/src/
├── routes/auth/
│   ├── __root.tsx              # Auth layout wrapper
│   ├── login.tsx               # /auth/login
│   ├── register.tsx            # /auth/register
│   ├── verify-email.tsx        # /auth/verify-email?token=xxx
│   ├── forgot-password.tsx     # /auth/forgot-password
│   └── reset-password.tsx      # /auth/reset-password?token=xxx
├── components/auth/
│   ├── AuthLayout.tsx
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── ResetPasswordForm.tsx
│   ├── PasswordInput.tsx
│   ├── AuthError.tsx
│   └── AuthSuccess.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useRequireAuth.ts
│   ├── useLoginMutation.ts
│   ├── useRegisterMutation.ts
│   └── usePasswordReset.ts
├── stores/
│   └── auth-store.ts
└── lib/validations/
    ├── auth.ts
    └── password.ts
```

## Completion Criteria

Phase is complete when:

1. All 130 tasks in `tasks.md` are implemented
2. All acceptance criteria from `spec.md` are met
3. Completion checklist is satisfied: `checklists/completion.md`
4. Smoke test passes: Full auth flow (register → verify → login → logout → reset → login)
5. Multi-language test passes: All flows work in en, ar, fr
6. Test coverage targets met: 70%+ overall, 80%+ for auth logic

## References

- **Specification**: `/specs/01-ui/01-authentication/README.md`
- **Task Breakdown**: `/specs/01-ui/01-authentication/tasks.md`
- **tRPC Contracts**: `/specs/01-ui/01-authentication/contracts/trpc-contracts.md`
- **UI Foundation**: `/changelog/2026-04-14-ui-foundation-design-system.md`
- **SpecKit Guide**: `/docs/02-planning-and-methodology/speckit-commands-guide.md`

---

**Generated**: 2026-04-14
**Maintainer**: UI Development Team
