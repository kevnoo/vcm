# Team Reassignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to reassign teams to different owners, including creating placeholder users for people who haven't logged in yet.

**Architecture:** Backend adds a `POST /users` endpoint for placeholder user creation and updates the Discord OAuth flow to merge placeholders on login. Frontend adds an inline owner-reassignment UI to the team detail page, with a user dropdown and "new user" input mode.

**Tech Stack:** NestJS (backend), React + TanStack Query + Zustand (frontend), Prisma (ORM), pnpm workspaces with `@vcm/shared` types.

**Design doc:** `docs/plans/2026-02-24-team-reassignment-design.md`

---

### Task 1: Add `CreateUserDto` shared type

**Files:**
- Modify: `packages/shared/src/types/user.ts`
- Modify: `packages/shared/src/types/index.ts`

**Step 1: Add the DTO interface to the shared types**

In `packages/shared/src/types/user.ts`, add after the `User` interface:

```typescript
export interface CreateUserDto {
  discordUsername: string;
}
```

**Step 2: Export the new type**

In `packages/shared/src/types/index.ts`, change the User export line to:

```typescript
export type { User, CreateUserDto } from './user';
```

**Step 3: Build the shared package**

Run: `pnpm build:shared`
Expected: Clean build, no errors.

**Step 4: Commit**

```bash
git add packages/shared/src/types/user.ts packages/shared/src/types/index.ts
git commit -m "feat: add CreateUserDto to shared types"
```

---

### Task 2: Add `POST /users` backend endpoint for placeholder user creation

**Files:**
- Create: `apps/api/src/users/dto/create-user.dto.ts`
- Modify: `apps/api/src/users/users.service.ts`
- Modify: `apps/api/src/users/users.controller.ts`

**Step 1: Create the DTO with validation**

Create `apps/api/src/users/dto/create-user.dto.ts`:

```typescript
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  discordUsername: string;
}
```

**Step 2: Add `create` method to UsersService**

In `apps/api/src/users/users.service.ts`, add this method to the class:

```typescript
import { randomUUID } from 'crypto';

// Inside the class:
create(dto: { discordUsername: string }) {
  return this.prisma.user.create({
    data: {
      discordId: `placeholder:${randomUUID()}`,
      discordUsername: dto.discordUsername,
      role: 'OWNER',
    },
  });
}
```

**Step 3: Add POST endpoint to UsersController**

In `apps/api/src/users/users.controller.ts`:

1. Add imports: `Post`, `Body` from `@nestjs/common`, plus `RolesGuard`, `Roles` decorator, and the DTO.
2. Add the `RolesGuard` to the controller-level `@UseGuards`.
3. Add the endpoint:

```typescript
@Post()
@Roles('ADMIN')
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

The full updated controller should look like:

```typescript
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

**Step 4: Verify the API builds**

Run: `pnpm --filter @vcm/api run build`
Expected: Clean build, no errors.

**Step 5: Commit**

```bash
git add apps/api/src/users/dto/create-user.dto.ts apps/api/src/users/users.service.ts apps/api/src/users/users.controller.ts
git commit -m "feat: add POST /users endpoint for placeholder user creation (admin-only)"
```

---

