# Player Card Discord Command — Design

## Summary

A `/player-card` slash command that posts a rich embed displaying a player's name, headshot, skill group averages, and market value. An optional `transferlist` boolean parameter adds a link to the web app's trade offer page.

## Command Signature

```
/player-card <player> [transferlist]
```

- `player` (required, string with autocomplete) — Player name search. Autocomplete queries players by first/last name, returns up to 25 results formatted as `"FirstName LastName (POS, OVR XX)"` with UUID as value.
- `transferlist` (optional, boolean, default `false`) — When true, appends a "Propose Trade Offer" URL linking to `{FRONTEND_URL}/transfers/create-trade?playerId={id}`.

## Data Model Change

Add `value` field to the `Player` model:

```prisma
value Int @default(0)  // Abstract points representing market value
```

Requires a new Prisma migration.

## Embed Layout

```
┌──────────────────────────────────────┐
│ [Thumbnail: player.imageUrl]         │
│                                      │
│  Title: "FirstName LastName"         │
│  Description: "Position • Team Name" │
│                                      │
│  OVR: 82    POT: 88    Value: 1500  │  (inline)
│                                      │
│  ── Skill Groups ──────────────────  │
│  PAC: 78    SHO: 85    PAS: 72     │  (inline, 3 per row)
│  DRI: 80    DEF: 45    PHY: 68     │
│                                      │
│  Weak Foot: ★★★☆☆                   │
│                                      │
│  [If transferlist=true:]             │
│  🔗 Propose Trade Offer             │
│  {FRONTEND_URL}/transfers/create-    │
│    trade?playerId={id}               │
└──────────────────────────────────────┘
```

**Color coding** by overall rating:
- 85+: Gold (`0xFFD700`)
- 75–84: Blue (`0x5865F2`)
- Below 75: Bronze (`0xCD7F32`)

## Autocomplete

The bot currently has no autocomplete handler. The `interaction-create.ts` event handler must be extended to handle `isAutocomplete()` interactions in addition to `isChatInputCommand()`.

When the user types in the `player` field, the bot will:
1. Get the focused option's value (the partial text typed)
2. Query `prisma.player.findMany()` with an OR filter on `firstName`/`lastName` containing the text (case-insensitive)
3. Include the player's team relation for display
4. Limit to 25 results (Discord's max for autocomplete)
5. Return choices formatted as `"FirstName LastName (POS, OVR XX)"` with the player UUID as the choice value

## Skill Group Averages

Query the player's skills via:
```
player.skills → PlayerSkill.skillDefinition → SkillDefinition.skillGroup → SkillGroup.name
```

Group skills by `SkillGroup.name`, average the `PlayerSkill.value` per group, and display as inline embed fields. Groups are sorted by `SkillGroup.sortOrder`.

Abbreviate group names for the embed (e.g., "Pace" → "PAC", "Shooting" → "SHO"). If a player has no skills assigned, show "No skills data" instead.

## Transfer List Link

When `transferlist=true`, add a field:
- Name: `"📋 Transfer List"`
- Value: `"[Propose Trade Offer]({FRONTEND_URL}/transfers/create-trade?playerId={id})"`

The `create-trade` page will need a minor frontend enhancement to read the `playerId` query parameter and pre-select that player. This is a separate, optional follow-up.

## Command Interface Extension

The `Command` interface needs an optional `autocomplete` method:

```typescript
export interface Command {
  data: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction, prisma: PrismaClient) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction, prisma: PrismaClient) => Promise<void>;
}
```

## Files Changed

1. `apps/api/src/prisma/schema.prisma` — Add `value Int @default(0)` to Player model
2. New Prisma migration — `pnpm db:migrate`
3. `apps/bot/src/commands/index.ts` — Add `autocomplete?` to Command interface, register player-card command
4. `apps/bot/src/commands/player-card.ts` — New command file with execute + autocomplete handlers
5. `apps/bot/src/utils/embeds.ts` — Add `playerCardEmbed()` builder function
6. `apps/bot/src/events/interaction-create.ts` — Add autocomplete interaction handling branch
