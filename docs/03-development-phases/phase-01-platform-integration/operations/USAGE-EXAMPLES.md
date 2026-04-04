# Platform adapters — usage examples

## TypeScript: instantiate and fetch

The following pattern matches integration tests: build credentials from your secure store (decrypted DB row), authenticate once per job, then fetch and normalize.

```typescript
import {
  Ga4PlatformAdapter,
  ga4CredentialKeys,
  createDefaultAdapterInfrastructure,
  runNormalizationPipeline,
} from "@agenticverdict/platform-adapters";

async function ga4SnapshotForTenant() {
  const infra = createDefaultAdapterInfrastructure();
  const adapter = new Ga4PlatformAdapter({
    tenantId: "tenant-uuid",
    cache: infra.cache,
    metrics: infra.metrics,
    deadLetterQueue: infra.deadLetterQueue,
  });

  const credentials = {
    [ga4CredentialKeys.accessToken]: process.env.GA4_ACCESS_TOKEN!,
    [ga4CredentialKeys.propertyId]: "properties/123456789",
  };

  await adapter.authenticate(credentials);
  const raw = await adapter.fetchMetrics({
    start: "2026-01-01",
    end: "2026-01-31",
  });
  const normalized = adapter.normalizeData(raw, {
    start: "2026-01-01",
    end: "2026-01-31",
  });
  const pipeline = runNormalizationPipeline(normalized);
  return pipeline.snapshot;
}
```

### Registry-based resolution

```typescript
import {
  createAdapterRegistry,
  MetaPlatformAdapter,
  type PlatformAdapter,
} from "@agenticverdict/platform-adapters";

type Ctx = { tenantId: string };

const registry = createAdapterRegistry<Ctx>();
registry.register("meta", (ctx) => new MetaPlatformAdapter({ tenantId: ctx.tenantId }));

function loadAdapter(platform: Parameters<typeof registry.resolve>[0], ctx: Ctx): PlatformAdapter {
  return registry.resolve(platform, ctx);
}
```

## TypeScript: shared health bundle (Next.js pattern)

The web app uses a process singleton:

```typescript
import { createDefaultAdapterInfrastructure } from "@agenticverdict/platform-adapters";

const infra = createDefaultAdapterInfrastructure();
const report = await infra.getHealth();
```

See `apps/web/src/lib/adapter-infrastructure.ts` for the `globalThis` singleton wrapper.

## Python: probe deployment health

Adapters are implemented in TypeScript. Python services should treat the **HTTP health API** (or an internal gRPC/REST facade you add later) as the integration boundary.

```python
import os
import urllib.request

BASE = os.environ.get("WEB_BASE_URL", "http://localhost:3000")

def adapters_health():
    req = urllib.request.Request(f"{BASE}/api/health/adapters")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.read().decode("utf-8")

status, body = adapters_health()
assert status == 200, body
```

## Python: per-platform health row

```python
import json
import urllib.request

def platform_health(platform: str):
    url = f"http://localhost:3000/api/health/platforms/{platform}"
    with urllib.request.urlopen(url, timeout=10) as resp:
        return json.load(resp)

print(platform_health("meta")["healthScore"])
```

Replace `localhost:3000` with your environment’s web origin.

## cURL examples

```bash
curl -sS "$WEB_URL/api/health" | jq .
curl -sS "$WEB_URL/api/health/adapters" | jq .
curl -sS "$WEB_URL/api/health/platforms/ga4" | jq .
```
