import type { Message } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { captureMedia } from '../services/media.service.js';

export async function onMessageCreate(message: Message, prisma: PrismaClient) {
  // Ignore bot messages
  if (message.author.bot) return;

  // Only process messages in threads (where match media is posted)
  if (!message.channel.isThread()) return;

  // Capture any attachments as match media
  const captured = await captureMedia(message, prisma);
  if (captured > 0) {
    await message.react('📸');
  }
}
