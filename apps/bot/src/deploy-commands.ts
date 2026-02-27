import { REST, Routes } from 'discord.js';
import { BOT_TOKEN, CLIENT_ID, GUILD_ID } from './config.js';
import { commands } from './commands/index.js';

const rest = new REST().setToken(BOT_TOKEN);

const commandData = commands.map((c) => c.data.toJSON());

async function deploy() {
  try {
    console.log(`Registering ${commandData.length} commands...`);

    if (GUILD_ID) {
      // Guild-specific commands (instant, good for development)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commandData,
      });
      console.log(`Registered ${commandData.length} guild commands to ${GUILD_ID}.`);
    } else {
      // Global commands (can take up to 1 hour to propagate)
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commandData,
      });
      console.log(`Registered ${commandData.length} global commands.`);
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
    process.exit(1);
  }
}

deploy();
