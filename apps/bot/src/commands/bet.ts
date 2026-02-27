import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import type { Command } from './index.js';

const DEFAULT_BALANCE = 1000;

/**
 * Calculate simple odds based on average squad OVR difference.
 * Returns { home, draw, away } as decimal odds (e.g. 1.5, 3.2, 2.8).
 */
export async function calculateOdds(
  prisma: PrismaClient,
  homeTeamId: string,
  awayTeamId: string,
): Promise<{ home: number; draw: number; away: number }> {
  const [homeAvg, awayAvg] = await Promise.all([
    prisma.player.aggregate({ where: { teamId: homeTeamId }, _avg: { overall: true } }),
    prisma.player.aggregate({ where: { teamId: awayTeamId }, _avg: { overall: true } }),
  ]);

  const homeOvr = homeAvg._avg.overall ?? 50;
  const awayOvr = awayAvg._avg.overall ?? 50;
  const diff = homeOvr - awayOvr; // positive = home is stronger

  // Convert OVR diff to implied probabilities, then to odds
  // Base: 40% home, 25% draw, 35% away. Shift by ~2% per OVR point difference.
  const shift = diff * 0.02;
  let homeProb = Math.min(0.85, Math.max(0.10, 0.40 + shift));
  let awayProb = Math.min(0.85, Math.max(0.10, 0.35 - shift));
  let drawProb = 1 - homeProb - awayProb;
  if (drawProb < 0.05) {
    drawProb = 0.05;
    const total = homeProb + awayProb;
    homeProb = (homeProb / total) * 0.95;
    awayProb = (awayProb / total) * 0.95;
  }

  return {
    home: parseFloat((1 / homeProb).toFixed(2)),
    draw: parseFloat((1 / drawProb).toFixed(2)),
    away: parseFloat((1 / awayProb).toFixed(2)),
  };
}

