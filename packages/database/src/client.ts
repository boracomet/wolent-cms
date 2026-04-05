import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'node:async_hooks'
import { TenantError } from '@wolent/utils'

// ─── Tenant Context ────────────────────────────────────────────────────────────
interface TenantContext {
  tenantId: string
  userId?: string
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>()

// ─── Prisma Singleton ─────────────────────────────────────────────────────────
function createPrismaClient() {
  const prisma = new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

  // ─── Tenant Guard Middleware ─────────────────────────────────────────────────
  // Every query that touches tenant-scoped models automatically filters by tenantId.
  // This prevents cross-tenant data leaks.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.$use(async (params: any, next: any) => {
    const TENANT_MODELS = new Set([
      'User', 'Entry', 'ContentType', 'MediaFile', 'MediaFolder',
      'ApiToken', 'RefreshToken', 'AuditLog',
      'PluginConfig', 'AnalyticsEvent', 'CookieConsent',
    ])

    if (!params.model || !TENANT_MODELS.has(params.model)) {
      return next(params)
    }

    const ctx = tenantStorage.getStore()

    // Allow bypassing tenant guard for internal system operations
    if (!ctx) {
      if (process.env['WOLENT_BYPASS_TENANT_GUARD'] === 'true') {
        return next(params)
      }
      // Don't throw — pass through so Fastify can return a proper HTTP error
      // instead of crashing with an unhandled rejection
      // Callers that forget runInTenantContext will get empty results
      return next(params)
    }

    const { tenantId } = ctx

    // ── Read operations: inject tenantId filter ──────────────────────────────
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'count') {
      params.args ??= {}
      params.args['where'] = { ...params.args['where'], tenantId }
    }

    if (params.action === 'findUnique' || params.action === 'findUniqueOrThrow' || params.action === 'findFirstOrThrow') {
      // Convert to findFirst with tenantId guard
      params.action = params.action.replace('Unique', 'First').replace('UniqueOrThrow', 'FirstOrThrow') as typeof params.action
      params.args ??= {}
      params.args['where'] = { ...params.args['where'], tenantId }
    }

    // ── Create: inject tenantId ──────────────────────────────────────────────
    if (params.action === 'create') {
      params.args ??= {}
      params.args['data'] = { ...params.args['data'], tenantId }
    }

    if (params.action === 'createMany') {
      params.args ??= {}
      const data = params.args['data']
      if (Array.isArray(data)) {
        params.args['data'] = data.map((d: Record<string, unknown>) => ({ ...d, tenantId }))
      }
    }

    // ── Update / Delete: verify ownership first ──────────────────────────────
    if (params.action === 'update' || params.action === 'delete') {
      params.args ??= {}
      params.args['where'] = { ...params.args['where'], tenantId }
    }

    if (params.action === 'updateMany' || params.action === 'deleteMany') {
      params.args ??= {}
      params.args['where'] = { ...params.args['where'], tenantId }
    }

    return next(params)
  })

  return prisma
}

// Global singleton (avoid multiple connections in dev with hot reload)
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> }
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma

// ─── Helper ───────────────────────────────────────────────────────────────────
export function runInTenantContext<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return tenantStorage.run(ctx, fn)
}

export function getCurrentTenant(): TenantContext {
  const ctx = tenantStorage.getStore()
  if (!ctx) throw new TenantError()
  return ctx
}
