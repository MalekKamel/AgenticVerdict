# Mock adapter configuration

This document describes how to run the AgenticVerdict API and worker with **mock platform adapters** and deterministic seed data, which is the default for local development and many integration tests.

## Enable mock adapters globally

When mock mode is on, connector fetches use **`@agenticverdict/data-connectors`** mock factories instead of live vendor APIs.

```bash
export AGENTICVERDICT_USE_MOCK_ADAPTERS=1
```

## Per-platform toggles

You can narrow mock usage by platform (exact variable names follow `@agenticverdict/config` / `ConfigurationService` — check `packages/config` for the current env map). Typical patterns include:

```bash
export AGENTICVERDICT_MOCK_META=1
export AGENTICVERDICT_MOCK_GA4=1
export AGENTICVERDICT_MOCK_GSC=1
export AGENTICVERDICT_MOCK_GBP=1
export AGENTICVERDICT_MOCK_TIKTOK=1
```

## Demo tenant company file

The demo tenant used in artifact verification lives at:

`configs/companies/22222222-2222-4222-8222-222222222222.json`

Ensure `marketing.channels` lists every platform you expect in `platformsAnalyzed`, with `"enabled": true` for each channel you want the worker to fetch. The worker loads this file via `ConfigManager` (`COMPANY_CONFIG_DIR` overrides the directory).

## Worker + BullMQ

Start Redis, API, and worker with the same env so job processors pick up mock configuration. Docker-oriented stacks are documented under `docs/docker/README.md`.

## Verification script

After a successful `marketing-analysis` or `verdict-generation` run for the demo tenant, `tests/scripts/verify-artifacts.sh` can assert platform coverage and non-placeholder provenance metrics when analysis results are fetched.
