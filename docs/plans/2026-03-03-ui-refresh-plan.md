# UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add toast notifications, skeleton loaders, and a sports broadcast visual refresh to the login, dashboard, and app shell.

**Architecture:** Install Sonner for toasts. Add Outfit font via Google Fonts. Define CSS custom properties for the dark color system. Refresh AppShell, login, and dashboard components. Add Skeleton component and dashboard skeleton. Wire toasts into existing mutation hooks.

**Tech Stack:** Sonner, Google Fonts (Outfit), Tailwind CSS 4, React 19

---

### Task 1: Install Sonner & Add Outfit Font

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/index.html`

**Step 1: Install Sonner**

Run: `pnpm --filter @vcm/web add sonner`

**Step 2: Add Google Fonts link to index.html**

In `apps/web/index.html`, add the Outfit font link after the title tag:

```html
    <title>Virtual Career Mode</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
```

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/index.html pnpm-lock.yaml
git commit -m "chore: add Sonner toast library and Outfit font"
```

---

### Task 2: CSS Design Tokens & Global Styles

**Files:**
- Modify: `apps/web/src/app.css`

**Step 1: Add CSS custom properties and global styles**

Add after `@import "tailwindcss";` in `apps/web/src/app.css`:

```css
@import "tailwindcss";

/* ─── VCM Design Tokens (Sports Broadcast) ─── */
:root {
  --surface-primary: #0f1117;
  --surface-card: #1a1d27;
  --surface-elevated: #242836;
  --border: #2e3345;
  --text-primary: #f0f2f5;
  --text-secondary: #8b92a5;
  --accent-primary: #4f8cff;
  --accent-win: #22c55e;
  --accent-loss: #ef4444;
  --accent-draw: #f59e0b;
  --accent-highlight: #a78bfa;
}

/* Apply Outfit font globally */
body {
  font-family: 'Outfit', system-ui, sans-serif;
  background-color: var(--surface-primary);
  color: var(--text-primary);
}

/* Skeleton pulse animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
.skeleton {
  animation: skeleton-pulse 1.8s ease-in-out infinite;
  background-color: var(--surface-elevated);
  border-radius: 0.375rem;
}
```

Keep the existing scrollbar-hide and tap-highlight styles below.

**Step 2: Commit**

```bash
git add apps/web/src/app.css
git commit -m "feat: add sports broadcast design tokens and global styles"
```

---

### Task 3: Skeleton Component

**Files:**
- Create: `apps/web/src/components/ui/Skeleton.tsx`

**Step 1: Create Skeleton component**

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ui/Skeleton.tsx
git commit -m "feat: add Skeleton loading component"
```

---

### Task 4: Mount Toaster in App.tsx

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Add Sonner Toaster**

Add import at the top of `apps/web/src/App.tsx`:

```tsx
import { Toaster } from 'sonner';
```

Wrap the return value in a fragment with the Toaster:

```tsx
export function App() {
  useCurrentUser();

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: "'Outfit', system-ui, sans-serif",
          },
        }}
      />
      <Routes>
        {/* ...existing routes unchanged... */}
      </Routes>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat: mount Sonner Toaster with dark theme"
