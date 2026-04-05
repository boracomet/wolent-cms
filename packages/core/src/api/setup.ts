/**
 * First-run Setup Wizard API.
 * When SETUP_COMPLETED=false (or no tenants in DB), these routes are active.
 * After setup, they return 403.
 *
 * Strapi-like flow:
 *   GET  /api/setup/status    → { required: true/false }
 *   POST /api/setup/complete  → creates tenant + super admin, sets SETUP_COMPLETED=true
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { hashPassword, validatePasswordStrength } from '../auth/password.js'
import { BadRequestError, ConflictError } from '@wolent/utils'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { findUpSync } from 'find-up'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Bypass tenant guard for setup operations
function getSetupPrisma(): PrismaClient {
  process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'
  return new PrismaClient()
}

async function isSetupRequired(): Promise<boolean> {
  const p = getSetupPrisma()
  try {
    const tenantCount = await p.tenant.count()
    return tenantCount === 0
  } catch {
    return true
  } finally {
    await p.$disconnect()
    process.env['WOLENT_BYPASS_TENANT_GUARD'] = ''
  }
}

function findEnvFile(): string | null {
  const envPath = findUpSync('.env', { cwd: __dirname })
  return envPath ?? null
}

function updateEnvFile(updates: Record<string, string>): void {
  const envPath = findEnvFile()
  if (!envPath) return

  let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  for (const [key, value] of Object.entries(updates)) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    if (new RegExp(`^${key}=`, 'm').test(content)) {
      content = content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}="${escaped}"`)
    } else {
      content += `\n${key}="${escaped}"`
    }
  }
  writeFileSync(envPath, content)
}

export async function setupRoutes(app: FastifyInstance) {
  // ─── GET /api/setup/status ─────────────────────────────────────────────────
  app.get('/api/setup/status', async (_req, reply) => {
    const required = await isSetupRequired()
    return reply.send({ data: { required, version: '0.1.0' } })
  })

  // ─── POST /api/setup/complete ──────────────────────────────────────────────
  app.post('/api/setup/complete', async (req, reply) => {
    // Only callable when setup is required
    const required = await isSetupRequired()
    if (!required) {
      return reply.status(403).send({
        error: { status: 403, name: 'ForbiddenError', message: 'Setup already completed' },
      })
    }

    const schema = z.object({
      // Site info
      siteName: z.string().min(1).max(100).default('My Wolent CMS'),
      siteUrl: z.string().url().optional(),

      // Admin account
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email(),
      password: z.string().min(8).max(128),

      // Database (already configured via env, just confirm)
      confirmed: z.boolean().default(true),
    })

    const input = schema.parse(req.body)

    // Validate password
    const strength = validatePasswordStrength(input.password)
    if (!strength.valid) throw new BadRequestError(strength.reason!)

    const p = getSetupPrisma()
    try {
      // Create default tenant
      const slug = 'default'
      const existing = await p.tenant.findFirst({ where: { slug } })
      if (existing) throw new ConflictError('Setup already completed')

      const tenant = await p.tenant.create({
        data: { name: input.siteName, slug },
      })

      // Create super admin
      const passwordHash = await hashPassword(input.password)
      await p.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          role: 'super_admin',
          isActive: true,
          tenantId: tenant.id,
        },
      })

      // Update .env to mark setup complete and store site URL
      updateEnvFile({
        SETUP_COMPLETED: 'true',
        ...(input.siteUrl ? { CORS_ORIGINS: input.siteUrl } : {}),
      })

      return reply.status(201).send({
        data: {
          ok: true,
          tenantId: tenant.id,
          message: `Welcome to Wolent CMS, ${input.firstName}! You can now log in.`,
        },
      })
    } finally {
      await p.$disconnect()
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = ''
    }
  })

  // ─── POST /api/setup/check-db ──────────────────────────────────────────────
  // Test database connection (called from setup wizard before completing)
  app.post('/api/setup/check-db', async (_req, reply) => {
    const p = getSetupPrisma()
    try {
      await p.$queryRaw`SELECT 1`
      return reply.send({ data: { ok: true } })
    } catch (err) {
      return reply.status(503).send({
        error: {
          status: 503,
          name: 'DatabaseError',
          message: `Database connection failed: ${err instanceof Error ? err.message : 'unknown'}`,
        },
      })
    } finally {
      await p.$disconnect()
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = ''
    }
  })
}
