import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import type {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import type { Command } from './index.js';

export const funds: Command = {
  data: new SlashCommandBuilder()
    .setName('funds')
    .setDescription('Grant or revoke team funds (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('grant')
        .setDescription('Grant funds to a team')
        .addStringOption((opt) =>
          opt
            .setName('team')
            .setDescription('The team to grant funds to')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName('amount')
            .setDescription('Amount of funds to grant')
            .setRequired(true)
            .setMinValue(1),
        )
        .addStringOption((opt) =>
          opt
            .setName('reason')
            .setDescription('Reason for granting funds')
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('revoke')
        .setDescription('Revoke funds from a team')
        .addStringOption((opt) =>
          opt
            .setName('team')
            .setDescription('The team to revoke funds from')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName('amount')
            .setDescription('Amount of funds to revoke')
            .setRequired(true)
            .setMinValue(1),
        )
        .addStringOption((opt) =>
          opt
            .setName('reason')
            .setDescription('Reason for revoking funds')
            .setRequired(false),
        ),
    ) as SlashCommandBuilder,

  async autocomplete(interaction: AutocompleteInteraction, prisma: PrismaClient) {
    const focused = interaction.options.getFocused();
    const teams = await prisma.team.findMany({
      where: {
        name: { contains: focused, mode: 'insensitive' },
      },
      select: { id: true, name: true },
      take: 25,
    });

    await interaction.respond(
      teams.map((t) => ({ name: t.name, value: t.id })),
    );
  },

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
    const teamId = interaction.options.getString('team', true);
    const amount = interaction.options.getInteger('amount', true);
    const reason = interaction.options.getString('reason');

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { owner: true },
    });
    if (!team) {
      await interaction.editReply('Team not found.');
      return;
    }

    if (subcommand === 'grant') {
      const updated = await prisma.team.update({
        where: { id: teamId },
        data: { budget: { increment: amount } },
      });

      const embed = new EmbedBuilder()
        .setTitle('Funds Granted')
        .setColor(0x57f287)
        .addFields(
          { name: 'Team', value: team.name, inline: true },
          { name: 'Amount', value: `+${amount.toLocaleString()}`, inline: true },
          { name: 'New Balance', value: updated.budget.toLocaleString(), inline: true },
          { name: 'Granted By', value: interaction.user.displayName, inline: true },
        )
        .setTimestamp();

      if (reason) {
        embed.addFields({ name: 'Reason', value: reason });
      }

      await interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'revoke') {
      if (team.budget < amount) {
        await interaction.editReply(
          `Cannot revoke ${amount.toLocaleString()} from **${team.name}** — current balance is only ${team.budget.toLocaleString()}.`,
        );
        return;
      }

      const updated = await prisma.team.update({
        where: { id: teamId },
        data: { budget: { decrement: amount } },
      });

      const embed = new EmbedBuilder()
        .setTitle('Funds Revoked')
        .setColor(0xed4245)
        .addFields(
          { name: 'Team', value: team.name, inline: true },
          { name: 'Amount', value: `-${amount.toLocaleString()}`, inline: true },
          { name: 'New Balance', value: updated.budget.toLocaleString(), inline: true },
          { name: 'Revoked By', value: interaction.user.displayName, inline: true },
        )
        .setTimestamp();

      if (reason) {
        embed.addFields({ name: 'Reason', value: reason });
      }

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
