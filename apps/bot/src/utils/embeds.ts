import { EmbedBuilder } from 'discord.js';
import { FRONTEND_URL } from '../config.js';

export function matchEmbed(match: {
  id: string;
  matchNumber?: number | null;
  scheduledAt?: Date | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  round: { name?: string | null; roundNumber: number; competition: { name: string } };
}) {
  const title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x5865f2)
    .addFields(
      { name: 'Competition', value: match.round.competition.name, inline: true },
      {
        name: 'Round',
        value: match.round.name ?? `Round ${match.round.roundNumber}`,
        inline: true,
      },
    );

  if (match.matchNumber != null) {
    embed.addFields({ name: 'Match #', value: `${match.matchNumber}`, inline: true });
  }

  if (match.scheduledAt) {
    embed.addFields({
      name: 'Scheduled',
      value: `<t:${Math.floor(match.scheduledAt.getTime() / 1000)}:F>`,
      inline: false,
    });
  }

  embed.addFields({
    name: 'Web App',
    value: `[View Match](${FRONTEND_URL}/matches/${match.id})`,
    inline: false,
  });

  return embed;
}

export function resultEmbed(data: {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  submittedBy: string;
  status: string;
}) {
  return new EmbedBuilder()
    .setTitle(`Result: ${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam}`)
    .setColor(data.status === 'CONFIRMED' ? 0x57f287 : 0xfee75c)
    .addFields(
      { name: 'Status', value: data.status, inline: true },
      { name: 'Submitted by', value: data.submittedBy, inline: true },
    )
    .setTimestamp();
}

export function timeProposalEmbed(data: {
  proposedBy: string;
  proposedTime: Date;
  homeTeam: string;
  awayTeam: string;
  status: string;
}) {
  const timestamp = Math.floor(data.proposedTime.getTime() / 1000);
  return new EmbedBuilder()
    .setTitle('Time Proposal')
    .setDescription(
      `${data.proposedBy} proposed <t:${timestamp}:F> for **${data.homeTeam} vs ${data.awayTeam}**`,
    )
    .setColor(
      data.status === 'ACCEPTED'
        ? 0x57f287
        : data.status === 'DECLINED'
          ? 0xed4245
          : 0xfee75c,
    )
    .addFields({ name: 'Status', value: data.status, inline: true })
    .setTimestamp();
}

export function tradeEmbed(data: {
  initiatingTeam: string;
  receivingTeam: string;
  offeredPlayers: string[];
  requestedPlayers: string[];
  currency?: { offered: number; requested: number };
  status: string;
}) {
  const embed = new EmbedBuilder()
    .setTitle(`Trade: ${data.initiatingTeam} ↔ ${data.receivingTeam}`)
    .setColor(0x5865f2)
    .addFields(
      {
        name: `${data.initiatingTeam} offers`,
        value: data.offeredPlayers.length
          ? data.offeredPlayers.join('\n')
          : 'No players',
        inline: true,
      },
      {
        name: `${data.receivingTeam} offers`,
        value: data.requestedPlayers.length
          ? data.requestedPlayers.join('\n')
          : 'No players',
        inline: true,
      },
    );

  if (data.currency && (data.currency.offered > 0 || data.currency.requested > 0)) {
    embed.addFields({
      name: 'Currency',
      value: `${data.initiatingTeam}: ${data.currency.offered} | ${data.receivingTeam}: ${data.currency.requested}`,
    });
  }

  embed.addFields({ name: 'Status', value: data.status, inline: true });
  embed.setTimestamp();
  return embed;
}

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
