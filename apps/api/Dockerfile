# Fastify API — runs TypeScript via tsx (workspace packages are noEmit). See docs/docker/container-images.md
# Multi-stage `TARGET_STAGE` selects NODE_ENV at copy time (development | test | production).
# Source is layered separately from deps. Runner extends the deps image so /app/node_modules stays 1001:1001 (COPY --from does not preserve ownership).
ARG DEPS_IMAGE=agenticverdict/deps:local
ARG NODE_VERSION=20
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

RUN groupadd --gid 1001 appuser \
  && useradd --uid 1001 --gid appuser --shell=/bin/bash --create-home appuser

FROM base AS source
WORKDIR /app
COPY --chown=appuser:appuser packages ./packages
COPY --chown=appuser:appuser apps/api ./apps/api
COPY --chown=appuser:appuser apps/worker/package.json ./apps/worker/
COPY --chown=appuser:appuser apps/worker/src ./apps/worker/src
COPY --chown=appuser:appuser configs ./configs
COPY --chown=appuser:appuser tools ./tools
COPY --chown=appuser:appuser scripts ./scripts
COPY --chown=appuser:appuser eslint.config.mjs ./
COPY --chown=appuser:appuser tsconfig.json ./
COPY --chown=appuser:appuser turbo.json ./
USER appuser
RUN node scripts/dockerPrebuild.mjs

FROM ${DEPS_IMAGE} AS deps

FROM deps AS buildenv
COPY --from=source /app /app

FROM buildenv AS development
ENV NODE_ENV=development

FROM buildenv AS test
ENV NODE_ENV=test

FROM buildenv AS production
ENV NODE_ENV=production
RUN pnpm --filter @agenticverdict/api build:vite

FROM ${TARGET_STAGE} AS app_build

FROM ${DEPS_IMAGE} AS runner
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS="--dns-result-order=ipv4first --tls-min-v1.2"
ENV PORT=4000
ENV API_HOST=0.0.0.0

COPY --from=app_build /app/package.json /app/
COPY --from=app_build /app/pnpm-workspace.yaml /app/
COPY --from=app_build /app/pnpm-lock.yaml /app/
COPY --from=app_build /app/packages /app/packages
COPY --from=app_build /app/apps/api /app/apps/api
COPY --from=app_build /app/apps/worker/src /app/apps/worker/src
COPY --from=app_build /app/configs /app/configs
COPY --from=app_build /app/tools /app/tools
COPY --from=app_build /app/scripts /app/scripts
COPY --from=app_build /app/eslint.config.mjs /app/
COPY --from=app_build /app/tsconfig.json /app/
COPY --from=app_build /app/turbo.json /app/

USER appuser
WORKDIR /app/apps/api
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:4000/health || exit 1

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then exec node dist/cli.mjs; else exec node --import tsx src/cli.ts; fi"]
