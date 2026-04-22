# syntax=docker/dockerfile:1
# Next.js 15 standalone (monorepo). See docs/docker/container-images.md
ARG DEPS_IMAGE=agenticverdict/deps:local

FROM ${DEPS_IMAGE} AS deps

FROM deps AS builder
COPY packages ./packages
COPY tests ./tests
COPY apps ./apps
RUN node scripts/dockerPrebuild.mjs
ENV NEXT_TELEMETRY_DISABLED=1
ARG USE_TURBOPACK=false
# Default webpack for reproducible standalone traces; set USE_TURBOPACK=true for faster experimental builds.
RUN --mount=type=cache,target=/root/.cache/turbo \
    --mount=type=cache,target=/root/.cache/npm \
    if [ "$USE_TURBOPACK" = "true" ]; then \
      pnpm --filter @agenticverdict/frontend exec next build --no-lint --turbopack; \
    else \
      pnpm --filter @agenticverdict/frontend exec next build --no-lint; \
    fi

# Distroless runtime for Next.js standalone (no shell; Node fetch healthcheck).
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_OPTIONS="--dns-result-order=ipv4first --tls-min-v1.2"

COPY --from=builder --chown=65532:65532 /app/apps/web/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=65532:65532 /app/apps/web/public ./apps/web/public

USER 65532:65532
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["apps/web/server.js"]