```

---

### Task 5: Wire Toasts into Mutation Hooks

**Files:**
- Modify: `apps/web/src/hooks/useResults.ts`
- Modify: `apps/web/src/hooks/useItems.ts`
- Modify: `apps/web/src/hooks/useBundles.ts`
- Modify: `apps/web/src/hooks/useMatchScheduling.ts`
- Modify: `apps/web/src/hooks/useTrades.ts`
- Modify: `apps/web/src/hooks/useFreeAgency.ts`
- Modify: `apps/web/src/hooks/usePlayerGameStats.ts`
- Modify: `apps/web/src/hooks/useGameStats.ts`

**Pattern:** Add `import { toast } from 'sonner';` to each file. Add `toast.success(...)` inside existing `onSuccess` callbacks and `onError` with `toast.error(...)`. Do NOT add toasts to `useSendMessage` (too noisy for chat).

**Step 1: Wire toasts into useResults.ts**

Add `import { toast } from 'sonner';` at line 2.

Add toast calls inside each existing `onSuccess`:
- `useSubmitResult` → `toast.success('Result submitted');`
- `useDisputeResult` → `toast.success('Result disputed');`
- `useResolveResult` → `toast.success('Dispute resolved');`
- `useConfirmResult` → `toast.success('Result confirmed');`

Add `onError` to each mutation:
```tsx
onError: () => { toast.error('Something went wrong'); },
```

**Step 2: Wire toasts into useItems.ts** (owner-facing only)

- `useBuyItem` → `toast.success('Item purchased');` / `toast.error('Purchase failed');`
- `useUseItem` → `toast.success('Item applied');` / `toast.error('Failed to apply item');`

**Step 3: Wire toasts into useBundles.ts** (owner-facing only)

- `useBuyBundle` → `toast.success('Bundle purchased');` / `toast.error('Purchase failed');`

**Step 4: Wire toasts into useMatchScheduling.ts**

- `useProposeTime` → `toast.success('Time proposed');`
- `useRespondToProposal` → `toast.success('Response sent');`
- `useAdminSetTime` → `toast.success('Time set');`
- Skip `useSendMessage` — too frequent for toasts.
- Add `onError` to all.

**Step 5: Wire toasts into useTrades.ts**

- `useCreateTradeOffer` → `toast.success('Trade offer sent');`
- `useAcceptTrade` → `toast.success('Trade accepted');`
- `useRejectTrade` → `toast.success('Trade rejected');`
- `useCounterTrade` → `toast.success('Counter offer sent');`
- `useCancelTrade` → `toast.success('Trade cancelled');`
- Add `onError` to all.

**Step 6: Wire toasts into useFreeAgency.ts**

- `useClaimFreeAgent` → `toast.success('Free agent claimed');` / `toast.error('Claim failed');`

**Step 7: Wire toasts into usePlayerGameStats.ts**

- `useSubmitGameStats` → `toast.success('Game stats submitted');`
- `useConfirmGameStats` → `toast.success('Game stats confirmed');`
- `useDisputeStatField` → `toast.success('Stat disputed');`
- Add `onError` to all.

**Step 8: Wire toasts into useGameStats.ts**

- `useSaveLineup` → `toast.success('Lineup saved');`
- `useSaveSubstitutions` → `toast.success('Substitutions saved');`
- `useSavePlayerStats` → `toast.success('Player stats saved');`
- Add `onError` to all.

**Step 9: Commit**

```bash
git add apps/web/src/hooks/
git commit -m "feat: add toast notifications to all mutation hooks"
```

---

### Task 6: Replace browser confirm() in Free Agency

**Files:**
- Modify: `apps/web/src/routes/transfers/free-agency.tsx`

**Step 1: Replace confirm() with state-based confirmation**

Replace the `handleClaim` function and add a `claimingPlayerId` state:

```tsx
const [claimingPlayerId, setClaimingPlayerId] = useState<string | null>(null);

const handleClaim = (playerId: string) => {
  if (!userTeam) return;
  claimFreeAgent.mutate(
    { playerId, teamId: userTeam.id },
    { onSuccess: () => setClaimingPlayerId(null) },
  );
};
```

In the player card, replace the single Claim button with a confirm/cancel pattern:

```tsx
{claimingPlayerId === player.id ? (
  <div className="flex items-center gap-2">
    <span className="text-xs text-amber-400">50% value deducted</span>
    <button
      onClick={() => handleClaim(player.id)}
      disabled={claimFreeAgent.isPending}
      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded"
    >
      Confirm
    </button>
    <button
      onClick={() => setClaimingPlayerId(null)}
      className="text-xs text-gray-400 hover:text-gray-200"
    >
      Cancel
    </button>
  </div>
) : (
  <button
    onClick={() => setClaimingPlayerId(player.id)}
    className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded"
  >
    Claim
  </button>
)}
```

**Step 2: Add `useState` import if not present**

Add `import { useState } from 'react';` at the top.

**Step 3: Commit**

```bash
git add apps/web/src/routes/transfers/free-agency.tsx
git commit -m "fix: replace browser confirm() with inline confirmation UI"
```

---

### Task 7: AppShell Visual Refresh

**Files:**
- Modify: `apps/web/src/components/layout/AppShell.tsx`

**Step 1: Update sidebar styling**

Key changes to `AppShell.tsx`:

1. **Sidebar background**: Change `bg-gray-900` → `bg-[var(--surface-primary)]` on both desktop and mobile sidebars.

2. **VCM wordmark**: Replace the plain `<h1>` with styled version:
```tsx
<h1 className="text-xl font-bold tracking-tight">
  <span className="text-[var(--accent-primary)]">V</span>CM
</h1>
```

3. **Nav items active state**: Change from `bg-gray-700 text-white` to:
```tsx
isNavActive(item.to, location.pathname)
  ? 'text-white border-l-2 border-[var(--accent-primary)] bg-[var(--surface-elevated)] pl-[10px]'
  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-white pl-3'
