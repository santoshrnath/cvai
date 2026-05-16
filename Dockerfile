# syntax=docker/dockerfile:1
# =============================================================================
# CV Intelligence Agent — production Dockerfile (Next.js standalone)
# =============================================================================
FROM node:20-bookworm-slim AS deps
WORKDIR /app
# Force dev deps to be installed (prisma, typescript, tailwind are devDependencies
# and are required at BUILD time). Override any NPM_CONFIG_PRODUCTION inherited
# from the base image or the surrounding environment.
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client via the local bin — no `npx` (which can silently
# fall back to fetching the latest Prisma major from the registry).
RUN ./node_modules/.bin/prisma generate
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

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

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
