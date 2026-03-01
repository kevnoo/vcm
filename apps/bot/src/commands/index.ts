import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  type SharedSlashCommand,
} from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { matchThread } from './match-thread.js';
import { proposeTime } from './propose-time.js';
import { submitResult } from './submit-result.js';
import { schedule } from './schedule.js';
import { setup } from './setup.js';
import { demo } from './demo.js';
import { playerCard } from './player-card.js';

export interface Command {
  data: SharedSlashCommand;
  execute: (
    interaction: ChatInputCommandInteraction,
    prisma: PrismaClient,
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    prisma: PrismaClient,
  ) => Promise<void>;
}

export const commands: Command[] = [
  matchThread,
  proposeTime,
  submitResult,
  schedule,
  setup,
  demo,
  playerCard,
];
