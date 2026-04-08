/**
 * Plugin Config API — CRUD for plugin enable/disable and configuration.
 * All plugin configs are stored in DB (PluginConfig table).
 * Sensitive fields (API keys, passwords) are stored as-is — in production
 * wrap them with AES-256-GCM encryption using ADMIN_JWT_SECRET as key.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'

const KNOWN_PLUGIN_IDS = [
  'cookie-management',
  'gemini-auto-translate',
  's3-object-storage',
  'sitemap-xml',
  'robots-txt',
  'redis-cache',
  'smtp-mail',
  'n8n-automation',
  'outbound-webhook',
  'native-analytics',
  'image-optimization',
] as const

export type PluginId = typeof KNOWN_PLUGIN_IDS[number]

export async function pluginConfigRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── GET /api/admin/plugins ───────────────────────────────────────────────
  app.get('/api/admin/plugins', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const rows = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findMany({ orderBy: { pluginId: 'asc' } })
    ) as any[]

    // Return map of pluginId → { enabled, config }
    const result: Record<string, { enabled: boolean; config: Record<string, unknown> }> = {}
    for (const row of rows) {
      result[row.pluginId] = {
        enabled: row.enabled,
        config: safeParseJson(row.config),
      }
    }
    return { data: result }
  })

  // ─── GET /api/admin/plugins/:pluginId ─────────────────────────────────────
  app.get('/api/admin/plugins/:pluginId', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const { pluginId } = req.params as { pluginId: string }
    const row = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId } })
    ) as any

    if (!row) {
      return { data: { enabled: false, config: {} } }
    }
    return { data: { enabled: row.enabled, config: safeParseJson(row.config) } }
  })

  // ─── PUT /api/admin/plugins/:pluginId ─────────────────────────────────────
  // Upsert: create or update plugin config
  app.put('/api/admin/plugins/:pluginId', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { pluginId } = req.params as { pluginId: string }
    if (!KNOWN_PLUGIN_IDS.includes(pluginId as PluginId)) {
      return reply.status(400).send({
        error: { status: 400, name: 'BadRequestError', message: `Unknown plugin: ${pluginId}` },
      })
    }
    const schema = z.object({
      enabled: z.boolean().optional(),
      config: z.record(z.unknown()).optional(),
    })
    const input = schema.parse(req.body)

    const row = await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const existing = await (prisma as any).pluginConfig.findFirst({ where: { pluginId } })
      if (existing) {
        const newConfig = input.config !== undefined
          ? JSON.stringify({ ...safeParseJson(existing.config), ...input.config })
          : existing.config
        return (prisma as any).pluginConfig.update({
          where: { id: existing.id },
          data: {
            ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
            config: newConfig,
          },
        })
      }
      return (prisma as any).pluginConfig.create({
        data: {
          tenantId: req.tenantId,
          pluginId,
          enabled: input.enabled ?? false,
          config: JSON.stringify(input.config ?? {}),
        },
      })
    })

    return reply.send({ data: { enabled: (row as any).enabled, config: safeParseJson((row as any).config) } })
  })

  // ─── POST /api/admin/plugins/:pluginId/toggle ─────────────────────────────
  app.post('/api/admin/plugins/:pluginId/toggle', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { pluginId } = req.params as { pluginId: string }
    if (!KNOWN_PLUGIN_IDS.includes(pluginId as PluginId)) {
      return reply.status(400).send({
        error: { status: 400, name: 'BadRequestError', message: `Unknown plugin: ${pluginId}` },
      })
    }
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body)

    const row = await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const existing = await (prisma as any).pluginConfig.findFirst({ where: { pluginId } })
      if (existing) {
        return (prisma as any).pluginConfig.update({
          where: { id: existing.id },
          data: { enabled },
        })
      }
      return (prisma as any).pluginConfig.create({
        data: { tenantId: req.tenantId, pluginId, enabled, config: '{}' },
      })
    })

    return reply.send({ data: { enabled: (row as any).enabled } })
  })
}

function safeParseJson(str: string): Record<string, unknown> {
  try { return JSON.parse(str) } catch { return {} }
}
