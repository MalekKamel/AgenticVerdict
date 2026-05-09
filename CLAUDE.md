# CLAUDE.md

This file defines always-on guardrails for working in this repository.

## Non-negotiable constraints

1. No `any` types in production code.
2. No hardcoded tenant logic.
3. No tenant data access without tenant context and scoping safeguards.
4. No sensitive data in logs (credentials, tokens, raw PII).
5. No long-running blocking operations in API request handlers.
6. No platform-specific leakage into shared core abstractions.
7. Follow security-first defaults and fail-closed validation behavior.
