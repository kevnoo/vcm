import type { Message, Attachment } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'];

function inferMediaType(attachment: Attachment): 'SCREENSHOT' | 'VIDEO' | 'REPLAY' {
  const name = attachment.name?.toLowerCase() ?? '';
  if (VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'VIDEO';
  if (attachment.contentType?.startsWith('video/')) return 'VIDEO';
  return 'SCREENSHOT';
}

/**
 * Scans a Discord message for attachments and saves them as MatchMedia
 * if the message is in a tracked match thread.
 */
export async function captureMedia(
  message: Message,
  prisma: PrismaClient,
): Promise<number> {
  if (message.attachments.size === 0) return 0;

  // Check if this message is in a tracked match thread
  const threadId = message.channel.isThread() ? message.channelId : null;
  if (!threadId) return 0;

  const match = await prisma.match.findFirst({
    where: { discordThreadId: threadId },
  });
  if (!match) return 0;

  // Find the VCM user by Discord ID (if they exist)
  const user = await prisma.user.findUnique({
    where: { discordId: message.author.id },
  });

  let captured = 0;
  for (const [, attachment] of message.attachments) {
    const isMedia =
      IMAGE_EXTENSIONS.some((ext) => (attachment.name?.toLowerCase() ?? '').endsWith(ext)) ||
      VIDEO_EXTENSIONS.some((ext) => (attachment.name?.toLowerCase() ?? '').endsWith(ext)) ||
      attachment.contentType?.startsWith('image/') ||
      attachment.contentType?.startsWith('video/');

    if (!isMedia) continue;

    await prisma.matchMedia.create({
      data: {
        matchId: match.id,
        discordMessageId: message.id,
        url: attachment.url,
        mediaType: inferMediaType(attachment),
        uploadedById: user?.id ?? null,
        caption: message.content || null,
      },
    });
    captured++;
  }

  return captured;
}
