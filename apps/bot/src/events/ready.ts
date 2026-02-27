import type { Client } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { commands } from '../commands/index.js';

export async function onReady(client: Client, _prisma: PrismaClient) {
  // Register all commands on the client's command collection
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  const guilds = client.guilds.cache.size;
  console.log(`VCM Bot ready as ${client.user?.tag} in ${guilds} server(s)`);
  console.log(`Loaded ${commands.length} commands: ${commands.map((c) => `/${c.data.name}`).join(', ')}`);
}
