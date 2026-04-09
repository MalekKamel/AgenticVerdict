# syntax=docker/dockerfile:1
# BullMQ worker — TypeScript via tsx. Chromium + fonts included for production-flow PDF jobs (R01/R02) and real report PDF output.
# Multi-stage `TARGET_STAGE`: development | test | production
ARG NODE_VERSION=20
# Declared before any FROM so `FROM ${TARGET_STAGE}` below resolves at build time (BuildKit requirement).
ARG TARGET_STAGE=production

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
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
COPY --from=app_build /app /app
USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-core \
    wget \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1001 appuser \
  && useradd --uid 1001 --gid appuser --shell /bin/bash --create-home appuser \
  && chown -R appuser:appuser /app
USER appuser
WORKDIR /app/apps/worker

CMD ["node", "--import", "tsx", "src/cli.ts"]
