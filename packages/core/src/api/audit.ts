import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../middleware/auth.js'

export async function auditRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  app.get('/api/admin/audit-logs', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(50),
      action: z.string().optional(),
      userId: z.string().optional(),
    }).parse(req.query)

    const where: Record<string, unknown> = {}
    if (query.action) where['action'] = { contains: query.action }
    if (query.userId) where['userId'] = query.userId

    const [total, logs] = await runInTenantContext({ tenantId: req.tenantId }, () =>
      Promise.all([
        (prisma as any).auditLog.count({ where }),
        (prisma as any).auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
      ])
    )

    return {
      data: logs,
      meta: {
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          pageCount: Math.ceil(total / query.pageSize),
          total,
        },
      },
    }
  })
}

// ─── Audit Log Writer ──────────────────────────────────────────────────────────
export async function writeAuditLog(params: {
  tenantId: string
  userId?: string
  action: string
  subject?: string
  subjectId?: string
  payload?: unknown
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  try {
    await runInTenantContext({ tenantId: params.tenantId }, () =>
      (prisma as any).auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId ?? null,
          action: params.action,
          subject: params.subject ?? null,
          subjectId: params.subjectId ?? null,
          payload: params.payload ? JSON.stringify(params.payload) : null,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      })
    )
  } catch {
    // Audit log failures must never break the main flow
  }
}
