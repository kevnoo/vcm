import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { resultEmbed } from '../utils/embeds.js';
import { scorePrediction } from './predict.js';
import type { Command } from './index.js';

export const submitResult: Command = {
  data: new SlashCommandBuilder()
    .setName('submit-result')
    .setDescription('Submit a match result')
    .addStringOption((opt) =>
      opt
        .setName('match-id')
        .setDescription('The match ID (UUID)')
        .setRequired(true),
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

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const matchId = interaction.options.getString('match-id', true);
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

      // Score predictions for this match
      await scorePredictions(prisma, matchId, homeScore, awayScore);

      // Settle bets for this match (friendly matches only)
      await settleBets(prisma, matchId, homeScore, awayScore);
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

/** Score all predictions for a confirmed match result. */
async function scorePredictions(
  prisma: PrismaClient,
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  for (const pred of predictions) {
    const points = scorePrediction(pred.homeScore, pred.awayScore, homeScore, awayScore);
    await prisma.prediction.update({
      where: { id: pred.id },
      data: { points },
    });
  }
}

/** Settle all bets for a confirmed friendly match result. */
async function settleBets(
  prisma: PrismaClient,
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { round: { include: { competition: true } } },
  });

  // Only settle bets on friendly matches
  if (!match || match.round.competition.type !== 'FRIENDLY') return;

  const bets = await prisma.matchBet.findMany({
    where: { matchId, status: 'PENDING' },
  });

  const actualOutcome: 'HOME' | 'AWAY' | 'DRAW' =
    homeScore > awayScore ? 'HOME' : homeScore < awayScore ? 'AWAY' : 'DRAW';

  for (const b of bets) {
    const won = b.pick === actualOutcome;
    const payout = won ? Math.floor(b.amount * b.odds) : 0;

    await prisma.$transaction([
      prisma.matchBet.update({
        where: { id: b.id },
        data: {
          status: won ? 'WON' : 'LOST',
          payout,
        },
      }),
      // Credit winnings back to balance (wager was already deducted)
      ...(won
        ? [
            prisma.bettingBalance.update({
              where: { discordUserId: b.discordUserId },
              data: { balance: { increment: payout } },
            }),
          ]
        : []),
    ]);
  }
}
