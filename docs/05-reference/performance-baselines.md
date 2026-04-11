# Performance baselines (local)

This file records **developer-machine** timings for quick regression visibility. Numbers are not CI gates.

**Audit reference (Phase 00):** target ~5 minutes for a clean full monorepo build and ~30 seconds for typical incremental builds on a well-cached machine (`turbo`).

## How to record a row

```bash
pnpm benchmark:esbuild
pnpm benchmark:performance-baseline
# Optional: append a dated table to this file
PERFBASELINE_WRITE=1 pnpm benchmark:performance-baseline
```

Full monorepo timing (optional, slow):

```bash
/usr/bin/time -p pnpm exec turbo run build
```

---

## Run 2026-04-08T18:26:53.027Z

| Step                                   | Duration (ms) |
| -------------------------------------- | ------------- |
| API esbuild bundle                     | 645           |
| Worker esbuild bundle                  | 1733          |
| Agent-runtime typecheck (tsc --noEmit) | 7772          |
