import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../middleware/auth.js'

const RoleOverridePermissionsSchema = z
  .object({
    contentTypes: z
      .object({
        read: z.boolean().optional(),
        create: z.boolean().optional(),
        update: z.boolean().optional(),
        delete: z.boolean().optional(),
      })
      .strict()
      .optional(),
    media: z
      .object({
        read: z.boolean().optional(),
        create: z.boolean().optional(),
        update: z.boolean().optional(),
        delete: z.boolean().optional(),
      })
      .strict()
      .optional(),
    users: z
      .object({
        read: z.boolean().optional(),
        create: z.boolean().optional(),
        update: z.boolean().optional(),
        delete: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

// Static role definitions derived from the RBAC permission matrix
const ROLE_DEFINITIONS = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full access to all features including settings and user management',
    permissions: {
      contentTypes: { read: true, create: true, update: true, delete: true },
      media: { read: true, create: true, update: true, delete: true },
      users: { read: true, create: true, update: true, delete: true },
    },
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full content access plus settings management, cannot manage super admins',
    permissions: {
      contentTypes: { read: true, create: true, update: true, delete: true },
      media: { read: true, create: true, update: true, delete: true },
      users: { read: true, create: true, update: true, delete: false },
    },
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can create, edit and publish content and manage media',
    permissions: {
      contentTypes: { read: true, create: true, update: true, delete: false },
      media: { read: true, create: true, update: true, delete: false },
      users: { read: false, create: false, update: false, delete: false },
    },
  },
  {
    id: 'author',
    name: 'Author',
    description: 'Can create and edit their own content entries',
    permissions: {
      contentTypes: { read: true, create: true, update: true, delete: false },
      media: { read: true, create: true, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
    },
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content and media',
    permissions: {
      contentTypes: { read: true, create: false, update: false, delete: false },
      media: { read: true, create: false, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
    },
  },
]

const ROLE_OVERRIDES_KEY = '_settings::role-overrides'

async function getRoleOverrides(tenantId: string): Promise<Record<string, Record<string, unknown>>> {
  const row = await runInTenantContext({ tenantId }, () =>
    (prisma as any).pluginConfig.findFirst({ where: { pluginId: ROLE_OVERRIDES_KEY, tenantId } })
  )
  if (!row) return {}
  try { return JSON.parse((row as any).config) as Record<string, Record<string, unknown>> } catch { return {} }
}

export async function roleRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // GET /api/admin/roles — list roles with user counts
  app.get('/api/admin/roles', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const [counts, overrides] = await Promise.all([
      runInTenantContext({ tenantId: req.tenantId }, () =>
        (prisma as any).user.groupBy({
          by: ['role'],
          _count: { role: true },
          where: { isActive: true },
        })
      ) as Promise<{ role: string; _count: { role: number } }[]>,
      getRoleOverrides(req.tenantId),
    ])

    const countMap: Record<string, number> = {}
    for (const row of counts) {
      countMap[row.role] = row._count.role
    }

    const roles = ROLE_DEFINITIONS.map(r => ({
      ...r,
      permissions: overrides[r.id] ? { ...r.permissions, ...overrides[r.id] } : r.permissions,
      usersCount: countMap[r.id] ?? 0,
    }))

    return { data: roles }
  })

  // PUT /api/admin/roles/:id/permissions — update role permission overrides
  app.put('/api/admin/roles/:id/permissions', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const role = ROLE_DEFINITIONS.find(r => r.id === id)
    if (!role) return reply.status(404).send({ error: { status: 404, name: 'NotFoundError', message: `Role "${id}" not found` } })

    const newPerms = RoleOverridePermissionsSchema.parse(req.body)
    const tenantId = req.tenantId

    const overrides = await getRoleOverrides(tenantId)
    overrides[id] = newPerms as Record<string, unknown>

    await runInTenantContext({ tenantId }, () =>
      (prisma as any).pluginConfig.upsert({
        where: { tenantId_pluginId: { tenantId, pluginId: ROLE_OVERRIDES_KEY } },
        update: { config: JSON.stringify(overrides) },
        create: { pluginId: ROLE_OVERRIDES_KEY, tenantId, enabled: true, config: JSON.stringify(overrides) },
      })
    )

    return { data: { id, permissions: newPerms } }
  })
}
