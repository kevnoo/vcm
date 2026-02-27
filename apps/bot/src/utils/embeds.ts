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
