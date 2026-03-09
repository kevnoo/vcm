# Bot Autocomplete for All Commands

## Problem

Four commands require users to paste raw UUIDs (`match-id`, `competition-id`), and `/schedule` uses free-text competition name search. This is error-prone and poor UX.

## Commands Getting Autocomplete

| Command | Old Option | New Option | Autocomplete Type |
|---------|-----------|------------|-------------------|
| `/match-thread create` | `match-id` (UUID) | `match` | Match |
| `/match-thread all` | `competition-id` (UUID) | `competition` | Competition |
| `/propose-time` | `match-id` (UUID) | `match` | Match |
| `/setup channel` | `competition-id` (UUID) | `competition` | Competition |
| `/schedule` | `competition` (free-text) | `competition` | Competition |

Already done: `/submit-result` (match), `/player-card` (player).

## Shared Autocomplete Helpers

New file: `apps/bot/src/utils/autocomplete.ts`

### `autocompleteMatch(interaction, prisma, filter?)`

Queries matches with team name search. Display: `Home vs Away — Comp Round`.

Default filter: all non-completed matches. Callers can override:
- `submit-result`: `status IN (SCHEDULED, IN_PROGRESS)` and `result IS NULL` (existing behavior, stays in command)
- `propose-time`: same default (non-completed)
- `match-thread create`: all matches (threads can be created for any match)

Scoped by user role: admins see all, owners see their matches.

### `autocompleteCompetition(interaction, prisma)`

Queries competitions filtered by name. Display: `Name (TYPE, STATUS)`. Active competitions sorted first.

## Option Renaming

`match-id` → `match`, `competition-id` → `competition`. Requires `pnpm bot:deploy` after changes.

## Files Changed

- **New**: `apps/bot/src/utils/autocomplete.ts`
- **Modified**: `match-thread.ts`, `propose-time.ts`, `setup.ts`, `schedule.ts`
- **Unchanged**: `submit-result.ts` (already has custom autocomplete), `player-card.ts`, `demo.ts`
