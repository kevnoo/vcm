import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { BOT_TOKEN } from './config.js';
import { prisma } from './prisma.js';
import { registerEvents } from './events/index.js';
import type { Command } from './commands/index.js';

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

registerEvents(client, prisma);

client.login(BOT_TOKEN);
