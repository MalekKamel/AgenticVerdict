# Security

## Container hardening (Compose defaults)

### Application services (`web`, `api`, `worker` in `docker-compose.apps.yml`)

- **`read_only: true`** on the container root filesystem
- **`tmpfs`** for `/tmp` with `noexec,nosuid` and size limits
- **`cap_drop: [ALL]`**
- **`security_opt`:** `no-new-privileges:true` and **`seccomp=deploy/security/seccomp-profile.json`** (path relative to the compose file’s working directory when you run `docker compose`)
- **Resource limits** under `deploy.resources`

### Infrastructure services (`postgres`, `redis` in `docker-compose.yml`)

These use the same **read-only root**, **tmpfs**, **seccomp**, and **resource limits** pattern as the apps, but two details differ so the **official images start reliably**:

| Service      | Difference from apps                                                                                     | Why                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Postgres** | **No `cap_drop: [ALL]`**                                                                                 | The upstream entrypoint runs as root briefly to `chown` / `chmod` the data directory under the volume. With all capabilities dropped, that step fails (`Operation not permitted`) and the container exits.                                                                                                                                                                          |
| **Redis**    | **No `cap_drop`**, **no `no-new-privileges`**, **`user: "999:999"`**, **`entrypoint: ["redis-server"]`** | The stock `docker-entrypoint.sh` uses a setuid helper to become the `redis` user; `no-new-privileges:true` and aggressive cap dropping (with this seccomp profile) can block that path (`failed switching to "redis"`). Running `redis-server` directly as the image’s `redis` user (UID **999** in the official image) avoids setuid while keeping AOF on the `redis_data` volume. |

**Do not** re-add `cap_drop: [ALL]` to Postgres or the stock Redis entrypoint without retesting; if you tighten further, expect to adjust entrypoints, users, or volume ownership.

**Other exceptions:**

- **Promtail** runs as `root` to read the Docker socket (see [Observability](./observability.md)).
- **Falco** is **privileged** and mounts host paths — **Linux only**, profile `security`.

## AppArmor (optional, Linux)

Profile source: `deploy/security/apparmor-profile` (application profile name **`agenticverdict-app`**).

Load on the host (example):

```bash
sudo install -m 0644 deploy/security/apparmor-profile /etc/apparmor.d/agenticverdict-app
sudo apparmor_parser -r /etc/apparmor.d/agenticverdict-app
```

Apply to **web**, **api**, **worker** via `deploy/docker-compose.security-linux.override.yml` (appends `apparmor=agenticverdict-app` to `security_opt`). Postgres/Redis are omitted because entrypoints need a shell.

Example with the production example compose:

```bash
docker compose -f deploy/docker-compose.production.example.yml \
  -f deploy/docker-compose.security-linux.override.yml up -d
```

## Seccomp profile

`deploy/security/seccomp-profile.json` is referenced from Compose. The production example file uses `seccomp=security/seccomp-profile.json` **relative to the `deploy/` directory**.

## Image supply chain (CI)

- **Trivy** SARIF upload (CRITICAL/HIGH) for `web`, `api`, `worker` on `main` pushes/PRs and weekly schedule — see [Continuous integration](./continuous-integration.md).
- **SBOM:** SPDX JSON artifacts from Anchore `sbom-action` per service.
- **Release signing:** Cosign keyless signing after push to GHCR.

## Out of scope / follow-ups

- **Edge TLS:** terminate at ingress/LB; dev certs via `scripts/setup-tls.sh` only.
- **Minimal JS artifacts:** API/worker images still ship TypeScript execution via `tsx`; shrinking attack surface is a future optimization (see changelog “out of scope”).
