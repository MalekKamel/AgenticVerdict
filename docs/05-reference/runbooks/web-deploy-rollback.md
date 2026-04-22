# Web app — deploy and rollback

**Date:** 2026-04-17  
**Scope:** TanStack Start web image / Node server (`apps/frontend` production build → Nitro `.output/`).

## Deploy (N+1)

1. **Build** the web app with `NODE_ENV=production`: `pnpm --filter @agenticverdict/frontend build` (CI does this before E2E and Lighthouse).
2. **Tag / record** the git SHA and image digest (or artifact id) promoted to the environment.
3. **Apply** the new version using your platform (Kubernetes rollout, Compose pull, etc.). Ensure **`PORT`** and **`VITE_*` / `API_URL`** env vars match the previous release unless intentionally changed.
4. **Smoke:** open `/en` and `/en/auth/login`; verify no CSP console errors (see `apps/frontend/README.md`).
5. **Session:** log in on staging, confirm dashboard loads; optional: telemetry ingest returns 202 when configured.

## Rollback (to N)

1. **Re-deploy** the prior known-good image or artifact (same command as deploy, previous tag/digest).
2. **Invalidate** CDN / edge cache if HTML or hashed assets are cached separately.
3. **Smoke** again: home, login, one authenticated page.
4. **Record** incident id, root cause, and whether a forward fix is tracked.

## Tabletop checklist (drill)

Use this as a **≤1 page** rehearsal; store dated notes in your ticket system.

| Step                                                 | Owner | Result |
| ---------------------------------------------------- | ----- | ------ |
| Deploy N+1 to staging                                |       |        |
| Verify app version / SHA                             |       |        |
| Roll back to N                                       |       |        |
| Sessions: users must re-login? (JWT / cookie change) |       |        |
| Static assets: no 404 on `/_build` or `/assets`      |       |        |

**Outcome template:** “Rolled from SHA **_ to _**; rollback completed in **_ min; sessions OK / notes: _**.”

## Drill record (fill when exercised)

| Field                      | Value |
| -------------------------- | ----- |
| Date (UTC)                 |       |
| Environment                |       |
| Participants (roles)       |       |
| Version deployed (N+1)     |       |
| Version rolled back to (N) |       |
| Rollback duration          |       |
| Session impact             |       |
| Asset / CDN checks         |       |
| Ticket / incident link     |       |

## References

- Docker SSOT: `docs/docker/README.md`
- CSP / headers: `apps/frontend/src/start.ts`, `apps/frontend/src/lib/csp.ts`, `apps/frontend/vite.config.ts`, `apps/frontend/README.md`
