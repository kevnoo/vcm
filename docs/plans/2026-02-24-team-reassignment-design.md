# Team Reassignment Design

**Date:** 2026-02-24
**Status:** Approved

## Problem

Admins need the ability to reassign teams to different owners. This includes assigning teams to people who haven't yet logged into the app via Discord OAuth.

## Solution

Add a "Reassign Owner" flow to the team detail page, with backend support for creating placeholder users for unregistered owners.

## Data Model

No schema changes. The existing `Team.ownerId` foreign key supports reassignment.

**Placeholder users** are created as real `User` records with:
- `discordId`: `"placeholder:<uuid>"` (distinguishes from real Discord IDs)
- `discordUsername`: the username the admin enters
- `role`: `OWNER` (default)

When the person later logs in via Discord OAuth, the auth flow merges the placeholder record with the real Discord identity.

## Backend Changes

### 1. New endpoint: `POST /users` (admin-only)

- Accepts `{ discordUsername: string }`
- Creates a placeholder user with `discordId: "placeholder:<uuid>"`
- Returns the created user
- Guarded by `@Roles('ADMIN')`

### 2. Auth service: placeholder merge on login

In `AuthService.validateDiscordUser`:
1. Look up by `discordId` (existing behavior)
2. If not found, look up by `discordUsername` where `discordId` starts with `"placeholder:"`
3. If placeholder found, update it with the real `discordId` and `discordAvatar`
4. If neither found, create a new user (existing behavior)

This ensures placeholder users seamlessly inherit their teams, trades, and other relationships when they first log in.

### 3. No changes to `PATCH /teams/:id`

Already accepts `ownerId` in `UpdateTeamDto` and is admin-only.

## Frontend Changes

### Team Detail Page (`apps/web/src/routes/teams/detail.tsx`)

Add admin-only "Reassign Owner" inline edit, following the same pattern as the budget editor:

1. **Default:** Shows current owner with a "Reassign" button (admin-only)
2. **Edit mode:**
   - Dropdown of existing users (from `GET /users`)
   - Toggle to "New user" mode with a Discord username text input
3. **Confirmation:** Dialog: "Reassign [Team] from [Old Owner] to [New Owner]?"
4. **On confirm:**
   - New user: `POST /users` then `PATCH /teams/:id`
   - Existing user: `PATCH /teams/:id`
5. **Success:** Close edit, query invalidation refreshes the page

### New hooks

- `useUsers()` — extracted from inline query in `create.tsx`, reusable hook
- `useCreateUser()` — mutation for `POST /users`

## Files to Modify

**Backend:**
- `apps/api/src/users/users.controller.ts` — add `POST /` endpoint
- `apps/api/src/users/users.service.ts` — add `create` method
- `apps/api/src/users/dto/create-user.dto.ts` — new DTO
- `apps/api/src/auth/auth.service.ts` — add placeholder merge logic

**Frontend:**
- `apps/web/src/hooks/useUsers.ts` — new file, reusable user hooks
- `apps/web/src/routes/teams/detail.tsx` — add reassign UI
- `apps/web/src/routes/teams/create.tsx` — refactor to use `useUsers` hook
