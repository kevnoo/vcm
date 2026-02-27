import { EmbedBuilder, WebhookClient } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';

/**
 * Sends a Discord webhook notification to a mapped channel.
 * Webhook URLs are stored as LeagueSettings with keys like:
 *   discord_webhook_results, discord_webhook_transactions, etc.
 */
export async function sendWebhook(
  prisma: PrismaClient,
  settingKey: string,
  embed: EmbedBuilder,
) {
  const setting = await prisma.leagueSetting.findUnique({
    where: { key: settingKey },
  });

  if (!setting?.value) return;

  try {
    const webhook = new WebhookClient({ url: setting.value });
    await webhook.send({ embeds: [embed] });
    webhook.destroy();
  } catch (err) {
    console.error(`Failed to send webhook (${settingKey}):`, err);
  }
}

/**
 * Sends an embed to a specific channel via the bot client (not webhook).
 * Used when we have the bot in the server and don't need a separate webhook.
 */
export async function sendToChannel(
  client: { channels: { fetch: (id: string) => Promise<any> } },
  channelId: string,
  embed: EmbedBuilder,
) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && 'send' in channel) {
      await channel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error(`Failed to send to channel ${channelId}:`, err);
  }
}
