# Admin/Owner View Switching

## Problem

Admins are typically also team owners. Currently, the app shows either the admin dashboard or the owner dashboard based on the user's `Role` enum (`ADMIN` | `OWNER`). An admin who owns a team only ever sees the admin view and cannot access the owner experience.

## Decision

**Approach A: Zustand `activeView` state** — add a frontend-only view toggle to the existing auth store. No backend changes required.

## Design

### State Management

Add to `auth.store.ts`:
- `activeView: 'admin' | 'owner'` — defaults to `'admin'` for admins, `'owner'` for non-admins
- `switchView(view: 'admin' | 'owner')` — only effective when `user.role === 'ADMIN'`
- `isInAdminView()` — returns `true` when `activeView === 'admin'` AND user is actually an admin
- Persist `activeView` in localStorage (`vcm_active_view`); clear on logout
- On `setAuth()`, initialize `activeView` based on user role

Replace UI-rendering `isAdmin()` checks with `isInAdminView()`. Keep raw `isAdmin()` for permission checks (e.g., `AdminRoute`).

### Sidebar UI

- View switcher button in sidebar footer, between user info and "Sign out"
- Only visible when `user.role === 'ADMIN'`
- Shows the opposite action: "Switch to Owner View" / "Switch to Admin View"
- Clicking navigates to `/` so user lands on the correct dashboard
- Role badge shows "Admin View" / "Owner View" instead of raw role
- Admin nav section fully hidden when in owner view

### Dashboard & Routes

- `DashboardPage` checks `isInAdminView()` instead of `isAdmin()`
- `AdminRoute` still checks real role (`user.role === 'ADMIN'`) for URL-based access
- Owner view scopes to the admin's owned team via existing `/teams` endpoint
- If admin owns no team, owner view shows a "no team" message

### Files Changed

| File | Change |
|------|--------|
| `apps/web/src/stores/auth.store.ts` | Add `activeView`, `switchView()`, `isInAdminView()`, localStorage persistence |
| `apps/web/src/components/layout/AppShell.tsx` | Add view switcher button, conditional admin nav, updated role badge |
| `apps/web/src/routes/dashboard.tsx` | Use `isInAdminView()` instead of `isAdmin()` |
| `apps/web/src/components/auth/AdminRoute.tsx` | No change |

### Constraints

- Frontend-only change; backend permissions unchanged
- No new files or dependencies
- Admins never lose real access; view switch is a UX convenience
