import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { createMatchThread, createAllMatchThreads } from '../services/thread.service.js';
import type { Command } from './index.js';

export const matchThread: Command = {
  data: new SlashCommandBuilder()
    .setName('match-thread')
    .setDescription('Create a Discord thread for match scheduling')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a thread for a specific match')
        .addStringOption((opt) =>
          opt
            .setName('match-id')
            .setDescription('The match ID (UUID) from the web app')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('all')
        .setDescription('Create threads for all unthreaded matches in a competition')
        .addStringOption((opt) =>
          opt
            .setName('competition-id')
            .setDescription('The competition ID (UUID)')
            .setRequired(true),
        ),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const matchId = interaction.options.getString('match-id', true);
      try {
        const result = await createMatchThread(
          interaction.client,
          prisma,
          matchId,
          interaction.channelId,
        );
        if (result.alreadyExisted) {
          await interaction.editReply(
            `This match already has a thread: <#${result.threadId}>`,
          );
        } else {
          await interaction.editReply(
            `Match thread created: <#${result.threadId}>`,
          );
        }
      } catch (err: any) {
        await interaction.editReply(`Failed: ${err.message}`);
      }
    }

    if (subcommand === 'all') {
      const competitionId = interaction.options.getString('competition-id', true);
      try {
        const results = await createAllMatchThreads(
          interaction.client,
          prisma,
          competitionId,
          interaction.channelId,
        );
        await interaction.editReply(
          `Created ${results.length} match thread(s).`,
        );
      } catch (err: any) {
        await interaction.editReply(`Failed: ${err.message}`);
      }
    }
  },
};
