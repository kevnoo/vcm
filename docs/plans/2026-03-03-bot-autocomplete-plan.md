# Bot Autocomplete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace raw UUID inputs with searchable autocomplete on all applicable Discord bot commands.

**Architecture:** Two shared autocomplete helpers (`autocompleteMatch`, `autocompleteCompetition`) in a new utils file, consumed by 4 command files. Commands with subcommands (`match-thread`, `setup`) route autocomplete by checking the focused option name.

**Tech Stack:** discord.js 14 (AutocompleteInteraction), Prisma ORM

**Design doc:** `docs/plans/2026-03-03-bot-autocomplete-design.md`

**No test framework** — verify manually with `pnpm dev:bot` and Discord.

---

### Task 1: Create shared autocomplete helpers

**Files:**
- Create: `apps/bot/src/utils/autocomplete.ts`

**Step 1: Create the autocomplete utility file**

```typescript
import type { AutocompleteInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';

/**
 * Shared match autocomplete. Searches by team name, returns match ID.
 * Display: "Home vs Away — Competition Round"
 *
 * @param filter - Prisma `where` overrides merged into the base query
 */
export async function autocompleteMatch(
  interaction: AutocompleteInteraction,
  prisma: PrismaClient,
  filter: Record<string, unknown> = {},
) {
  const focused = interaction.options.getFocused();

  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  const isAdmin = user?.role === 'ADMIN';

  const where: Record<string, unknown> = { ...filter };

  // Non-admins only see their own matches
  if (user && !isAdmin) {
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    const teamIds = ownedTeams.map((t) => t.id);
    where.OR = [
      { homeTeamId: { in: teamIds } },
      { awayTeamId: { in: teamIds } },
    ];
  }

  // Filter by team name if user typed something
  if (focused && focused.length > 0) {
    const teamFilter = { contains: focused, mode: 'insensitive' as const };
    const nameCondition = [
      { homeTeam: { name: teamFilter } },
      { awayTeam: { name: teamFilter } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: nameCondition }];
      delete where.OR;
    } else {
      where.OR = nameCondition;
    }
  }

  const matches = await prisma.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      round: { include: { competition: true } },
    },
    orderBy: [{ scheduledAt: 'asc' }, { round: { roundNumber: 'asc' } }],
    take: 25,
  });

  const choices = matches.map((m) => {
    const comp = m.round.competition.name;
    const round = m.round.name ?? `R${m.round.roundNumber}`;
    const label = `${m.homeTeam.name} vs ${m.awayTeam.name} — ${comp} ${round}`;
    return {
      name: label.length > 100 ? label.slice(0, 97) + '...' : label,
      value: m.id,
    };
  });

  await interaction.respond(choices);
}

/**
 * Shared competition autocomplete. Searches by name, returns competition ID.
 * Display: "Name (TYPE, STATUS)"
 */
export async function autocompleteCompetition(
  interaction: AutocompleteInteraction,
  prisma: PrismaClient,
) {
  const focused = interaction.options.getFocused();

  const where: Record<string, unknown> = {};
  if (focused && focused.length > 0) {
    where.name = { contains: focused, mode: 'insensitive' };
  }

  const competitions = await prisma.competition.findMany({
    where,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    take: 25,
  });

  const choices = competitions.map((c) => {
    const label = `${c.name} (${c.type}, ${c.status})`;
    return {
      name: label.length > 100 ? label.slice(0, 97) + '...' : label,
      value: c.id,
    };
  });

  await interaction.respond(choices);
}
```

**Step 2: Commit**

```bash
git add apps/bot/src/utils/autocomplete.ts
git commit -m "feat(bot): add shared match and competition autocomplete helpers"
```

---

### Task 2: Add autocomplete to `/propose-time`

**Files:**
- Modify: `apps/bot/src/commands/propose-time.ts`

**Step 1: Update the command**

Changes needed:
1. Add `AutocompleteInteraction` import
2. Import `autocompleteMatch` from utils
3. Import `Command` type (already imported)
4. Rename option from `match-id` to `match`, add `.setAutocomplete(true)`
5. Add `autocomplete` method calling `autocompleteMatch`
6. Update `execute` to read from `'match'` instead of `'match-id'`

Updated file — key diffs:

**Option definition** (line ~12): Change `'match-id'` → `'match'`, description from `'The match ID (UUID)'` → `'Search for a match by team name'`, add `.setAutocomplete(true)`.

**Add autocomplete method** before execute:
```typescript
async autocomplete(interaction: AutocompleteInteraction, prisma: PrismaClient) {
  await autocompleteMatch(interaction, prisma);
},
```

**In execute** (line 27): Change `getString('match-id', true)` → `getString('match', true)`.

**Step 2: Commit**

