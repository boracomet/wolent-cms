/**
 * Admin Settings API — stores CMS configuration as JSON blobs in PluginConfig table.
 * Each settings namespace (general, i18n, security, notifications, appearance, menu, page-access)
 * is stored as pluginId = "_settings::{namespace}".
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { ForbiddenError } from '@wolent/utils'

const VALID_NAMESPACES = [
  'general', 'i18n', 'security', 'notifications', 'appearance', 'menu', 'page-access',
] as const

type Namespace = typeof VALID_NAMESPACES[number]

function nsKey(ns: Namespace) {
  return `_settings::${ns}`
}

export async function settingsRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // GET /api/admin/settings/:namespace
  app.get('/api/admin/settings/:namespace', { preHandler: [requireAuth] }, async (req, reply) => {
    const { namespace } = req.params as { namespace: string }
    if (!VALID_NAMESPACES.includes(namespace as Namespace)) {
      return reply.status(400).send({ error: 'Unknown settings namespace' })
    }
    const ns = namespace as Namespace
    if (
      (ns === 'security' || ns === 'notifications') &&
      !['super_admin', 'admin'].includes(req.user.role)
    ) {
      throw new ForbiddenError('You cannot read this settings namespace')
    }
    const row = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: nsKey(namespace as Namespace) } })
    ) as any
    const config = row ? safeParseJson(row.config) : {}
    return { data: config }
  })

  // PUT /api/admin/settings/:namespace — full replace
  app.put('/api/admin/settings/:namespace', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { namespace } = req.params as { namespace: string }
    if (!VALID_NAMESPACES.includes(namespace as Namespace)) {
      return reply.status(400).send({ error: 'Unknown settings namespace' })
    }
    const body = z.record(z.unknown()).parse(req.body)

    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const key = nsKey(namespace as Namespace)
      const existing = await (prisma as any).pluginConfig.findFirst({ where: { pluginId: key } })
      if (existing) {
        await (prisma as any).pluginConfig.update({
          where: { id: existing.id },
          data: { config: JSON.stringify(body) },
        })
      } else {
        await (prisma as any).pluginConfig.create({
          data: { tenantId: req.tenantId, pluginId: key, enabled: true, config: JSON.stringify(body) },
        })
      }
    })

    return { data: body }
  })
}

function safeParseJson(str: string): Record<string, unknown> {
  try { return JSON.parse(str) } catch { return {} }
}
