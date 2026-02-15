import path from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env from monorepo root (two levels up from apps/api/)
config({ path: path.resolve(__dirname, '../../.env') })

export default defineConfig({
  schema: path.resolve(__dirname, 'src/prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