```bash
git add apps/bot/src/commands/propose-time.ts
git commit -m "feat(bot): add match autocomplete to /propose-time"
```

---

### Task 3: Add autocomplete to `/match-thread`

**Files:**
- Modify: `apps/bot/src/commands/match-thread.ts`

This command uses subcommands, so the autocomplete handler must check which option is focused.

**Step 1: Update the command**

Changes needed:
1. Add `AutocompleteInteraction` import
2. Import `autocompleteMatch` and `autocompleteCompetition` from utils
3. Rename `'match-id'` → `'match'` in `create` subcommand, add `.setAutocomplete(true)`, update description
4. Rename `'competition-id'` → `'competition'` in `all` subcommand, add `.setAutocomplete(true)`, update description
5. Add `autocomplete` method that routes by `interaction.options.getFocused(true).name`
6. Update `execute` to read `'match'` and `'competition'` instead of `'match-id'` and `'competition-id'`

**Autocomplete method:**
```typescript
async autocomplete(interaction: AutocompleteInteraction, prisma: PrismaClient) {
  const focused = interaction.options.getFocused(true);

  if (focused.name === 'match') {
    // match-thread create: show all matches (threads can be created for any)
    await autocompleteMatch(interaction, prisma);
  } else if (focused.name === 'competition') {
    await autocompleteCompetition(interaction, prisma);
  }
},
```

**In execute**: `getString('match-id', true)` → `getString('match', true)`, `getString('competition-id', true)` → `getString('competition', true)`.

**Step 2: Commit**

```bash
git add apps/bot/src/commands/match-thread.ts
git commit -m "feat(bot): add match and competition autocomplete to /match-thread"
```

---

### Task 4: Add autocomplete to `/setup channel`

**Files:**
- Modify: `apps/bot/src/commands/setup.ts`

Only the `channel` subcommand needs autocomplete (for `competition-id`). The `webhook` and `status` subcommands have no ID options.

**Step 1: Update the command**

Changes needed:
1. Add `AutocompleteInteraction` import
2. Import `autocompleteCompetition` from utils
3. Rename `'competition-id'` → `'competition'` in `channel` subcommand, add `.setAutocomplete(true)`, update description
4. Add `autocomplete` method calling `autocompleteCompetition`
5. Update `execute` to read `'competition'` instead of `'competition-id'`

**Autocomplete method:**
```typescript
async autocomplete(interaction: AutocompleteInteraction, prisma: PrismaClient) {
  await autocompleteCompetition(interaction, prisma);
},
```

**In execute** (line 82): `getString('competition-id', true)` → `getString('competition', true)`.

**Step 2: Commit**

```bash
git add apps/bot/src/commands/setup.ts
git commit -m "feat(bot): add competition autocomplete to /setup channel"
```

---

### Task 5: Add autocomplete to `/schedule`

**Files:**
- Modify: `apps/bot/src/commands/schedule.ts`

**Step 1: Update the command**

Changes needed:
1. Add `AutocompleteInteraction` import
2. Import `autocompleteCompetition` from utils
3. Add `.setAutocomplete(true)` to the `competition` option
4. Add `autocomplete` method calling `autocompleteCompetition`
5. Update `execute`: competition option now provides an ID, not a name. Change the filter logic from `name: { contains }` to `id: competitionId`.

**Updated execute filter logic:**
```typescript
const competitionId = interaction.options.getString('competition');

if (competitionId) {
  where.round = {
    competition: {
      id: competitionId,
      status: 'ACTIVE',
    },
  };
} else {
  where.round = { competition: { status: 'ACTIVE' } };
}
```

Also update the embed title logic — fetch competition name from the first match's round data (already included) instead of echoing back the free-text input.

**Step 2: Commit**

```bash
git add apps/bot/src/commands/schedule.ts
git commit -m "feat(bot): add competition autocomplete to /schedule"
```

---

### Task 6: Deploy and verify

**Step 1: Build to check for type errors**

```bash
cd apps/bot && npx tsc --noEmit
```

**Step 2: Deploy updated slash commands**

```bash
pnpm bot:deploy
```

**Step 3: Verify in Discord**

Test each command in Discord and confirm autocomplete appears:
- `/propose-time` → typing in match field shows match suggestions
- `/match-thread create` → match autocomplete
- `/match-thread all` → competition autocomplete
- `/setup channel` → competition autocomplete
- `/schedule` → competition autocomplete
- `/submit-result` → still works (unchanged)
- `/player-card` → still works (unchanged)

**Step 4: Commit plan doc**

```bash
git add docs/plans/2026-03-03-bot-autocomplete-design.md docs/plans/2026-03-03-bot-autocomplete-plan.md
git commit -m "docs: add autocomplete design and implementation plan"
```
