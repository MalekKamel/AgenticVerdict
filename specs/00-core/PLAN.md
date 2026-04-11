# Core platform documentation plan

## Tooling

- **Authoring:** Markdown in-repo; no external SpecKit package was wired for this repository, so `SPEC.md` / `PLAN.md` / `TASKS.md` follow SpecKit-style headings manually.
- **Migration:** Phase folders were consolidated under `specs/00-core/<sub-phase>/` with renamed segments (`01-connectors`, `02-intelligence`, `03-insights`, `04-production-hardening`).
- **Validation:** Relative links from `specs/` to `docs/` use explicit `../../docs/...` prefixes from `specs/00-core/` where needed.

## Reference update rules

| Legacy segment                  | New path                                 |
| ------------------------------- | ---------------------------------------- |
| `phase-00-foundation`           | `/specs/00-core/00-foundation`           |
| `phase-01-platform-integration` | `/specs/00-core/01-connectors`           |
| `phase-02-agent-intelligence`   | `/specs/00-core/02-intelligence`         |
| `phase-03-report-generation`    | `/specs/00-core/03-insights`             |
| `phase-04-production-hardening` | `/specs/00-core/04-production-hardening` |

Cross-links in `docs/` and `CLAUDE.md` must use `/specs/...` root-relative paths for navigation from GitHub and local editors.

## Rollback

Use `git revert` on the migration commit if structural issues are found; avoid partial deletes of `specs/00-core/`.

---

Last Updated: 2026-04-11
