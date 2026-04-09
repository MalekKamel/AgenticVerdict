# syntax=docker/dockerfile:1
# Fastify API — runs TypeScript via tsx (workspace packages are noEmit). See docs/docker/container-images.md
# Multi-stage `TARGET_STAGE` selects NODE_ENV at copy time (development | test | production).
ARG NODE_VERSION=20
# Declared before any FROM so `FROM ${TARGET_STAGE}` below resolves at build time (BuildKit requirement).
ARG TARGET_STAGE=production

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json turbo.json ./
COPY apps ./apps
COPY packages ./packages
COPY tests ./tests
COPY configs ./configs
COPY scripts ./scripts
COPY eslint.config.mjs ./
RUN pnpm install --frozen-lockfile

FROM deps AS development
ENV NODE_ENV=development
COPY . .
RUN node scripts/dockerPrebuild.mjs

FROM deps AS test
ENV NODE_ENV=test
COPY . .
RUN node scripts/dockerPrebuild.mjs

FROM deps AS production
ENV NODE_ENV=production
COPY . .
RUN node scripts/dockerPrebuild.mjs

# `COPY --from=${VAR}` is invalid in BuildKit; alias the selected stage, then copy from a fixed name.
FROM ${TARGET_STAGE} AS app_build

FROM base AS runner
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS="--dns-result-order=ipv4first --tls-min-v1.2"
ENV PORT=4000
ENV API_HOST=0.0.0.0
COPY --from=app_build /app /app
RUN groupadd --gid 1001 appuser \
  && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
  && chown -R appuser:appuser /app
USER appuser
WORKDIR /app/apps/api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:4000/health || exit 1

# Avoid `pnpm` at runtime (Corepack may try to download when running as non-root without network policy)
CMD ["node", "--import", "tsx", "src/cli.ts"]
