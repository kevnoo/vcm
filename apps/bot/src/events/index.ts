import type { Client } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { onReady } from './ready.js';
import { onInteractionCreate } from './interaction-create.js';
import { onMessageCreate } from './message-create.js';

export function registerEvents(client: Client, prisma: PrismaClient) {
  client.once('ready', () => onReady(client, prisma));
  client.on('interactionCreate', (interaction) =>
    onInteractionCreate(interaction, prisma),
  );
  client.on('messageCreate', (message) => onMessageCreate(message, prisma));
}
