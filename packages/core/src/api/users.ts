import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { hashPassword, validatePasswordStrength } from '../auth/password.js'
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
  RoleSchema,
  type Role,
} from '@wolent/utils'
import { assertCan } from '../rbac/permissions.js'

export async function userRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── GET /api/admin/users ─────────────────────────────────────────────────
  app.get('/api/admin/users', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const users = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).user.findMany({
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, lastLoginAt: true, createdAt: true,
          twoFactorEnabled: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    )
    return { data: users }
  })

  // ─── GET /api/admin/users/:id ─────────────────────────────────────────────
  app.get('/api/admin/users/:id', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const { id } = req.params as { id: string }
    const user = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).user.findFirst({
        where: { id },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, lastLoginAt: true, createdAt: true,
          twoFactorEnabled: true,
        },
      })
    )
    if (!user) throw new NotFoundError('User', id)
    return { data: user }
  })

  // ─── POST /api/admin/users ────────────────────────────────────────────────
  app.post('/api/admin/users', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: RoleSchema.default('author'),
    })

    const input = schema.parse(req.body)
    if (input.role === 'super_admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenError('Only super_admin can assign the super_admin role')
    }
    const strength = validatePasswordStrength(input.password)
    if (!strength.valid) throw new BadRequestError(strength.reason!)

    const existing = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).user.findFirst({ where: { email: input.email } })
    )
    if (existing) throw new ConflictError('Email already registered')

    const passwordHash = await hashPassword(input.password)
    const user = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          role: input.role,
          tenantId: req.tenantId,
        },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true,
        },
      })
    )

    return reply.status(201).send({ data: user })
  })

  // ─── PUT /api/admin/users/:id ─────────────────────────────────────────────
  app.put('/api/admin/users/:id', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      role: RoleSchema.optional(),
      isActive: z.boolean().optional(),
    })

    const input = schema.parse(req.body)

    if (input.role === 'super_admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenError('Only super_admin can assign the super_admin role')
    }

    const updated = await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const exists = await (prisma as any).user.findFirst({ where: { id } })
      if (!exists) throw new NotFoundError('User', id)

      // Cannot demote the last super_admin
      if (exists.role === 'super_admin' && input.role && input.role !== 'super_admin') {
        const superAdminCount = await (prisma as any).user.count({ where: { role: 'super_admin' } })
        if (superAdminCount <= 1) {
          throw new BadRequestError('Cannot demote the last super admin')
        }
      }

      return (prisma as any).user.update({
        where: { id },
        data: input,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
      })
    })

    return reply.send({ data: updated })
  })

  // ─── DELETE /api/admin/users/:id ──────────────────────────────────────────
  app.delete('/api/admin/users/:id', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const user = await (prisma as any).user.findFirst({ where: { id } })
      if (!user) throw new NotFoundError('User', id)
      if (user.id === req.user.sub) throw new BadRequestError('Cannot delete your own account')

      await (prisma as any).user.update({ where: { id }, data: { isActive: false } })
    })

    return reply.send({ data: { ok: true } })
  })
}
