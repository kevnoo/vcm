# Admin/Owner View Switching — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins who are also team owners to switch between admin and owner views via a toggle in the sidebar.

**Architecture:** Add an `activeView` field to the existing Zustand auth store. The sidebar, dashboard, and nav conditionally render based on this field. No backend changes. The `AdminRoute` guard still checks the real `user.role` for URL-based access.

**Tech Stack:** React 19, Zustand 5, React Router 7, Tailwind CSS 4

---

### Task 1: Add `activeView` state to the auth store

**Files:**
- Modify: `apps/web/src/stores/auth.store.ts`

**Step 1: Update the `AuthState` interface**

Add three new members to the interface at `apps/web/src/stores/auth.store.ts:4-10`:

```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  activeView: 'admin' | 'owner';
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  switchView: (view: 'admin' | 'owner') => void;
  isAdmin: () => boolean;
  isInAdminView: () => boolean;
}
```

**Step 2: Implement the new state and actions**

Replace the store implementation at `apps/web/src/stores/auth.store.ts:12-24` with:

```typescript
export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('vcm_token'),
  user: null,
  activeView: (localStorage.getItem('vcm_active_view') as 'admin' | 'owner') ?? 'owner',
  setAuth: (token, user) => {
    localStorage.setItem('vcm_token', token);
    const defaultView = user.role === 'ADMIN' ? 'admin' : 'owner';
    const storedView = localStorage.getItem('vcm_active_view') as 'admin' | 'owner' | null;
    // Respect stored preference if user is admin, otherwise force 'owner'
    const activeView = user.role === 'ADMIN' && storedView ? storedView : defaultView;
    localStorage.setItem('vcm_active_view', activeView);
    set({ token, user, activeView });
  },
  clearAuth: () => {
    localStorage.removeItem('vcm_token');
    localStorage.removeItem('vcm_active_view');
    set({ token: null, user: null, activeView: 'owner' });
  },
  switchView: (view) => {
    const { user } = get();
    if (user?.role !== 'ADMIN') return;
    localStorage.setItem('vcm_active_view', view);
    set({ activeView: view });
  },
  isAdmin: () => get().user?.role === 'ADMIN',
  isInAdminView: () => get().activeView === 'admin' && get().user?.role === 'ADMIN',
}));
```

**Step 3: Verify the build compiles**

Run: `cd /Users/knoone/Documents/PersonalGitHub/vcm && pnpm --filter @vcm/web build`

Expected: Build succeeds (existing `isAdmin()` calls still work; new fields are additive).

**Step 4: Commit**

```bash
git add apps/web/src/stores/auth.store.ts
git commit -m "feat: add activeView state and switchView to auth store"
```

---

### Task 2: Update the sidebar with view switcher and conditional nav

**Files:**
- Modify: `apps/web/src/components/layout/AppShell.tsx`

**Step 1: Import `useNavigate` and destructure new store fields**

At the top of `AppShell`, update the store destructure and add navigate:

```typescript
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/auth.store';
```

Update the destructure inside `AppShell()` (line 26):

```typescript
const { user, clearAuth, isAdmin, isInAdminView, switchView } = useAuthStore();
const navigate = useNavigate();
```

**Step 2: Change admin nav visibility from `isAdmin()` to `isInAdminView()`**

At `apps/web/src/components/layout/AppShell.tsx:55`, change:

```typescript
// Before:
{isAdmin() && (

// After:
{isInAdminView() && (
```

**Step 3: Update the role badge to show view context**

At `apps/web/src/components/layout/AppShell.tsx:89`, change:

```typescript
// Before:
<p className="text-xs text-gray-400">{user?.role}</p>

// After:
<p className="text-xs text-gray-400">
  {isAdmin() ? (isInAdminView() ? 'Admin View' : 'Owner View') : user?.role}
</p>
```

**Step 4: Add the view switcher button between user info and sign out**

At `apps/web/src/components/layout/AppShell.tsx`, between the user info `</div>` (line 91) and the sign out `<button>` (line 92), add:

```typescript
{isAdmin() && (
  <button
    onClick={() => {
      const newView = isInAdminView() ? 'owner' : 'admin';
      switchView(newView);
      navigate('/');
      closeSidebar();
    }}
    className="mt-2 w-full text-sm text-indigo-400 hover:text-indigo-300 text-left flex items-center gap-2"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
    {isInAdminView() ? 'Switch to Owner View' : 'Switch to Admin View'}
  </button>
)}
```

**Step 5: Verify the build compiles**

Run: `cd /Users/knoone/Documents/PersonalGitHub/vcm && pnpm --filter @vcm/web build`

Expected: Build succeeds.

**Step 6: Commit**

```bash
git add apps/web/src/components/layout/AppShell.tsx
git commit -m "feat: add view switcher button and conditional admin nav in sidebar"
```

---

### Task 3: Update the dashboard to use `isInAdminView()`

**Files:**
- Modify: `apps/web/src/routes/dashboard.tsx`

**Step 1: Replace `isAdmin()` with `isInAdminView()` in the dashboard**

Replace the entire file content of `apps/web/src/routes/dashboard.tsx`:

```typescript
import { useAuthStore } from '../stores/auth.store';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { OwnerDashboard } from '../components/dashboard/OwnerDashboard';

export function DashboardPage() {
  const { user, isInAdminView } = useAuthStore();

  if (!user) return null;

  if (isInAdminView()) {
    return <AdminDashboard user={user} />;
  }

  return <OwnerDashboard user={user} />;
}
```

**Step 2: Verify the build compiles**

Run: `cd /Users/knoone/Documents/PersonalGitHub/vcm && pnpm --filter @vcm/web build`

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/web/src/routes/dashboard.tsx
git commit -m "feat: dashboard uses isInAdminView for conditional rendering"
```

---

### Task 4: Manual verification

**No files changed — this is a testing task.**

**Step 1: Start the dev server**

Run: `cd /Users/knoone/Documents/PersonalGitHub/vcm && pnpm dev`

**Step 2: Test as admin user**

1. Log in as an admin user
2. Verify the sidebar shows "Admin View" under the username
3. Verify admin nav items (Disputes, Pending Trades, etc.) are visible
4. Verify `AdminDashboard` is shown on `/`
5. Click "Switch to Owner View" in the sidebar footer
6. Verify sidebar now shows "Owner View" under the username
7. Verify admin nav items are hidden
8. Verify `OwnerDashboard` is shown on `/` scoped to the admin's team
9. Verify clicking "Switch to Admin View" restores the admin experience
10. Refresh the page — verify the view preference persists
11. Type `/admin/disputes` in URL bar while in owner view — verify it still works (real `isAdmin()` guard)
12. Sign out and back in — verify the stored view preference is respected

**Step 3: Test as regular owner**

1. Log in as a regular owner
2. Verify no switch button appears in the sidebar
3. Verify role badge shows "OWNER"
4. Verify `OwnerDashboard` is shown

**Step 4: Commit all if everything passes**

If any uncommitted fixes were needed during testing:

```bash
git add -A
git commit -m "fix: address issues found during view switching verification"
```
