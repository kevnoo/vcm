# ─── Base ─────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ─── Dependencies ─────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ─── Development ──────────────────────────────────────
FROM deps AS development
COPY . .
RUN pnpm --filter @vcm/shared run build
CMD ["pnpm", "--filter", "@vcm/api", "run", "dev"]

# ─── Build ────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN pnpm --filter @vcm/shared run build
RUN pnpm --filter @vcm/api run db:generate
RUN pnpm --filter @vcm/api run build

# ─── Production ───────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/apps/api/src/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build /app/apps/api/src/prisma/migrations ./prisma/migrations
COPY --from=build /app/node_modules ./node_modules
COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000
CMD ["./entrypoint.sh"]
