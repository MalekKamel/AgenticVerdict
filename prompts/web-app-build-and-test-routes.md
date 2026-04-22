# Web Application Build and Route Testing Guide

## Context

Authentication features in `/apps/frontend/src/routes/$locale/auth` have been implemented and require manual browser testing. The application is built with TanStack Start (Vite) and uses dynamic locale routing.

## Objective

Build the web application, analyze its route structure, and provide a comprehensive set of local URLs for testing all routes. Deliver a complete manual testing guide that ensures each route functions correctly in the browser.

## Requirements

### 1. Analyze Route Structure

- Examine the route definitions in `/apps/frontend/src/routes/` to identify all accessible paths.
- Document the route hierarchy, including dynamic segments (`$locale`) and nested routes.
- Note any route‑specific requirements (authentication, parameters, query strings).

### 2. Build the Web Application

- Run the appropriate build command to compile the application for local development.
- Verify the build completes without errors and that all TypeScript checks pass.
- Confirm the development server can start successfully.

### 3. Determine Local Testing URLs

- Based on the route analysis and the application’s configured port (default: 3000), generate a complete list of local URLs for each route.
- Include variations for supported locales (e.g., `/en`, `/ar`) and ensure RTL/LTR layout rendering is accounted for.
- For dynamic routes, provide example URLs with valid parameters.

### 4. Create a Comprehensive Manual Testing Guide

- Produce a markdown file that lists each route, its purpose, expected behavior, and the steps to verify functionality.
- Include pre‑conditions (e.g., logged‑in state, specific data) and post‑conditions (e.g., redirects, UI changes).
- Add a checklist for each route to track testing progress and outcomes.
- Incorporate accessibility (WCAG 2.1 AA) and multi‑language considerations where applicable.

## Workflow Summary

1. **Route Analysis**
   - Use `Glob` and `Read` tools to inspect `/apps/frontend/src/routes/` and its subdirectories.
   - Map the route tree, noting file‑based routing conventions (TanStack Router).

2. **Build Execution**
   - Run `pnpm dev` from the repository root to start all services (web, API, worker), or `pnpm --filter @agenticverdict/frontend dev` to start only the web app. For full authentication functionality, ensure the API service is also running.
   - Monitor the build output for errors; resolve any compilation or dependency issues.
   - Confirm the development server is reachable at `http://localhost:3000`.

3. **URL Generation**
   - Combine the base URL (`http://localhost:3000`) with each route pattern.
   - For locale‑specific routes, generate URLs for each supported language (`en`, `ar`, etc.).
   - Document any API health endpoints exposed by the web app (e.g., `/api/health`).

4. **Guide Assembly**
   - Create a new markdown file at `/docs/05-reference/manual-testing-guide.md`.
   - Structure the guide with an overview, prerequisites, route‑by‑route instructions, and a summary checklist.
   - Include screenshots or references to design files (`.pen`) where visual validation is needed.
   - Ensure the guide is self‑contained and can be used by QA or developers without additional context.

## Expected Output

1. **Route Analysis Report** – A concise list of all routes with their patterns and purposes.
2. **Build Success Confirmation** – Log output showing a clean build and running development server.
3. **Local URL List** – A complete set of accessible URLs, e.g.:
   - `http://localhost:3000/en/auth/login`
   - `http://localhost:3000/en/auth/register`
   - `http://localhost:3000/en/auth/forgot-password`
   - `http://localhost:3000/en/auth/reset-password`
   - `http://localhost:3000/en/auth/verify-email`
   - `http://localhost:3000/en/` (homepage)
   - `http://localhost:3000/api/health` (API health check)
4. **Manual Testing Guide** – A comprehensive markdown file saved at `/docs/05-reference/manual-testing-guide.md`, ready for use by QA or developers, containing:
   - Overview of the testing scope
   - Prerequisites (browser, locale settings, test accounts)
   - Step‑by‑step instructions for each route
   - Verification criteria and pass/fail indicators
   - Accessibility and localization checkpoints

## References

- `/docs/architecture/business/technical-architecture.md` – System architecture and component overview.
- `/docs/02-planning-and-methodology/testing-strategy.md` – Project testing standards and coverage targets.
- `/apps/frontend/package.json` – Web application scripts and dependencies.
- `/specs/00-core/01-connectors/` – Relevant specifications for authentication and routing.
- `/changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md` – Context on local development with mock adapters.
