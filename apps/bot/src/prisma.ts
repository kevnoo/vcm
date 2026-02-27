import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../api/src/generated/prisma/client.js';
import { DATABASE_URL } from './config.js';

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
