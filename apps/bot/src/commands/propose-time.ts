import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { timeProposalEmbed } from '../utils/embeds.js';
import type { Command } from './index.js';

export const proposeTime: Command = {
  data: new SlashCommandBuilder()
    .setName('propose-time')
    .setDescription('Propose a time for a match')
    .addStringOption((opt) =>
      opt
        .setName('match-id')
        .setDescription('The match ID (UUID)')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('datetime')
        .setDescription('Proposed date/time (e.g. 2026-03-15 20:00)')
        .setRequired(true),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const matchId = interaction.options.getString('match-id', true);
    const datetimeStr = interaction.options.getString('datetime', true);

    const proposedTime = new Date(datetimeStr);
    if (isNaN(proposedTime.getTime())) {
      await interaction.editReply('Invalid date/time format. Use: YYYY-MM-DD HH:MM');
      return;
    }

    // Find the VCM user by Discord ID
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });
    if (!user) {
      await interaction.editReply(
        'You are not linked to a VCM account. Log in to the web app first.',
      );
      return;
    }

    // Verify the match exists and the user is involved
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
    if (!match) {
      await interaction.editReply('Match not found.');
      return;
    }

    const isAdmin = user.role === 'ADMIN';
    const isInvolved =
      match.homeTeam.ownerId === user.id || match.awayTeam.ownerId === user.id;

    if (!isAdmin && !isInvolved) {
      await interaction.editReply('You are not involved in this match.');
      return;
    }

    // Create the time proposal
    const proposal = await prisma.timeProposal.create({
      data: {
        matchId,
        proposedById: user.id,
        proposedTime,
      },
    });

    const embed = timeProposalEmbed({
      proposedBy: interaction.user.displayName,
      proposedTime,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      status: 'PENDING',
    });

    await interaction.editReply({ embeds: [embed] });

    // If we're in the match thread, also send to the thread for visibility
    if (
      interaction.channel?.isThread() &&
      interaction.channelId !== match.discordThreadId
    ) {
      // Already in the channel, no need to cross-post
    }
  },
};
