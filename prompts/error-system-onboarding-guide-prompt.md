Create a comprehensive onboarding guide for the repository's error system implementation.

Context:

- The error system has been implemented according to `/openspec/changes/error-system/tasks.md`.
- The implementation is based on `/prompts/error-handling-single-source-of-truth-comprehensive-implementation-plan.md`.

Objective:

- Produce a single, detailed onboarding document that helps new developers quickly understand, use, and extend the error system safely and consistently.

Scope the guide with clear, practical sections:

- Error system goals, design principles, and architectural boundaries
- Core concepts and terminology (error codes, categories, translators, adapters, boundaries)
- End-to-end error lifecycle across backend, frontend, shared core, and worker contexts
- Source-of-truth locations (specs, docs, code modules, and governance scripts)
- How to add a new error type/code, including required implementation steps and validation checks
- How localization, observability, and user-facing messaging are handled
- Integration points in API routes, middleware, tRPC, frontend mapping layers, and queue/worker flows
- Testing strategy and required test coverage for error-related changes
- Common pitfalls, anti-patterns, and troubleshooting guidance
- Governance and maintenance workflow (registry updates, review expectations, and ongoing compliance checks)

Requirements:

- Write for developers who are new to this codebase but experienced with TypeScript and modern full-stack patterns.
- Keep the content repository-specific, accurate, and implementation-aligned.
- Use professional, concise language with strong structure (headings, bullet points, and practical examples).
- Reference concrete internal paths/files wherever useful so readers can navigate directly.
- Emphasize correctness, tenant-safe behavior, and consistency with the established error-system standards.
