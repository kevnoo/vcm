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
  const adminDiscordId = process.env.ADMIN_DISCORD_ID;

  if (!adminDiscordId) {
    console.log('ADMIN_DISCORD_ID not set, skipping admin seed.');
    return;
  }

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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