```
Note: adjust padding to account for the 2px left border.

4. **Main content background**: Change `bg-gray-50` → `bg-[var(--surface-primary)]` on the root `<div>`.

5. **Mobile top bar**: Change `bg-gray-900` → `bg-[var(--surface-primary)]`.

6. **Border colors**: Change `border-gray-700` → `border-[var(--border)]` on dividers.

7. **Admin section divider**: Change `text-gray-500` → `text-[var(--text-secondary)]`.

8. **User section**: Change `text-gray-400` → `text-[var(--text-secondary)]`, `text-indigo-400` → `text-[var(--accent-primary)]`.

9. **Sidebar overlay**: Keep `bg-black/50` for the overlay.

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/AppShell.tsx
git commit -m "feat: refresh AppShell with sports broadcast dark theme"
```

---

### Task 8: Login Page Visual Refresh

**Files:**
- Modify: `apps/web/src/routes/login.tsx`

**Step 1: Redesign login page**

Replace the entire login page content with the broadcast intro design:

```tsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)] relative overflow-hidden">
      {/* Background glow effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent 70%)' }}
      />

      <div className="relative z-10 text-center px-6">
        {/* Animated border card */}
        <div className="relative p-px rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-win), var(--accent-primary))',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 4s ease infinite',
            }}
          />
          <div className="relative bg-[var(--surface-card)] rounded-2xl p-10 sm:p-14">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[var(--text-primary)]">
              <span className="text-[var(--accent-primary)]">V</span>CM
            </h1>
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[var(--text-secondary)] mt-2">
              Virtual Career Mode
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              EAFC26 League Management
            </p>

            <a
              href={`${API_URL}/auth/discord`}
              className="inline-flex items-center gap-3 bg-[var(--accent-primary)] hover:brightness-110 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all mt-8 hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
              </svg>
              Login with Discord
            </a>
          </div>
        </div>

        <a
          href="/tools/schedule-generator"
          className="inline-block mt-8 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          Try our free Schedule Generator &rarr;
        </a>
      </div>
    </div>
  );
}
```

**Step 2: Add the gradient-shift keyframe to app.css**

Add to `apps/web/src/app.css`:

```css
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

**Step 3: Commit**

```bash
git add apps/web/src/routes/login.tsx apps/web/src/app.css
git commit -m "feat: redesign login page with sports broadcast aesthetic"
```

---

### Task 9: Dashboard Skeleton Loader

**Files:**
- Create: `apps/web/src/components/dashboard/DashboardSkeleton.tsx`

**Step 1: Create dashboard skeleton**

```tsx
import { Skeleton } from '../ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <div>
      {/* Title skeleton */}
      <Skeleton className="h-8 w-64 mb-6" />

      {/* Team hero card skeleton */}
      <div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Mini stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface-card)] border border-[var(--border)] rounded-lg p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Two column grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface-card)] border border-[var(--border)] rounded-lg">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/dashboard/DashboardSkeleton.tsx
git commit -m "feat: add dashboard skeleton loader component"
```

---

### Task 10: Owner Dashboard Visual Refresh

**Files:**
- Modify: `apps/web/src/components/dashboard/OwnerDashboard.tsx`

This is the largest task. Transform the dashboard from white-on-gray to the sports broadcast dark theme.

**Step 1: Add DashboardSkeleton import and replace loading state**

At top of file, add:
```tsx
import { DashboardSkeleton } from './DashboardSkeleton';
```

Replace the loading return (line ~71):
```tsx
// BEFORE:
if (isLoading) {
  return <p className="text-gray-500">Loading dashboard...</p>;
}

// AFTER:
if (isLoading) {
  return <DashboardSkeleton />;
}
```

**Step 2: Update text colors and card surfaces throughout**

Apply these replacements across the file:
- `text-gray-900` → `text-[var(--text-primary)]`
- `text-gray-500` → `text-[var(--text-secondary)]`
- `text-gray-600` → `text-[var(--text-secondary)]`
- `text-gray-400` → `text-[var(--text-secondary)]`
- `text-gray-700` → `text-[var(--text-primary)]`
- `bg-white` → `bg-[var(--surface-card)]`
- `shadow` (standalone, on cards) → `border border-[var(--border)]`
- `border-gray-100` → `border-[var(--border)]`
- `hover:bg-gray-50` → `hover:bg-[var(--surface-elevated)]`
- `bg-yellow-50 border border-yellow-200` → `bg-amber-900/20 border border-amber-700/30`
- `text-yellow-800` → `text-amber-400`
- `text-yellow-600` → `text-amber-500/70`

**Step 3: Update the no-team warning**

```tsx
<div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-6 text-center">
  <p className="text-amber-400 font-medium">
    You don't have a team assigned yet.
  </p>
  <p className="text-amber-500/70 text-sm mt-1">
    Contact a league admin to get your team set up.
  </p>
