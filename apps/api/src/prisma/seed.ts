import path from 'node:path';
import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Load .env from monorepo root
config({ path: path.resolve(__dirname, '../../../../.env') });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed admin user
  const adminDiscordId = process.env.ADMIN_DISCORD_ID;

  if (!adminDiscordId) {
    console.log('ADMIN_DISCORD_ID not set, skipping admin seed.');
  } else {
    const admin = await prisma.user.upsert({
      where: { discordId: adminDiscordId },
      update: { role: 'ADMIN' },
      create: {
        discordId: adminDiscordId,
        discordUsername: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log(`Admin user seeded: ${admin.id} (Discord: ${admin.discordId})`);
  }

  // Seed Skill Groups and Skills
  const skillGroupsData = [
    {
      name: 'Pace',
      sortOrder: 1,
      skills: [
        { name: 'Acceleration', sortOrder: 1 },
        { name: 'Sprint Speed', sortOrder: 2 },
      ],
    },
    {
      name: 'Shooting',
      sortOrder: 2,
      skills: [
        { name: 'Positioning', sortOrder: 1 },
        { name: 'Finishing', sortOrder: 2 },
        { name: 'Shot Power', sortOrder: 3 },
        { name: 'Long Shots', sortOrder: 4 },
        { name: 'Volleys', sortOrder: 5 },
        { name: 'Penalties', sortOrder: 6 },
      ],
    },
    {
      name: 'Passing',
      sortOrder: 3,
      skills: [
        { name: 'Vision', sortOrder: 1 },
        { name: 'Crossing', sortOrder: 2 },
        { name: 'FK Accuracy', sortOrder: 3 },
        { name: 'Short Passing', sortOrder: 4 },
        { name: 'Long Passing', sortOrder: 5 },
        { name: 'Curve', sortOrder: 6 },
      ],
    },
    {
      name: 'Dribbling',
      sortOrder: 4,
      skills: [
        { name: 'Agility', sortOrder: 1 },
        { name: 'Balance', sortOrder: 2 },
        { name: 'Reactions', sortOrder: 3 },
        { name: 'Ball Control', sortOrder: 4 },
        { name: 'Dribbling', sortOrder: 5 },
        { name: 'Composure', sortOrder: 6 },
      ],
    },
    {
      name: 'Defending',
      sortOrder: 5,
      skills: [
        { name: 'Interceptions', sortOrder: 1 },
        { name: 'Heading Accuracy', sortOrder: 2 },
        { name: 'Def. Awareness', sortOrder: 3 },
        { name: 'Standing Tackle', sortOrder: 4 },
        { name: 'Sliding Tackle', sortOrder: 5 },
      ],
    },
    {
      name: 'Physical',
      sortOrder: 6,
      skills: [
        { name: 'Jumping', sortOrder: 1 },
        { name: 'Stamina', sortOrder: 2 },
        { name: 'Strength', sortOrder: 3 },
        { name: 'Aggression', sortOrder: 4 },
      ],
    },
  ];

  for (const groupData of skillGroupsData) {
    const group = await prisma.skillGroup.upsert({
      where: { name: groupData.name },
      update: { sortOrder: groupData.sortOrder },
      create: { name: groupData.name, sortOrder: groupData.sortOrder },
    });

    for (const skillData of groupData.skills) {
      await prisma.skillDefinition.upsert({
        where: { name: skillData.name },
        update: { sortOrder: skillData.sortOrder, skillGroupId: group.id },
        create: {
          name: skillData.name,
          skillGroupId: group.id,
          defaultValue: 50,
          sortOrder: skillData.sortOrder,
        },
      });
    }

    console.log(`Seeded skill group: ${groupData.name} (${groupData.skills.length} skills)`);
  }

  // Seed Player Role Definitions
  const playerRolesData: { name: string; position: string; description?: string; sortOrder: number }[] = [
    // GK
    { name: 'Goalkeeper', position: 'GK', description: 'Standard goalkeeper', sortOrder: 1 },
    { name: 'Sweeper Keeper', position: 'GK', description: 'Goalkeeper who plays high up the pitch', sortOrder: 2 },
    // CB
    { name: 'Ball-Playing Defender', position: 'CB', description: 'Center back comfortable on the ball', sortOrder: 1 },
    { name: 'Stopper', position: 'CB', description: 'Aggressive center back', sortOrder: 2 },
    // RB / LB
    { name: 'Fullback', position: 'RB', sortOrder: 1 },
    { name: 'Wingback', position: 'RB', description: 'Attacking fullback', sortOrder: 2 },
    { name: 'Falseback', position: 'RB', description: 'Inverted fullback who tucks inside', sortOrder: 3 },
    { name: 'Fullback', position: 'LB', sortOrder: 1 },
    { name: 'Wingback', position: 'LB', description: 'Attacking fullback', sortOrder: 2 },
    { name: 'Falseback', position: 'LB', description: 'Inverted fullback who tucks inside', sortOrder: 3 },
    // CDM
    { name: 'Holding', position: 'CDM', description: 'Stays back to shield the defence', sortOrder: 1 },
    { name: 'Centre-Half', position: 'CDM', description: 'Drops between centre-backs', sortOrder: 2 },
    { name: 'Deep-Lying Playmaker', position: 'CDM', description: 'Dictates play from deep', sortOrder: 3 },
    // CM
    { name: 'Box-to-Box', position: 'CM', description: 'Covers the full length of the pitch', sortOrder: 1 },
    { name: 'Deep-Lying Playmaker', position: 'CM', description: 'Dictates play from deep', sortOrder: 2 },
    { name: 'Playmaker', position: 'CM', description: 'Creative central midfielder', sortOrder: 3 },
    // CAM
    { name: 'Playmaker', position: 'CAM', description: 'Creative attacking midfielder', sortOrder: 1 },
    { name: 'Shadow Striker', position: 'CAM', description: 'Plays close to the striker', sortOrder: 2 },
    { name: 'Half-Winger', position: 'CAM', description: 'Drifts wide from central position', sortOrder: 3 },
    // RM / LM
    { name: 'Winger', position: 'RM', description: 'Stays wide and delivers crosses', sortOrder: 1 },
    { name: 'Wide Midfielder', position: 'RM', description: 'Balanced wide role', sortOrder: 2 },
    { name: 'Winger', position: 'LM', description: 'Stays wide and delivers crosses', sortOrder: 1 },
    { name: 'Wide Midfielder', position: 'LM', description: 'Balanced wide role', sortOrder: 2 },
    // RW / LW
    { name: 'Winger', position: 'RW', description: 'Hugs the touchline', sortOrder: 1 },
    { name: 'Inside Forward', position: 'RW', description: 'Cuts inside to shoot', sortOrder: 2 },
    { name: 'Wide Playmaker', position: 'RW', description: 'Creative wide player', sortOrder: 3 },
    { name: 'Winger', position: 'LW', description: 'Hugs the touchline', sortOrder: 1 },
    { name: 'Inside Forward', position: 'LW', description: 'Cuts inside to shoot', sortOrder: 2 },
    { name: 'Wide Playmaker', position: 'LW', description: 'Creative wide player', sortOrder: 3 },
    // CF
    { name: 'False 9', position: 'CF', description: 'Drops deep to create space', sortOrder: 1 },
    { name: 'Target Forward', position: 'CF', description: 'Physical focal point', sortOrder: 2 },
    // ST
    { name: 'Advanced Forward', position: 'ST', description: 'Plays on the last defender', sortOrder: 1 },
    { name: 'Poacher', position: 'ST', description: 'Goal-focused striker', sortOrder: 2 },
    { name: 'Target Forward', position: 'ST', description: 'Physical focal point', sortOrder: 3 },
  ];

  for (const roleData of playerRolesData) {
    await prisma.playerRoleDefinition.upsert({
      where: {
        name_position: { name: roleData.name, position: roleData.position as any },
      },
      update: { description: roleData.description, sortOrder: roleData.sortOrder },
      create: {
        name: roleData.name,
        position: roleData.position as any,
        description: roleData.description,
        sortOrder: roleData.sortOrder,
      },
    });
  }
  console.log(`Seeded ${playerRolesData.length} player role definitions`);

  // Seed Play Style Definitions
  // Play styles are position-agnostic in EAFC — they apply broadly, but we map them to
  // positions where they're most relevant. Many styles apply to multiple positions.
  const allOutfieldPositions = ['RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'] as const;
  const attackingPositions = ['CAM', 'RM', 'LM', 'RW', 'LW', 'CF', 'ST'] as const;
  const defendingPositions = ['RB', 'CB', 'LB', 'CDM'] as const;

  const playStyleTemplates: { name: string; positions: readonly string[]; description?: string; sortOrder: number }[] = [
    { name: 'Finesse Shot', positions: attackingPositions, description: 'Curls shots into the corner', sortOrder: 1 },
    { name: 'Power Shot', positions: attackingPositions, description: 'Powerful strikes on goal', sortOrder: 2 },
    { name: 'Chip Shot', positions: attackingPositions, description: 'Lobs the keeper with finesse', sortOrder: 3 },
    { name: 'Trivela', positions: allOutfieldPositions, description: 'Uses outside of the foot', sortOrder: 4 },
    { name: 'Pinged Pass', positions: allOutfieldPositions, description: 'Accurate long-range passes', sortOrder: 5 },
    { name: 'Incisive Pass', positions: ['CM', 'CAM', 'CDM', 'CF'], description: 'Threading through balls', sortOrder: 6 },
    { name: 'Whipped Pass', positions: ['RB', 'LB', 'RM', 'LM', 'RW', 'LW'], description: 'Delivers whipped crosses', sortOrder: 7 },
    { name: 'Tiki Taka', positions: allOutfieldPositions, description: 'Quick one-touch passing', sortOrder: 8 },
    { name: 'Press Proven', positions: allOutfieldPositions, description: 'Stays composed under pressure', sortOrder: 9 },
    { name: 'Rapid', positions: allOutfieldPositions, description: 'Explosive acceleration', sortOrder: 10 },
    { name: 'Technical', positions: allOutfieldPositions, description: 'Excellent close control', sortOrder: 11 },
    { name: 'Bruiser', positions: defendingPositions, description: 'Physical and aggressive in challenges', sortOrder: 12 },
    { name: 'Intercept', positions: defendingPositions, description: 'Reads the game to intercept passes', sortOrder: 13 },
    { name: 'Jockey', positions: defendingPositions, description: 'Expert at containing attackers', sortOrder: 14 },
    { name: 'Aerial', positions: ['CB', 'ST', 'CF'], description: 'Dominant in the air', sortOrder: 15 },
    { name: 'Acrobatic', positions: ['GK'], description: 'Spectacular shot-stopping', sortOrder: 16 },
    { name: 'Rushing', positions: ['GK'], description: 'Quick off the line', sortOrder: 17 },
    { name: 'Far Reach', positions: ['GK'], description: 'Extended diving reach', sortOrder: 18 },
    { name: 'Footwork', positions: ['GK'], description: 'Good with feet for distribution', sortOrder: 19 },
  ];

  let playStyleCount = 0;
  for (const template of playStyleTemplates) {
    for (const position of template.positions) {
      await prisma.playStyleDefinition.upsert({
        where: {
          name_position: { name: template.name, position: position as any },
        },
        update: { description: template.description, sortOrder: template.sortOrder },
        create: {
          name: template.name,
          position: position as any,
          description: template.description,
          sortOrder: template.sortOrder,
        },
      });
      playStyleCount++;
    }
  }
  console.log(`Seeded ${playStyleCount} play style definitions`);

  // Seed League Settings
  const leagueSettings = [
    { key: 'waiver_period_days', value: '3' },
    { key: 'trade_offer_expiry_days', value: '7' },
    { key: 'free_agency_cost_percent', value: '50' },
  ];

  for (const setting of leagueSettings) {
    await prisma.leagueSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`Seeded ${leagueSettings.length} league settings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
