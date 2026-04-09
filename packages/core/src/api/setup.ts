/**
 * First-run Setup Wizard API.
 * When SETUP_COMPLETED=false (or no tenants in DB), these routes are active.
 *
 * Kurulumda SQLite / PostgreSQL seçilebilir; PostgreSQL için schema provider güncellenir,
 * prisma generate + db push çalışır, tenant oluşturma ayrı süreçte (setup-bootstrap-worker) yapılır.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { validatePasswordStrength } from '../auth/password.js'
import { BadRequestError } from '@wolent/utils'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { findUpSync } from 'find-up'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getSetupPrisma(): PrismaClient {
  process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'
  return new PrismaClient()
}

function findRepoRoot(): string {
  const from = path.join(__dirname, '../..')
  const ws = findUpSync('pnpm-workspace.yaml', { cwd: from })
    ?? findUpSync('pnpm-workspace.yaml', { cwd: process.cwd() })
  return ws ? path.dirname(ws) : process.cwd()
}

function databasePackageDir(): string {
  return path.join(findRepoRoot(), 'packages', 'database')
}

function schemaPath(): string {
  return path.join(databasePackageDir(), 'prisma', 'schema.prisma')
}

/** SQLite göreli yolları şema dizinine göre mutlak file: URL yapar (API cwd'den bağımsız). */
function resolveSqliteDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl.startsWith('file:')) return databaseUrl
  const pathPart = databaseUrl.replace(/^file:/, '')
  if (path.isAbsolute(pathPart)) return databaseUrl
  const prismaDir = path.join(databasePackageDir(), 'prisma')
  const rel = pathPart.replace(/^\.\//, '')
  const absPath = path.resolve(prismaDir, rel)
  return pathToFileURL(absPath).href
}

function patchSchemaProvider(provider: 'sqlite' | 'postgresql'): void {
  const fp = schemaPath()
  if (!existsSync(fp)) return
  let s = readFileSync(fp, 'utf8')
  s = s.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${provider}"`)
  writeFileSync(fp, s)
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

async function testSqliteUrl(databaseUrl: string): Promise<void> {
  const p = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  try {
    await p.$queryRaw`SELECT 1`
  } finally {
    await p.$disconnect()
  }
}

async function testPostgresUrl(databaseUrl: string): Promise<void> {
  const { Client } = await import('pg')
  const c = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 10_000 })
  try {
    await c.connect()
    await c.query('SELECT 1')
  } finally {
    await c.end().catch(() => {})
  }
}

function runPrismaGenerateAndPush(databaseUrl: string): void {
  const dbDir = databasePackageDir()
  const env = { ...process.env, DATABASE_URL: databaseUrl }
  execFileSync('npx', ['prisma', 'generate', '--schema=prisma/schema.prisma'], {
    cwd: dbDir,
    env,
    stdio: 'inherit',
  })
  execFileSync(
    'npx',
    ['prisma', 'db', 'push', '--schema=prisma/schema.prisma', '--accept-data-loss', '--skip-generate'],
    { cwd: dbDir, env, stdio: 'inherit' },
  )
}

type BootstrapResult = {
  ok: boolean
  tenantId?: string
  userId?: string
  accessToken?: string
  refreshToken?: string
  error?: string
}

function runBootstrapWorker(payload: Record<string, unknown>, databaseUrl: string): BootstrapResult {
  const repo = findRepoRoot()
  const workerTs = path.join(repo, 'packages', 'core', 'src', 'scripts', 'setup-bootstrap-worker.ts')
  const r = spawnSync('npx', ['tsx', workerTs], {
    cwd: repo,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    input: JSON.stringify({ ...payload, databaseUrl }),
    encoding: 'utf-8',
    maxBuffer: 20_000_000,
    timeout: 60_000,
  })
  const out = (r.stdout ?? '').trim()
  const lastLine = out.split('\n').filter(Boolean).pop() ?? ''
  try {
    return JSON.parse(lastLine) as BootstrapResult
  } catch {
    return {
      ok: false,
      error: r.stderr?.toString() || out || `Worker exited ${r.status}`,
    }
  }
}

