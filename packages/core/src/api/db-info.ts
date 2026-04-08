import type { FastifyInstance } from 'fastify'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { getEnv } from '../config/env.js'
import { prisma, runInTenantContext } from '@wolent/database'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

function parseDbUrl(url: string) {
  try {
    if (url.startsWith('file:') || url.startsWith('./') || url.endsWith('.db')) {
      return { driver: 'sqlite' as const, path: url.replace(/^file:/, '') }
    }
    const u = new URL(url)
    return {
      driver: 'postgres' as const,
      host: u.hostname,
      port: u.port || '5432',
      database: u.pathname.replace(/^\//, ''),
      user: u.username,
      ssl: u.searchParams.get('sslmode') !== 'disable',
    }
  } catch {
    return { driver: 'unknown' as const }
  }
}

export async function dbInfoRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // GET /api/admin/db-info — return parsed DB connection info (no secrets)
  app.get('/api/admin/db-info', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const env = getEnv()
    const parsed = parseDbUrl(env.DATABASE_URL)

    // Test connection
    let connected = false
    try {
      await runInTenantContext({ tenantId: req.tenantId }, () => (prisma as any).$queryRaw`SELECT 1`)
      connected = true
    } catch { /* ignore */ }

    // Mask password — never send it
    const info = parsed.driver === 'postgres'
      ? { driver: parsed.driver, host: parsed.host, port: parsed.port, database: parsed.database, user: parsed.user, ssl: parsed.ssl, connected }
      : { driver: parsed.driver, path: (parsed as { path?: string }).path, connected }

    return { data: info }
  })

  // GET /api/admin/db-info/migrations — list applied/pending migrations via Prisma
  app.get('/api/admin/db-info/migrations', { preHandler: [requireAuth, await adminOnly] }, async () => {
    try {
      // Read migration status via prisma migrate status (stdout parsing)
      const prismaDir = path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../../../../database'
      )
      const { stdout } = await execFileAsync('npx', ['prisma', 'migrate', 'status', '--schema=./prisma/schema.prisma'], {
        cwd: prismaDir,
        timeout: 15000,
      }).catch(() => ({ stdout: '' }))

      // Parse output: lines like "  20240101_init  ... Applied"
      const rows: { id: string; name: string; status: 'applied' | 'pending'; appliedAt: string | null }[] = []
      const lines = stdout.split('\n')
      for (const line of lines) {
        const applied = line.match(/^\s+(\d{14}_\S+)\s+.*Applied/i)
        const pending = line.match(/^\s+(\d{14}_\S+)\s+.*Pending/i)
        if (applied) {
          rows.push({ id: applied[1].slice(0, 14), name: applied[1].slice(15), status: 'applied', appliedAt: applied[1].slice(0, 8) })
        } else if (pending) {
          rows.push({ id: pending[1].slice(0, 14), name: pending[1].slice(15), status: 'pending', appliedAt: null })
        }
      }
      return { data: rows }
    } catch {
      return { data: [] }
    }
  })

  // POST /api/admin/db-info/migrate — run prisma migrate deploy
  app.post('/api/admin/db-info/migrate', { preHandler: [requireAuth, await adminOnly] }, async (_req, reply) => {
    try {
      const prismaDir = path.resolve(
        fileURLToPath(new URL('.', import.meta.url)),
        '../../../../database'
      )
      await execFileAsync('npx', ['prisma', 'migrate', 'deploy', '--schema=./prisma/schema.prisma'], {
        cwd: prismaDir,
        timeout: 60000,
      })
      return { data: { ok: true } }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Migration failed'
      return reply.status(500).send({ error: { message: msg } })
    }
  })
}
