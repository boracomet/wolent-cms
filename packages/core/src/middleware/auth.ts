import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../auth/jwt.js'
import { sha256 } from '../utils/crypto.js'
import { prisma, runInTenantContext } from '@wolent/database'
import { UnauthorizedError, type JwtPayload } from '@wolent/utils'

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

  // Tenant discovery — from header or subdomain
  const tenantId = (req.headers['x-wolent-tenant'] as string | undefined) ?? ''
  if (!tenantId) throw new UnauthorizedError('Missing X-Wolent-Tenant header')

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

// Tenant slug → ID cache (avoids repeated DB hits)
const tenantIdCache = new Map<string, string>()

/**
 * Tenant injection middleware — runs before auth.
 * Resolves tenantId from X-Wolent-Tenant header (slug) by looking up the DB.
 * Results are cached in-memory.
 */
export async function injectTenant(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const slug = (req.headers['x-wolent-tenant'] as string | undefined) ?? 'default'

  if (tenantIdCache.has(slug)) {
    req.tenantId = tenantIdCache.get(slug)!
    return
  }

  try {
    // Bypass tenant guard for this bootstrap lookup
    const prevBypass = process.env['WOLENT_BYPASS_TENANT_GUARD']
    process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenant = await (prisma as any).tenant.findFirst({ where: { slug } })
    process.env['WOLENT_BYPASS_TENANT_GUARD'] = prevBypass ?? ''

    if (tenant?.id) {
      tenantIdCache.set(slug, tenant.id)
      req.tenantId = tenant.id
    } else {
      req.tenantId = slug
    }
  } catch {
    req.tenantId = slug
  }
}
