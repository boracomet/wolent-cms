import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../auth/jwt.js'
import { sha256 } from '../utils/crypto.js'
import { prisma, runInTenantContext } from '@wolent/database'
import { BadRequestError, UnauthorizedError, type JwtPayload } from '@wolent/utils'

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
    tenantId: string
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw new UnauthorizedError('Missing authorization header')
  }

  const payload = await verifyAccessToken(token)
  req.user = payload
  req.tenantId = payload.tenantId
}

export async function requireRole(roles: string[]) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    if (!roles.includes(req.user.role)) {
      const { ForbiddenError } = await import('@wolent/utils')
      throw new ForbiddenError(`Role "${req.user.role}" is not allowed here`)
    }
  }
}

/**
 * Authenticate via API Token (for public API access).
 * Checks Authorization: Bearer <token> against DB hashes.
 */
export async function requireApiToken(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization
  const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!rawToken) {
    // Try JWT fallback
    return requireAuth(req, reply)
  }

  const hash = sha256(rawToken)

  const tenantId = req.tenantId
  if (!tenantId) throw new UnauthorizedError('Missing tenant context')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = await runInTenantContext({ tenantId }, () =>
    prisma.apiToken.findFirst({ where: { tokenHash: hash } })
  ) as any

  if (!token) throw new UnauthorizedError('Invalid API token')
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
    throw new UnauthorizedError('API token expired')
  }

  // Update last used
  void runInTenantContext({ tenantId }, () =>
    prisma.apiToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    })
  )

  req.tenantId = tenantId
  req.user = {
    sub: `token:${token.id}`,
    email: '',
    role: token.type === 'full-access' ? 'editor' : 'viewer',
    tenantId,
  }
}

/**
 * Bearer token: önce JWT, geçersizse API token (hash) dener.
 * İçerik API’si için headless erişim.
 */
export async function requireAuthOrApiToken(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization
  const raw = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!raw) {
    throw new UnauthorizedError('Missing authorization header')
  }

  const parts = raw.split('.')
  if (parts.length === 3) {
    try {
      const payload = await verifyAccessToken(raw)
      req.user = payload
      req.tenantId = payload.tenantId
      return
    } catch {
      // JWT değil veya süresi dolmuş — API token dene
    }
  }

  await requireApiToken(req, reply)
}

// Tenant slug → ID cache (avoids repeated DB hits)
const tenantIdCache = new Map<string, string>()

/**
 * Tenant injection middleware — runs before auth.
 * Resolves tenantId from X-Wolent-Tenant header (slug) by looking up the DB.
 * Results are cached in-memory.
 */
function shouldRelaxTenantResolution(url: string): boolean {
  const path = url.split('?')[0]
  return path === '/health' || path.startsWith('/api/setup/')
}

export async function injectTenant(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const slug = (req.headers['x-wolent-tenant'] as string | undefined) ?? 'default'
  const relax = shouldRelaxTenantResolution(req.url)

  if (tenantIdCache.has(slug)) {
    req.tenantId = tenantIdCache.get(slug)!
    return
  }

  try {
    let tenant: any
    try {
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tenant = await (prisma as any).tenant.findFirst({ where: { slug } })
    } finally {
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = ''
    }

    if (tenant?.id) {
      tenantIdCache.set(slug, tenant.id)
      req.tenantId = tenant.id
    } else if (relax) {
      req.tenantId = slug
    } else {
      throw new BadRequestError(`Unknown tenant "${slug}". Check X-Wolent-Tenant header.`)
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err
    if (relax) {
      req.tenantId = slug
    } else {
      throw new BadRequestError(`Unknown tenant "${slug}". Check X-Wolent-Tenant header.`)
    }
  }
}