### Task 3: Update auth service to merge placeholder users on Discord login

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`

**Step 1: Update `validateDiscordUser` method**

Replace the `validateDiscordUser` method in `apps/api/src/auth/auth.service.ts` with:

```typescript
async validateDiscordUser(profile: DiscordProfile) {
  // 1. Look up by real Discord ID (existing users who have logged in)
  let user = await this.prisma.user.findUnique({
    where: { discordId: profile.id },
  });

  if (!user) {
    // 2. Check for a placeholder user with matching discordUsername
    const placeholder = await this.prisma.user.findFirst({
      where: {
        discordUsername: profile.username,
        discordId: { startsWith: 'placeholder:' },
      },
    });

    if (placeholder) {
      // 3. Merge: update placeholder with real Discord identity
      user = await this.prisma.user.update({
        where: { id: placeholder.id },
        data: {
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
        },
      });
    } else {
      // 4. Brand new user — create from scratch
      user = await this.prisma.user.create({
        data: {
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
          role: 'OWNER',
        },
      });
    }
  } else {
    // Existing user — refresh profile fields
    user = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        discordUsername: profile.username,
        discordAvatar: profile.avatar,
      },
    });
  }

  return user;
}
```

**Step 2: Verify the API builds**

Run: `pnpm --filter @vcm/api run build`
Expected: Clean build, no errors.

**Step 3: Commit**

```bash
git add apps/api/src/auth/auth.service.ts
git commit -m "feat: merge placeholder users on Discord OAuth login"
```

---

### Task 4: Create `useUsers` hook (extract from create team page)

**Files:**
- Create: `apps/web/src/hooks/useUsers.ts`
- Modify: `apps/web/src/routes/teams/create.tsx`

**Step 1: Create the reusable hook file**

Create `apps/web/src/hooks/useUsers.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { User, CreateUserDto } from '@vcm/shared';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, CreateUserDto>({
    mutationFn: (data) => api.post('/users', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

**Step 2: Refactor `create.tsx` to use the new hook**

In `apps/web/src/routes/teams/create.tsx`:

1. Remove the `useQuery` and `api` imports, and the `User` type import.
2. Add: `import { useUsers } from '../../hooks/useUsers';`
3. Replace the inline `useQuery` call:

Before:
```typescript
const { data: users } = useQuery<User[]>({
  queryKey: ['users'],
  queryFn: () => api.get('/users').then((r) => r.data),
});
```

After:
```typescript
const { data: users } = useUsers();
```

The updated imports at top of file should be:
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateTeam } from '../../hooks/useTeams';
import { useUsers } from '../../hooks/useUsers';
```

**Step 3: Verify the frontend builds**

Run: `pnpm --filter @vcm/web run build`
Expected: Clean build, no errors.

**Step 4: Commit**

```bash
git add apps/web/src/hooks/useUsers.ts apps/web/src/routes/teams/create.tsx
git commit -m "refactor: extract useUsers hook from create team page"
```

---

### Task 5: Add reassign owner UI to team detail page

**Files:**
- Modify: `apps/web/src/routes/teams/detail.tsx`

**Step 1: Add imports and state**

Add to the imports at top of `detail.tsx`:

```typescript
import { useUsers, useCreateUser } from '../../hooks/useUsers';
import { useUpdateTeam } from '../../hooks/useTeams';
```

Add new state variables inside the component (after the existing budget state):

```typescript
const { data: users } = useUsers();
const updateTeam = useUpdateTeam();
const createUser = useCreateUser();

const [reassigning, setReassigning] = useState(false);
const [selectedUserId, setSelectedUserId] = useState('');
const [isNewUser, setIsNewUser] = useState(false);
const [newUsername, setNewUsername] = useState('');
const [showConfirm, setShowConfirm] = useState(false);
```

**Step 2: Add reassignment handler functions**

Add these functions inside the component (after the `saveBudget` function):

```typescript
const startReassign = () => {
  setSelectedUserId('');
  setNewUsername('');
  setIsNewUser(false);
  setReassigning(true);
};

const cancelReassign = () => {
  setReassigning(false);
  setShowConfirm(false);
};

const handleReassignClick = () => {
  if (isNewUser ? newUsername.trim() : selectedUserId) {
    setShowConfirm(true);
  }
};

const confirmReassign = async () => {
  let ownerId = selectedUserId;

  if (isNewUser) {
    try {
      const newUser = await createUser.mutateAsync({ discordUsername: newUsername.trim() });
      ownerId = newUser.id;
    } catch {
      return;
    }
  }

  updateTeam.mutate(
    { id: team.id, ownerId },
    {
      onSuccess: () => {
        setReassigning(false);
        setShowConfirm(false);
      },
    },
  );
};

const newOwnerName = isNewUser
  ? newUsername.trim()
  : users?.find((u) => u.id === selectedUserId)?.discordUsername ?? '';
```

**Step 3: Add the reassign UI to the JSX**

In the JSX, find the current owner display line:

```tsx
<p className="text-gray-500">
  Owner: {team.owner?.discordUsername ?? 'None'}
</p>
```

Replace it with:

```tsx
<div className="flex items-center gap-2">
  <p className="text-gray-500">
    Owner: {team.owner?.discordUsername ?? 'None'}
  </p>
  {isAdmin() && !reassigning && (
    <button
      onClick={startReassign}
      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
    >
      Reassign
    </button>
  )}
</div>
{reassigning && (
  <div className="mt-2 space-y-2">
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsNewUser(false)}
        className={`text-xs font-medium px-2 py-1 rounded ${!isNewUser ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
      >
        Existing User
      </button>
      <button
        onClick={() => setIsNewUser(true)}
        className={`text-xs font-medium px-2 py-1 rounded ${isNewUser ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
      >
        New User
      </button>
    </div>
    {isNewUser ? (
      <input
        type="text"
        placeholder="Discord username"
        value={newUsername}
        onChange={(e) => setNewUsername(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    ) : (
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Select user</option>
        {users
          ?.filter((u) => u.id !== team.ownerId)
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.discordUsername}
            </option>
          ))}
      </select>
    )}
    <div className="flex items-center gap-2">
      <button
        onClick={handleReassignClick}
        disabled={isNewUser ? !newUsername.trim() : !selectedUserId}
        className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
      >
        Reassign
      </button>
      <button
        onClick={cancelReassign}
        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
      >
        Cancel
      </button>
    </div>
    {showConfirm && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <p className="text-yellow-800">
          Reassign <strong>{team.name}</strong> from{' '}
          <strong>{team.owner?.discordUsername ?? 'None'}</strong> to{' '}
          <strong>{newOwnerName}</strong>?
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={confirmReassign}
            disabled={updateTeam.isPending || createUser.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium"
          >
            {updateTeam.isPending || createUser.isPending ? 'Reassigning...' : 'Confirm'}
          </button>
          <button
            onClick={cancelReassign}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
        {(updateTeam.isError || createUser.isError) && (
          <p className="text-red-600 text-xs mt-1">
            Failed to reassign. Please try again.
          </p>
        )}
      </div>
    )}
  </div>
)}
```

**Step 4: Verify the frontend builds**

Run: `pnpm --filter @vcm/web run build`
Expected: Clean build, no errors.

**Step 5: Commit**

```bash
git add apps/web/src/routes/teams/detail.tsx
git commit -m "feat: add team owner reassignment UI on team detail page"
```

---

### Task 6: Manual verification

**Step 1: Start the dev servers**

Run: `pnpm dev`

**Step 2: Verify admin can see the Reassign button**

1. Log in as an admin
2. Navigate to any team detail page (`/teams/:id`)
3. Verify "Reassign" button appears next to the owner name

**Step 3: Test reassignment to existing user**

1. Click "Reassign"
2. Select an existing user from the dropdown (current owner should be excluded)
3. Click "Reassign" button
4. Verify the confirmation dialog appears with correct names
5. Click "Confirm"
6. Verify the owner updates on the page

**Step 4: Test reassignment to new user**

1. Click "Reassign"
2. Toggle to "New User"
3. Enter a Discord username
4. Click "Reassign" then "Confirm"
5. Verify the owner updates to the new username

**Step 5: Verify non-admin cannot see Reassign button**

1. Log in as a non-admin owner
2. Navigate to a team detail page
3. Verify "Reassign" button does NOT appear
