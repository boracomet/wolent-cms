import { config as dotenvConfig } from 'dotenv'
import { findUpSync } from 'find-up'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Load .env from the project root (monorepo root or app root)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envFile = findUpSync('.env', { cwd: __dirname }) ?? path.resolve(__dirname, '../../../.env')
dotenvConfig({ path: envFile })

import { buildApp } from './app.js'
import { getEnv } from './config/env.js'
import { prisma } from '@wolent/database'

async function start() {
  const env = getEnv()
  const app = await buildApp()

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`🚀 Wolent CMS running at http://${env.HOST}:${env.PORT}`)
    app.log.info(`📖 Admin panel: http://localhost:1337`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

async function shutdown() {
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()