</div>
```

**Step 4: Add colored left borders to MiniCard**

Update the MiniCard component to accept and render a left border accent:

```tsx
function MiniCard({
  label,
  value,
  highlight = false,
  accent,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  accent?: string;
}) {
  return (
    <div className={`bg-[var(--surface-card)] border border-[var(--border)] rounded-lg p-3 sm:p-4 ${accent ? `border-l-2 ${accent}` : ''}`}>
      <h3 className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider leading-tight">{label}</h3>
      <p
        className={`text-2xl sm:text-3xl font-bold mt-1 ${
          highlight ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
```

Update the MiniCard usages to pass accent colors:
```tsx
<MiniCard label="Competitions" value={myCompetitions.length} accent="border-l-[var(--accent-primary)]" />
<MiniCard label="Upcoming Matches" value={upcomingMatches.length} accent="border-l-[var(--accent-win)]" />
<MiniCard
  label="Needs Attention"
  value={pendingResultMatches.length}
  highlight={pendingResultMatches.length > 0}
  accent="border-l-[var(--accent-loss)]"
/>
<MiniCard
  label="Active Trades"
  value={activeTrades.length}
  highlight={activeTrades.length > 0}
  accent="border-l-[var(--accent-highlight)]"
/>
```

**Step 5: Color-code the W-D-L record**

Replace the plain record display:
```tsx
<span>
  Record: <strong className="text-[var(--text-primary)]">
    <span className="text-[var(--accent-win)]">{seasonRecord.wins}W</span>
    {' - '}
    <span className="text-[var(--accent-draw)]">{seasonRecord.draws}D</span>
    {' - '}
    <span className="text-[var(--accent-loss)]">{seasonRecord.losses}L</span>
  </strong>
</span>
```

**Step 6: Update result W/L/D badge colors for dark theme**

```tsx
const resultColor =
  resultChar === 'W'
    ? 'bg-emerald-900/40 text-emerald-400'
    : resultChar === 'L'
      ? 'bg-red-900/40 text-red-400'
      : 'bg-gray-700/40 text-gray-400';
```

**Step 7: Update TradeStatusBadge for dark theme**

```tsx
function TradeStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-900/30 text-amber-400',
    PENDING_APPROVAL: 'bg-blue-900/30 text-blue-400',
    COUNTERED: 'bg-purple-900/30 text-purple-400',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PENDING_APPROVAL: 'Awaiting Approval',
    COUNTERED: 'Countered',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[status] ?? 'bg-[var(--surface-elevated)] text-[var(--text-secondary)]'}`}>
      {labels[status] ?? status}
    </span>
  );
}
```

**Step 8: Update team hero card border**

Add a gradient bottom border to the team hero card:
```tsx
<div className="bg-[var(--surface-card)] border border-[var(--border)] rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
  {/* Gradient accent bar */}
  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-win))' }} />
  {/* ... existing card content with updated colors ... */}
</div>
```

**Step 9: Update team initial placeholder for dark theme**

```tsx
<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center text-xl sm:text-2xl font-bold text-[var(--text-secondary)] shrink-0">
```

**Step 10: Update link colors**

- Team name link: `hover:text-indigo-600` → `hover:text-[var(--accent-primary)]`
- Transfers link: `text-indigo-600 hover:text-indigo-800` → `text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80`
- Home/Away labels: keep `text-xs` but use `text-[var(--text-secondary)]`

**Step 11: Commit**

```bash
git add apps/web/src/components/dashboard/OwnerDashboard.tsx
git commit -m "feat: refresh owner dashboard with sports broadcast dark theme"
```

---

### Task 11: Verify and Build

**Step 1: Run the dev server**

Run: `pnpm dev:web`

Manually verify:
- Login page shows dark broadcast design with gradient border animation
- Dashboard loads with skeleton, then shows dark cards
- AppShell sidebar has accent left borders on active nav
- Toast notifications fire on actions (test by navigating)
- No white-on-white text issues on non-refreshed pages

**Step 2: Run build to check for TypeScript errors**

Run: `pnpm --filter @vcm/web build`

Fix any type errors.

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues from UI refresh"
```
