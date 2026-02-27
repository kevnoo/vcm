import {
  ChannelType,
  TextChannel,
  ThreadAutoArchiveDuration,
  type Client,
} from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { matchEmbed } from '../utils/embeds.js';
import { matchLabel } from '../utils/format.js';

const MATCH_INCLUDE = {
  homeTeam: true,
  awayTeam: true,
  round: { include: { competition: true } },
} as const;

/**
 * Creates a Discord thread for a match in the competition's schedule channel.
 * If no channel mapping exists, creates the thread in the provided fallback channel.
 */
export async function createMatchThread(
  client: Client,
  prisma: PrismaClient,
  matchId: string,
  fallbackChannelId?: string,
) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: MATCH_INCLUDE,
  });

  if (match.discordThreadId) {
    return { threadId: match.discordThreadId, alreadyExisted: true };
  }

  // Find the mapped schedule channel for this competition
  const mapping = await prisma.discordChannelMapping.findUnique({
    where: {
      competitionId_channelType: {
        competitionId: match.round.competitionId,
        channelType: 'SCHEDULE',
      },
    },
  });

  const channelId = mapping?.discordChannelId ?? fallbackChannelId;
  if (!channelId) {
    throw new Error(
      `No schedule channel mapped for competition "${match.round.competition.name}". ` +
        'Use /setup to map a channel first.',
    );
  }

  const channel = await client.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error(`Channel ${channelId} is not a text channel.`);
  }

  const textChannel = channel as TextChannel;
  const threadName = matchLabel(match);

  const thread = await textChannel.threads.create({
    name: threadName,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    reason: `Match thread for ${threadName}`,
  });

  // Post the match info embed as the first message
  await thread.send({ embeds: [matchEmbed(match)] });

  // Save the thread ID on the match
  await prisma.match.update({
    where: { id: matchId },
    data: { discordThreadId: thread.id },
  });

  return { threadId: thread.id, alreadyExisted: false };
}

/**
 * Creates threads for all unthreaded matches in a competition.
 */
export async function createAllMatchThreads(
  client: Client,
  prisma: PrismaClient,
  competitionId: string,
  fallbackChannelId?: string,
) {
  const matches = await prisma.match.findMany({
    where: {
      round: { competitionId },
      discordThreadId: null,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    },
    include: MATCH_INCLUDE,
    orderBy: [{ round: { roundNumber: 'asc' } }, { matchNumber: 'asc' }],
  });

  const results: Array<{ matchId: string; threadId: string }> = [];
  for (const match of matches) {
    const { threadId } = await createMatchThread(
      client,
      prisma,
      match.id,
      fallbackChannelId,
    );
    results.push({ matchId: match.id, threadId });
    // Brief pause to avoid Discord rate limits
    await new Promise((r) => setTimeout(r, 1000));
  }

  return results;
}
