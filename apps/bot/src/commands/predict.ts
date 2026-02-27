import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { discordTimestamp } from '../utils/format.js';
import type { Command } from './index.js';

/**
 * Score a prediction against the actual result.
 * - Exact score: 3 pts
 * - Correct outcome (W/D/L): 1 pt
 * - Wrong: 0 pts
 */
export function scorePrediction(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
): number {
  if (predHome === actualHome && predAway === actualAway) return 3;
  const predOutcome = Math.sign(predHome - predAway);
  const actualOutcome = Math.sign(actualHome - actualAway);
  if (predOutcome === actualOutcome) return 1;
  return 0;
}

export const predict: Command = {
  data: new SlashCommandBuilder()
    .setName('predict')
    .setDescription('Predict match scores and compete on the leaderboard')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Submit or update a prediction for a match')
        .addStringOption((opt) =>
          opt.setName('match-id').setDescription('The match ID (UUID)').setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt.setName('home-score').setDescription('Predicted home score').setRequired(true).setMinValue(0),
        )
        .addIntegerOption((opt) =>
          opt.setName('away-score').setDescription('Predicted away score').setRequired(true).setMinValue(0),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('leaderboard')
        .setDescription('View prediction leaderboard')
        .addStringOption((opt) =>
          opt.setName('competition').setDescription('Competition name (optional)').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('mine')
        .setDescription('View your recent predictions'),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      await handleSet(interaction, prisma);
    } else if (sub === 'leaderboard') {
      await handleLeaderboard(interaction, prisma);
    } else if (sub === 'mine') {
      await handleMine(interaction, prisma);
    }
  },
};

async function handleSet(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply();

  const matchId = interaction.options.getString('match-id', true);
  const homeScore = interaction.options.getInteger('home-score', true);
  const awayScore = interaction.options.getInteger('away-score', true);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!match) {
    await interaction.editReply('Match not found.');
    return;
  }

  if (match.status !== 'SCHEDULED') {
    await interaction.editReply('Predictions are only allowed for scheduled matches (before kick-off).');
    return;
  }

  const prediction = await prisma.prediction.upsert({
    where: {
      matchId_discordUserId: {
        matchId,
        discordUserId: interaction.user.id,
      },
    },
    update: { homeScore, awayScore },
    create: {
      matchId,
      discordUserId: interaction.user.id,
      homeScore,
      awayScore,
    },
  });

  const embed = new EmbedBuilder()
    .setTitle('Prediction Saved')
    .setDescription(
      `**${match.homeTeam.name}** ${homeScore} - ${awayScore} **${match.awayTeam.name}**`,
    )
    .setColor(0x57f287)
    .setFooter({ text: 'You can update your prediction until the match starts' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply();

  const competitionName = interaction.options.getString('competition');

  const where: any = {};
  if (competitionName) {
    where.match = {
      round: {
        competition: {
          name: { contains: competitionName, mode: 'insensitive' },
        },
      },
    };
  }

  const predictions = await prisma.prediction.findMany({
    where,
    select: { discordUserId: true, points: true },
  });

  // Aggregate points by user
  const totals = new Map<string, number>();
  for (const p of predictions) {
    totals.set(p.discordUserId, (totals.get(p.discordUserId) ?? 0) + p.points);
  }

  const sorted = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (sorted.length === 0) {
    await interaction.editReply('No predictions scored yet.');
    return;
  }

  const lines = await Promise.all(
    sorted.map(async ([discordUserId, points], i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      try {
        const user = await interaction.client.users.fetch(discordUserId);
        return `${medal} **${user.displayName}** — ${points} pts`;
      } catch {
        return `${medal} <@${discordUserId}> — ${points} pts`;
      }
    }),
  );

  const title = competitionName ? `Predictions: ${competitionName}` : 'Prediction Leaderboard';
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(lines.join('\n'))
    .setColor(0x5865f2)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleMine(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply({ flags: 64 }); // ephemeral

  const predictions = await prisma.prediction.findMany({
    where: { discordUserId: interaction.user.id },
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
          result: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  if (predictions.length === 0) {
    await interaction.editReply('You have no predictions yet. Use `/predict set` to get started!');
    return;
  }

  const totalPoints = predictions.reduce((s, p) => s + p.points, 0);

  const lines = predictions.map((p) => {
    const pred = `${p.homeScore}-${p.awayScore}`;
    const actual = p.match.result
      ? `${p.match.result.homeScore}-${p.match.result.awayScore}`
      : 'TBD';
    const pts = p.match.result ? ` (+${p.points})` : '';
    return `**${p.match.homeTeam.name}** vs **${p.match.awayTeam.name}** — You: ${pred} | Actual: ${actual}${pts}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('Your Predictions')
    .setDescription(lines.join('\n'))
    .setColor(0x5865f2)
    .setFooter({ text: `Total points: ${totalPoints}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
