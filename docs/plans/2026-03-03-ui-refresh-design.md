# UI Refresh: Toast System, Skeletons & Visual Refresh

**Date**: 2026-03-03
**Scope**: Login page, Owner dashboard, AppShell (sidebar/nav), toast notifications, skeleton loaders
**Direction**: Sports Broadcast aesthetic — dark surfaces, vivid accent colors, bold typography

## Color System

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-primary` | `#0f1117` | Main background, sidebar |
| `--surface-card` | `#1a1d27` | Cards, panels |
| `--surface-elevated` | `#242836` | Hover states, elevated elements |
| `--border` | `#2e3345` | Card borders, dividers |
| `--text-primary` | `#f0f2f5` | Primary text |
| `--text-secondary` | `#8b92a5` | Muted/secondary text |
| `--accent-primary` | `#4f8cff` | Links, primary buttons (broadcast blue) |
| `--accent-win` | `#22c55e` | Wins, success, confirmations |
| `--accent-loss` | `#ef4444` | Losses, errors, disputes |
| `--accent-draw` | `#f59e0b` | Draws, warnings, pending |
| `--accent-highlight` | `#a78bfa` | Trades, special items (violet) |

## Typography

**Font**: Outfit (Google Fonts) — geometric sans-serif, excellent number rendering, distinctive without being decorative.

- Display/headers: Outfit 700, larger sizes
- Body: Outfit 400-500
- Stats/numbers: Outfit 600-700, emphasized sizing

Single font family, varied by weight. Loaded via Google Fonts CDN.

## Toast System

**Library**: Sonner (~3KB)

**Configuration**:
- Mounted once in `App.tsx` via `<Toaster />`
- Position: bottom-right (desktop), bottom-center (mobile)
- Theme: dark, matching `--surface-card` background
- Duration: 4s success/info, 6s errors
- 4 variants: success (green border), error (red), info (blue), warning (amber)

**Integration points** (existing mutations, add `toast.*()` in callbacks):
- Result submission (success/error)
- Trade offer sent/accepted/rejected
- Item/bundle purchased
- Time proposal sent/accepted/declined
- Message send failure
- Free agency claim (replacing browser `confirm()`)
- Game stats submitted/confirmed/disputed

## Skeleton Loaders

**Component**: `<Skeleton className="h-4 w-32" />` — single reusable component.
- Animation: `animate-pulse` with `bg-[--surface-elevated]` color
- Rounded by default, accepts className for sizing

**Applied to**:
1. **Dashboard**: Team card skeleton, 4 mini stat skeletons, match list skeletons, results list skeletons
2. **Match Hub**: Status banner, result display, conversation placeholder
3. **Shop**: Grid of item card skeletons

Each gets a `*Skeleton` component mirroring the loaded layout structure.

## Login Page — "Broadcast Intro"

- Full-screen `--surface-primary` background
- Radial gradient glow behind logo (accent-primary, subtle)
- "VCM" wordmark: Outfit 700, 4-5rem
- "Virtual Career Mode" in tracked uppercase, muted
- "EAFC26 League Management" as smaller tagline
- Discord login button: accent-primary fill, Discord icon, hover lift + shadow
- Animated gradient border on card container (CSS-only, broadcast lower-third feel)
- Schedule generator link at bottom

No images or external assets. Pure CSS atmosphere.

## Owner Dashboard — "Match Center"

### Team Hero Section
- Full-width dark card, gradient border-bottom (accent-primary → accent-win)
- Team initial/logo prominent on left
- Team name in Outfit 700
- Stats row: Budget | Roster | Record in chip-style
- W-D-L with color-coded numbers (green/amber/red)

### Mini Stat Cards (4-grid)
- Dark surface, number as hero (3xl bold)
- Colored left-border per type: blue (competitions), green (upcoming), red (attention), violet (trades)
- Small uppercase label above

### Upcoming Matches (left column)
- Dark card, left color indicator bar per row
- Home/Away pill badge
- Opponent name primary, date right-aligned
- Competition + round in muted text

### Recent Results (right column)
- Dark card, prominent W/L/D colored pill badge
- Score displayed in medium weight

### Active Trades (conditional)
- Violet accent left-border
- Trade partner + status badge

### My Competitions (bottom)
- Progress bar: thin colored line showing matches played / total

## AppShell Refresh

### Sidebar
- Background: `--surface-primary`
- "VCM" wordmark: Outfit 700, subtle blue accent/glow
- Nav items: icon + label, `--surface-elevated` on hover
- Active state: left accent bar (accent-primary) instead of full bg
- Admin divider: thin line + "ADMIN" label, more visually distinct
- User section: Discord avatar with hover ring

### Main Content Area
- Background: `--surface-primary` (dark), replacing gray-50
- Content padding unchanged (p-4 md:p-8)

### Mobile
- Top bar: dark surface matching sidebar
- Overlay sidebar: same dark treatment

## Page Compatibility Strategy

Pages NOT being refreshed (teams, players, transfers, competitions, match hub, shop) currently use `bg-white` cards. On the new dark main background:
- White cards on dark background are readable (high contrast) — acceptable intermediate state
- A `.card` utility will be added for the new dark card style
- Only dashboard cards use the new dark style in this pass
- Other pages will be individually refreshed in future passes

## Dependencies Added

- `sonner` (toast library, ~3KB)
- Google Fonts: Outfit (loaded via `<link>` in index.html)
