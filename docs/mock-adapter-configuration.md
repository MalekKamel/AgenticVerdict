# Mock adapter configuration

This document describes runtime-policy-driven mock adapter configuration.

## Core contract

```bash
export AGENTICVERDICT_RUNTIME_ENV=development
export AGENTICVERDICT_MOCK_MODE=all
export AGENTICVERDICT_MOCK_SCENARIO=normal
```

## Selective connector mode

```bash
export AGENTICVERDICT_RUNTIME_ENV=development
export AGENTICVERDICT_MOCK_MODE=selective
export AGENTICVERDICT_MOCK_CONNECTORS=meta,ga4,gsc
```

When mock mode is active, connector fetches use `@agenticverdict/data-connectors` mock factories instead of live vendor APIs.

## Demo tenant tenant file

The demo tenant used in artifact verification lives at:

`configs/tenants/22222222-2222-4222-8222-222222222222.json`

Ensure `marketing.channels` lists every platform you expect in `platformsAnalyzed`, with `"enabled": true` for each channel you want the worker to fetch. The worker loads this file via `ConfigManager` (`TENANT_CONFIG_DIR` overrides the directory).

## Worker + BullMQ

Start Redis, API, and worker with the same env so job processors pick up mock configuration. Docker-oriented stacks are documented under `docs/docker/README.md`.

## Verification script

After a successful `marketing-analysis` or `verdict-generation` run for the demo tenant, `tests/scripts/verify-artifacts.sh` can assert platform coverage and non-placeholder provenance metrics when analysis results are fetched.
