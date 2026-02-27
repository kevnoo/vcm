import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '..', '..', '..', '.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const BOT_TOKEN = required('DISCORD_BOT_TOKEN');
export const CLIENT_ID = required('DISCORD_CLIENT_ID');
export const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '';
export const DATABASE_URL = required('DATABASE_URL');
export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
