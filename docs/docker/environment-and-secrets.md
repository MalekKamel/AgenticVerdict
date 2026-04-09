# Environment variables and secrets

## Compose application overlay (`docker-compose.apps.yml`)

| Variable                                    | Services                   | Purpose                                                     |
| ------------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`                                  | web, api, worker           | `production` in overlay                                     |
| `PORT`                                      | web (`3000`), api (`4000`) | Listen port inside container                                |
| `API_HOST`                                  | api                        | `0.0.0.0` for container networking                          |
| `DATABASE_URL`                              | web, api, worker           | Postgres DSN (service hostname `postgres`)                  |
| `REDIS_URL`                                 | web, api, worker           | Redis URL (service hostname `redis`)                        |
| `COMPANY_CONFIG_DIR`                        | web, api, worker           | Config injection root (`/app/configs/companies` in overlay) |
| `TMPDIR`                                    | web, api, worker           | `/tmp` for read-only rootfs compatibility                   |
| `XDG_CACHE_HOME`                            | web, api, worker           | `/tmp/.cache` (writable with read-only `/`)                 |
| `JWT_SECRET_FILE`                           | api                        | Path to secret file (`/run/secrets/jwt_secret`)             |
| `AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS` | worker                     | `1` avoids Chromium-backed generators in slim image         |

### Dev / test overlays (`docker-compose.dev.yml`, `docker-compose.test.yml`, `deploy/docker-compose.dev.override.yml`)

Merged **on top of** `docker-compose.apps.yml` for **api** and **worker** only (web keeps the apps overlay unless you add a custom service block).

| Variable / build arg               | Services    | Purpose                                                                |
| ---------------------------------- | ----------- | ---------------------------------------------------------------------- |
| `TARGET_STAGE` (Docker build arg)  | api, worker | `development`, `test`, or `production` — selects Dockerfile copy stage |
| `NODE_ENV` (build arg + env)       | api, worker | Runtime classification; must be non-`production` for mock adapter use  |
| `AGENTICVERDICT_USE_MOCK_ADAPTERS` | api, worker | `1` enables master mock toggle (with non-production `NODE_ENV`)        |
| `AGENTICVERDICT_MOCK_SCENARIO`     | api, worker | Optional; `docker-compose.test.yml` sets `normal` by default           |

Optional feature-style env vars consumed by `@agenticverdict/config` **`ConfigurationService`** (not required for Compose): `ENABLE_NEW_REPORT_GENERATOR`, `ENABLE_ADVANCED_ANALYTICS` (`"true"` / unset).

## File-backed secrets (development overlay)

Compose declares:

```yaml
secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

Generate with:

```bash
./scripts/generate-secrets.sh
```

Files created under `secrets/` (mode `600`):

- `jwt_secret.txt` — required for `docker-compose.apps.yml` API service
- `db_password.txt`, `redis_password.txt`, `encryption_key.txt` — reserved for production-style flows

**Do not commit** generated secrets or TLS material. `.gitignore` excludes `secrets/`, `deploy/tls/*.pem`, `backups/`, and related local paths.

## API JWT without Compose

For local or custom runs you may set **`JWT_SECRET`** (string, ≥ 8 characters) instead of `JWT_SECRET_FILE`. The middleware accepts either.

## Host-based development vs in-container URLs

When apps or tests run on the **host** against `docker compose up` infrastructure:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agenticverdict`
- `REDIS_URL=redis://localhost:6379`

See [Testing](./testing.md).

## Production example compose

`deploy/docker-compose.production.example.yml` uses **`${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}`** and interpolates that password into `DATABASE_URL` for services. Adjust registry/tags via **`REGISTRY`** and **`VERSION`**.