export async function setupRoutes(app: FastifyInstance) {
  app.get('/api/setup/status', async (_req, reply) => {
    const required = await isSetupRequired()
    return reply.send({ data: { required, version: '0.1.0' } })
  })

  app.post('/api/setup/check-db', async (req, reply) => {
    const setupRequired = await isSetupRequired()
    if (!setupRequired) {
      return reply.status(403).send({
        error: { status: 403, name: 'ForbiddenError', message: 'Setup already completed' },
      })
    }

    const envDbUrl = process.env['DATABASE_URL']
    if (envDbUrl) {
      try {
        if (envDbUrl.startsWith('file:')) {
          await testSqliteUrl(envDbUrl)
        } else {
          await testPostgresUrl(envDbUrl)
        }
      } catch {
        // Dosya henüz yoksa ok — entrypoint prisma db push ile oluşturacak
      }
      return reply.send({ data: { ok: true } })
    }

    const body = z
      .object({
        databaseUrl: z.string().min(1),
        provider: z.enum(['sqlite', 'postgresql']),
      })
      .parse(req.body)

    try {
      if (body.provider === 'sqlite') {
        if (!body.databaseUrl.startsWith('file:')) {
          throw new BadRequestError('SQLite DATABASE_URL must start with file:')
        }
        await testSqliteUrl(resolveSqliteDatabaseUrl(body.databaseUrl))
      } else {
        await testPostgresUrl(body.databaseUrl)
      }
      return reply.send({ data: { ok: true } })
    } catch (err) {
      const msg =
        err instanceof BadRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Connection failed'
      return reply.status(503).send({
        error: {
          status: 503,
          name: 'DatabaseError',
          message: msg,
        },
      })
    }
  })

  app.post('/api/setup/complete', async (req, reply) => {
    const required = await isSetupRequired()
    if (!required) {
      return reply.status(403).send({
        error: { status: 403, name: 'ForbiddenError', message: 'Setup already completed' },
      })
    }

    const schema = z.object({
      siteName: z.string().min(1).max(100).default('My Wolent CMS'),
      siteUrl: z.string().url().optional(),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      email: z.string().email(),
      password: z.string().min(8).max(128),
      databaseProvider: z.enum(['sqlite', 'postgresql']),
      databaseUrl: z.string().min(1),
    })

    const input = schema.parse(req.body)

    const strength = validatePasswordStrength(input.password)
    if (!strength.valid) throw new BadRequestError(strength.reason!)

    // Eğer ortam değişkeni zaten ayarlıysa (Docker gibi), onu kullan — frontend'den gelen URL'i yoksay.
    const envDbUrl = process.env['DATABASE_URL']
    let effectiveDbUrl: string
    let resolvedProvider: 'sqlite' | 'postgresql' = input.databaseProvider
    if (envDbUrl) {
      effectiveDbUrl = envDbUrl
      // provider'ı env URL'inden tespit et
      resolvedProvider = envDbUrl.startsWith('file:') ? 'sqlite' : 'postgresql'
    } else {
      if (input.databaseProvider === 'sqlite' && !input.databaseUrl.startsWith('file:')) {
        throw new BadRequestError('SQLite DATABASE_URL must start with file:')
      }
      if (
        input.databaseProvider === 'postgresql' &&
        !input.databaseUrl.startsWith('postgresql:') &&
        !input.databaseUrl.startsWith('postgres:')
      ) {
        throw new BadRequestError('PostgreSQL DATABASE_URL must start with postgresql: or postgres:')
      }
      effectiveDbUrl =
        input.databaseProvider === 'sqlite'
          ? resolveSqliteDatabaseUrl(input.databaseUrl)
          : input.databaseUrl.trim()
    }

    patchSchemaProvider(resolvedProvider)
    updateEnvFile({ DATABASE_URL: effectiveDbUrl })
    process.env['DATABASE_URL'] = effectiveDbUrl

    // Entrypoint zaten `prisma db push` çalıştırdıysa (Docker), bu adımı atla
    if (!envDbUrl) {
      try {
        runPrismaGenerateAndPush(effectiveDbUrl)
      } catch (e) {
        throw new BadRequestError(
          e instanceof Error ? `Prisma failed: ${e.message}` : 'Prisma generate/db push failed',
        )
      }
    }

    const bootstrap = runBootstrapWorker(
      {
        siteName: input.siteName,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: input.password,
        ip: req.ip,
        ua: req.headers['user-agent'],
      },
      effectiveDbUrl,
    )

    if (!bootstrap.ok || !bootstrap.tenantId || !bootstrap.userId) {
      throw new BadRequestError(bootstrap.error ?? 'Initial data creation failed')
    }

    updateEnvFile({
      SETUP_COMPLETED: 'true',
      ...(input.siteUrl ? { CORS_ORIGINS: input.siteUrl } : {}),
    })

    let accessToken = bootstrap.accessToken
    if (bootstrap.refreshToken) {
      reply.setCookie('wolent_refresh', bootstrap.refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60,
      })
    }

    if (!accessToken) {
      try {
        const { authService } = await import('../auth/service.js')
        const loginResult = await authService.login(
          { email: input.email, password: input.password },
          { tenantId: bootstrap.tenantId, ip: req.ip, ua: req.headers['user-agent'] },
        )
        accessToken = loginResult.tokens.accessToken
        if (loginResult.tokens.refreshToken) {
          reply.setCookie('wolent_refresh', loginResult.tokens.refreshToken, {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'lax',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60,
          })
        }
      } catch {
        /* kullanıcı girişten devam eder */
      }
    }

    return reply.status(201).send({
      data: {
        ok: true,
        tenantId: bootstrap.tenantId,
        userId: bootstrap.userId,
        accessToken,
        message: `Welcome to Wolent CMS, ${input.firstName}! You can now log in.`,
        /** PostgreSQL / yeni Prisma motoru: API’yi yeniden başlatmanız önerilir. */
        restartRecommended: resolvedProvider === 'postgresql',
      },
    })
  })
}
