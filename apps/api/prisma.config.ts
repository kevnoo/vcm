import fs from 'node:fs'
import path from 'node:path'
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env from monorepo root (no-op in production where file doesn't exist)
config({ path: path.resolve(__dirname, '../../.env') })

// Dev: src/prisma/schema.prisma | Production: prisma/schema.prisma
const schemaPath = fs.existsSync(path.resolve(__dirname, 'prisma/schema.prisma'))
  ? path.resolve(__dirname, 'prisma/schema.prisma')
  : path.resolve(__dirname, 'src/prisma/schema.prisma')

export default defineConfig({
  schema: schemaPath,
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
