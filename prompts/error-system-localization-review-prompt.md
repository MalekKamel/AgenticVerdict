## Error Message Localization Audit and Remediation

### Context

The error system has been implemented according to `/openspec/changes/error-system/tasks.md`, based on `/prompts/error-handling-single-source-of-truth-comprehensive-implementation-plan.md`.

### Objective

Ensure all error messages are fully localized and eliminate hardcoded user-facing error strings across the codebase.

### Task

Conduct a comprehensive audit of error-message generation and presentation paths, then implement localization for every user-facing message.

### Scope

- API, frontend, worker, shared packages, and any related error translation/mapping layers.
- Error constructors, adapters, mappers, middleware, route handlers, and UI display components.
- Tests and documentation that validate or describe error message behavior.

### Requirements

- No hardcoded user-facing error messages in business logic or UI rendering paths.
- All user-facing error messages must resolve through approved localization mechanisms.
- Preserve internal error codes and diagnostics while localizing only user-visible text.
- Maintain tenant-safe, security-safe messaging (no sensitive detail leakage).

### Deliverables

- Updated implementations with localized error messages.
- Test updates/additions that verify localization behavior and guard against regressions.
- A short audit summary listing:
  - Areas reviewed
  - Hardcoded messages found and fixed
  - Remaining risks or follow-up items (if any)

### Acceptance Criteria

- Every user-facing error message is localization-backed.
- No hardcoded user-facing error strings remain in audited paths.
- Relevant tests pass for modified areas.