export const bet: Command = {
  data: new SlashCommandBuilder()
    .setName('bet')
    .setDescription('Bet on friendly match outcomes')
    .addSubcommand((sub) =>
      sub
        .setName('place')
        .setDescription('Place a bet on a friendly match')
        .addStringOption((opt) =>
          opt.setName('match-id').setDescription('The match ID (UUID)').setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('pick')
            .setDescription('Your pick')
            .setRequired(true)
            .addChoices(
              { name: 'Home Win', value: 'HOME' },
              { name: 'Away Win', value: 'AWAY' },
              { name: 'Draw', value: 'DRAW' },
            ),
        )
        .addIntegerOption((opt) =>
          opt
            .setName('amount')
            .setDescription('Amount to wager')
            .setRequired(true)
            .setMinValue(10)
            .setMaxValue(500),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('balance').setDescription('Check your betting balance'),
    )
    .addSubcommand((sub) =>
      sub.setName('history').setDescription('View your recent bet history'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('odds')
        .setDescription('View odds for a match')
        .addStringOption((opt) =>
          opt.setName('match-id').setDescription('The match ID (UUID)').setRequired(true),
        ),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'place') {
      await handlePlace(interaction, prisma);
    } else if (sub === 'balance') {
      await handleBalance(interaction, prisma);
    } else if (sub === 'history') {
      await handleHistory(interaction, prisma);
    } else if (sub === 'odds') {
      await handleOdds(interaction, prisma);
    }
  },
};

async function getOrCreateBalance(prisma: PrismaClient, discordUserId: string) {
  return prisma.bettingBalance.upsert({
    where: { discordUserId },
    update: {},
    create: { discordUserId, balance: DEFAULT_BALANCE },
  });
}

async function handlePlace(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply();

  const matchId = interaction.options.getString('match-id', true);
  const pick = interaction.options.getString('pick', true) as 'HOME' | 'AWAY' | 'DRAW';
  const amount = interaction.options.getInteger('amount', true);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      round: { include: { competition: true } },
    },
  });

  if (!match) {
    await interaction.editReply('Match not found.');
    return;
  }

  if (match.round.competition.type !== 'FRIENDLY') {
    await interaction.editReply('Betting is only available for friendly matches.');
    return;
  }

  if (match.status !== 'SCHEDULED') {
    await interaction.editReply('Bets are only allowed on scheduled matches (before kick-off).');
    return;
  }

  // Check for existing bet
  const existing = await prisma.matchBet.findUnique({
    where: {
      matchId_discordUserId: {
        matchId,
        discordUserId: interaction.user.id,
      },
    },
  });
  if (existing) {
    await interaction.editReply('You already have a bet on this match. One bet per match.');
    return;
  }

  // Check balance
  const bal = await getOrCreateBalance(prisma, interaction.user.id);
  if (bal.balance < amount) {
    await interaction.editReply(
      `Insufficient balance. You have **${bal.balance}** coins but tried to wager **${amount}**.`,
    );
    return;
  }

  // Calculate odds
  const odds = await calculateOdds(prisma, match.homeTeamId, match.awayTeamId);
  const selectedOdds = pick === 'HOME' ? odds.home : pick === 'AWAY' ? odds.away : odds.draw;
  const potentialPayout = Math.floor(amount * selectedOdds);

  // Place bet and deduct balance in transaction
  await prisma.$transaction([
    prisma.matchBet.create({
      data: {
        matchId,
        discordUserId: interaction.user.id,
        amount,
        pick,
        odds: selectedOdds,
        status: 'PENDING',
      },
    }),
    prisma.bettingBalance.update({
      where: { discordUserId: interaction.user.id },
      data: { balance: { decrement: amount } },
    }),
  ]);

  const pickLabel =
    pick === 'HOME'
      ? match.homeTeam.name
      : pick === 'AWAY'
        ? match.awayTeam.name
        : 'Draw';

  const embed = new EmbedBuilder()
    .setTitle('Bet Placed!')
    .setColor(0x57f287)
    .setDescription(
      `**${match.homeTeam.name}** vs **${match.awayTeam.name}**`,
    )
    .addFields(
      { name: 'Pick', value: pickLabel, inline: true },
      { name: 'Wager', value: `${amount} coins`, inline: true },
      { name: 'Odds', value: `${selectedOdds}x`, inline: true },
      { name: 'Potential Payout', value: `${potentialPayout} coins`, inline: true },
      { name: 'Remaining Balance', value: `${bal.balance - amount} coins`, inline: true },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleBalance(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply({ flags: 64 }); // ephemeral

  const bal = await getOrCreateBalance(prisma, interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle('Betting Balance')
    .setDescription(`You have **${bal.balance}** coins`)
    .setColor(0x5865f2)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleHistory(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply({ flags: 64 }); // ephemeral

  const bets = await prisma.matchBet.findMany({
    where: { discordUserId: interaction.user.id },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true, result: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (bets.length === 0) {
    await interaction.editReply('No bets yet. Use `/bet place` on a friendly match!');
    return;
  }

  const lines = bets.map((b) => {
    const pickLabel =
      b.pick === 'HOME'
        ? b.match.homeTeam.name
        : b.pick === 'AWAY'
          ? b.match.awayTeam.name
          : 'Draw';
    const result = b.match.result
      ? `${b.match.result.homeScore}-${b.match.result.awayScore}`
      : 'Pending';
    const statusIcon =
      b.status === 'WON' ? '✅' : b.status === 'LOST' ? '❌' : b.status === 'PUSH' ? '🔄' : '⏳';
    const payoutStr = b.payout != null ? ` → ${b.payout} coins` : '';
    return `${statusIcon} **${b.match.homeTeam.name}** vs **${b.match.awayTeam.name}** — ${pickLabel} (${b.amount} @ ${b.odds}x) | ${result}${payoutStr}`;
  });

  const embed = new EmbedBuilder()
    .setTitle('Bet History')
    .setDescription(lines.join('\n'))
    .setColor(0x5865f2)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleOdds(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply();

  const matchId = interaction.options.getString('match-id', true);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      round: { include: { competition: true } },
    },
  });

  if (!match) {
    await interaction.editReply('Match not found.');
    return;
  }

  const odds = await calculateOdds(prisma, match.homeTeamId, match.awayTeamId);
  const isFriendly = match.round.competition.type === 'FRIENDLY';

  const embed = new EmbedBuilder()
    .setTitle(`Odds: ${match.homeTeam.name} vs ${match.awayTeam.name}`)
    .setColor(0x5865f2)
    .addFields(
      { name: match.homeTeam.name, value: `${odds.home}x`, inline: true },
      { name: 'Draw', value: `${odds.draw}x`, inline: true },
      { name: match.awayTeam.name, value: `${odds.away}x`, inline: true },
    )
    .setFooter({
      text: isFriendly
        ? 'Use /bet place to wager on this match'
        : 'Betting only available for friendly matches',
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
