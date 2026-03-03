import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { resultEmbed } from '../utils/embeds.js';
import type { Command } from './index.js';

export const submitResult: Command = {
  data: new SlashCommandBuilder()
    .setName('submit-result')
    .setDescription('Submit a match result')
    .addStringOption((opt) =>
      opt
        .setName('match')
        .setDescription('Search for a match by team name')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('home-score')
        .setDescription('Home team score')
        .setRequired(true)
        .setMinValue(0),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('away-score')
        .setDescription('Away team score')
        .setRequired(true)
        .setMinValue(0),
    ) as SlashCommandBuilder,

  async autocomplete(interaction: AutocompleteInteraction, prisma: PrismaClient) {
    const focused = interaction.options.getFocused();

    // Find the Discord user to scope results
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    const isAdmin = user?.role === 'ADMIN';

    // Build filter: only matches that can have a result submitted
    const where: Record<string, unknown> = {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      result: null,
    };

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

    // If the user typed something, filter by team name
    if (focused && focused.length > 0) {
      const teamFilter = { contains: focused, mode: 'insensitive' as const };
      const nameCondition = [
        { homeTeam: { name: teamFilter } },
        { awayTeam: { name: teamFilter } },
      ];
      // Merge with existing OR (owned teams) if present
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
      // Discord autocomplete name max is 100 chars
      return {
        name: label.length > 100 ? label.slice(0, 97) + '...' : label,
        value: m.id,
      };
    });

    await interaction.respond(choices);
  },

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const matchId = interaction.options.getString('match', true);
    const homeScore = interaction.options.getInteger('home-score', true);
    const awayScore = interaction.options.getInteger('away-score', true);

    // Find the VCM user
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });
    if (!user) {
      await interaction.editReply(
        'You are not linked to a VCM account. Log in to the web app first.',
      );
      return;
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true, result: true },
    });
    if (!match) {
      await interaction.editReply('Match not found.');
      return;
    }

    if (match.result) {
      await interaction.editReply(
        `A result has already been submitted for this match (${match.result.homeScore}-${match.result.awayScore}, ${match.result.status}).`,
      );
      return;
    }

    const isAdmin = user.role === 'ADMIN';
    const isInvolved =
      match.homeTeam.ownerId === user.id || match.awayTeam.ownerId === user.id;

    if (!isAdmin && !isInvolved) {
      await interaction.editReply('You are not involved in this match.');
      return;
    }

    const status = isAdmin ? 'CONFIRMED' : 'PENDING';
    const result = await prisma.result.create({
      data: {
        matchId,
        homeScore,
        awayScore,
        status,
        submittedById: user.id,
      },
    });

    if (status === 'CONFIRMED') {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED' },
      });
    }

    const embed = resultEmbed({
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore,
      awayScore,
      submittedBy: interaction.user.displayName,
      status,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
