# ─── Base ─────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ─── Dependencies ─────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/bot/package.json ./apps/bot/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ─── Build & Run ──────────────────────────────────────
FROM deps AS production
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api/src/prisma ./apps/api/src/prisma
COPY apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY apps/bot ./apps/bot
RUN pnpm --filter @vcm/shared run build
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    pnpm --filter @vcm/api run db:generate

CMD ["pnpm", "--filter", "@vcm/bot", "run", "start"]
