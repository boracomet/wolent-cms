import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { NotFoundError } from '@wolent/utils'
import { generateToken, sha256 } from '../utils/crypto.js'

export async function apiTokenRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── GET /api/admin/api-tokens ────────────────────────────────────────────
  app.get('/api/admin/api-tokens', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const tokens = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).apiToken.findMany({
        select: {
          id: true, name: true, description: true, type: true,
          permissions: true, expiresAt: true, lastUsedAt: true,
          createdAt: true, createdById: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    )
    return { data: tokens }
  })

  // ─── POST /api/admin/api-tokens ───────────────────────────────────────────
  app.post('/api/admin/api-tokens', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      type: z.enum(['full-access', 'read-only', 'custom']).default('read-only'),
      permissions: z.record(z.unknown()).optional(),
      expiresAt: z.string().datetime().optional(),
    })

    const input = schema.parse(req.body)
    const rawToken = generateToken(48)
    const tokenHash = sha256(rawToken)

    const token = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).apiToken.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          tokenHash,
          type: input.type,
          permissions: input.permissions ? JSON.stringify(input.permissions) : null,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          createdById: req.user.sub,
          tenantId: req.tenantId,
        },
        select: {
          id: true, name: true, type: true, expiresAt: true, createdAt: true,
        },
      })
    )

    // Return plaintext token ONCE — never stored
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reply.status(201).send({ data: { ...(token as any), token: rawToken } })
  })

  // ─── DELETE /api/admin/api-tokens/:id ────────────────────────────────────
  app.delete('/api/admin/api-tokens/:id', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const token = await (prisma as any).apiToken.findFirst({ where: { id } })
      if (!token) throw new NotFoundError('ApiToken', id)
      await (prisma as any).apiToken.delete({ where: { id } })
    })

    return reply.send({ data: { ok: true } })
  })
}
