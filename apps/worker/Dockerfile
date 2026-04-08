# syntax=docker/dockerfile:1
# BullMQ worker — TypeScript via tsx. Chromium + fonts included for production-flow PDF jobs (R01/R02) and real report PDF output.
ARG NODE_VERSION=20

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

FROM deps AS build
COPY . .
RUN node scripts/dockerPrebuild.mjs

FROM base AS runner
# Accept NODE_ENV as build argument for runtime
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS="--dns-result-order=ipv4first --tls-min-v1.2"
COPY --from=build /app /app
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
