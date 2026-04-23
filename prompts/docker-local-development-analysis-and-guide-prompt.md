## Docker Local Development Analysis and Guide

### Context

The current local testing workflow primarily uses `pnpm dev`. We now need a Docker-based local development workflow that runs all required services together to better mirror production behavior.

### Objective

Assess the existing Docker setup and implement the changes required to make Docker the recommended local development path, with support for live development workflows (file watching, rebuild/restart behavior, and fast feedback loops).

### Task

Perform a comprehensive review of the current Docker implementation and update the codebase where needed to support an effective production-like local environment.

### Required Work

1. Analyze all relevant Docker assets (Compose files, Dockerfiles, scripts, Make targets, and environment configuration) to identify gaps for local development usability and production parity.
2. Implement the necessary updates to enable:
   - reliable startup of all required services,
   - development-time change detection (watching),
   - rebuild/restart behavior aligned with local development needs,
   - clear and consistent developer commands.
3. Validate the updated workflow end-to-end and confirm it works for iterative development.
4. Create a dedicated documentation file that provides a complete local Docker development guide.

### Documentation Deliverable

Add a comprehensive guide that includes:

- prerequisites and setup,
- environment variable configuration,
- commands to start/stop/rebuild services,
- watch-mode development flow,
- common troubleshooting scenarios,
- recommended day-to-day workflow.

### Success Criteria

- Developers can run the full application stack locally using Docker.
- Development changes are reflected through an explicit, documented watch/rebuild workflow.
- The guide is complete enough for a new team member to follow without additional context.
