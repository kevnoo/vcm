# Player Card Discord Command — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/player-card` slash command to the Discord bot that displays a rich embed with player stats, skill group averages, and an optional transfer list link.

**Architecture:** New slash command with autocomplete for player search. Extends the bot's interaction handler to support autocomplete events. Adds a `value` field to the Player model via migration. Embed builder in the shared embeds utility.

**Tech Stack:** discord.js 14, Prisma ORM, TypeScript

---

### Task 1: Add `value` field to Player model

**Files:**
- Modify: `apps/api/src/prisma/schema.prisma:495` (Player model)

**Step 1: Add the field**

In `apps/api/src/prisma/schema.prisma`, add `value` after `overall` (line 495):

```prisma
  overall         Int      @default(50)
  value           Int      @default(0)
  weakFoot        Int      @default(3)
```

**Step 2: Generate migration and Prisma client**

Run:
```bash
cd apps/api && npx prisma migrate dev --name add-player-value
```

Expected: Migration created, Prisma client regenerated.

**Step 3: Commit**

```bash
git add apps/api/src/prisma/schema.prisma apps/api/src/prisma/migrations/
git commit -m "feat: add value field to Player model"
```

---

### Task 2: Extend Command interface with autocomplete support

**Files:**
- Modify: `apps/bot/src/commands/index.ts`

**Step 1: Add autocomplete to the Command interface**

Replace the existing `Command` interface in `apps/bot/src/commands/index.ts`:

```typescript
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  type SharedSlashCommand,
} from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { matchThread } from './match-thread.js';
import { proposeTime } from './propose-time.js';
import { submitResult } from './submit-result.js';
import { schedule } from './schedule.js';
import { setup } from './setup.js';
import { demo } from './demo.js';
import { playerCard } from './player-card.js';

export interface Command {
  data: SharedSlashCommand;
  execute: (
    interaction: ChatInputCommandInteraction,
    prisma: PrismaClient,
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    prisma: PrismaClient,
  ) => Promise<void>;
}

export const commands: Command[] = [
  matchThread,
  proposeTime,
  submitResult,
  schedule,
  setup,
  demo,
  playerCard,
];
```

> **Note:** The `playerCard` import will error until Task 4 creates the file. That's fine — complete Task 4 before running the bot.

**Step 2: Commit**

```bash
git add apps/bot/src/commands/index.ts
git commit -m "feat: extend Command interface with autocomplete support"
```

---

### Task 3: Add autocomplete handler to interaction event

**Files:**
- Modify: `apps/bot/src/events/interaction-create.ts`

**Step 1: Add the autocomplete branch**

Replace `apps/bot/src/events/interaction-create.ts` with:

```typescript
import { type Interaction, ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';

export async function onInteractionCreate(
  interaction: Interaction,
  prisma: PrismaClient,
) {
  // Handle autocomplete interactions
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
      await command.autocomplete(interaction, prisma);
    } catch (error) {
      console.error(`Autocomplete error for /${interaction.commandName}:`, error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction as ChatInputCommandInteraction, prisma);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);
    const reply = {
      content: 'Something went wrong executing that command.',
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
```

**Step 2: Commit**

```bash
git add apps/bot/src/events/interaction-create.ts
git commit -m "feat: add autocomplete interaction handler"
```

---

### Task 4: Create the playerCardEmbed builder

**Files:**
- Modify: `apps/bot/src/utils/embeds.ts`

**Step 1: Add the embed builder**

Append to the bottom of `apps/bot/src/utils/embeds.ts`:

```typescript
export function playerCardEmbed(data: {
  firstName: string;
  lastName: string;
  position: string;
  teamName: string | null;
  imageUrl: string | null;
  overall: number;
  potential: number;
  value: number;
  weakFoot: number;
  skillGroups: { name: string; average: number }[];
  transferUrl: string | null;
}) {
  const color =
    data.overall >= 85 ? 0xffd700 : data.overall >= 75 ? 0x5865f2 : 0xcd7f32;

  const stars = '★'.repeat(data.weakFoot) + '☆'.repeat(5 - data.weakFoot);

  const embed = new EmbedBuilder()
    .setTitle(`${data.firstName} ${data.lastName}`)
    .setDescription(`${data.position} • ${data.teamName ?? 'Free Agent'}`)
    .setColor(color)
    .addFields(
      { name: 'OVR', value: `${data.overall}`, inline: true },
      { name: 'POT', value: `${data.potential}`, inline: true },
      { name: 'Value', value: `${data.value.toLocaleString()}`, inline: true },
    );

  if (data.skillGroups.length > 0) {
    for (const group of data.skillGroups) {
      embed.addFields({
        name: abbreviateSkillGroup(group.name),
        value: `${Math.round(group.average)}`,
        inline: true,
      });
    }
  } else {
    embed.addFields({ name: 'Skills', value: 'No skill data', inline: false });
  }

  embed.addFields({ name: 'Weak Foot', value: stars, inline: false });

  if (data.imageUrl) {
    embed.setThumbnail(data.imageUrl);
  }

  if (data.transferUrl) {
    embed.addFields({
      name: '📋 Transfer List',
      value: `[Propose Trade Offer](${data.transferUrl})`,
      inline: false,
    });
  }

  return embed;
}

const SKILL_GROUP_ABBREV: Record<string, string> = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
};

function abbreviateSkillGroup(name: string): string {
  return SKILL_GROUP_ABBREV[name.toLowerCase()] ?? name.substring(0, 3).toUpperCase();
}
```

