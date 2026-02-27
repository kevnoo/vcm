import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface WebhookEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
}

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send a notification to a Discord webhook stored in LeagueSettings.
   * @param settingKey e.g. 'discord_webhook_results'
   * @param embed The Discord embed payload
   */
  async notify(settingKey: string, embed: WebhookEmbed) {
    const setting = await this.prisma.leagueSetting.findUnique({
      where: { key: settingKey },
    });

    if (!setting?.value) {
      this.logger.debug(`No webhook configured for ${settingKey}`);
      return;
    }

    try {
      const response = await fetch(setting.value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Webhook ${settingKey} returned ${response.status}: ${response.statusText}`,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to send webhook ${settingKey}`, err);
    }
  }

  async notifyResultSubmitted(data: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    submittedBy: string;
    status: string;
    matchId: string;
  }) {
    await this.notify('discord_webhook_results', {
      title: `Result: ${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam}`,
      color: data.status === 'CONFIRMED' ? 0x57f287 : 0xfee75c,
      fields: [
        { name: 'Status', value: data.status, inline: true },
        { name: 'Submitted by', value: data.submittedBy, inline: true },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  async notifyTradeCreated(data: {
    initiatingTeam: string;
    receivingTeam: string;
    offeredPlayers: string[];
    requestedPlayers: string[];
    status: string;
  }) {
    await this.notify('discord_webhook_transactions', {
      title: `Trade: ${data.initiatingTeam} ↔ ${data.receivingTeam}`,
      color: 0x5865f2,
      fields: [
        {
          name: `${data.initiatingTeam} offers`,
          value: data.offeredPlayers.join(', ') || 'No players',
          inline: true,
        },
        {
          name: `${data.receivingTeam} offers`,
          value: data.requestedPlayers.join(', ') || 'No players',
          inline: true,
        },
        { name: 'Status', value: data.status, inline: true },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  async notifyDispute(data: {
    matchInfo: string;
    disputedBy: string;
    reason: string;
  }) {
    await this.notify('discord_webhook_admin', {
      title: `Dispute: ${data.matchInfo}`,
      color: 0xed4245,
      fields: [
        { name: 'Disputed by', value: data.disputedBy, inline: true },
        { name: 'Reason', value: data.reason },
      ],
      timestamp: new Date().toISOString(),
    });
  }
}
