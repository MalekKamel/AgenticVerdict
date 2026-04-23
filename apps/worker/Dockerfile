# BullMQ worker — TypeScript via tsx. Chromium + fonts included for production-flow PDF jobs (R01/R02) and real report PDF output.
# Multi-stage `TARGET_STAGE`: development | test | production
# Source is layered separately from deps. Runner copies node_modules without --chown (faster than V2); files stay root-owned but remain readable to UID 1001 via default modes.
ARG DEPS_IMAGE=agenticverdict/deps:local
ARG CHROMIUM_IMAGE=agenticverdict/chromium-base:local
ARG TARGET_STAGE=production

FROM ${CHROMIUM_IMAGE} AS source
WORKDIR /app
COPY --chown=appuser:appuser packages ./packages
COPY --chown=appuser:appuser apps/worker ./apps/worker
COPY --chown=appuser:appuser apps/api/package.json ./apps/api/
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
RUN pnpm --filter @agenticverdict/worker build:vite

FROM ${TARGET_STAGE} AS app_build

FROM ${CHROMIUM_IMAGE} AS runner
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS="--dns-result-order=ipv4first --tls-min-v1.2"

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app/
COPY --from=deps /app/pnpm-workspace.yaml /app/
COPY --from=deps /app/pnpm-lock.yaml /app/
COPY --from=app_build /app/packages /app/packages
COPY --from=app_build /app/apps/worker /app/apps/worker
COPY --from=app_build /app/configs /app/configs
COPY --from=app_build /app/tools /app/tools
COPY --from=app_build /app/scripts /app/scripts
COPY --from=app_build /app/eslint.config.mjs /app/
COPY --from=app_build /app/tsconfig.json /app/
COPY --from=app_build /app/turbo.json /app/

USER appuser
WORKDIR /app/apps/worker

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then exec node dist/cli.mjs; else exec node --import tsx src/cli.ts; fi"]
