import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import type { Command } from './index.js';

export const setup: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Map Discord channels to VCM competitions (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName('channel')
        .setDescription('Map a channel to a competition')
        .addStringOption((opt) =>
          opt
            .setName('competition-id')
            .setDescription('The competition ID (UUID)')
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Channel type')
            .setRequired(true)
            .addChoices(
              { name: 'Schedule', value: 'SCHEDULE' },
              { name: 'Results', value: 'RESULTS' },
              { name: 'Transactions', value: 'TRANSACTIONS' },
              { name: 'Media', value: 'MEDIA' },
            ),
        )
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('The channel to map (defaults to current)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('webhook')
        .setDescription('Set a Discord webhook URL for notifications')
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Webhook type')
            .setRequired(true)
            .addChoices(
              { name: 'Results', value: 'discord_webhook_results' },
              { name: 'Transactions', value: 'discord_webhook_transactions' },
              { name: 'Admin Alerts', value: 'discord_webhook_admin' },
            ),
        )
        .addStringOption((opt) =>
          opt
            .setName('url')
            .setDescription('The webhook URL')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Show current channel mappings'),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply({ ephemeral: true });

    // Verify the Discord user is a VCM admin
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });
    if (!user || user.role !== 'ADMIN') {
      await interaction.editReply('You must be a VCM admin to use this command.');
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'channel') {
      const competitionId = interaction.options.getString('competition-id', true);
      const channelType = interaction.options.getString('type', true) as any;
      const channel = interaction.options.getChannel('channel') ?? interaction.channel;

      if (!channel || !interaction.guildId) {
        await interaction.editReply('Must be used in a server channel.');
        return;
      }

      // Verify competition exists
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
      });
      if (!competition) {
        await interaction.editReply('Competition not found.');
        return;
      }

      await prisma.discordChannelMapping.upsert({
        where: {
          competitionId_channelType: { competitionId, channelType },
        },
        update: {
          discordGuildId: interaction.guildId,
          discordChannelId: channel.id,
        },
        create: {
          competitionId,
          discordGuildId: interaction.guildId,
          discordChannelId: channel.id,
          channelType,
        },
      });

      await interaction.editReply(
        `Mapped <#${channel.id}> as **${channelType}** channel for **${competition.name}**.`,
      );
    }

    if (subcommand === 'webhook') {
      const key = interaction.options.getString('type', true);
      const url = interaction.options.getString('url', true);

      await prisma.leagueSetting.upsert({
        where: { key },
        update: { value: url },
        create: { key, value: url },
      });

      await interaction.editReply(`Webhook **${key}** saved.`);
    }

    if (subcommand === 'status') {
      const mappings = await prisma.discordChannelMapping.findMany({
        include: { competition: true },
        orderBy: { createdAt: 'asc' },
      });

      const webhookKeys = [
        'discord_webhook_results',
        'discord_webhook_transactions',
        'discord_webhook_admin',
      ];
      const webhooks = await prisma.leagueSetting.findMany({
        where: { key: { in: webhookKeys } },
      });

      let msg = '**Channel Mappings:**\n';
      if (mappings.length === 0) {
        msg += 'None configured.\n';
      } else {
        for (const m of mappings) {
          msg += `• ${m.competition.name} → ${m.channelType}: <#${m.discordChannelId}>\n`;
        }
      }

      msg += '\n**Webhooks:**\n';
      if (webhooks.length === 0) {
        msg += 'None configured.\n';
      } else {
        for (const w of webhooks) {
          msg += `• ${w.key}: configured\n`;
        }
      }

      await interaction.editReply(msg);
    }
  },
};
