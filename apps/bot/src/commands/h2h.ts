import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import type { Command } from './index.js';

export const h2h: Command = {
  data: new SlashCommandBuilder()
    .setName('h2h')
    .setDescription('Head-to-head record between two owners or two teams')
    .addSubcommand((sub) =>
      sub
        .setName('owners')
        .setDescription('Lifetime record between two owners (across all teams)')
        .addUserOption((opt) =>
          opt.setName('owner1').setDescription('First owner').setRequired(true),
        )
        .addUserOption((opt) =>
          opt.setName('owner2').setDescription('Second owner').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('teams')
        .setDescription('Lifetime record between two teams')
        .addStringOption((opt) =>
          opt.setName('team1').setDescription('First team name').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('team2').setDescription('Second team name').setRequired(true),
        ),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'owners') {
      await handleOwners(interaction, prisma);
    } else if (sub === 'teams') {
      await handleTeams(interaction, prisma);
    }
  },
};

async function handleOwners(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply();

  const discord1 = interaction.options.getUser('owner1', true);
  const discord2 = interaction.options.getUser('owner2', true);

  if (discord1.id === discord2.id) {
    await interaction.editReply("Can't compare an owner against themselves.");
    return;
  }

  // Look up VCM users
  const [user1, user2] = await Promise.all([
    prisma.user.findUnique({ where: { discordId: discord1.id } }),
    prisma.user.findUnique({ where: { discordId: discord2.id } }),
  ]);

  if (!user1 || !user2) {
    await interaction.editReply('One or both users are not linked to VCM accounts.');
    return;
  }

  // Find all completed matches where these two owners faced each other
  const matches = await prisma.match.findMany({
    where: {
      status: 'COMPLETED',
      result: { status: { in: ['CONFIRMED', 'RESOLVED'] } },
      OR: [
        { homeOwnerId: user1.id, awayOwnerId: user2.id },
        { homeOwnerId: user2.id, awayOwnerId: user1.id },
      ],
    },
    include: {
      result: true,
      homeTeam: true,
      awayTeam: true,
      round: { include: { competition: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (matches.length === 0) {
    await interaction.editReply(
      `No completed matches found between **${discord1.displayName}** and **${discord2.displayName}**.`,
    );
    return;
  }

  // Tally W/D/L from user1's perspective
  let wins1 = 0;
  let draws = 0;
  let losses1 = 0;
  let goals1 = 0;
  let goals2 = 0;

  for (const m of matches) {
    if (!m.result) continue;
    const user1IsHome = m.homeOwnerId === user1.id;
    const u1Goals = user1IsHome ? m.result.homeScore : m.result.awayScore;
    const u2Goals = user1IsHome ? m.result.awayScore : m.result.homeScore;
    goals1 += u1Goals;
    goals2 += u2Goals;
    if (u1Goals > u2Goals) wins1++;
    else if (u1Goals < u2Goals) losses1++;
    else draws++;
  }

  // Recent matches (last 5)
  const recent = matches.slice(0, 5).map((m) => {
    if (!m.result) return '';
    const score = `${m.result.homeScore}-${m.result.awayScore}`;
    const comp = m.round.competition.name;
    return `**${m.homeTeam.name}** ${score} **${m.awayTeam.name}** — ${comp}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`H2H: ${discord1.displayName} vs ${discord2.displayName}`)
    .setColor(0x5865f2)
    .addFields(
      { name: 'Matches', value: `${matches.length}`, inline: true },
      { name: discord1.displayName, value: `${wins1}W`, inline: true },
      { name: discord2.displayName, value: `${losses1}W`, inline: true },
      { name: 'Draws', value: `${draws}`, inline: true },
      { name: 'Goals', value: `${goals1} - ${goals2}`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
    );

  if (recent.length > 0) {
    embed.addFields({
      name: 'Recent Matches',
      value: recent.join('\n'),
      inline: false,
    });
  }

  embed.setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}

async function handleTeams(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
  await interaction.deferReply();

  const name1 = interaction.options.getString('team1', true);
  const name2 = interaction.options.getString('team2', true);

  const [team1, team2] = await Promise.all([
    prisma.team.findFirst({ where: { name: { contains: name1, mode: 'insensitive' } } }),
    prisma.team.findFirst({ where: { name: { contains: name2, mode: 'insensitive' } } }),
  ]);

  if (!team1 || !team2) {
    await interaction.editReply('One or both teams not found.');
    return;
  }

  if (team1.id === team2.id) {
    await interaction.editReply("Can't compare a team against itself.");
    return;
  }

  const matches = await prisma.match.findMany({
    where: {
      status: 'COMPLETED',
      result: { status: { in: ['CONFIRMED', 'RESOLVED'] } },
      OR: [
        { homeTeamId: team1.id, awayTeamId: team2.id },
        { homeTeamId: team2.id, awayTeamId: team1.id },
      ],
    },
    include: {
      result: true,
      round: { include: { competition: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (matches.length === 0) {
    await interaction.editReply(
      `No completed matches found between **${team1.name}** and **${team2.name}**.`,
    );
    return;
  }

  let wins1 = 0;
  let draws = 0;
  let losses1 = 0;
  let goals1 = 0;
  let goals2 = 0;

  for (const m of matches) {
    if (!m.result) continue;
    const t1IsHome = m.homeTeamId === team1.id;
    const t1Goals = t1IsHome ? m.result.homeScore : m.result.awayScore;
    const t2Goals = t1IsHome ? m.result.awayScore : m.result.homeScore;
    goals1 += t1Goals;
    goals2 += t2Goals;
    if (t1Goals > t2Goals) wins1++;
    else if (t1Goals < t2Goals) losses1++;
    else draws++;
  }

  const recent = matches.slice(0, 5).map((m) => {
    if (!m.result) return '';
    const score = `${m.result.homeScore}-${m.result.awayScore}`;
    const comp = m.round.competition.name;
    return `${score} — ${comp}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`H2H: ${team1.name} vs ${team2.name}`)
    .setColor(0x5865f2)
    .addFields(
      { name: 'Matches', value: `${matches.length}`, inline: true },
      { name: team1.name, value: `${wins1}W`, inline: true },
      { name: team2.name, value: `${losses1}W`, inline: true },
      { name: 'Draws', value: `${draws}`, inline: true },
      { name: 'Goals', value: `${goals1} - ${goals2}`, inline: true },
      { name: '\u200b', value: '\u200b', inline: true },
    );

  if (recent.length > 0) {
    embed.addFields({
      name: 'Recent Matches',
      value: recent.join('\n'),
      inline: false,
    });
  }

  embed.setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}
