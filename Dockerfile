# syntax=docker/dockerfile:1
# =============================================================================
# CV Intelligence Agent — production Dockerfile (Next.js standalone)
# =============================================================================
FROM node:20-bookworm AS deps
WORKDIR /app
# Use the full bookworm image (not slim) so OpenSSL + build tooling are
# available for native deps. The runner stage stays slim for size.
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
COPY package.json package-lock.json* ./
# `--ignore-scripts` skips postinstall scripts (notably @prisma/engines which
# downloads native binaries). If any postinstall fails, npm ci can leave
# node_modules in a partially-installed state, which is what bit us here.
RUN npm ci --ignore-scripts
# `sharp` (transitive dep of @xenova/transformers) skipped its postinstall
# under --ignore-scripts and is missing its prebuilt linux-x64 binary.
# Re-run its install script to fetch the native binary for the current arch.
RUN cd node_modules/sharp && npm run install
# Generate Prisma engines here in the deps stage so they're cached
# alongside node_modules and binaries.prisma.sh DNS only matters once.
# Engine downloads can be flaky (intermittent EAI_AGAIN) — retry up to 6
# times with exponential backoff.
COPY prisma ./prisma
RUN for i in 1 2 3 4 5 6; do \
      ./node_modules/.bin/prisma generate && break; \
      echo "prisma generate attempt $i failed — sleeping $((i * 5))s before retry"; \
      sleep $((i * 5)); \
    done

FROM node:20-bookworm AS builder
WORKDIR /app
ENV NODE_ENV=development
# NEXT_PUBLIC_* env vars are baked into the client bundle at build time, so
# Clerk's publishable key MUST be present here. Receive it via build arg.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# CRITICAL: Next.js standalone server binds to 127.0.0.1 by default, which
# means Traefik (running in a different docker network) gets `connection
# refused`. Bind to all interfaces.
ENV HOSTNAME=0.0.0.0

# Native deps for pdf-parse / mammoth at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fontconfig \
  && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
  && useradd  --system --uid 1001 --gid nodejs nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma          ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# Include the Prisma CLI so `docker compose exec cvai-app npx prisma db push` works.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma     ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Give the nextjs user a writable HOME so npm cache and similar don't fail.
ENV HOME=/app

# Pre-create the local storage dir (used when STORAGE_PROVIDER=local) and
# chown the whole /app tree so the runtime user can write to it.
RUN mkdir -p /app/storage-local/cv-originals /app/storage-local/cv-chunks \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
