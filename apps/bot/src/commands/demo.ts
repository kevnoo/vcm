import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { PrismaClient } from '../../../api/src/generated/prisma/client.js';
import { createAllMatchThreads } from '../services/thread.service.js';
import { resultEmbed, tradeEmbed } from '../utils/embeds.js';
import type { Command } from './index.js';

export const demo: Command = {
  data: new SlashCommandBuilder()
    .setName('demo')
    .setDescription('Demo & test utilities for VCM (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('seed')
        .setDescription('Create demo teams, competition, and matches in the database'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('threads')
        .setDescription('Create match threads for all demo matches in this channel'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('simulate-result')
        .setDescription('Post a simulated match result embed'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('simulate-trade')
        .setDescription('Post a simulated trade notification embed'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('simulate-media')
        .setDescription('Post sample media to the current thread to test capture'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Show current demo data in the database'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('link-me')
        .setDescription('Link your Discord account to a VCM user (creates one if needed)'),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, prisma: PrismaClient) {
    await interaction.deferReply();

    const sub = interaction.options.getSubcommand();

    if (sub === 'seed') {
      await handleSeed(interaction, prisma);
    } else if (sub === 'threads') {
      await handleThreads(interaction, prisma);
    } else if (sub === 'simulate-result') {
      await handleSimulateResult(interaction);
    } else if (sub === 'simulate-trade') {
      await handleSimulateTrade(interaction);
    } else if (sub === 'simulate-media') {
      await handleSimulateMedia(interaction);
    } else if (sub === 'status') {
      await handleStatus(interaction, prisma);
    } else if (sub === 'link-me') {
      await handleLinkMe(interaction, prisma);
    }
  },
};

async function handleLinkMe(
  interaction: ChatInputCommandInteraction,
  prisma: PrismaClient,
) {
  const existing = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  if (existing) {
    await interaction.editReply(
      `You're already linked as **${existing.discordUsername}** (role: ${existing.role}).`,
    );
    return;
  }

  const user = await prisma.user.create({
    data: {
      discordId: interaction.user.id,
      discordUsername: interaction.user.username,
      discordAvatar: interaction.user.avatar,
      role: 'ADMIN',
    },
  });

  await interaction.editReply(
    `Linked your Discord account as **${user.discordUsername}** with ADMIN role. ` +
      'You can now use all bot commands.',
  );
}

async function handleSeed(
  interaction: ChatInputCommandInteraction,
  prisma: PrismaClient,
) {
  // Ensure the calling user exists as admin
  let admin = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        discordId: interaction.user.id,
        discordUsername: interaction.user.username,
        discordAvatar: interaction.user.avatar,
        role: 'ADMIN',
      },
    });
  }

  // Check if demo data already exists
  const existingComp = await prisma.competition.findFirst({
    where: { name: 'Demo League' },
  });
  if (existingComp) {
    await interaction.editReply(
      `Demo data already exists (competition ID: \`${existingComp.id}\`). ` +
        'Use `/demo status` to see details.',
    );
    return;
  }

  // Create demo team owners (placeholder users)
  const ownerNames = ['Alpha FC', 'Bravo United', 'Charlie City', 'Delta Town'];
  const owners = [];
  for (let i = 0; i < ownerNames.length; i++) {
    const owner = await prisma.user.upsert({
      where: { discordId: `demo:owner-${i}` },
      update: {},
      create: {
        discordId: `demo:owner-${i}`,
        discordUsername: `demo_owner_${i}`,
        role: 'OWNER',
      },
    });
    owners.push(owner);
  }

  // Create demo teams
  const teams = [];
  for (let i = 0; i < ownerNames.length; i++) {
    const team = await prisma.team.create({
      data: {
        name: ownerNames[i],
        ownerId: owners[i].id,
        budget: 10000,
      },
    });
    teams.push(team);
  }

  // Create demo competition (single round robin)
  const competition = await prisma.competition.create({
    data: {
      name: 'Demo League',
      type: 'SINGLE_ROUND_ROBIN',
      status: 'ACTIVE',
    },
  });

  // Add teams to competition
  for (const team of teams) {
    await prisma.competitionTeam.create({
      data: {
        competitionId: competition.id,
        teamId: team.id,
      },
    });
  }

  // Generate round-robin schedule (4 teams = 3 rounds, 2 matches each)
  const matchups = [
    // Round 1
    [
      [0, 1],
      [2, 3],
    ],
    // Round 2
    [
      [0, 2],
      [1, 3],
    ],
    // Round 3
    [
      [0, 3],
      [1, 2],
    ],
  ];

  let matchNumber = 1;
  for (let r = 0; r < matchups.length; r++) {
    const round = await prisma.round.create({
      data: {
        competitionId: competition.id,
        roundNumber: r + 1,
        name: `Matchday ${r + 1}`,
      },
    });

    for (const [home, away] of matchups[r]) {
      await prisma.match.create({
        data: {
          roundId: round.id,
          homeTeamId: teams[home].id,
          awayTeamId: teams[away].id,
          matchNumber: matchNumber++,
        },
      });
    }
  }

  // Map current channel as schedule channel
  if (interaction.guildId) {
    await prisma.discordChannelMapping.upsert({
      where: {
        competitionId_channelType: {
          competitionId: competition.id,
          channelType: 'SCHEDULE',
        },
      },
      update: {
        discordGuildId: interaction.guildId,
        discordChannelId: interaction.channelId,
      },
      create: {
        competitionId: competition.id,
        discordGuildId: interaction.guildId,
        discordChannelId: interaction.channelId,
        channelType: 'SCHEDULE',
      },
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('Demo Data Seeded')
    .setColor(0x57f287)
    .addFields(
      { name: 'Competition', value: `${competition.name} (\`${competition.id}\`)` },
      { name: 'Teams', value: ownerNames.join(', ') },
      { name: 'Matches', value: `${matchNumber - 1} matches across 3 rounds` },
      {
        name: 'Schedule Channel',
        value: `<#${interaction.channelId}> (mapped automatically)`,
      },
      {
        name: 'Next Steps',
        value:
          '1. `/demo threads` — create match threads\n' +
          '2. `/demo link-me` — link your Discord to VCM\n' +
          '3. Post screenshots in a match thread to test media capture\n' +
          '4. `/propose-time` or `/submit-result` to test workflows',
      },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleThreads(
  interaction: ChatInputCommandInteraction,
  prisma: PrismaClient,
) {
  const competition = await prisma.competition.findFirst({
    where: { name: 'Demo League' },
  });

  if (!competition) {
    await interaction.editReply(
      'No demo data found. Run `/demo seed` first.',
    );
    return;
  }

  const results = await createAllMatchThreads(
    interaction.client,
    prisma,
    competition.id,
    interaction.channelId,
  );

  await interaction.editReply(
    `Created **${results.length}** match threads in this channel. ` +
      'Try posting a screenshot in one of the threads!',
  );
}

async function handleSimulateResult(interaction: ChatInputCommandInteraction) {
  const embed = resultEmbed({
    homeTeam: 'Alpha FC',
    awayTeam: 'Bravo United',
    homeScore: 3,
    awayScore: 1,
    submittedBy: interaction.user.displayName,
    status: 'PENDING',
  });

  await interaction.editReply({
    content:
      '*This is a simulated result notification. In production, this would be posted automatically when a result is submitted.*',
    embeds: [embed],
  });
}

async function handleSimulateTrade(interaction: ChatInputCommandInteraction) {
  const embed = tradeEmbed({
    initiatingTeam: 'Alpha FC',
    receivingTeam: 'Charlie City',
    offeredPlayers: ['M. Rodriguez (ST, 82 OVR)', 'L. Chen (CM, 76 OVR)'],
    requestedPlayers: ['K. Williams (RW, 85 OVR)'],
    currency: { offered: 2000, requested: 0 },
    status: 'PENDING',
  });

  await interaction.editReply({
    content:
      '*This is a simulated trade notification. In production, this would be posted to the transactions channel.*',
    embeds: [embed],
  });
}

async function handleSimulateMedia(interaction: ChatInputCommandInteraction) {
  if (!interaction.channel?.isThread()) {
    await interaction.editReply(
      'Run this command inside a match thread to test media capture. ' +
        'The bot reacts with 📸 when it captures media from a tracked thread.',
    );
    return;
  }

  await interaction.editReply(
    'Post a screenshot or video in this thread. ' +
      "If this thread is linked to a match, the bot will capture the media and react with 📸.\n\n" +
      "You can verify captured media with `/demo status`.",
  );
}

async function handleStatus(
  interaction: ChatInputCommandInteraction,
  prisma: PrismaClient,
) {
  const competitions = await prisma.competition.count();
  const teams = await prisma.team.count();
  const matches = await prisma.match.count();
  const threadedMatches = await prisma.match.count({
    where: { discordThreadId: { not: null } },
  });
  const mediaCount = await prisma.matchMedia.count();
  const users = await prisma.user.count();
  const mappings = await prisma.discordChannelMapping.count();

  const embed = new EmbedBuilder()
    .setTitle('VCM Database Status')
    .setColor(0x5865f2)
    .addFields(
      { name: 'Users', value: `${users}`, inline: true },
      { name: 'Teams', value: `${teams}`, inline: true },
      { name: 'Competitions', value: `${competitions}`, inline: true },
      { name: 'Matches', value: `${matches}`, inline: true },
      { name: 'With Threads', value: `${threadedMatches}`, inline: true },
      { name: 'Media Captured', value: `${mediaCount}`, inline: true },
      { name: 'Channel Mappings', value: `${mappings}`, inline: true },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
