# TanStack Start frontend (monorepo). See docs/docker/container-images.md
ARG DEPS_IMAGE=agenticverdict/deps:local

FROM ${DEPS_IMAGE} AS deps

FROM deps AS builder
ARG VITE_PUBLIC_API_URL
ENV VITE_PUBLIC_API_URL=${VITE_PUBLIC_API_URL}
ARG VITE_PUBLIC_DEFAULT_TENANT_ID
ENV VITE_PUBLIC_DEFAULT_TENANT_ID=${VITE_PUBLIC_DEFAULT_TENANT_ID}
COPY packages ./packages
COPY tests ./tests
COPY apps ./apps
RUN node scripts/dockerPrebuild.mjs
# Re-link workspace bins (e.g. vite) after source COPY overrides app dirs.
RUN --mount=type=cache,target=/pnpm-cache,id=pnpm-appuser,sharing=shared \
    pnpm install --frozen-lockfile --prefer-offline --store-dir /pnpm-cache
RUN --mount=type=cache,target=/root/.cache/turbo \
    --mount=type=cache,target=/root/.cache/npm \
    pnpm --filter @agenticverdict/frontend run build

# Distroless runtime for TanStack Start server output.
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_OPTIONS="--dns-result-order=ipv4first --tls-min-v1.2"

COPY --from=builder --chown=65532:65532 /app/apps/frontend/.output ./.output
COPY --from=builder --chown=65532:65532 /app/apps/frontend/public ./public
COPY --from=builder --chown=65532:65532 /app/configs ./configs

USER 65532:65532
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD [".output/server/index.mjs"]
