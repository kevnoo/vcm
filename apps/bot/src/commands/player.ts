import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { FRONTEND_URL } from '../config.js';
import type { Command } from './index.js';

/** OVR-based card colour: gold 85+, silver 75-84, bronze <75 */
function ovrColor(ovr: number): number {
  if (ovr >= 85) return 0xffd700; // gold
  if (ovr >= 75) return 0xc0c0c0; // silver
  return 0xcd7f32; // bronze
}

function weakFootStars(wf: number): string {
  return '★'.repeat(wf) + '☆'.repeat(5 - wf);
}

export const player: Command = {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('View a player card')
    .addStringOption((opt) =>
      opt
        .setName('name')
        .setDescription('Player name (partial match)')
        .setRequired(true),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const query = interaction.options.getString('name', true).trim();

    // Search by first name, last name, or combined
    const players = await prisma.player.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        team: true,
        positions: { orderBy: { isPrimary: 'desc' } },
        skills: {
          include: { skillDefinition: { include: { skillGroup: true } } },
          orderBy: { value: 'desc' },
        },
        playStyles: {
          include: { playStyleDefinition: true },
        },
        gameStats: {
          where: { status: 'CONFIRMED' },
          select: {
            goals: true,
            assists: true,
            rating: true,
            minutesPlayed: true,
            yellowCards: true,
            redCards: true,
          },
        },
      },
      take: 10,
    });

    if (players.length === 0) {
      await interaction.editReply(`No players found matching "${query}".`);
      return;
    }

    // If multiple matches, show a selection list
    if (players.length > 1) {
      const lines = players.map(
        (p) =>
          `**${p.firstName} ${p.lastName}** — ${p.primaryPosition} ${p.overall} OVR${p.team ? ` | ${p.team.name}` : ' | Free Agent'}`,
      );
      const embed = new EmbedBuilder()
        .setTitle('Multiple Players Found')
        .setDescription(lines.join('\n'))
        .setColor(0x5865f2)
        .setFooter({ text: 'Be more specific to see a full player card' });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Single player — show full card
    const p = players[0];
    const fullName = `${p.firstName} ${p.lastName}`;

    // Aggregate career stats from confirmed game stats
    const totalGames = p.gameStats.length;
    const totalGoals = p.gameStats.reduce((s, g) => s + g.goals, 0);
    const totalAssists = p.gameStats.reduce((s, g) => s + g.assists, 0);
    const avgRating =
      totalGames > 0
        ? (p.gameStats.reduce((s, g) => s + g.rating, 0) / totalGames).toFixed(1)
        : '-';
    const totalYellows = p.gameStats.reduce((s, g) => s + g.yellowCards, 0);
    const totalReds = p.gameStats.reduce((s, g) => s + g.redCards, 0);

    // Positions
    const positionList =
      p.positions.length > 0
        ? p.positions.map((pp) => pp.position).join(', ')
        : p.primaryPosition;

    // Top skills (up to 6)
    const topSkills = p.skills
      .slice(0, 6)
      .map((s) => `${s.skillDefinition.name}: **${s.value}**`)
      .join('\n');

    // Play styles
    const playStyles =
      p.playStyles.length > 0
        ? p.playStyles
            .map((ps) => `${ps.playStyleDefinition.name} (${ps.level})`)
            .join(', ')
        : 'None';

    const embed = new EmbedBuilder()
      .setTitle(`${fullName}  |  ${p.overall} OVR`)
      .setColor(ovrColor(p.overall))
      .setTimestamp();

    if (p.imageUrl) {
      embed.setThumbnail(p.imageUrl);
    }

    // Info row
    embed.addFields(
      { name: 'Position', value: `${positionList}`, inline: true },
      { name: 'Age', value: `${p.age}`, inline: true },
      { name: 'Weak Foot', value: weakFootStars(p.weakFoot), inline: true },
    );

    embed.addFields(
      { name: 'Potential', value: `${p.potential}`, inline: true },
      {
        name: 'Team',
        value: p.team ? p.team.name : 'Free Agent',
        inline: true,
      },
      { name: '\u200b', value: '\u200b', inline: true }, // spacer
    );

    // Career stats
    if (totalGames > 0) {
      const cardsStr =
        totalYellows > 0 || totalReds > 0
          ? ` | 🟨 ${totalYellows} 🟥 ${totalReds}`
          : '';
      embed.addFields({
        name: 'Career Stats',
        value: `${totalGames} apps | ${totalGoals} goals | ${totalAssists} assists | ${avgRating} avg rating${cardsStr}`,
        inline: false,
      });
    }

    // Skills
    if (topSkills) {
      embed.addFields({
        name: 'Top Skills',
        value: topSkills,
        inline: true,
      });
    }

    // Play styles
    embed.addFields({
      name: 'Play Styles',
      value: playStyles,
      inline: true,
    });

    // Transfer action link
    if (p.teamId) {
      embed.addFields({
        name: 'Transfer',
        value: `[Make Trade Offer](${FRONTEND_URL}/transfers/create-trade?teamId=${p.teamId})`,
        inline: false,
      });
    } else {
      embed.addFields({
        name: 'Transfer',
        value: `[Claim Free Agent](${FRONTEND_URL}/players/${p.id})`,
        inline: false,
      });
    }

    embed.setFooter({
      text: `Player ID: ${p.id}`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
