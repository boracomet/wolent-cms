/**
 * Robots.txt plugin.
 * GET /robots.txt — returns dynamically configured robots.txt content.
 * Admin can edit it through the CMS panel.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: {{sitemapUrl}}`

export async function robotsPluginRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── GET /robots.txt ──────────────────────────────────────────────────────
  app.get('/robots.txt', async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'robots-txt', enabled: true } })
    ) as any

    let content = DEFAULT_ROBOTS_TXT

    if (pluginRow) {
      const config = JSON.parse(pluginRow.config)
      if (config.content) {
        content = config.content
      }
      // Replace sitemap placeholder if sitemap plugin is also enabled
      const sitemapRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
        (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'sitemap-xml', enabled: true } }) as any
      ) as any
      if (sitemapRow) {
        const sitemapConfig = JSON.parse(sitemapRow.config)
        const sitemapUrl = sitemapConfig.baseUrl
          ? `${sitemapConfig.baseUrl.replace(/\/$/, '')}/sitemap.xml`
          : ''
        content = content.replace('{{sitemapUrl}}', sitemapUrl)
      } else {
        content = content.replace('\nSitemap: {{sitemapUrl}}', '')
      }
    }

    return reply
      .header('Content-Type', 'text/plain; charset=utf-8')
      .header('Cache-Control', 'public, max-age=86400')
      .send(content)
  })

  // ─── GET /api/plugins/robots/content ─────────────────────────────────────
  app.get('/api/plugins/robots/content', { preHandler: [requireAuth] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'robots-txt' } })
    ) as any as any

    const content = pluginRow ? (JSON.parse(pluginRow.config).content ?? DEFAULT_ROBOTS_TXT) : DEFAULT_ROBOTS_TXT
    return reply.send({ data: { content, isDefault: !pluginRow?.config || !JSON.parse(pluginRow.config).content } })
  })

  // ─── PUT /api/plugins/robots/content ─────────────────────────────────────
  app.put('/api/plugins/robots/content', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { content } = z.object({ content: z.string().min(1).max(10000) }).parse(req.body)

    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const existing = await (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'robots-txt' } }) as any
      if (existing) {
        const currentConfig = JSON.parse(existing.config)
        await (prisma as any).pluginConfig.update({
          where: { id: existing.id },
          data: { config: JSON.stringify({ ...currentConfig, content }) },
        })
      } else {
        await (prisma as any).pluginConfig.create({
          data: {
            tenantId: req.tenantId,
            pluginId: 'robots-txt',
            enabled: true,
            config: JSON.stringify({ content }),
          },
        })
      }
    })

    return reply.send({ data: { ok: true, content } })
  })

  // ─── POST /api/plugins/robots/reset ──────────────────────────────────────
  app.post('/api/plugins/robots/reset', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const existing = await (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'robots-txt' } }) as any
      if (existing) {
        const currentConfig = JSON.parse(existing.config)
        delete currentConfig.content
        await (prisma as any).pluginConfig.update({
          where: { id: existing.id },
          data: { config: JSON.stringify(currentConfig) },
        })
      }
    })

    return reply.send({ data: { ok: true, content: DEFAULT_ROBOTS_TXT } })
  })
}
