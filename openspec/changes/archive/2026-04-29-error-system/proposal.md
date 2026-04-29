## Why

Error behavior is currently fragmented across API, worker, frontend, and shared packages, which causes inconsistent contracts, duplicated mappings, and unsafe message exposure risks. This change is needed now to establish one canonical, enforceable error system before broader feature growth increases migration cost.

## What Changes

- Introduce a shared canonical error contract with a typed error code registry and normalized fault shape used across runtime surfaces.
- Standardize boundary translation for HTTP, tRPC, queue/worker, and frontend-safe payloads so all transports emit consistent, machine-readable error metadata.
- Consolidate frontend error consumption into one normalized adapter and remove feature-local error models and message-matching branches.
- Add structured observability semantics (logs and metrics dimensions) tied to canonical error metadata.
- Add governance checks that prevent legacy/non-compliant error patterns from reappearing.

## Capabilities

### New Capabilities

- `error-system-core`: Canonical error contract, typed code/category/surface model, normalization helpers, and transport translation interfaces.
- `error-system-boundaries`: Unified error translation behavior at API/tRPC/queue/worker boundaries with safe payload shaping.
- `error-system-frontend`: Frontend normalization, message-key mapping, retry metadata handling, and centralized client-side error logging.
- `error-system-governance`: CI and quality guardrails for code registry compliance, non-string-matching enforcement, and migration hardening.

### Modified Capabilities

- None.

## Impact

- Affected areas: `apps/api`, `apps/worker`, `apps/frontend`, `packages/core`, `packages/data-connectors`, `packages/agent-runtime`, `packages/observability`, and CI quality gates.
- API and tRPC error outputs become contract-driven with explicit code/category/retryability semantics.
- Queue and worker failure handling migrates from message matching to typed fault translation.
- Frontend error model and resolver paths are consolidated; legacy local error taxonomies are removed.
- Requires targeted unit/integration/system test updates and documentation for error-code lifecycle ownership.