**Step 2: Commit**

```bash
git add apps/bot/src/utils/embeds.ts
git commit -m "feat: add playerCardEmbed builder"
```

---

### Task 5: Create the player-card command

**Files:**
- Create: `apps/bot/src/commands/player-card.ts`

**Step 1: Create the command file**

Create `apps/bot/src/commands/player-card.ts`:

```typescript
import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { playerCardEmbed } from '../utils/embeds.js';
import { FRONTEND_URL } from '../config.js';
import type { Command } from './index.js';

export const playerCard: Command = {
  data: new SlashCommandBuilder()
    .setName('player-card')
    .setDescription('Display a player card with stats and value')
    .addStringOption((opt) =>
      opt
        .setName('player')
        .setDescription('Search for a player by name')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addBooleanOption((opt) =>
      opt
        .setName('transferlist')
        .setDescription('Include a link to propose a trade offer')
        .setRequired(false),
    ) as SlashCommandBuilder,

  async autocomplete(interaction: AutocompleteInteraction, prisma: PrismaClient) {
    const focused = interaction.options.getFocused();

    if (!focused || focused.length < 1) {
      await interaction.respond([]);
      return;
    }

    const players = await prisma.player.findMany({
      where: {
        OR: [
          { firstName: { contains: focused, mode: 'insensitive' } },
          { lastName: { contains: focused, mode: 'insensitive' } },
        ],
      },
      include: { team: true },
      take: 25,
      orderBy: { overall: 'desc' },
    });

    const choices = players.map((p) => ({
      name: `${p.firstName} ${p.lastName} (${p.primaryPosition}, ${p.overall} OVR)${p.team ? ` — ${p.team.name}` : ''}`,
      value: p.id,
    }));

    await interaction.respond(choices);
  },

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const playerId = interaction.options.getString('player', true);
    const transferlist = interaction.options.getBoolean('transferlist') ?? false;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        team: true,
        skills: {
          include: {
            skillDefinition: {
              include: {
                skillGroup: true,
              },
            },
          },
        },
      },
    });

    if (!player) {
      await interaction.editReply('Player not found.');
      return;
    }

    // Calculate skill group averages
    const groupTotals = new Map<string, { sum: number; count: number; sortOrder: number }>();
    for (const skill of player.skills) {
      const groupName = skill.skillDefinition.skillGroup.name;
      const sortOrder = skill.skillDefinition.skillGroup.sortOrder;
      const existing = groupTotals.get(groupName) ?? { sum: 0, count: 0, sortOrder };
      existing.sum += skill.value;
      existing.count += 1;
      groupTotals.set(groupName, existing);
    }

    const skillGroups = Array.from(groupTotals.entries())
      .map(([name, { sum, count, sortOrder }]) => ({
        name,
        average: sum / count,
        sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const transferUrl = transferlist
      ? `${FRONTEND_URL}/transfers/create-trade?playerId=${player.id}`
      : null;

    const embed = playerCardEmbed({
      firstName: player.firstName,
      lastName: player.lastName,
      position: player.primaryPosition,
      teamName: player.team?.name ?? null,
      imageUrl: player.imageUrl ?? null,
      overall: player.overall,
      potential: player.potential,
      value: player.value,
      weakFoot: player.weakFoot,
      skillGroups,
      transferUrl,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
```

**Step 2: Commit**

```bash
git add apps/bot/src/commands/player-card.ts
git commit -m "feat: add /player-card slash command with autocomplete"
```

---

### Task 6: Deploy and test

**Step 1: Deploy the slash command to Discord**

Run:
```bash
pnpm bot:deploy
```

Expected: Output showing commands registered, including `player-card`.

**Step 2: Start the bot**

Run:
```bash
pnpm dev:bot
```

**Step 3: Test in Discord**

1. Type `/player-card` — verify autocomplete shows player results as you type
2. Select a player — verify embed displays with correct OVR, POT, value, skill group averages, weak foot stars, and team name
3. Test with `transferlist: True` — verify the "Propose Trade Offer" link appears and points to the correct URL
4. Test with a player that has no skills — verify "No skill data" appears
5. Test with a free agent (no team) — verify "Free Agent" displays

**Step 4: Commit all remaining changes (if any)**

```bash
git add -A
git commit -m "feat: complete /player-card command implementation"
```
