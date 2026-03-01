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
