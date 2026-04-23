# Pre-Flight Checklist: Authentication

**Feature**: Authentication (Phase 01)  
**Version**: 1.0  
**Last Updated**: 2026-04-14

This checklist MUST be completed before beginning implementation of Phase 01 (Authentication). Ensure all items are checked off before writing any code.

---

## Environment Setup

- [ ] TanStack Start project is initialized and working (`pnpm dev` runs successfully)
- [ ] Mantine v9 is installed and configured (`@mantine/core`, `@mantine/form`, `@mantine/hooks`)
- [ ] tRPC client is configured (`@trpc/client`, `@tanstack/start-trpc`)
- [ ] TanStack Store is installed (`@tanstack/store`)
- [ ] TypeScript strict mode is enabled (`tsconfig.json`)
- [ ] Phase 00-foundation is complete (design tokens, base UI components, RTL/LTR support)
- [ ] All dependencies are installed (`pnpm install` completed without errors)

---

## Backend Prerequisites

- [ ] tRPC API server is running and accessible
- [ ] Auth router is implemented with all procedures:
  - [ ] `auth.login`
  - [ ] `auth.register`
  - [ ] `auth.logout`
  - [ ] `auth.getSession`
  - [ ] `auth.verifyEmail`
  - [ ] `auth.requestPasswordReset`
  - [ ] `auth.confirmPasswordReset`
- [ ] Database tables exist:
  - [ ] `users`
  - [ ] `sessions`
  - [ ] `email_verification_tokens`
  - [ ] `password_reset_tokens`
- [ ] Email delivery service is configured (Resend/SendGrid)
- [ ] Session management is configured with HTTP-only cookies
- [ ] Rate limiting is implemented on auth endpoints

---

## Documentation Review

- [ ] Read and understand `/specs/01-ui/01-authentication/spec.md` (user stories, requirements)
- [ ] Read and understand `/specs/01-ui/01-authentication/plan.md` (technical implementation)
- [ ] Read and understand `/specs/01-ui/01-authentication/tasks.md` (task breakdown)
- [ ] Read and understand `/specs/01-ui/01-authentication/contracts/trpc-contracts.md` (API contracts)
- [ ] Read and understand `/docs/architecture/ui/00-overview.md` (UI architecture)
- [ ] Read and understand `/CLAUDE.md` (project guidelines)

---

## Development Environment

- [ ] Code editor is configured (VS Code recommended)
- [ ] ESLint is configured and running
- [ ] Prettier is configured (optional but recommended)
- [ ] Git hooks are configured (husky, lint-staged)
- [ ] Environment variables are set (`.env.local` file)
- [ ] Database connection is working (can connect to local/dev database)
- [ ] Email service is working (can send test emails)

---

## Testing Setup

- [ ] Playwright is installed and configured (`@playwright/test`)
- [ ] Vitest is installed and configured (`vitest`)
- [ ] @axe-core/playwright is installed for accessibility testing
- [ ] React Testing Library is installed (`@testing-library/react`)
- [ ] Test scripts are configured in `package.json`:
  - [ ] `test` (unit tests with Vitest)
  - [ ] `test:e2e` (E2E tests with Playwright)
- [ ] Playwright browsers are installed (`npx playwright install`)
- [ ] Test environment variables are configured

---

## Design System Assets

- [ ] Tenant logo is available in SVG format (`/public/logos/masafh.svg`)
- [ ] Brand colors are defined in design tokens
- [ ] Typography scale is defined in design tokens
- [ ] Spacing scale is defined in design tokens
- [ ] Mantine theme is configured with brand tokens
- [ ] RTL/LTR support is configured (DirectionProvider)
- [ ] Base UI components from Phase 00-foundation are available:
  - [ ] `AppTextInput`
  - [ ] `AppButton`
  - [ ] `AppCard`

---

## Internationalization Setup

- [ ] Translation files exist for all supported languages:
  - [ ] `i18n/locales/en.json` (English)
  - [ ] `i18n/locales/ar.json` (Arabic)
  - [ ] `i18n/locales/fr.json` (French)
