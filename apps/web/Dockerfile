# syntax=docker/dockerfile:1
# Next.js 15 standalone (monorepo). See docs/docker/container-images.md
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

FROM deps AS builder
COPY . .
RUN node scripts/dockerPrebuild.mjs
ENV NEXT_TELEMETRY_DISABLED=1
# Use webpack build (not --turbopack) for reproducible standalone traces in CI/images
RUN pnpm --filter @agenticverdict/web exec next build --no-lint

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
