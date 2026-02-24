# VCM — Virtual Career Mode

Web app for the Virtual Career Mode community, a self-managed EAFC26 video game league. Users authenticate via Discord OAuth2. Primary users: admins and team owners.

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: NestJS 11, Prisma ORM, PostgreSQL, Passport (Discord + JWT)
- **Frontend**: React 19, React Router 7, Zustand 5, TanStack Query 5, Tailwind CSS 4, Vite 6
- **Shared types**: `packages/shared` — enums, interfaces, DTOs

## Project Structure

- `apps/api/` — NestJS backend (port 3000)
- `apps/web/` — React frontend (port 5173)
- `packages/shared/` — Shared TypeScript types

## Common Commands

- `pnpm dev` — run all apps
- `pnpm build` — build all (run `pnpm build:shared` first if types changed)
- `pnpm --filter @vcm/web build` — build frontend only
- `pnpm db:migrate` — run Prisma migrations + generate client
- `pnpm db:generate` — generate Prisma client only
- `pnpm db:seed` — seed database
- `pnpm db:studio` — open Prisma Studio GUI

## Key Patterns

- **Auth**: Discord OAuth2 → Passport → JWT (7-day). Token in localStorage (`vcm_token`). Axios interceptor adds Bearer header.
- **Roles**: `ADMIN` | `OWNER` enum. Backend: `@Roles('ADMIN')` decorator + `RolesGuard`. Frontend: `AdminRoute` component checks `user.role`, `isInAdminView()` for UI rendering.
- **View switching**: Admins can toggle between admin/owner views via `activeView` in Zustand auth store. Use `isInAdminView()` for UI decisions, `isAdmin()` for permission checks.
- **API pattern**: NestJS controllers with class-validator DTOs. Prisma for DB access.
- **Frontend state**: Zustand for auth, React Query for server state. Hooks in `apps/web/src/hooks/`.
- **Prisma schema**: `apps/api/src/prisma/schema.prisma`. Generated client: `apps/api/src/generated/prisma`.

## What's Built

Phase 1 (League Setup) — complete:
- Teams (CRUD, owner reassignment, budgets)
- Competitions (double round robin, single round robin, knockout cup, playoff)
- Match scheduling (auto-generation), result submission, dispute workflow

Phase 2 (Players & Rosters) — in progress:
- Player database (positions, skills, play styles, roles)
- Per-match game stats with dispute/delegate system

Additional features:
- Transaction audit log (trades, free agency, waivers, admin moves)
- Trade offers with counters, waiver wire with bidding
- Item/boost system with bundles
- Admin dashboard with disputes, pending trades, league settings
- Owner dashboard with team-scoped views

## Environment Variables

`DATABASE_URL`, `JWT_SECRET`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_CALLBACK_URL`, `FRONTEND_URL`, `ADMIN_DISCORD_ID`