- [ ] Translation utility is configured (`useTranslation` hook or equivalent)
- [ ] RTL/LTR detection is working (locale-based)
- [ ] Date formatting is locale-aware
- [ ] Number formatting is locale-aware

---

## Accessibility Tools

- [ ] Screen reader is available for testing:
  - [ ] NVDA (Windows) or
  - [ ] JAWS (Windows) or
  - [ ] VoiceOver (macOS/iOS)
- [ ] axe DevTools browser extension is installed
- [ ] Keyboard is available for keyboard navigation testing
- [ ] Color contrast analyzer is available (web-based tool or plugin)

---

## Version Control

- [ ] Git repository is initialized
- [ ] Feature branch is created: `01-ui-authentication`
- [ ] `.gitignore` is configured correctly
- [ ] Commit message conventions are understood (Conventional Commits)
- [ ] PR template is available (if using GitHub/GitLab)

---

## Performance Monitoring

- [ ] Lighthouse CLI is installed (`npm install -g lighthouse`)
- [ ] Bundle analyzer is configured (webpack-bundle-analyzer or similar)
- [ ] Performance budgets are defined (in Lighthouse config or similar)
- [ ] Core Web Vitals targets are understood (<2s load time, <3s TTI)

---

## Security Considerations

- [ ] HTTPS is configured locally (self-signed cert accepted)
- [ ] CSRF protection is understood and configured
- [ ] Rate limiting is understood and tested
- [ ] OWASP security guidelines are reviewed
- [ ] Password security best practices are understood (hashing, salting, etc.)

---

## Pre-Implementation Validation

### Manual Testing of Prerequisites

- [ ] Can run `pnpm dev` without errors
- [ ] Can access the web app at `http://localhost:3000`
- [ ] Can make a successful tRPC call to `auth.getSession`
- [ ] Can send a test email via the email service
- [ ] Can run unit tests: `pnpm test` (should pass with no tests yet)
- [ ] Can run E2E tests: `pnpm test:e2e` (should pass with no tests yet)
- [ ] Can build the project: `pnpm build` (should succeed)
- [ ] Can lint the project: `pnpm lint` (should pass)

---

## Knowledge Check

Answer these questions before starting implementation:

1. **What is the file-based routing structure for TanStack Start?**  
   Answer: `routes/auth/login.tsx` maps to `/auth/login`

2. **How do you create a protected route that requires authentication?**  
   Answer: Use `useRequireAuth` hook in the route component

3. **How do you handle form validation with Mantine and Zod?**  
   Answer: Use `useForm` with `zodResolver` from `@mantine/form/zod-resolver`

4. **How do you call a tRPC mutation from a component?**  
   Answer: `trpc.auth.login.mutate(input)` or use `useMutation` hook

5. **How do you manage auth state across the app?**  
   Answer: TanStack Store at `stores/auth-store.ts`

6. **How do you implement RTL support for Arabic?**  
   Answer: DirectionProvider with `dir="rtl"` for Arabic locale

7. **How do you ensure accessibility for form errors?**  
   Answer: ARIA live regions with `role="alert"` and `aria-live="assertive"`

8. **What is the password strength requirement?**  
   Answer: 8+ characters, uppercase, lowercase, number, special character

9. **How do you prevent email enumeration attacks?**  
   Answer: Generic error messages, consistent responses regardless of email existence

10. **What is the session duration?**  
    Answer: 24 hours default, 7 days with "remember me" option

---

## Final Sign-Off

- [ ] I have reviewed all documentation
- [ ] I understand the technical approach
- [ ] I understand the user stories and requirements
- [ ] I understand the task breakdown
- [ ] All prerequisites are complete
- [ ] My development environment is ready
- [ ] I am ready to begin implementation with Phase 1 (Setup) in tasks.md

---

**Completed By**: __________________________  
**Date**: __________________________  
**Approved By**: __________________________

---

**Document Status**: Draft  
**Last Updated**: 2026-04-14  
**Next Review**: After Phase 01 completion
