import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { discordTimestamp } from '../utils/format.js';
import { FRONTEND_URL } from '../config.js';
import type { Command } from './index.js';

export const schedule: Command = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('View upcoming matches')
    .addStringOption((opt) =>
      opt
        .setName('competition')
        .setDescription('Competition name (optional, shows all if omitted)')
        .setRequired(false),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('limit')
        .setDescription('Number of matches to show (default 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const competitionName = interaction.options.getString('competition');
    const limit = interaction.options.getInteger('limit') ?? 10;

    const where: any = {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    };

    if (competitionName) {
      where.round = {
        competition: {
          name: { contains: competitionName, mode: 'insensitive' },
          status: 'ACTIVE',
        },
      };
    } else {
      where.round = { competition: { status: 'ACTIVE' } };
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        round: { include: { competition: true } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { round: { roundNumber: 'asc' } }],
      take: limit,
    });

    if (matches.length === 0) {
      await interaction.editReply('No upcoming matches found.');
      return;
    }

    const lines = matches.map((m) => {
      const round = m.round.name ?? `Round ${m.round.roundNumber}`;
      const time = m.scheduledAt
        ? discordTimestamp(m.scheduledAt, 'f')
        : 'TBD';
      const thread = m.discordThreadId ? ` | <#${m.discordThreadId}>` : '';
      return `**${m.homeTeam.name}** vs **${m.awayTeam.name}** — ${round} | ${time}${thread}`;
    });

    const title = competitionName
      ? `Schedule: ${matches[0].round.competition.name}`
      : 'Upcoming Matches';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(lines.join('\n'))
      .setColor(0x5865f2)
      .setFooter({ text: `Showing ${matches.length} match(es)` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
