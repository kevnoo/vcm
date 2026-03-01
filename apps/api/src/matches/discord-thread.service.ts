import { Injectable, Logger } from '@nestjs/common';
import { WebhookClient } from 'discord.js';
import { PrismaService } from '../prisma/prisma.service';

interface ThreadPostOptions {
  threadId: string;
  content: string;
  username: string;
  avatarURL?: string;
  attachmentUrls?: string[];
}

interface ThreadPostResult {
  discordMessageId: string;
}

@Injectable()
export class DiscordThreadService {
  private readonly logger = new Logger(DiscordThreadService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Posts a message to a Discord match thread via webhook.
   * Finds the webhook URL from the competition's SCHEDULE channel mapping.
   */
  async postToThread(
    matchId: string,
    options: ThreadPostOptions,
  ): Promise<ThreadPostResult | null> {
    try {
      const match = await this.prisma.match.findUnique({
        where: { id: matchId },
        include: { round: true },
      });

      if (!match?.discordThreadId) return null;

      const mapping = await this.prisma.discordChannelMapping.findUnique({
        where: {
          competitionId_channelType: {
            competitionId: match.round.competitionId,
            channelType: 'SCHEDULE',
          },
        },
      });

      if (!mapping?.webhookUrl) return null;

      const webhook = new WebhookClient({ url: mapping.webhookUrl });

      const message = await webhook.send({
        content: options.content,
        username: options.username,
        avatarURL: options.avatarURL,
        threadId: match.discordThreadId,
      });

      webhook.destroy();

      return { discordMessageId: message.id };
    } catch (err) {
      this.logger.error(`Failed to post to thread for match ${matchId}:`, err);
      return null;
    }
  }
}
