# syntax=docker/dockerfile:1

# Stage 1: Base image with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/domain/package.json ./packages/domain/
COPY packages/app/package.json ./packages/app/
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/workers/package.json ./packages/workers/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# Stage 3: Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=deps /app/packages/app/node_modules ./packages/app/node_modules
COPY --from=deps /app/packages/adapters/node_modules ./packages/adapters/node_modules
COPY --from=deps /app/packages/workers/node_modules ./packages/workers/node_modules
COPY . .
RUN pnpm --filter @bt-log-viewer/web build

# Stage 4: Production dependencies
FROM base AS prod-deps
ENV PNPM_NODE_LINKER=hoisted
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/domain/package.json ./packages/domain/
COPY packages/app/package.json ./packages/app/
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/workers/package.json ./packages/workers/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts --filter @bt-log-viewer/web...

# Stage 5: Production image
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=sveltekit:nodejs /app/apps/web/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/apps/web/package.json ./

USER sveltekit

EXPOSE 3000

CMD ["node", "build"]
